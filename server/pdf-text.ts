import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const MAX_PAGES = 12;

export class PdfReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfReadError";
  }
}

type Positioned = { str: string; x: number; y: number };

/**
 * Reads the PDF text layer. Image-only scans come back empty; this beta does not OCR them.
 */
export async function extractPdfText(data: Uint8Array): Promise<{ text: string; pages: number; truncated: boolean }> {
  if (data.byteLength === 0) {
    throw new PdfReadError("That file is empty.");
  }
  let doc: Awaited<ReturnType<typeof getDocument>["promise"]> | null = null;
  try {
    doc = await getDocument({ data, verbosity: 0, isEvalSupported: false }).promise;
    const pageCount = doc.numPages;
    const truncated = pageCount > MAX_PAGES;
    const lines: string[] = [];
    for (let pageNumber = 1; pageNumber <= Math.min(pageCount, MAX_PAGES); pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();
      lines.push(itemsToText(content.items as { str?: string; transform?: number[] }[]));
    }
    return { text: lines.filter(Boolean).join("\n"), pages: pageCount, truncated };
  } catch (error) {
    if (error instanceof PdfReadError) throw error;
    const message = error instanceof Error ? error.message : "";
    if (/password/i.test(message)) {
      throw new PdfReadError("This PDF is password-protected and was not read.");
    }
    throw new PdfReadError("This PDF could not be read. Scanned PDFs are not supported in this beta.");
  } finally {
    await doc?.destroy();
  }
}

function itemsToText(items: { str?: string; transform?: number[] }[]): string {
  const positioned: Positioned[] = [];
  for (const item of items) {
    if (!item.str || !item.transform) continue;
    positioned.push({ str: item.str, x: item.transform[4] ?? 0, y: item.transform[5] ?? 0 });
  }
  positioned.sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: string[][] = [];
  let currentY: number | null = null;
  for (const item of positioned) {
    if (currentY == null || Math.abs(item.y - currentY) > 2) {
      lines.push([item.str]);
      currentY = item.y;
    } else {
      lines[lines.length - 1].push(item.str);
    }
  }
  return lines.map((parts) => parts.join(" ").replace(/[ ]{2,}/g, " ").trim()).filter(Boolean).join("\n");
}
