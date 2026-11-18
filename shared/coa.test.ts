import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { COA_SAMPLES } from "./coa-samples";
import {
  DECARB_FACTOR,
  STALE_AFTER_DAYS,
  coaRecordLabel,
  compareCoas,
  comparisonToCsv,
  comparisonToJson,
  computedCannabinoidTotal,
  daysBefore,
  isStaleTestDate,
  parseCoaText,
  parsedCoaSchema,
  totalsDisagree,
  type CoaLibraryRecord,
} from "./coa";

const TODAY = new Date("2026-11-18T12:00:00.000Z");

function libraryRecord(text: string, id: string): CoaLibraryRecord {
  return {
    id,
    serverId: null,
    parsed: parseCoaText(text, { sourceName: id, sourceKind: "sample", today: TODAY }),
  };
}

describe("THC math", () => {
  it("uses total = THC + 0.877 × THCA", () => {
    assert.equal(DECARB_FACTOR, 0.877);
    assert.equal(computedCannabinoidTotal(0.82, 24.1), 21.956);
    assert.equal(computedCannabinoidTotal(4.5, 68.2), 64.311);
    assert.equal(computedCannabinoidTotal(0, 0), 0);
    assert.equal(computedCannabinoidTotal(1, 0), 1);
  });

  it("ignores rounding and flags a sum that skipped the factor", () => {
    assert.equal(totalsDisagree(21.96, 21.956), false);
    assert.equal(totalsDisagree(21.96, 22.05), false);
    assert.equal(totalsDisagree(72.7, 64.311), true);
    assert.equal(totalsDisagree(10, 10.2), true);
  });

  it("treats a date older than 365 days as stale and keeps the boundary", () => {
    assert.equal(STALE_AFTER_DAYS, 365);
    assert.equal(daysBefore("2025-11-18", TODAY), 365);
    assert.equal(isStaleTestDate("2025-11-18", TODAY), false);
    assert.equal(isStaleTestDate("2025-11-17", TODAY), true);
  });
});

describe("certificate parser", () => {
  it("reads the Harbor sample, including a correct total and every safety panel", () => {
    const parsed = parseCoaText(COA_SAMPLES[0].text, { sourceName: "harbor", sourceKind: "sample", today: TODAY });
    assert.equal(parsedCoaSchema.safeParse(parsed).success, true);
    assert.equal(parsed.sampleData, true);
    assert.equal(parsed.productName, "Harbor Kush Flower");
    assert.equal(parsed.strainName, "Harbor Kush");
    assert.equal(parsed.labName, "Northglass Sample Lab");
    assert.equal(parsed.batchId, "HK-2026-0914");
    assert.equal(parsed.lotId, "LOT-4419");
    assert.equal(parsed.testDate, "2026-09-14");
    assert.equal(parsed.cannabinoids.thca?.value, 24.1);
    assert.equal(parsed.cannabinoids.thc?.value, 0.82);
    assert.equal(parsed.cannabinoids.totalThc?.value, 21.96);
    assert.equal(parsed.cannabinoids.cbd?.value, 0.04);
    assert.equal(parsed.cannabinoids.cbg?.value, 0.64);
    assert.equal(parsed.cannabinoids.cbn?.raw, "ND");
    assert.equal(parsed.cannabinoids.cbc?.value, 0.09);
    assert.equal(parsed.cannabinoids.thcv?.value, 0.21);
    assert.equal(parsed.totals.thc.status, "ok");
    assert.equal(parsed.totals.thc.computed, 21.956);
    assert.equal(parsed.terpenes[0]?.name, "beta-Myrcene");
    assert.equal(parsed.terpenes[0]?.measure.value, 6.4);
    assert.deepEqual(parsed.safety, {
      pesticides: "pass",
      heavy_metals: "pass",
      microbials: "pass",
      mycotoxins: "pass",
      residual_solvents: "pass",
    });
    assert.equal(parsed.flags.length, 0);
    assert.equal(parsed.confidence, 100);
  });

  it("flags a total THC that was added without 0.877, and names missing panels", () => {
    const parsed = parseCoaText(COA_SAMPLES[1].text, { sourceName: "citrus", sourceKind: "sample", today: TODAY });
    assert.equal(parsed.productName, "Citrus Drift Live Resin");
    assert.equal(parsed.batchId, "CD-2026-1002");
    assert.equal(parsed.lotId, "LOT-7781");
    assert.equal(parsed.testDate, "2026-10-02");
    assert.equal(parsed.totals.thc.status, "mismatch");
    assert.equal(parsed.totals.thc.computed, 64.311);
    assert.equal(parsed.totals.cbd.status, "ok");
    assert.equal(parsed.cannabinoids.thc?.value, 4.5);
    assert.notEqual(parsed.cannabinoids.thc?.value, parsed.cannabinoids.totalThc?.value);
    assert.ok(parsed.flags.some((flag) => flag.code === "total_thc_mismatch"));
    assert.equal(parsed.flags.filter((flag) => flag.code === "missing_safety_panel").length, 2);
    assert.equal(parsed.safety.mycotoxins, null);
    assert.equal(parsed.safety.residual_solvents, null);
    assert.equal(parsed.safety.pesticides, "pass");
  });

  it("flags an old test date, a failed panel, and missing terpenes", () => {
    const parsed = parseCoaText(COA_SAMPLES[2].text, { sourceName: "lowland", sourceKind: "sample", today: TODAY });
    assert.equal(parsed.testDate, "2024-02-11");
    assert.equal(parsed.totals.thc.status, "ok");
    assert.equal(parsed.safety.pesticides, "fail");
    assert.equal(parsed.safety.microbials, null);
    assert.ok(parsed.flags.some((flag) => flag.code === "stale_test_date"));
    assert.ok(parsed.flags.some((flag) => flag.code === "safety_fail"));
    assert.ok(parsed.warnings.some((warning) => warning.code === "no_terpenes"));
    assert.equal(parsed.confidence < 100, true);
  });

  it("reads inline results, ND, and a US month name without mixing analytes", () => {
    const parsed = parseCoaText(`
      Product: Cedar Mints
      Laboratory: Inline Sample Lab
      Batch/Lot: CM-1 / LOT-9
      Date tested: March 2, 2026
      delta-9 THC 1.20% THCA 18.00% Total THC 16.99%
      CBD ND CBDA 0.40% Total CBD 0.35%
      CBG 0.22% CBN <LOQ CBC 0.08% THCV 0.15%
      Terpenes: Myrcene 4.2 mg/g, Limonene 1.1 mg/g
      Pesticides PASS. Heavy metals PASS. Microbials PASS. Mycotoxins PASS. Residual solvents PASS.
    `, { today: TODAY });
    assert.equal(parsed.productName, "Cedar Mints");
    assert.equal(parsed.batchId, "CM-1");
    assert.equal(parsed.lotId, "LOT-9");
    assert.equal(parsed.testDate, "2026-03-02");
    assert.equal(parsed.cannabinoids.thc?.value, 1.2);
    assert.equal(parsed.cannabinoids.thca?.value, 18);
    assert.equal(parsed.cannabinoids.totalThc?.value, 16.99);
    assert.equal(parsed.cannabinoids.cbd?.raw, "ND");
    assert.equal(parsed.cannabinoids.cbda?.value, 0.4);
    assert.equal(parsed.cannabinoids.cbn?.value, 0);
    assert.equal(parsed.cannabinoids.cbc?.value, 0.08);
    assert.equal(parsed.totals.thc.status, "ok");
    assert.equal(parsed.terpenes.find((item) => item.name === "beta-Myrcene")?.measure.value, 4.2);
    assert.equal(parsed.terpenes.find((item) => item.name === "Limonene")?.measure.value, 1.1);
    assert.equal(parsed.safety.residual_solvents, "pass");
  });

  it("checks mg/g totals on the same scale and does not treat THCA as THC", () => {
    const ok = parseCoaText(`
      Product: Milligram Sample
      Laboratory: Northglass Sample Lab
      Batch: MG-1
      Date tested: 2026-08-01
      THCA 241.0 mg/g
      delta-9 THC 8.2 mg/g
      Total THC 219.6 mg/g
    `, { today: TODAY });
    assert.equal(ok.cannabinoids.thc?.unit, "mg/g");
    assert.equal(ok.cannabinoids.thca?.value, 241);
    assert.notEqual(ok.cannabinoids.thc?.value, 241);
    assert.equal(ok.totals.thc.status, "ok");
    assert.equal(ok.totals.thc.computed, 219.557);

    const wrong = parseCoaText(`
      Product: Milligram Sample
      Laboratory: Northglass Sample Lab
      Batch: MG-2
      Date tested: 08/01/2026
      THCA 241.0 mg/g
      delta-9 THC 8.2 mg/g
      Total THC 249.2 mg/g
    `, { today: TODAY });
    assert.equal(wrong.testDate, "2026-08-01");
    assert.equal(wrong.totals.thc.status, "mismatch");
  });

  it("says a short or empty text layer cannot be read, and does not invent fields", () => {
    const scanned = parseCoaText("   ", { emptyReason: "pdf", sourceName: "scan.pdf", sourceKind: "pdf" });
    assert.equal(scanned.confidence, 0);
    assert.equal(scanned.productName, null);
    assert.match(scanned.warnings[0]?.message ?? "", /Scanned PDFs are not supported/);
    const pasted = parseCoaText("hello", { emptyReason: "text" });
    assert.match(pasted.warnings[0]?.message ?? "", /enough text/);
    assert.equal(pasted.flags.length, 0);
  });

  it("keeps a heavy-metals pass from being read as a pesticide fail", () => {
    const parsed = parseCoaText(`
      Product: Split Panels
      Laboratory: Northglass Sample Lab
      Batch: SP-1
      Date tested: 2026-05-01
      THC 1.00%
      THCA 10.00%
      Total THC 9.77%
      Pesticides: FAIL
      Heavy metals
      Pass
    `, { today: TODAY });
    assert.equal(parsed.safety.pesticides, "fail");
    assert.equal(parsed.safety.heavy_metals, "pass");
    assert.equal(parsed.totals.thc.status, "ok");
  });
});

describe("certificate comparison export", () => {
  it("highlights different totals and leaves equivalent percent and mg/g terpenes unshaded", () => {
    const harbor = libraryRecord(COA_SAMPLES[0].text, "harbor");
    const citrus = libraryRecord(COA_SAMPLES[1].text, "citrus");
    const sameTerpene = parseCoaText(`
      Product: Twin
      Laboratory: Northglass Sample Lab
      Batch: TW-1
      Date tested: 2026-09-14
      THC 0.82%
      THCA 24.10%
      Total THC 21.96%
      Limonene 0.31%
      Pesticides: PASS
      Heavy metals: PASS
      Microbials: PASS
      Mycotoxins: PASS
      Residual solvents: PASS
    `, { today: TODAY, sourceKind: "sample", sourceName: "twin" });
    const comparison = compareCoas([
      harbor,
      { id: "twin", serverId: null, parsed: sameTerpene },
    ]);
    const limonene = comparison.rows.find((row) => row.label === "Limonene");
    assert.ok(limonene);
    assert.equal(limonene.cells.every((cell) => cell.different === false), true);

    const mismatch = compareCoas([harbor, citrus]);
    const total = mismatch.rows.find((row) => row.label === "Total THC");
    assert.equal(total?.cells.every((cell) => cell.different), true);
    assert.ok(mismatch.flags.some((flag) => flag.code === "total_thc_mismatch"));
    const csv = comparisonToCsv(mismatch);
    assert.match(csv, /Harbor Kush Flower/);
    assert.match(csv, /Citrus Drift Live Resin/);
    assert.match(csv, /total_thc_mismatch/);
    const hostile = compareCoas([
      harbor,
      {
        ...citrus,
        parsed: { ...citrus.parsed, productName: "=1+1" },
      },
    ]);
    assert.match(comparisonToCsv(hostile), /'=1\+1/);
    const json = comparisonToJson(mismatch, [harbor, citrus], "2026-11-18T00:00:00.000Z");
    assert.match(json, /Not a compliance determination/);
    assert.match(json, /2026-11-18T00:00:00.000Z/);
    assert.equal(coaRecordLabel(harbor.parsed), "Harbor Kush Flower");
  });

  it("refuses a comparison that is not 2 to 4 certificates", () => {
    const one = libraryRecord(COA_SAMPLES[0].text, "only");
    assert.throws(() => compareCoas([one]), /2 to 4/);
  });
});
