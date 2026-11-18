/**
 * Invented certificates for the beta reader.
 * Northglass Sample Lab is not a real laboratory. Do not present these as lab documents.
 */

export type CoaSample = {
  id: string;
  title: string;
  blurb: string;
  text: string;
};

const BANNER = `SYNTHETIC SAMPLE DATA
This is not a document from a real laboratory.
Northglass Sample Lab is a fictional name.`;

export const COA_SAMPLES: CoaSample[] = [
  {
    id: "harbor-kush",
    title: "Harbor Kush Flower",
    blurb: "Recent flower certificate. Totals use THC + 0.877 × THCA. Every safety panel is marked pass.",
    text: `${BANNER}

CERTIFICATE OF ANALYSIS
Product: Harbor Kush Flower
Strain: Harbor Kush
Laboratory: Northglass Sample Lab
Batch: HK-2026-0914
Lot: LOT-4419
Date tested: 2026-09-14

Cannabinoids (% by weight)
THCA 24.10%
delta-9 THC 0.82%
Total THC 21.96%
CBDA 0.08%
CBD 0.04%
Total CBD 0.11%
CBG 0.64%
CBN ND
CBC 0.09%
THCV 0.21%

Terpenes (mg/g)
beta-Myrcene 6.40 mg/g
Limonene 3.10 mg/g
beta-Caryophyllene 2.25 mg/g
Linalool 1.40 mg/g
alpha-Pinene 0.95 mg/g
alpha-Humulene 0.70 mg/g

Safety panels
Pesticides: PASS
Heavy metals: PASS
Microbials: PASS
Mycotoxins: PASS
Residual solvents: PASS
`,
  },
  {
    id: "citrus-drift",
    title: "Citrus Drift Live Resin",
    blurb: "The printed total THC is the raw sum of THC and THCA, not THC + 0.877 × THCA. Two safety panels are absent.",
    text: `${BANNER}

CERTIFICATE OF ANALYSIS
Product: Citrus Drift Live Resin
Strain: Citrus Drift
Laboratory: Northglass Sample Lab
Batch/Lot: CD-2026-1002 / LOT-7781
Date tested: October 2, 2026

Cannabinoids
THCA 68.20%
delta-9 THC 4.50%
Total THC 72.70%
CBDA 0.30%
CBD 0.20%
Total CBD 0.46%
CBG 1.80%
CBN 0.40%
CBC 0.55%
THCV 0.33%

Terpenes
Limonene 2.40%
beta-Caryophyllene 1.10%
Myrcene 0.80%
Linalool 0.45%

Safety panels
Pesticides: PASS
Heavy metals: PASS
Microbials: PASS
`,
  },
  {
    id: "lowland-cbd",
    title: "Lowland CBD Flower",
    blurb: "Test date is in 2024. Pesticides are marked fail. Terpenes and two safety panels are absent.",
    text: `${BANNER}

CERTIFICATE OF ANALYSIS
Product: Lowland CBD Flower
Strain: Lowland
Laboratory: Northglass Sample Lab
Batch: LL-2024-0211
Lot: LOT-102
Date tested: February 11, 2024

Cannabinoids (% by weight)
THCA 0.60%
delta-9 THC 0.15%
Total THC 0.68%
CBDA 12.40%
CBD 0.90%
Total CBD 11.77%
CBG 0.30%
CBN ND
CBC 0.12%
THCV ND

Safety panels
Pesticides: FAIL
Heavy metals: PASS
Mycotoxins: PASS
`,
  },
];
