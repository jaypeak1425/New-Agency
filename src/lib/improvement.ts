import type { Scenario, Strategy } from "@/generated/prisma/client";
import {
  ESTATE_EXEMPTION_2026,
  ESTATE_TAX_RATE,
  amtTrapExposure2026,
  computeFederalTax2026,
  marginalRate2026,
  type FilingStatus,
} from "@/lib/tax-reference";

// The quantified side of "sell the improvement" (owner directive
// 2026-07-02): current-path vs. with-strategy math from the agent-entered
// case numbers and the verified 2026 federal tables. STRICTLY AGENT-FACING —
// the client deck shows the structural contrast only; dollar outcomes in
// client copy are banned by the compliance filter, and that's deliberate.
// Every figure here is directional (rough inputs, federal only, current-year
// tables) and says so.

export interface ImprovementAnalysis {
  available: boolean;
  // When unavailable: which case numbers would unlock it.
  missingInputs: string[];
  currentPath: string[];
  withDesign: string[];
  notes: string[];
}

const ESTATE_FAMILY = new Set([
  "survivorship-second-to-die",
  "estate-funding",
  "ilit-foundation-wrapper",
  "slat",
  "dynasty-gst-trust",
  "grats",
  "qprt-insurance-hedge",
  "flp-fllc-discounted-gifting",
  "installment-sale-idgt",
  "premium-financed-life-insurance",
  "private-split-dollar-loan-regime",
  "wealth-replacement-crt",
  "clat-wealth-replacement",
]);

const QUALIFIED_FAMILY = new Set(["quiet-wealth-transfer", "rmd-repositioning", "roth-plus-life"]);

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const pct = (r: number) => `${Math.round(r * 100)}%`;

function filingStatus(scenario: Scenario): FilingStatus {
  return scenario.maritalStatus === "married" ? "mfj" : "single";
}

function amtNote(scenario: Scenario): string | null {
  if (scenario.estimatedTaxableIncome === null) return null;
  const exposure = amtTrapExposure2026(scenario.estimatedTaxableIncome, filingStatus(scenario));
  if (!exposure) return null;
  return (
    `AMT trap check: at ~${money(scenario.estimatedTaxableIncome)} of income, roughly ` +
    `${money(exposure.exemptionLost)} of the AMT exemption is already phased out ` +
    `(fully exhausted at ${money(exposure.fullyPhasedOutAt)}) — coordinate conversion and ` +
    `deduction timing with the client's CPA before quoting after-tax outcomes.`
  );
}

const STANDARD_NOTES = [
  "Directional math from rough agent-entered figures and 2026 federal tables (Rev. Proc. 2025-32) — federal only, not a projection, never client-facing.",
  "Verify with the client's CPA before any number leaves this screen.",
];

export function buildImprovementAnalysis(
  scenario: Scenario,
  strategy: Strategy,
): ImprovementAnalysis {
  const status = filingStatus(scenario);
  const notes = [...STANDARD_NOTES];
  const amt = amtNote(scenario);
  if (amt) notes.unshift(amt);

  if (ESTATE_FAMILY.has(strategy.slug)) {
    if (scenario.estimatedEstateValue === null) {
      return {
        available: false,
        missingInputs: ["estimated estate value"],
        currentPath: [],
        withDesign: [],
        notes,
      };
    }
    const exemption =
      scenario.maritalStatus === "married" ? ESTATE_EXEMPTION_2026 * 2 : ESTATE_EXEMPTION_2026;
    const excess = Math.max(0, scenario.estimatedEstateValue - exemption);
    const exposure = excess * ESTATE_TAX_RATE;

    if (excess === 0) {
      return {
        available: true,
        missingInputs: [],
        currentPath: [
          `At ~${money(scenario.estimatedEstateValue)}, the estate sits under the ${money(exemption)} federal exemption today — no current federal estate exposure.`,
          "Growth is the exposure: every year of appreciation compounds toward the exemption line, and the exemption's indexation may not keep pace.",
        ],
        withDesign: [
          "Moving appreciating assets (or funding coverage) outside the estate now caps the future 40% base before growth creates the problem.",
        ],
        notes,
      };
    }

    return {
      available: true,
      missingInputs: [],
      currentPath: [
        `~${money(excess)} sits above the ${money(exemption)} federal exemption — a projected ~${money(exposure)} federal estate bill at the 40% rate.`,
        "That bill is due in cash at death; without liquidity it gets paid by selling assets on the IRS's timeline.",
      ],
      withDesign: [
        `Liquidity target: ~${money(exposure)} of death benefit arriving outside the estate covers the projected bill without touching the assets.`,
        "Every dollar gifted or frozen into the structure also removes its future growth from the 40% base.",
      ],
      notes,
    };
  }

  if (QUALIFIED_FAMILY.has(strategy.slug)) {
    const missing: string[] = [];
    if (scenario.estimatedQualifiedBalance === null) missing.push("estimated qualified balance");
    if (scenario.estimatedTaxableIncome === null) missing.push("estimated taxable income");
    if (missing.length > 0) {
      return { available: false, missingInputs: missing, currentPath: [], withDesign: [], notes };
    }

    const balance = scenario.estimatedQualifiedBalance as number;
    const income = scenario.estimatedTaxableIncome as number;
    const clientMarginal = marginalRate2026(income, status);
    // Heirs' bracket assumption: the 10-year rule lands distributions in the
    // heirs' PEAK earning years — assume at least the client's marginal rate.
    const heirsTax = balance * clientMarginal;
    const clientTax = computeFederalTax2026(income + balance / 10, status) - computeFederalTax2026(income, status);

    const currentPath = [
      `Passing the ~${money(balance)} balance as-is: the 10-year rule forces it into the heirs' brackets — at an assumed ${pct(clientMarginal)} rate (their peak years, likely ≥ the client's), roughly ${money(heirsTax)} goes to the IRS.`,
    ];

    if (strategy.slug === "roth-plus-life") {
      return {
        available: true,
        missingInputs: [],
        currentPath,
        withDesign: [
          `Converting ~${money(balance / 10)}/year on top of ~${money(income)} of income costs roughly ${money(clientTax)}/year at today's rates (client marginal: ${pct(clientMarginal)}) — tax the family was paying anyway, just pre-paid at a known rate.`,
          "Heirs then drain the converted account non-taxable under the 10-year rule, and the paired coverage restores the pre-paid tax to the estate.",
        ],
        notes,
      };
    }

    return {
      available: true,
      missingInputs: [],
      currentPath,
      withDesign: [
        `Distributions come out at the client's ${pct(clientMarginal)} marginal rate instead of the heirs' — the spread between those rates, applied to ~${money(balance)}, is the improvement.`,
        "The after-tax stream funds trust-owned coverage: the taxable, 10-year-forced balance converts into a death benefit arriving non-taxable, outside the estate.",
      ],
      notes,
    };
  }

  if (strategy.slug === "ppli") {
    if (scenario.estimatedTaxableIncome === null) {
      return {
        available: false,
        missingInputs: ["estimated taxable income"],
        currentPath: [],
        withDesign: [],
        notes,
      };
    }
    const marginal = marginalRate2026(scenario.estimatedTaxableIncome, status);
    return {
      available: true,
      missingInputs: [],
      currentPath: [
        `At a ${pct(marginal)} marginal rate (plus the 3.8% investment-income surtax where it applies), every $100,000 of ordinary portfolio income costs ~${money(100_000 * (marginal + 0.038))} per year — before compounding the loss.`,
      ],
      withDesign: [
        "Inside the wrapper the same strategies compound with no annual federal drag while the policy remains in force — the case's economics are that spread versus the policy's all-in costs.",
      ],
      notes,
    };
  }

  // Business-owner and protection strategies: the quantified story is the
  // commission/estimate math and carrier illustrations, not a federal-table
  // computation — no invented numbers here.
  return {
    available: false,
    missingInputs: [],
    currentPath: [],
    withDesign: [],
    notes,
  };
}
