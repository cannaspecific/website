import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCoaText } from "@shared/coa";
import { COA_SAMPLES } from "@shared/coa-samples";
import { extractPdfText } from "./pdf-text";
import { buildEmptyPdf, buildTextPdf } from "./text-pdf";

describe("pdf text layer", () => {
  it("reads selectable text and leaves a blank page empty", async () => {
    const lines = ["Product: Harbor Kush Flower", "THCA 24.10%", "delta-9 THC 0.82%"];
    const extracted = await extractPdfText(new Uint8Array(buildTextPdf(lines)));
    assert.equal(extracted.pages, 1);
    assert.match(extracted.text, /Harbor Kush Flower/);
    assert.match(extracted.text, /THCA 24\.10%/);
    const parsed = parseCoaText(extracted.text, { sourceKind: "pdf", sourceName: "mini.pdf" });
    assert.equal(parsed.productName, "Harbor Kush Flower");
    assert.equal(parsed.cannabinoids.thca?.value, 24.1);

    const empty = await extractPdfText(new Uint8Array(buildEmptyPdf()));
    assert.equal(empty.text.trim(), "");
    const scanned = parseCoaText(empty.text, { emptyReason: "pdf", sourceKind: "pdf", sourceName: "scan.pdf" });
    assert.match(scanned.warnings[0]?.message ?? "", /Scanned PDFs are not supported/);
  });

  it("reads a multi-line sample certificate from a generated PDF", async () => {
    const extracted = await extractPdfText(new Uint8Array(buildTextPdf(COA_SAMPLES[0].text.split(/\n/))));
    const parsed = parseCoaText(extracted.text, {
      sourceKind: "pdf",
      sourceName: "harbor.pdf",
      today: new Date("2026-11-18T12:00:00.000Z"),
    });
    assert.equal(parsed.productName, "Harbor Kush Flower");
    assert.equal(parsed.totals.thc.status, "ok");
    assert.equal(parsed.safety.pesticides, "pass");
    assert.equal(parsed.sampleData, true);
  });
});
