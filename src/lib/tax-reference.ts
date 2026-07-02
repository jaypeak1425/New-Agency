// Federal tax reference — agent-facing figures the strategies key off.
// FEDERAL ONLY by owner directive (2026-07-02): state tax is out of scope.
//
// 2026 figures are ACTUALS from Rev. Proc. 2025-32 (released October 2025,
// reflecting OBBBA) plus statutes, verified 2026-07-02 as part of the
// docs/25 tax-law alignment review. 2027 inflation adjustments are NOT
// published until the IRS releases the fall-2026 revenue procedure — so the
// 2027 column carries what is law-locked today (rates, statutory
// non-indexed thresholds, scheduled ages) and says "pending" for everything
// awaiting indexation. UPDATE PROTOCOL: when the 2027 Rev. Proc. lands
// (~October 2026), fill the pending values here and re-run the docs/25
// review — this file is the single source the UI reads.

export interface TaxRefEntry {
  key: string;
  label: string;
  y2026: string;
  y2027: string;
  source: string;
  note?: string;
}

const PENDING_2027 =
  "Pending — 2027 inflation adjustments publish in the fall-2026 revenue procedure";

export const TAX_REFERENCE: TaxRefEntry[] = [
  {
    key: "ordinary_brackets_single",
    label: "Ordinary income brackets — single",
    y2026:
      "10% to $12,400 · 12% to $50,400 · 22% to $105,700 · 24% to $201,775 · 32% to $256,225 · 35% to $640,600 · 37% above",
    y2027: `Same seven rates (permanent under OBBBA); thresholds ${PENDING_2027.toLowerCase()}`,
    source: "Rev. Proc. 2025-32 §1(j)(2) tables",
    note: "OBBBA added an extra inflation adjustment to the lower brackets for 2026.",
  },
  {
    key: "ordinary_brackets_mfj",
    label: "Ordinary income brackets — married filing jointly",
    y2026:
      "10% to $24,800 · 12% to $100,800 · 22% to $211,400 · 24% to $403,550 · 32% to $512,450 · 35% to $768,700 · 37% above",
    y2027: `Same seven rates (permanent under OBBBA); thresholds ${PENDING_2027.toLowerCase()}`,
    source: "Rev. Proc. 2025-32 §1(j)(2) tables",
  },
  {
    key: "standard_deduction",
    label: "Standard deduction",
    y2026: "$16,100 single · $32,200 married filing jointly · $24,150 head of household",
    y2027: PENDING_2027,
    source: "Rev. Proc. 2025-32 (OBBBA-amended §63)",
  },
  {
    key: "estate_gift_gst_exemption",
    label: "Estate / gift / GST exemption (per person)",
    y2026: "$15,000,000",
    y2027: "$15,000,000 base, indexed for inflation (2025 base year) — exact figure pending",
    source: "§2010(c)(3) as amended by OBBBA — permanent, no sunset",
    note: "GST exemption equals the basic exclusion amount and is NOT portable between spouses.",
  },
  {
    key: "annual_gift_exclusion",
    label: "Annual gift exclusion (per donee)",
    y2026: "$19,000 · non-citizen spouse: $194,000",
    y2027: PENDING_2027,
    source: "Rev. Proc. 2025-32 (§2503(b))",
    note: "The Crummey-gift ceiling per beneficiary for every trust-funded strategy in the library.",
  },
  {
    key: "ltcg_thresholds",
    label: "Long-term capital gains thresholds",
    y2026:
      "0% to $49,450 single / $98,900 MFJ · 20% begins above $613,700 MFJ (single 20% threshold: confirm Rev. Proc. 2025-32 §3.03 before quoting) · 15% between",
    y2027: PENDING_2027,
    source: "Rev. Proc. 2025-32 §3.03",
  },
  {
    key: "niit",
    label: "Net investment income tax",
    y2026: "3.8% on net investment income above $200,000 single / $250,000 MFJ MAGI",
    y2027: "Unchanged — statutory thresholds, never indexed",
    source: "§1411 (statutory, not inflation-adjusted)",
  },
  {
    key: "amt",
    label: "Alternative minimum tax (the OBBBA AMT trap)",
    y2026:
      "Exemption $90,100 single / $140,200 MFJ · phase-out begins at $500,000 / $1,000,000 AMTI at 50¢ per dollar · 28% rate above $244,500",
    y2027:
      "Exemption indexed (figure pending); phase-out thresholds reset to $500K/$1M by OBBBA — confirm indexation treatment in the fall-2026 revenue procedure",
    source: "Rev. Proc. 2025-32 + OBBBA (phase-out reset to 2018 levels, rate accelerated from 25% to 50%)",
    note: "This is the CLAUDE.md AMT-trap diagnostic: $500K–$1.5M earners can lose the exemption at 50¢ per dollar — twice the old speed.",
  },
  {
    key: "ltc_per_diem",
    label: "Qualified LTC per-diem limitation",
    y2026: "$430/day",
    y2027: PENDING_2027,
    source: "Rev. Proc. 2025-32 §4.62 (§7702B(d)(4))",
    note: "Caps non-taxable treatment of periodic LTC payments (including chronic-illness life riders).",
  },
  {
    key: "rmd_age",
    label: "RMD required beginning age",
    y2026: "73 (born 1951–1959)",
    y2027: "73 — unchanged; rises to 75 for those born 1960+ starting 2033",
    source: "SECURE 2.0 §107 (law-locked schedule)",
  },
  {
    key: "corporate_rate",
    label: "Corporate income tax rate",
    y2026: "21% flat",
    y2027: "21% flat — permanent (TCJA, unchanged by OBBBA)",
    source: "§11(b)",
  },
];

const BY_KEY = new Map(TAX_REFERENCE.map((e) => [e.key, e]));

export function taxRef(key: string): TaxRefEntry | undefined {
  return BY_KEY.get(key);
}
