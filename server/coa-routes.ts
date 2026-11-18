import express, { type Express, type Request, type Response } from "express";
import { z } from "zod";
import { parseCoaText, parsedCoaSchema, type ParsedCoa } from "@shared/coa";
import { adminAuthorized, readProvidedAdminToken } from "./admin-auth";
import { isCoaStoreReady } from "./db";
import { deleteCoaRecord, insertCoaRecord, listCoaRecords } from "./coa-store";
import { extractPdfText, PdfReadError } from "./pdf-text";
import { coaRateLimit } from "./rate-limit";

const textBodySchema = z.object({
  text: z.string().trim().min(1).max(500_000),
  sourceName: z.string().trim().max(180).optional(),
  ageConfirmed: z.literal(true, {
    errorMap: () => ({ message: "Confirm you are 21 or older before reading a certificate." }),
  }),
  remember: z.boolean().optional(),
});

const DB_OFF = "Database storage is off, so certificates stay in this browser tab.";

function clientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function requireAdmin(req: Request, res: Response): boolean {
  const provided = readProvidedAdminToken(req.get("x-admin-token"), req.get("authorization"));
  const decision = adminAuthorized(provided);
  if (decision === "ok") return true;
  if (decision === "disabled") {
    res.status(503).json({
      success: false,
      message: "Admin access is not configured. Set ADMIN_TOKEN on the server.",
    });
    return false;
  }
  res.status(401).json({ success: false, message: "Unauthorized." });
  return false;
}

function allowParse(req: Request, res: Response): boolean {
  const result = coaRateLimit.check(`${clientIp(req)}:coa`);
  if (result.ok) return true;
  res.set("Retry-After", String(result.retryAfterSec));
  res.status(429).json({
    success: false,
    message: "Too many certificate reads from this network. Please wait a few minutes and try again.",
  });
  return false;
}

function ageConfirmed(req: Request, bodyFlag: boolean | undefined): boolean {
  if (bodyFlag === true) return true;
  return req.get("x-age-confirmed")?.trim().toLowerCase() === "yes";
}

async function rememberParsed(parsed: ParsedCoa, remember: boolean) {
  if (!remember) return { saved: null, db: isCoaStoreReady(), message: null as string | null };
  if (!isCoaStoreReady()) return { saved: null, db: false, message: DB_OFF };
  try {
    const record = await insertCoaRecord(parsed);
    return { saved: { id: record.id }, db: true, message: null };
  } catch (error) {
    console.error("Failed to store parsed certificate.", error);
    return {
      saved: null,
      db: true,
      message: "The certificate was read, but it could not be stored. It can stay in this browser tab.",
    };
  }
}

function safeFilename(value: string | undefined): string {
  const base = (value ?? "").split(/[/\\]/).pop() ?? "";
  const cleaned = base.replace(/[^\w.\- ()+,]+/g, "").trim().slice(0, 180);
  return cleaned || "certificate.pdf";
}

async function handleText(req: Request, res: Response) {
  const parsedBody = textBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    const ageIssue = parsedBody.error.issues.find((issue) => issue.path[0] === "ageConfirmed");
    res.status(400).json({
      success: false,
      message: ageIssue?.message ?? "Paste the certificate text to read it.",
    });
    return;
  }
  if (!allowParse(req, res)) return;
  const parsed = parseCoaText(parsedBody.data.text, {
    sourceName: parsedBody.data.sourceName || "Pasted text",
    sourceKind: "text",
    emptyReason: "text",
  });
  const stored = await rememberParsed(parsed, parsedBody.data.remember === true);
  res.json({ success: true, data: parsed, ...stored });
}

async function handlePdf(req: Request, res: Response) {
  if (!ageConfirmed(req, undefined)) {
    res.status(400).json({
      success: false,
      message: "Confirm you are 21 or older before reading a certificate.",
    });
    return;
  }
  if (!allowParse(req, res)) return;
  const body = req.body;
  if (!Buffer.isBuffer(body) || body.byteLength === 0) {
    res.status(400).json({ success: false, message: "Upload a PDF file." });
    return;
  }
  try {
    const extracted = await extractPdfText(new Uint8Array(body));
    const parsed = parseCoaText(extracted.text, {
      sourceName: safeFilename(req.get("x-coa-filename")),
      sourceKind: "pdf",
      emptyReason: "pdf",
    });
    if (extracted.truncated) {
      parsed.warnings = [
        { code: "truncated_pdf", message: "Only the first 12 pages were read." },
        ...parsed.warnings,
      ].slice(0, 40);
    }
    const remember = req.query.remember === "1" || req.query.remember === "true";
    const stored = await rememberParsed(parsed, remember);
    res.json({ success: true, data: parsed, pages: extracted.pages, ...stored });
  } catch (error) {
    const message = error instanceof PdfReadError
      ? error.message
      : "This PDF could not be read. Scanned PDFs are not supported in this beta.";
    res.status(422).json({ success: false, message });
  }
}

export function registerCoaRoutes(app: Express): void {
  app.get("/api/coa/records", (req, res, next) => {
    if (!requireAdmin(req, res)) return;
    if (!isCoaStoreReady()) {
      res.set("Cache-Control", "no-store");
      res.json({ success: true, db: false, data: [], message: DB_OFF });
      return;
    }
    listCoaRecords()
      .then((data) => {
        res.set("Cache-Control", "no-store");
        res.json({ success: true, db: true, data, message: null });
      })
      .catch(next);
  });

  app.post("/api/coa/records", express.json({ limit: "256kb" }), (req, res, next) => {
    if (!requireAdmin(req, res)) return;
    if (!allowParse(req, res)) return;
    const parsedBody = z.object({ parsed: parsedCoaSchema }).safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ success: false, message: "That certificate could not be stored." });
      return;
    }
    if (!isCoaStoreReady()) {
      res.status(503).json({ success: false, db: false, message: DB_OFF });
      return;
    }
    insertCoaRecord(parsedBody.data.parsed)
      .then((record) => {
        res.status(201).json({ success: true, data: record });
      })
      .catch(next);
  });

  app.delete("/api/coa/records/:id", (req, res, next) => {
    if (!requireAdmin(req, res)) return;
    if (!/^[a-zA-Z0-9-]{1,80}$/.test(req.params.id)) {
      res.status(400).json({ success: false, message: "Unknown certificate id." });
      return;
    }
    if (!isCoaStoreReady()) {
      res.status(503).json({ success: false, message: DB_OFF });
      return;
    }
    deleteCoaRecord(req.params.id)
      .then((removed) => {
        if (!removed) {
          res.status(404).json({ success: false, message: "Certificate not found." });
          return;
        }
        res.json({ success: true });
      })
      .catch(next);
  });

  app.post("/api/coa/parse", (req, res, next) => {
    if (!requireAdmin(req, res)) return;
    const type = req.get("content-type") ?? "";
    if (type.includes("application/pdf")) {
      express.raw({ type: "application/pdf", limit: "8mb" })(req, res, (error) => {
        if (error) {
          next(error);
          return;
        }
        handlePdf(req, res).catch(next);
      });
      return;
    }
    express.json({ limit: "1mb" })(req, res, (error) => {
      if (error) {
        next(error);
        return;
      }
      handleText(req, res).catch(next);
    });
  });
}
