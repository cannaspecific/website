import { z } from "zod";

/**
 * Decarboxylation factor used on most US cannabis certificates:
 * total = neutral + 0.877 × acid form.
 */
export const DECARB_FACTOR = 0.877;

/** A test date older than this many days is flagged. It is not a legal hold time. */
export const STALE_AFTER_DAYS = 365;

export const PARSER_VERSION = 1;

const unitSchema = z.enum(["%", "mg/g", "mg/ml", "mg/unit", "unknown"]);

export const measureSchema = z.object({
  value: z.number().finite(),
  unit: unitSchema,
  raw: z.string().max(40),
});

export type Measure = z.infer<typeof measureSchema>;
export type MeasureUnit = z.infer<typeof unitSchema>;

export const CANNABINOID_KEYS = [
  "thc",
  "thca",
  "totalThc",
  "cbd",
  "cbda",
  "totalCbd",
  "cbg",
  "cbn",
  "cbc",
  "thcv",
] as const;

export type CannabinoidKey = (typeof CANNABINOID_KEYS)[number];

export const CANNABINOID_LABELS: Record<CannabinoidKey, string> = {
  thc: "THC",
  thca: "THCA",
  totalThc: "Total THC",
  cbd: "CBD",
  cbda: "CBDA",
  totalCbd: "Total CBD",
  cbg: "CBG",
  cbn: "CBN",
  cbc: "CBC",
  thcv: "THCV",
};

export const SAFETY_PANELS = [
  "pesticides",
  "heavy_metals",
  "microbials",
  "mycotoxins",
  "residual_solvents",
] as const;

export type SafetyPanel = (typeof SAFETY_PANELS)[number];
export type SafetyStatus = "pass" | "fail" | "not_tested" | "unknown";

export const SAFETY_LABELS: Record<SafetyPanel, string> = {
  pesticides: "Pesticides",
  heavy_metals: "Heavy metals",
  microbials: "Microbials",
  mycotoxins: "Mycotoxins",
  residual_solvents: "Residual solvents",
};

const totalCheckSchema = z.object({
  reported: z.number().finite().nullable(),
  computed: z.number().finite().nullable(),
  delta: z.number().finite().nullable(),
  unit: unitSchema.nullable(),
  status: z.enum(["ok", "mismatch", "skipped"]),
});

export type TotalCheck = z.infer<typeof totalCheckSchema>;

const noteSchema = z.object({
  code: z.string().max(40),
  message: z.string().max(400),
});

export type CoaNote = z.infer<typeof noteSchema>;

export const parsedCoaSchema = z.object({
  parserVersion: z.literal(PARSER_VERSION),
  sourceName: z.string().max(180),
  sourceKind: z.enum(["pdf", "text", "sample"]),
  sampleData: z.boolean(),
  productName: z.string().max(180).nullable(),
  strainName: z.string().max(180).nullable(),
  labName: z.string().max(180).nullable(),
  batchId: z.string().max(180).nullable(),
  lotId: z.string().max(180).nullable(),
  testDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  cannabinoids: z.object({
    thc: measureSchema.nullable(),
    thca: measureSchema.nullable(),
    totalThc: measureSchema.nullable(),
    cbd: measureSchema.nullable(),
    cbda: measureSchema.nullable(),
    totalCbd: measureSchema.nullable(),
    cbg: measureSchema.nullable(),
    cbn: measureSchema.nullable(),
    cbc: measureSchema.nullable(),
    thcv: measureSchema.nullable(),
  }),
  terpenes: z.array(z.object({
    name: z.string().max(60),
    measure: measureSchema,
  })).max(20),
  safety: z.object({
    pesticides: z.enum(["pass", "fail", "not_tested", "unknown"]).nullable(),
    heavy_metals: z.enum(["pass", "fail", "not_tested", "unknown"]).nullable(),
    microbials: z.enum(["pass", "fail", "not_tested", "unknown"]).nullable(),
    mycotoxins: z.enum(["pass", "fail", "not_tested", "unknown"]).nullable(),
    residual_solvents: z.enum(["pass", "fail", "not_tested", "unknown"]).nullable(),
  }),
  totals: z.object({
    thc: totalCheckSchema,
    cbd: totalCheckSchema,
  }),
  confidence: z.number().int().min(0).max(100),
  warnings: z.array(noteSchema).max(40),
  flags: z.array(noteSchema).max(20),
});

export type ParsedCoa = z.infer<typeof parsedCoaSchema>;

export type CoaLibraryRecord = {
  id: string;
  serverId: string | null;
  parsed: ParsedCoa;
};

export type ParseCoaOptions = {
  sourceName?: string;
  sourceKind?: ParsedCoa["sourceKind"];
  /** Used for the stale-date check. Defaults to the current time. */
  today?: Date;
  /** Distinguishes an empty PDF text layer from a short paste. */
  emptyReason?: "pdf" | "text";
};

type Span = { start: number; end: number };

const ANALYTE_STOP =
  /\b(?:total(?:\s+potential)?(?:\s+delta-?9)?\s+thc|total(?:\s+potential)?\s+cbd|delta-?9(?:[-\s]*thc-?a|thc)|d9[-\s]*thc|thc-?a|thc-?v|thc|cbd-?a|cbd|cbg-?a|cbg|cbn-?a|cbn|cbc-?a|cbc|myrcene|limonene|caryophyllene|linalool|pinene|humulene|terpinolene|ocimene|bisabolol|camphene|geraniol|nerolidol|eucalyptol|cineole|valencene|guaiol|terpineol|fenchol|borneol|carene|pesticides?|heavy\s+metals?|microbials?|mycotoxins?|residual\s+solvents?)\b/i;

const PANEL_STOP =
  /\b(?:pesticides?|heavy\s+metals?|microbials?|microbiology|mycotoxins?|aflatoxin|ochratoxin|residual\s+solvents?)\b/i;

export function roundTo(value: number, places = 3): number {
  return Number(value.toFixed(places));
}

export function computedCannabinoidTotal(neutral: number, acid: number): number {
  return roundTo(neutral + DECARB_FACTOR * acid, 3);
}

export function totalsDisagree(reported: number, computed: number): boolean {
  const delta = Math.abs(roundTo(reported - computed, 3));
  const tolerance = Math.max(0.15, Math.abs(reported) * 0.01);
  return delta > roundTo(tolerance, 3);
}

export function daysBefore(isoDate: string, today: Date): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return null;
  const then = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  if (Number.isNaN(then)) return null;
  return Math.round((now - then) / 86400000);
}

export function isStaleTestDate(isoDate: string, today = new Date()): boolean {
  const age = daysBefore(isoDate, today);
  return age != null && age > STALE_AFTER_DAYS;
}

export function normalizeCoaText(input: string): string {
  return input
    .replace(/\u0000/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/\f/g, "\n")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[Δδ]/g, "delta")
    .replace(/[αΑ]/g, "alpha")
    .replace(/[βΒ]/g, "beta")
    .split("\n")
    .map((line) => line.replace(/[ \t]{2,}/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function formatMeasure(measure: Measure | null): string {
  if (!measure) return "—";
  if (measure.raw.toUpperCase() === "ND") return "ND";
  const text = roundTo(measure.value, 3).toString();
  if (measure.unit === "unknown") return text;
  return `${text} ${measure.unit}`;
}

export function formatSafety(status: SafetyStatus | null): string {
  if (status === "pass") return "Pass";
  if (status === "fail") return "Fail";
  if (status === "not_tested") return "Not tested";
  if (status === "unknown") return "Status unread";
  return "Not on certificate";
}

export function coaRecordLabel(parsed: ParsedCoa): string {
  return parsed.productName || parsed.strainName || parsed.sourceName || "Untitled certificate";
}

export function parseCoaText(input: string, options: ParseCoaOptions = {}): ParsedCoa {
  const today = options.today ?? new Date();
  const text = normalizeCoaText(input);
  const letters = text.replace(/[^a-z0-9]/gi, "");
  const sourceName = (options.sourceName ?? "").trim().slice(0, 180) || "Pasted text";
  const sourceKind = options.sourceKind ?? "text";
  const sampleData = /synthetic sample|not a real laboratory|fictional/i.test(text);

  if (letters.length < 20) {
    return emptyParsed({
      sourceName,
      sourceKind,
      sampleData,
      message: options.emptyReason === "pdf"
        ? "No selectable text was found. Scanned PDFs are not supported in this beta. Paste the certificate text, or upload a PDF with a text layer."
        : "There isn't enough text to read a certificate.",
    });
  }

  const productName = labeledValue(text, ["product name", "product/strain", "sample name", "item name", "product"]);
  const strainName = labeledValue(text, ["strain name", "strain", "cultivar", "variety"]);
  const labName = labeledValue(text, ["testing laboratory", "laboratory", "tested by", "issued by", "lab name", "lab"]);
  let batchId = labeledValue(text, ["batch/lot", "batch number", "batch id", "batch no", "batch #", "batch"]);
  let lotId = labeledValue(text, ["lot number", "lot id", "lot no", "lot #", "lot"]);
  if (batchId && lotId && batchId === lotId) lotId = null;
  if (batchId && !lotId) {
    const parts = batchId.split(/\s*\/\s*/);
    if (parts.length === 2 && parts[0] && parts[1] && !/lot/i.test(parts[0])) {
      batchId = cleanToken(parts[0]);
      lotId = cleanToken(parts[1]);
    }
  }
  const testDate = parseDateToken(labeledValue(text, [
    "date tested",
    "test date",
    "tested date",
    "analysis date",
    "date of analysis",
    "report date",
    "date reported",
  ]) ?? "") ?? findLooseDate(text);

  const taken: Span[] = [];
  const cannabinoids = {
    totalThc: takeMeasure(text, /\btotal(?:\s+potential)?(?:\s+delta-?9)?\s+thc\b/gi, taken),
    totalCbd: takeMeasure(text, /\btotal(?:\s+potential)?\s+cbd\b/gi, taken),
    thca: takeMeasure(text, /\b(?:delta-?9[-\s]*)?thc-?a\b/gi, taken),
    thcv: takeMeasure(text, /\bthc-?v\b/gi, taken),
    thc: takeMeasure(text, /\b(?:delta-?9[-\s]*|d9[-\s]*)?thc\b/gi, taken),
    cbda: takeMeasure(text, /\bcbd-?a\b/gi, taken),
    cbd: takeMeasure(text, /\bcbd\b/gi, taken),
    cbg: takeMeasure(text, /\bcbg\b/gi, taken),
    cbn: takeMeasure(text, /\bcbn\b/gi, taken),
    cbc: takeMeasure(text, /\bcbc\b/gi, taken),
  };

  const warnings: CoaNote[] = [];
  if (!cannabinoids.cbg) {
    const acid = takeMeasure(text, /\bcbg-?a\b/gi, taken);
    if (acid) {
      cannabinoids.cbg = acid;
      warnings.push({ code: "acid_alias", message: "CBG was read from the acid form (CBGA)." });
    }
  }

  const terpenes = readTerpenes(text, taken);
  const safety = {
    pesticides: readPanel(text, /\bpesticides?\b/gi),
    heavy_metals: readPanel(text, /\bheavy\s+metals?\b/gi),
    microbials: readPanel(text, /\b(?:microbials?|microbiology|microbiological)\b/gi),
    mycotoxins: readPanel(text, /\b(?:mycotoxins?|aflatoxins?|ochratoxins?)\b/gi),
    residual_solvents: readPanel(text, /\bresidual\s+solvents?\b/gi),
  };

  const totals = {
    thc: checkTotal(cannabinoids.thc, cannabinoids.thca, cannabinoids.totalThc, "THC", "THCA", warnings),
    cbd: checkTotal(cannabinoids.cbd, cannabinoids.cbda, cannabinoids.totalCbd, "CBD", "CBDA", warnings),
  };

  const flags: CoaNote[] = [];
  if (totals.thc.status === "mismatch" && totals.thc.reported != null && totals.thc.computed != null) {
    flags.push({
      code: "total_thc_mismatch",
      message: totalMismatchMessage("THC", "THCA", totals.thc),
    });
  }
  if (totals.cbd.status === "mismatch" && totals.cbd.reported != null && totals.cbd.computed != null) {
    flags.push({
      code: "total_cbd_mismatch",
      message: totalMismatchMessage("CBD", "CBDA", totals.cbd),
    });
  }
  if (testDate && isStaleTestDate(testDate, today)) {
    flags.push({
      code: "stale_test_date",
      message: `Test date ${testDate} is more than ${STALE_AFTER_DAYS} days before today.`,
    });
  }
  if (testDate && (daysBefore(testDate, today) ?? 0) < -1) {
    warnings.push({ code: "future_test_date", message: `Test date ${testDate} is after today.` });
  }

  for (const panel of SAFETY_PANELS) {
    const status = safety[panel];
    if (status == null) {
      flags.push({
        code: "missing_safety_panel",
        message: `${SAFETY_LABELS[panel]} panel was not found on this certificate.`,
      });
    } else if (status === "fail") {
      flags.push({
        code: "safety_fail",
        message: `${SAFETY_LABELS[panel]} panel is marked fail on this certificate.`,
      });
    } else if (status === "unknown") {
      warnings.push({
        code: "safety_status_unread",
        message: `${SAFETY_LABELS[panel]} is named, but the pass/fail status was not readable.`,
      });
    } else if (status === "not_tested") {
      warnings.push({
        code: "safety_not_tested",
        message: `${SAFETY_LABELS[panel]} panel is marked not tested.`,
      });
    }
  }

  if (!productName && !strainName) {
    warnings.push({ code: "missing_product", message: "Product name and strain were not found." });
  }
  if (!labName) warnings.push({ code: "missing_lab", message: "Lab name was not found." });
  if (!batchId && !lotId) warnings.push({ code: "missing_batch", message: "Batch and lot were not found." });
  if (!testDate) warnings.push({ code: "missing_test_date", message: "Test date was not found." });
  if (CANNABINOID_KEYS.every((key) => cannabinoids[key] == null)) {
    warnings.push({ code: "no_cannabinoids", message: "No cannabinoid results were found." });
  }
  if (terpenes.length === 0) warnings.push({ code: "no_terpenes", message: "No terpene results were found." });

  const confidence = scoreConfidence({
    productName,
    strainName,
    labName,
    batchId,
    lotId,
    testDate,
    cannabinoids,
    terpeneCount: terpenes.length,
    safety,
  });
  if (confidence < 50) {
    warnings.push({ code: "low_confidence", message: "Only part of this certificate was recognized." });
  }

  return {
    parserVersion: PARSER_VERSION,
    sourceName,
    sourceKind,
    sampleData,
    productName,
    strainName,
    labName,
    batchId,
    lotId,
    testDate,
    cannabinoids,
    terpenes,
    safety,
    totals,
    confidence,
    warnings: warnings.slice(0, 40),
    flags: flags.slice(0, 20),
  };
}

function emptyParsed(input: {
  sourceName: string;
  sourceKind: ParsedCoa["sourceKind"];
  sampleData: boolean;
  message: string;
}): ParsedCoa {
  const none = {
    thc: null,
    thca: null,
    totalThc: null,
    cbd: null,
    cbda: null,
    totalCbd: null,
    cbg: null,
    cbn: null,
    cbc: null,
    thcv: null,
  };
  const skipped: TotalCheck = { reported: null, computed: null, delta: null, unit: null, status: "skipped" };
  return {
    parserVersion: PARSER_VERSION,
    sourceName: input.sourceName,
    sourceKind: input.sourceKind,
    sampleData: input.sampleData,
    productName: null,
    strainName: null,
    labName: null,
    batchId: null,
    lotId: null,
    testDate: null,
    cannabinoids: none,
    terpenes: [],
    safety: {
      pesticides: null,
      heavy_metals: null,
      microbials: null,
      mycotoxins: null,
      residual_solvents: null,
    },
    totals: { thc: skipped, cbd: skipped },
    confidence: 0,
    warnings: [{ code: "empty_text", message: input.message }],
    flags: [],
  };
}

function scoreConfidence(input: {
  productName: string | null;
  strainName: string | null;
  labName: string | null;
  batchId: string | null;
  lotId: string | null;
  testDate: string | null;
  cannabinoids: ParsedCoa["cannabinoids"];
  terpeneCount: number;
  safety: ParsedCoa["safety"];
}): number {
  let score = 0;
  if (input.productName || input.strainName) score += 15;
  if (input.labName) score += 10;
  if (input.batchId || input.lotId) score += 10;
  if (input.testDate) score += 10;
  const found = CANNABINOID_KEYS.filter((key) => input.cannabinoids[key] != null).length;
  if (found > 0) score += 20;
  if (input.cannabinoids.totalThc || (input.cannabinoids.thc && input.cannabinoids.thca)) score += 10;
  if (input.terpeneCount > 0) score += 10;
  const panels = SAFETY_PANELS.map((panel) => input.safety[panel]).filter((status) => status != null);
  if (panels.length > 0) score += 10;
  if (panels.length >= 4) score += 5;
  return Math.min(100, score);
}

function checkTotal(
  neutral: Measure | null,
  acid: Measure | null,
  reported: Measure | null,
  neutralName: string,
  acidName: string,
  warnings: CoaNote[],
): TotalCheck {
  if (!reported && !neutral && !acid) {
    return { reported: null, computed: null, delta: null, unit: null, status: "skipped" };
  }
  if (!reported || !neutral || !acid) {
    if (reported && (!neutral || !acid)) {
      const missing = [!neutral ? neutralName : null, !acid ? acidName : null].filter(Boolean).join(" and ");
      warnings.push({
        code: neutralName === "THC" ? "total_thc_unchecked" : "total_cbd_unchecked",
        message: `Total ${neutralName} is printed, but ${missing} is missing, so ${neutralName} + ${DECARB_FACTOR} × ${acidName} was not checked.`,
      });
    } else if (!reported && neutral && acid) {
      const computed = computedFrom(neutral, acid, neutral.unit);
      if (computed) {
        warnings.push({
          code: neutralName === "THC" ? "total_thc_unchecked" : "total_cbd_unchecked",
          message: `Total ${neutralName} is not printed. ${neutralName} + ${DECARB_FACTOR} × ${acidName} is ${computed.value} ${computed.unit === "unknown" ? "" : computed.unit}.`.replace(/\s+\./, ".").trim(),
        });
      }
    }
    return {
      reported: reported ? roundTo(reported.value, 3) : null,
      computed: null,
      delta: null,
      unit: reported?.unit ?? null,
      status: "skipped",
    };
  }

  const computed = computedFrom(neutral, acid, reported.unit);
  if (!computed) {
    warnings.push({
      code: "unit_mismatch",
      message: `Total ${neutralName} uses ${reported.unit}, which could not be compared with ${neutralName} and ${acidName}.`,
    });
    return {
      reported: roundTo(reported.value, 3),
      computed: null,
      delta: null,
      unit: reported.unit,
      status: "skipped",
    };
  }
  const reportedValue = roundTo(reported.value, 3);
  const delta = roundTo(reportedValue - computed.value, 3);
  return {
    reported: reportedValue,
    computed: computed.value,
    delta,
    unit: reported.unit,
    status: totalsDisagree(reportedValue, computed.value) ? "mismatch" : "ok",
  };
}

function computedFrom(neutral: Measure, acid: Measure, unit: MeasureUnit): { value: number; unit: MeasureUnit } | null {
  const neutralValue = asUnit(neutral, unit);
  const acidValue = asUnit(acid, unit);
  if (neutralValue == null || acidValue == null) return null;
  return { value: computedCannabinoidTotal(neutralValue, acidValue), unit };
}

function asUnit(measure: Measure, unit: MeasureUnit): number | null {
  if (measure.unit === unit) return measure.value;
  if (measure.unit === "unknown" || unit === "unknown") return measure.value;
  if (measure.unit === "%" && unit === "mg/g") return measure.value * 10;
  if (measure.unit === "mg/g" && unit === "%") return measure.value / 10;
  return null;
}

function totalMismatchMessage(neutralName: string, acidName: string, total: TotalCheck): string {
  const unit = total.unit && total.unit !== "unknown" ? ` ${total.unit}` : "";
  return `Reported total ${neutralName} is ${total.reported}${unit}. ${neutralName} + ${DECARB_FACTOR} × ${acidName} is ${total.computed}${unit}. The gap is larger than rounding.`;
}

function labeledValue(text: string, labels: string[]): string | null {
  const group = labels.map(escapeRegExp).join("|");
  // A colon, or a hyphen that starts a new phrase. "LOT-7781" is an id, not a label.
  const re = new RegExp(`(?:^|\\n|\\s)(?:${group})\\s*(?::|-\\s)\\s*([^\\n]+)`, "i");
  const match = text.match(re);
  if (!match?.[1]) return null;
  return cleanToken(match[1].split(/\s+(?=(?:strain|cultivar|variety|product|sample\s+name|laboratory|testing\s+laboratory|tested\s+by|lab|batch|lot|date\s+tested|test\s+date|analysis\s+date)\s*(?::|-\\s))/i)[0] ?? match[1]);
}

function cleanToken(value: string): string | null {
  const next = value.replace(/[|]+$/g, "").trim().slice(0, 180);
  if (!next) return null;
  if (/^(n\/a|na|none|unknown|tbd|—|-)$/i.test(next)) return null;
  return next;
}

function parseDateToken(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  let match = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (match) return isoDate(match[1], match[2], match[3]);
  match = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/);
  if (match) return isoDate(match[3], match[1], match[2]);
  match = text.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2}),?\s+(20\d{2})\b/i);
  if (match) return isoDate(match[3], monthNumber(match[1]), match[2]);
  match = text.match(/\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(20\d{2})\b/i);
  if (match) return isoDate(match[3], monthNumber(match[2]), match[1]);
  return null;
}

function findLooseDate(text: string): string | null {
  const match = text.match(/\b(?:date\s+tested|test\s+date|analysis\s+date)\b[^\n]{0,40}/i);
  if (!match) return null;
  return parseDateToken(match[0]);
}

function isoDate(year: string, month: string, day: string): string | null {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!Number.isInteger(y) || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function monthNumber(name: string): string {
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const index = months.findIndex((month) => name.toLowerCase().startsWith(month));
  return String(index + 1);
}

function takeMeasure(text: string, pattern: RegExp, taken: Span[]): Measure | null {
  const re = new RegExp(pattern.source, "gi");
  let found: Measure | null = null;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const start = match.index;
    const end = start + match[0].length;
    if (overlaps(taken, start, end)) {
      if (re.lastIndex === start) re.lastIndex += 1;
      continue;
    }
    taken.push({ start, end });
    if (!found) {
      const measure = pickMeasure(readWindow(text, end));
      if (measure) found = measure;
    }
  }
  return found;
}

function readWindow(text: string, index: number): string {
  const rest = text.slice(index);
  const lines = rest.split("\n");
  let chunk = lines[0] ?? "";
  if (!/\d|ND|LOQ|not detected/i.test(chunk) && lines[1]) chunk = `${chunk} ${lines[1]}`;
  const capped = chunk.slice(0, 90);
  const stop = capped.search(ANALYTE_STOP);
  if (stop > 0) return capped.slice(0, stop);
  return capped.slice(0, 48);
}

function pickMeasure(window: string): Measure | null {
  const trimmed = window.trim();
  if (!trimmed) return null;
  if (/^(?:<\s*)?(?:ND|N\/D|NT|not detected|<\s*LOQ|LOQ|BLOQ)\b/i.test(trimmed) && !/\d/.test(trimmed)) {
    return { value: 0, unit: "unknown", raw: "ND" };
  }
  const found: { value: number; unit: MeasureUnit; raw: string; index: number }[] = [];
  const re = /(\d{1,5}(?:,\d{3})*(?:\.\d+)?|\.\d+)\s*(%|mg\/g|mg\/ml|mg\/unit)?/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(trimmed))) {
    const value = Number(match[1].replace(/,/g, ""));
    if (!Number.isFinite(value)) continue;
    if (value >= 1900 && value <= 2100 && !match[2]) continue;
    found.push({
      value,
      unit: normalizeUnit(match[2]),
      raw: match[0].trim().slice(0, 40),
      index: match.index,
    });
  }
  if (found.length === 0) {
    if (/\b(ND|not detected|<LOQ|BLOQ)\b/i.test(trimmed)) return { value: 0, unit: "unknown", raw: "ND" };
    return null;
  }
  const percent = found.find((item) => item.unit === "%");
  const chosen = percent
    ?? found.find((item) => item.unit === "mg/g" || item.unit === "mg/ml" || item.unit === "mg/unit")
    ?? (found.length >= 2 && found.every((item) => item.unit === "unknown") ? found[found.length - 1] : found[0]);
  const prefix = trimmed.slice(0, chosen.index);
  if (/<\s*$/.test(prefix)) {
    return { value: 0, unit: chosen.unit, raw: `<${chosen.raw}`.slice(0, 40) };
  }
  return { value: chosen.value, unit: chosen.unit, raw: chosen.raw };
}

function normalizeUnit(raw: string | undefined): MeasureUnit {
  const unit = raw?.toLowerCase();
  if (unit === "%" || unit === "mg/g" || unit === "mg/ml" || unit === "mg/unit") return unit;
  return "unknown";
}

const TERPENE_SPECS: { name: string; pattern: RegExp }[] = [
  { name: "Caryophyllene oxide", pattern: /\bcaryophyllene\s+oxide\b/gi },
  { name: "beta-Caryophyllene", pattern: /\b(?:beta[-\s]*)?caryophyllene\b/gi },
  { name: "alpha-Pinene", pattern: /\balpha[-\s]*pinene\b/gi },
  { name: "beta-Pinene", pattern: /\bbeta[-\s]*pinene\b/gi },
  { name: "Pinene", pattern: /\bpinene\b/gi },
  { name: "beta-Myrcene", pattern: /\b(?:beta[-\s]*)?myrcene\b/gi },
  { name: "Limonene", pattern: /\b(?:d[-\s]*)?limonene\b/gi },
  { name: "Linalool", pattern: /\blinalool\b/gi },
  { name: "alpha-Humulene", pattern: /\b(?:alpha[-\s]*)?humulene\b/gi },
  { name: "Terpinolene", pattern: /\bterpinolene\b/gi },
  { name: "Ocimene", pattern: /\b(?:beta[-\s]*)?ocimene\b/gi },
  { name: "alpha-Bisabolol", pattern: /\b(?:alpha[-\s]*)?bisabolol\b/gi },
  { name: "Camphene", pattern: /\bcamphene\b/gi },
  { name: "Geraniol", pattern: /\bgeraniol\b/gi },
  { name: "Nerolidol", pattern: /\b(?:trans[-\s]*)?nerolidol\b/gi },
  { name: "Eucalyptol", pattern: /\b(?:eucalyptol|cineole)\b/gi },
  { name: "Valencene", pattern: /\bvalencene\b/gi },
  { name: "Guaiol", pattern: /\bguaiol\b/gi },
  { name: "Terpineol", pattern: /\b(?:alpha[-\s]*)?terpineol\b/gi },
  { name: "Fenchol", pattern: /\b(?:fenchol|fenchyl\s+alcohol)\b/gi },
  { name: "Borneol", pattern: /\bborneol\b/gi },
  { name: "delta-3-Carene", pattern: /\b(?:delta-?3[-\s]*)?carene\b/gi },
];

function readTerpenes(text: string, taken: Span[]): { name: string; measure: Measure }[] {
  const found: { name: string; measure: Measure }[] = [];
  for (const spec of TERPENE_SPECS) {
    const measure = takeMeasure(text, spec.pattern, taken);
    if (!measure) continue;
    if (found.some((item) => item.name === spec.name)) continue;
    found.push({ name: spec.name, measure });
  }
  return found
    .sort((a, b) => (toMgPerG(b.measure) ?? -1) - (toMgPerG(a.measure) ?? -1))
    .slice(0, 20);
}

function readPanel(text: string, pattern: RegExp): SafetyStatus | null {
  const re = new RegExp(pattern.source, "gi");
  const found: SafetyStatus[] = [];
  let saw = false;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    saw = true;
    const status = readSafety(panelWindow(text, match.index + match[0].length));
    if (status) found.push(status);
    if (re.lastIndex === match.index) re.lastIndex += 1;
  }
  if (!saw) return null;
  if (found.includes("fail")) return "fail";
  if (found.includes("pass")) return "pass";
  if (found.includes("not_tested")) return "not_tested";
  return "unknown";
}

function panelWindow(text: string, index: number): string {
  const rest = text.slice(index);
  const lines = rest.split("\n");
  let chunk = lines[0] ?? "";
  if (!/\b(pass|fail|nd|not)\b/i.test(chunk) && lines[1]) chunk = `${chunk} ${lines[1]}`;
  const capped = chunk.slice(0, 120);
  const stop = capped.search(PANEL_STOP);
  if (stop > 0) return capped.slice(0, stop);
  return capped;
}

function readSafety(window: string): SafetyStatus | null {
  const text = window.toLowerCase();
  if (/\bnot\s+tested\b|\bnot\s+analyzed\b|\bn\/t\b|\bnt\b/.test(text)) return "not_tested";
  if (/\bfail(?:ed)?\b|\babove\s+action\b|\bexceeds?\b|\bout\s+of\s+spec\b/.test(text)) return "fail";
  if (/\bpass(?:ed)?\b|\bwithin\s+limits\b|\bacceptable\b|\bnot\s+detected\b|\bbelow\s+loq\b|\bnone\s+detected\b|\bnd\b/.test(text)) {
    return "pass";
  }
  return null;
}

function overlaps(taken: Span[], start: number, end: number): boolean {
  return taken.some((span) => start < span.end && end > span.start);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function toMgPerG(measure: Measure): number | null {
  if (measure.unit === "mg/g") return measure.value;
  if (measure.unit === "%") return measure.value * 10;
  if (measure.unit === "unknown") return measure.value;
  return null;
}

export function toPercent(measure: Measure): number | null {
  if (measure.unit === "%") return measure.value;
  if (measure.unit === "mg/g") return measure.value / 10;
  if (measure.unit === "unknown") return measure.value;
  return null;
}

export type ComparisonCell = { text: string; different: boolean };
export type ComparisonRow = {
  group: "identity" | "cannabinoid" | "terpene" | "safety";
  label: string;
  cells: ComparisonCell[];
};

export type Comparison = {
  columns: { id: string; label: string; confidence: number; sampleData: boolean }[];
  rows: ComparisonRow[];
  flags: { id: string; label: string; code: string; message: string }[];
};

export function compareCoas(records: CoaLibraryRecord[]): Comparison {
  if (records.length < 2 || records.length > 4) {
    throw new Error("Compare 2 to 4 certificates.");
  }
  const columns = records.map((record) => ({
    id: record.id,
    label: coaRecordLabel(record.parsed),
    confidence: record.parsed.confidence,
    sampleData: record.parsed.sampleData,
  }));
  const rows: ComparisonRow[] = [
    identityRow("Product", records, (parsed) => parsed.productName ?? "—"),
    identityRow("Strain", records, (parsed) => parsed.strainName ?? "—"),
    identityRow("Lab", records, (parsed) => parsed.labName ?? "—"),
    identityRow("Batch", records, (parsed) => parsed.batchId ?? "—"),
    identityRow("Lot", records, (parsed) => parsed.lotId ?? "—"),
    identityRow("Test date", records, (parsed) => parsed.testDate ?? "—"),
  ];

  for (const key of CANNABINOID_KEYS) {
    rows.push(numericRow("cannabinoid", CANNABINOID_LABELS[key], records, (parsed) => parsed.cannabinoids[key], toPercent));
  }
  rows.push({
    group: "cannabinoid",
    label: "Total THC computed",
    cells: shadeNumeric(records.map((record) => {
      const total = record.parsed.totals.thc;
      return {
        text: total.computed == null ? "—" : `${total.computed}${total.unit && total.unit !== "unknown" ? ` ${total.unit}` : ""}`,
        value: total.computed,
      };
    })),
  });

  const terpeneNames: string[] = [];
  for (const record of records) {
    for (const terpene of record.parsed.terpenes.slice(0, 5)) {
      if (!terpeneNames.includes(terpene.name)) terpeneNames.push(terpene.name);
    }
  }
  for (const name of terpeneNames.slice(0, 8)) {
    rows.push(numericRow("terpene", name, records, (parsed) => parsed.terpenes.find((item) => item.name === name)?.measure ?? null, toMgPerG));
  }

  for (const panel of SAFETY_PANELS) {
    rows.push(identityRow(SAFETY_LABELS[panel], records, (parsed) => formatSafety(parsed.safety[panel]), "safety"));
  }

  return {
    columns,
    rows,
    flags: records.flatMap((record) => record.parsed.flags.map((flag) => ({
      id: record.id,
      label: coaRecordLabel(record.parsed),
      code: flag.code,
      message: flag.message,
    }))),
  };
}

function identityRow(
  label: string,
  records: CoaLibraryRecord[],
  read: (parsed: ParsedCoa) => string,
  group: ComparisonRow["group"] = "identity",
): ComparisonRow {
  const texts = records.map((record) => read(record.parsed));
  const norm = texts.map((text) => text.trim().toLowerCase());
  const present = norm.filter((text) => text !== "—" && text !== "");
  const different = new Set(present).size > 1 || (present.length > 0 && present.length !== norm.length);
  return {
    group,
    label,
    cells: texts.map((text) => ({ text, different })),
  };
}

function numericRow(
  group: "cannabinoid" | "terpene",
  label: string,
  records: CoaLibraryRecord[],
  read: (parsed: ParsedCoa) => Measure | null,
  normalize: (measure: Measure) => number | null,
): ComparisonRow {
  const cells = records.map((record) => {
    const measure = read(record.parsed);
    const value = measure ? normalize(measure) : null;
    return { text: formatMeasure(measure), value };
  });
  return { group, label, cells: shadeNumeric(cells) };
}

function shadeNumeric(cells: { text: string; value: number | null }[]): ComparisonCell[] {
  const values = cells.map((cell) => cell.value);
  if (values.every((value) => value != null)) {
    const numbers = values as number[];
    const max = Math.max(...numbers);
    const min = Math.min(...numbers);
    const tolerance = Math.max(0.15, Math.abs(max) * 0.02);
    const different = roundTo(max - min, 3) > roundTo(tolerance, 3);
    return cells.map((cell) => ({ text: cell.text, different }));
  }
  const texts = cells.map((cell) => cell.text);
  const present = texts.filter((text) => text !== "—");
  const different = new Set(present.map((text) => text.toLowerCase())).size > 1
    || (present.length > 0 && present.length !== texts.length);
  return cells.map((cell) => ({ text: cell.text, different }));
}

function csvCell(value: string): string {
  const guarded = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export function comparisonToCsv(comparison: Comparison): string {
  const header = ["group", "field", ...comparison.columns.map((column) => column.label)].map(csvCell).join(",");
  const lines = comparison.rows.map((row) =>
    [row.group, row.label, ...row.cells.map((cell) => cell.text)].map(csvCell).join(","),
  );
  const flagHeader = ["flags", "certificate", "code", "message"].map(csvCell).join(",");
  const flagLines = comparison.flags.map((flag) =>
    ["flag", flag.label, flag.code, flag.message].map(csvCell).join(","),
  );
  return `\uFEFF${[header, ...lines, flagHeader, ...flagLines].join("\n")}\n`;
}

export function comparisonToJson(comparison: Comparison, records: CoaLibraryRecord[], exportedAt = new Date().toISOString()): string {
  return JSON.stringify({
    note: "Certificate comparison export. Not a compliance determination and not medical or health advice.",
    exportedAt,
    comparison,
    certificates: records.map((record) => ({
      id: record.id,
      serverId: record.serverId,
      parsed: record.parsed,
    })),
  }, null, 2);
}
