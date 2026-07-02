import { describe, it, expect } from "vitest";
import { coerceParsedAnswers } from "@/lib/intake-parser";

describe("intake parser whitelist validation", () => {
  it("accepts valid enum, int, boolean, array, and string fields", () => {
    const { answers, extractedFields } = coerceParsedAnswers({
      primaryAge: 50,
      healthRating: "average",
      businessOwnerStatus: "business_owner",
      businessStructure: "c_corp",
      keyEmployeesCount: 2,
      primaryGoals: ["business_continuity", "key_employee_retention"],
      hasDependentsUnder18: false,
      coOwnersNotes: "  Two owners, 50 and 49, 50/50 split  ",
    });

    expect(answers.primaryAge).toBe(50);
    expect(answers.healthRating).toBe("average");
    expect(answers.businessStructure).toBe("c_corp");
    expect(answers.primaryGoals).toEqual(["business_continuity", "key_employee_retention"]);
    expect(answers.hasDependentsUnder18).toBe(false);
    expect(answers.coOwnersNotes).toBe("Two owners, 50 and 49, 50/50 split");
    expect(extractedFields).toHaveLength(8);
  });

  it("drops hallucinated enum values, out-of-range ints, and unknown keys", () => {
    const { answers, extractedFields } = coerceParsedAnswers({
      healthRating: "excellent", // not a schema value
      tobaccoUse: "vapes sometimes", // not a schema value
      primaryAge: 250, // out of range
      keyEmployeesCount: -3, // out of range
      primaryGoals: ["business_continuity", "get_rich_quick"], // one invalid member
      recommendedStrategy: "ILIT", // unknown key — extraction must never carry this
      status: "closed_won", // unknown key — must not touch lifecycle fields
      hasDependentsUnder18: "yes", // wrong type
    });

    expect(answers.healthRating).toBeUndefined();
    expect(answers.tobaccoUse).toBeUndefined();
    expect(answers.primaryAge).toBeUndefined();
    expect(answers.keyEmployeesCount).toBeUndefined();
    expect(answers.primaryGoals).toEqual(["business_continuity"]);
    expect(answers.hasDependentsUnder18).toBeUndefined();
    expect("recommendedStrategy" in answers).toBe(false);
    expect("status" in answers).toBe(false);
    expect(extractedFields).toEqual(["primaryGoals"]);
  });

  it("returns nothing for non-object input", () => {
    expect(coerceParsedAnswers(null).extractedFields).toEqual([]);
    expect(coerceParsedAnswers("ILIT").extractedFields).toEqual([]);
    expect(coerceParsedAnswers([1, 2]).extractedFields).toEqual([]);
    expect(coerceParsedAnswers(undefined).extractedFields).toEqual([]);
  });

  it("dedupes array values and caps long strings", () => {
    const { answers } = coerceParsedAnswers({
      primaryGoals: ["legacy", "legacy", "estate_planning"],
      healthNotes: "x".repeat(5000),
    });
    expect(answers.primaryGoals).toEqual(["legacy", "estate_planning"]);
    expect((answers.healthNotes as string).length).toBe(2000);
  });
});
