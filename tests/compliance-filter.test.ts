import { describe, it, expect } from "vitest";
import { complianceFilter } from "@/lib/compliance-filter";

describe("complianceFilter", () => {
  it("passes clean text through unchanged", () => {
    const result = complianceFilter("This strategy may fit your situation. Talk to your CPA.");
    expect(result.status).toBe("pass");
    expect(result.violations).toHaveLength(0);
  });

  it("rewrites 'tax-free' to 'non-taxable'", () => {
    const result = complianceFilter("The death benefit is tax-free while the policy remains in force.");
    expect(result.status).toBe("rewrite");
    expect(result.output).toContain("non-taxable");
    expect(result.output).not.toMatch(/tax[\s-]?free/i);
    expect(result.violations[0]).toMatchObject({ type: "tax_free_language", autoFixable: true });
  });

  it("is case-insensitive and catches 'tax free' without a hyphen", () => {
    const result = complianceFilter("Proceeds are TAX FREE while the policy remains in force.");
    expect(result.status).toBe("rewrite");
    expect(result.output.toLowerCase()).toContain("non-taxable");
  });

  it("appends the force-conditioning phrase when a benefit claim lacks it", () => {
    const result = complianceFilter("The death benefit passes to your beneficiaries.");
    expect(result.status).toBe("rewrite");
    expect(result.output.toLowerCase()).toContain("while the policy remains in force");
    expect(result.violations[0]).toMatchObject({
      type: "missing_force_conditioning",
      autoFixable: true,
    });
  });

  it("does not flag conditioning when the phrase is already present", () => {
    const result = complianceFilter(
      "The death benefit passes to your beneficiaries while the policy remains in force.",
    );
    expect(result.status).toBe("pass");
  });

  it("holds on guarantee language and does not rewrite", () => {
    const original = "We guarantee this strategy will work for you.";
    const result = complianceFilter(original);
    expect(result.status).toBe("hold");
    expect(result.output).toBe(original);
    expect(result.violations.some((v) => v.type === "guarantee_language")).toBe(true);
  });

  it("holds on a money-back guarantee mention", () => {
    const result = complianceFilter("This comes with a 30-day money-back guarantee.");
    expect(result.status).toBe("hold");
  });

  it("holds on quantified income claims", () => {
    const original = "You'll receive $185,000 in retirement income.";
    const result = complianceFilter(original);
    expect(result.status).toBe("hold");
    expect(result.output).toBe(original);
    expect(result.violations.some((v) => v.type === "outcome_quantification")).toBe(true);
  });

  it("does not flag a bare dollar amount with no claim verb", () => {
    const result = complianceFilter("The estimated case size is $185,000.");
    expect(result.violations.some((v) => v.type === "outcome_quantification")).toBe(false);
  });

  it("holds on an IRS form number", () => {
    const result = complianceFilter("Please have them file Form 709 with their return.");
    expect(result.status).toBe("hold");
    expect(result.violations.some((v) => v.type === "irs_form_or_structure_name")).toBe(true);
  });

  it("holds on an IRC section reference", () => {
    const result = complianceFilter("This uses the §1035 exchange rules.");
    expect(result.status).toBe("hold");
    expect(result.violations.some((v) => v.type === "irs_form_or_structure_name")).toBe(true);
  });

  it("holds on a named repositioning structure (ILIT)", () => {
    const result = complianceFilter("The policy will be owned by an ILIT.");
    expect(result.status).toBe("hold");
    expect(result.violations.some((v) => v.type === "irs_form_or_structure_name")).toBe(true);
  });

  it("holds on 'Firm Advantage' language", () => {
    const result = complianceFilter("This is part of our Firm Advantage program.");
    expect(result.status).toBe("hold");
    expect(
      result.violations.some((v) => v.type === "firm_advantage_or_cpa_on_staff"),
    ).toBe(true);
  });

  it("holds on a CPA-on-staff implication", () => {
    const result = complianceFilter("Our CPA will handle the filing for you.");
    expect(result.status).toBe("hold");
    expect(
      result.violations.some((v) => v.type === "firm_advantage_or_cpa_on_staff"),
    ).toBe(true);
  });

  it("prioritizes hold over rewrite when both fixable and unfixable violations are present", () => {
    const original = "This tax-free benefit is guaranteed for life.";
    const result = complianceFilter(original);
    expect(result.status).toBe("hold");
    expect(result.output).toBe(original);
    expect(result.violations.length).toBeGreaterThanOrEqual(2);
  });
});
