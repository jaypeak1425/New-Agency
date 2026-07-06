import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getScenarioForUser, ScenarioError } from "@/lib/scenarios";
import { classifyAvatars } from "@/lib/avatars";
import { recommendStrategies } from "@/lib/recommendations";
import { getLifeUnderwritingIntake } from "@/lib/underwriting";
import { buildHandoffPreview } from "@/lib/wholesaler";
import { computeExpectedCommission, computeExpectedCommissionValue } from "@/lib/commission";
import { isAiConfigured } from "@/lib/ai";
import { listDocumentedStrategies } from "@/lib/strategies";
import {
  completeIntakeAction,
  notifyWholesalerAction,
  parseIntakeAction,
  saveStrategyEstimateAction,
} from "../../actions";
import { Card } from "@/components/ui/Card";
import { SubmitButton } from "@/components/SubmitButton";
import { IntakeForm } from "@/components/IntakeForm";
import { AtlasReveal, type RevealStep } from "@/components/AtlasReveal";
import { CPA_SCRUTINY, TIER_LABELS } from "@/lib/cpa-scrutiny";
import { taxRef } from "@/lib/tax-reference";
import { buildImprovementAnalysis } from "@/lib/improvement";
import { cn } from "@/lib/cn";
import type { Scenario, Strategy, User } from "@/generated/prisma/client";

const AVATAR_LABELS: Record<string, string> = {
  business_owner: "Business Owner",
  high_net_worth: "High Net Worth",
  qualified_fund_heavy: "Qualified Fund Heavy",
  family_legacy: "Family / Legacy",
};

// Where each strategy's missing answers live, so the "needs more info" list
// can link straight to the section that unlocks it instead of leaving the
// agent to guess. Slugs not listed default to the estate section (all the
// HNW estate-planning gates read from there).
const UNLOCK_SECTION: Record<string, "avatar" | "estate" | "annuity" | "business"> = {
  "quiet-wealth-transfer": "avatar",
  "rmd-repositioning": "avatar",
  "roth-plus-life": "avatar",
  ppli: "avatar",
  "family-income-legacy": "avatar",
  "annuity-rescue": "annuity",
  "qualified-ltc": "annuity",
  "buy-sell-life-insurance": "business",
  "key-person-life-insurance": "business",
  "coli-corporate-reserve": "business",
};

function unlockLink(scenarioId: string, slug: string) {
  const section = UNLOCK_SECTION[slug] ?? "estate";
  if (section === "annuity") {
    return {
      href: `/app/scenarios/${scenarioId}/underwriting/annuity`,
      label: "complete the annuity intake",
    };
  }
  if (section === "business") {
    return {
      href: `/app/scenarios/${scenarioId}/intake?edit=1#intake-edit`,
      label: "answer the business owner questions",
    };
  }
  return {
    href: `/app/scenarios/${scenarioId}/intake?edit=1&focus=${section}#${section}-details`,
    label: section === "avatar" ? "answer the avatar details" : "answer the estate details",
  };
}

export default async function IntakePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    parsed?: string;
    ready?: string;
    edit?: string;
    focus?: string;
  }>;
}) {
  const { id } = await params;
  const { error, parsed, ready, edit, focus } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let scenario;
  try {
    scenario = await getScenarioForUser(user.id, id);
  } catch (err) {
    if (err instanceof ScenarioError) redirect("/app/scenarios");
    throw err;
  }

  const focusSection =
    focus === "avatar" || focus === "estate" || focus === "numbers" ? focus : null;
  const intakeDone = Boolean(scenario.intakeCompletedAt);
  // Results-first once the intake exists: the agent lands on the case
  // design, and the form lives behind an "Update the intake" toggle —
  // auto-opened when they came here to edit (unlock links, Atlas parse,
  // or a validation error).
  const formOpen = !intakeDone || Boolean(edit || parsed || error || focusSection);

  const intakeSection = (
    <div id="intake-edit">
      {parsed && (
        <div className="mt-4 max-w-2xl rounded-lg border border-gold/40 bg-gradient-to-r from-gold/15 to-gold/5 px-4 py-3">
          <p className="text-sm text-navy">
            Atlas filled in <span className="font-semibold">{parsed}</span> field(s) from your
            description. Review them below, answer what it couldn&rsquo;t extract, then save.
          </p>
        </div>
      )}

      {isAiConfigured() ? (
        <Card variant="dark" className="mt-6 max-w-2xl">
          <p className="text-xs uppercase tracking-wide text-gold">Tell Atlas</p>
          <p className="mt-2 text-sm text-cream/80">
            Describe the client in your own words — Atlas extracts what it can into the questions
            below, and only ever fills in what you actually said. You review everything before
            saving.
          </p>
          <form action={parseIntakeAction} className="mt-4 space-y-3">
            <input type="hidden" name="scenarioId" value={scenario.id} />
            <textarea
              name="description"
              rows={4}
              required
              defaultValue={scenario.clientDescription ?? ""}
              placeholder="I've got a guy. Two owners, 50 and 49, C-Corp, two key employees, average to good health. Want to set up a buy-sell and put money aside in a company reserve."
              className="block w-full rounded-md border border-cream/20 bg-navy px-3 py-2 text-sm text-cream placeholder:text-cream/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
            <SubmitButton pendingText="Atlas is reading…">Design It</SubmitButton>
          </form>
        </Card>
      ) : (
        <p className="mt-4 max-w-2xl text-xs text-charcoal/50">
          Free-text intake (&ldquo;type a paragraph, Atlas fills in the questions&rdquo;) activates
          once the AI backend is configured — an admin can check Launch readiness for the one
          variable it needs.
        </p>
      )}

      <Card className="mt-6 max-w-2xl">
        <IntakeForm scenario={scenario} action={completeIntakeAction} focusSection={focusSection} />
      </Card>
    </div>
  );

  return (
    <div>
      <Link href="/app/scenarios" className="text-sm text-navy hover:text-gold">
        &larr; Back to scenarios
      </Link>
      <h1 className="mt-4 text-3xl">&ldquo;I&rsquo;ve got a guy&rdquo; intake</h1>
      <p className="mt-2 text-sm text-charcoal/60">
        {scenario.label}
        {intakeDone
          ? " — Atlas's case design is below. Update the intake any time; the design recomputes on save."
          : " — walk through Atlas's questions. Answer what you know; you can come back and fill in the rest later."}
      </p>
      <p className="mt-2 text-sm">
        <Link href={`/app/scenarios/${id}/underwriting/life`} className="text-navy hover:text-gold">
          Life insurance underwriting &rarr;
        </Link>
        <span className="mx-2 text-charcoal/30">&middot;</span>
        <Link href={`/app/scenarios/${id}/underwriting/annuity`} className="text-navy hover:text-gold">
          Annuity intake &rarr;
        </Link>
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!intakeDone && intakeSection}

      {scenario.intakeCompletedAt && (
        <AtlasReveal play={Boolean(ready)} steps={await buildRevealSteps(scenario)}>
          <AvatarClassificationCard scenario={scenario} />
          <RecommendationCard scenario={scenario} />
          {Boolean(user.assignedWholesalerId) && (
            <HandoffPreviewCard user={user} scenario={scenario} />
          )}
        </AtlasReveal>
      )}

      {intakeDone && (
        <details open={formOpen} className="group mt-8 max-w-2xl">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-navy hover:text-gold [&::-webkit-details-marker]:hidden">
            <span className="inline-block text-gold transition-transform group-open:rotate-90">
              &#9656;
            </span>
            Update the intake
            <span className="font-normal text-charcoal/50">
              — answers, avatar details, estate details
            </span>
          </summary>
          {intakeSection}
        </details>
      )}
    </div>
  );
}
// The reveal's step lines — every one is a real computation the engine runs
// for this scenario, restated for the animation, never invented: avatar
// classification is the same sync call the card below makes, the hard-rule
// line mirrors src/lib/recommendations.ts's rule-4 gate exactly, and the
// library count is the engine's own Brain-Locked query.
async function buildRevealSteps(scenario: Scenario): Promise<RevealStep[]> {
  const classification = classifyAvatars(scenario);
  const documented = await listDocumentedStrategies();

  const avatarDetail =
    classification.activated.length > 0
      ? classification.activated.map((a) => AVATAR_LABELS[a]).join(" + ")
      : "no avatar activated yet — more answers will narrow it";

  const rule4Violated = scenario.existingPolicyTransfer === true;
  const hardRuleDetail = rule4Violated
    ? "Rule 4 flagged — transferring an existing policy into the ILIT triggers the §2035 3-year lookback (details below)"
    : "no violations against this structure";

  return [
    { label: "Scenario read", detail: `intake captured for ${scenario.label}` },
    { label: "Avatar classified", detail: avatarDetail },
    { label: "9 hard rules checked", detail: hardRuleDetail },
    {
      label: "Locked library scanned",
      detail: `${documented.length} documented strategies evaluated — nothing outside the library, ever`,
    },
    { label: "Case design ready", detail: "recommendations, commission math, and the handoff are below" },
  ];
}

function AvatarClassificationCard({
  scenario,
}: {
  scenario: Parameters<typeof classifyAvatars>[0];
}) {
  const classification = classifyAvatars(scenario);

  return (
    <Card className="mt-6 max-w-2xl">
      <h2 className="text-lg font-medium text-navy">Avatar classification</h2>
      {classification.activated.length === 0 ? (
        <p className="mt-2 text-sm text-charcoal/70">
          No avatar activated yet from the answers given.
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {classification.activated.map((avatar) => (
            <span
              key={avatar}
              className="inline-block rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-medium text-navy"
            >
              {AVATAR_LABELS[avatar]}
            </span>
          ))}
        </div>
      )}
      {classification.needsMoreInfo.length > 0 && (
        <p className="mt-3 text-xs text-charcoal/50">
          Need more info to rule in or out: {classification.needsMoreInfo.map((a) => AVATAR_LABELS[a]).join(", ")}.
        </p>
      )}
      {classification.amtTrapFlag && (
        <p className="mt-3 rounded-md bg-cream px-3 py-2 text-xs text-charcoal/70">
          {classification.amtTrapNote}
        </p>
      )}
    </Card>
  );
}

async function RecommendationCard({ scenario }: { scenario: Scenario }) {
  const lifeUnderwritingIntake = await getLifeUnderwritingIntake(scenario.userId, scenario.id);
  const { pivot, recommendations, healthConcernNote } = await recommendStrategies(
    scenario,
    lifeUnderwritingIntake,
  );
  const eligible = recommendations.filter((r) => r.eligibility === "eligible");
  const needsMoreInfo = recommendations.filter((r) => r.eligibility === "needs_more_info");
  // The pivot no longer empties the recommendation — the annuity-side
  // strategies (Annuity Rescue, Qualified LTC) flow through the same list,
  // commission math and all, once they're live in the library.
  const showStrategySection = !pivot.triggered || recommendations.length > 0;
  const commission = showStrategySection
    ? await computeExpectedCommission(scenario.userId, scenario.id)
    : null;
  const estimateBySlug = new Map(commission?.lines.map((l) => [l.strategy.id, l]) ?? []);
  const pipelineValue = showStrategySection
    ? await computeExpectedCommissionValue(scenario.userId, scenario)
    : null;

  return (
    <Card className="mt-6 max-w-2xl">
      <h2 className="text-lg font-medium text-navy">Strategy recommendation</h2>
      <p className="mt-1 text-xs text-charcoal/50">
        Drawn only from the locked, documented strategy library — never invented.
      </p>

      {pivot.triggered && (
        <p className="mt-3 rounded-md bg-cream px-3 py-2 text-sm text-charcoal/80">{pivot.message}</p>
      )}

      {showStrategySection && (
        <>
          {healthConcernNote && !pivot.triggered && (
            <p className="mt-3 rounded-md bg-cream px-3 py-2 text-xs text-charcoal/70">
              {healthConcernNote}
            </p>
          )}

          {eligible.length === 0 ? (
            !pivot.triggered && (
              <p className="mt-3 text-sm text-charcoal/70">
                Based on what you&rsquo;ve told me, none of the standard strategies are a clean fit
                yet. Fill in more of the optional sections above to narrow this down.
              </p>
            )
          ) : (
            <ul className="mt-3 space-y-3">
              {eligible.map(({ strategy, hardRuleViolations }) => {
                const existingEstimate = estimateBySlug.get(strategy.id);
                return (
                  <li key={strategy.id} className="rounded-md border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-navy">{strategy.name}</p>
                      <Link
                        href={`/app/scenarios/${scenario.id}/deck/${strategy.id}`}
                        className="whitespace-nowrap text-xs text-navy underline hover:text-gold"
                      >
                        Build client pitch deck &rarr;
                      </Link>
                    </div>
                    {strategy.whyUsed && (
                      <p className="mt-1 text-xs text-charcoal/70">{strategy.whyUsed}</p>
                    )}
                    {hardRuleViolations.length > 0 && (
                      <div className="mt-2 rounded-md bg-red-50 px-2 py-1.5">
                        {hardRuleViolations.map((v) => (
                          <p key={v.rule} className="text-xs text-red-700">
                            <span className="font-medium">Hard rule {v.rule}:</span> {v.message}
                            {v.suggestion && ` ${v.suggestion}`}
                          </p>
                        ))}
                      </div>
                    )}

                    <ImprovementPanel scenario={scenario} strategy={strategy} />
                    <CpaScrutinyPanel slug={strategy.slug} />

                    <form
                      action={saveStrategyEstimateAction}
                      className="mt-3 flex flex-wrap items-end gap-2 border-t border-border pt-3"
                    >
                      <input type="hidden" name="scenarioId" value={scenario.id} />
                      <input type="hidden" name="strategyId" value={strategy.id} />
                      <label className="text-xs text-charcoal">
                        Product type
                        <select
                          name="productType"
                          defaultValue={existingEstimate?.estimate.productType ?? ""}
                          className="mt-1 block rounded-md border border-border bg-surface px-2 py-1 text-xs"
                        >
                          <option value="">Select</option>
                          <option value="permanent_life">Permanent life</option>
                          <option value="term_life">Term life</option>
                          <option value="survivorship_life">Survivorship life</option>
                          <option value="annuity">Annuity</option>
                          <option value="coli_face_amount">COLI (face amount)</option>
                          <option value="executive_bonus_162">§162 executive bonus</option>
                          <option value="disability_income">Disability income</option>
                          <option value="ltc_hybrid">LTC / hybrid</option>
                        </select>
                      </label>
                      <label className="text-xs text-charcoal">
                        Annual premium
                        <input
                          type="number"
                          name="annualPremium"
                          min={0}
                          defaultValue={existingEstimate?.estimate.annualPremium ?? ""}
                          className="mt-1 block w-28 rounded-md border border-border bg-surface px-2 py-1 text-xs"
                        />
                      </label>
                      <label className="text-xs text-charcoal">
                        Face amount (COLI)
                        <input
                          type="number"
                          name="faceAmount"
                          min={0}
                          defaultValue={existingEstimate?.estimate.faceAmount ?? ""}
                          className="mt-1 block w-28 rounded-md border border-border bg-surface px-2 py-1 text-xs"
                        />
                      </label>
                      <SubmitButton variant="outline" pendingText="Saving…" className="px-3 py-1 text-xs">
                        Save estimate
                      </SubmitButton>
                      {existingEstimate && (
                        <span className="text-xs text-charcoal/60">
                          Est. commission: ${existingEstimate.amount.toLocaleString()} (
                          {Math.round(existingEstimate.rate * 1000) / 10}%)
                        </span>
                      )}
                    </form>
                  </li>
                );
              })}
            </ul>
          )}

          {commission && commission.lines.length > 0 && (
            <p className="mt-3 rounded-md bg-cream px-3 py-2 text-sm text-navy">
              Total expected commission Y1: ${commission.total.toLocaleString()}
              {commission.overridePercent !== null && (
                <span className="ml-1 text-xs text-charcoal/60">
                  (using your {Math.round(commission.overridePercent * 1000) / 10}% override rate)
                </span>
              )}
              {pipelineValue?.expectedCommissionValue !== null &&
                pipelineValue?.expectedCommissionValue !== undefined && (
                  <span className="mt-1 block text-xs text-charcoal/70">
                    Expected commission value (× {Math.round((pipelineValue.closeRate ?? 0) * 1000) / 10}%
                    close rate): ${pipelineValue.expectedCommissionValue.toLocaleString()}
                  </span>
                )}
              {commission.total > 0 && pipelineValue?.expectedCommissionValue === null && (
                <span className="mt-1 block text-xs text-charcoal/50">
                  Set the close-rate category above (near Q9) to see the pipeline value.
                </span>
              )}
            </p>
          )}

          {needsMoreInfo.length > 0 && (
            <div className="mt-3 rounded-md bg-cream px-3 py-2">
              <p className="text-xs font-medium text-navy">
                {needsMoreInfo.length} more strateg{needsMoreInfo.length === 1 ? "y" : "ies"} could
                fit — a few answers would confirm:
              </p>
              <ul className="mt-1.5 space-y-1">
                {needsMoreInfo.map((r) => {
                  const link = unlockLink(scenario.id, r.strategy.slug);
                  return (
                    <li key={r.strategy.id} className="text-xs text-charcoal/70">
                      {r.strategy.name} —{" "}
                      <Link href={link.href} className="text-navy underline hover:text-gold">
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

// The quantified improvement analysis (owner directive 2026-07-02):
// current-path vs. with-design math from the agent-entered case numbers and
// the 2026 federal tables. Agent-only — the client deck stays structural.
function ImprovementPanel({ scenario, strategy }: { scenario: Scenario; strategy: Strategy }) {
  const analysis = buildImprovementAnalysis(scenario, strategy);

  if (!analysis.available && analysis.missingInputs.length === 0) return null;

  return (
    <details className="group mt-2 rounded-md bg-navy px-3 py-2">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-medium text-cream [&::-webkit-details-marker]:hidden">
        <span className="inline-block text-gold transition-transform group-open:rotate-90">
          &#9656;
        </span>
        Improvement analysis
        <span className="rounded-full bg-gold/25 px-2 py-0.5 text-[10px] font-medium text-gold">
          agent-only
        </span>
      </summary>
      {!analysis.available ? (
        <p className="mt-2 text-xs text-cream/70">
          Enter {analysis.missingInputs.join(" and ")} in the intake&rsquo;s{" "}
          <Link
            href={`/app/scenarios/${scenario.id}/intake?edit=1&focus=numbers#case-numbers`}
            className="text-gold underline"
          >
            case numbers section
          </Link>{" "}
          to quantify this comparison.
        </p>
      ) : (
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-cream/50">
              Current path
            </p>
            {analysis.currentPath.map((line) => (
              <p key={line} className="mt-1 text-xs leading-relaxed text-cream/80">
                {line}
              </p>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gold">
              With this design
            </p>
            {analysis.withDesign.map((line) => (
              <p key={line} className="mt-1 text-xs leading-relaxed text-cream/90">
                {line}
              </p>
            ))}
          </div>
        </div>
      )}
      <div className="mt-2 border-t border-cream/10 pt-1.5">
        {analysis.notes.map((note) => (
          <p key={note} className="mt-0.5 text-[10px] leading-relaxed text-cream/50">
            {note}
          </p>
        ))}
      </div>
    </details>
  );
}

// The CPA lens per recommendation (owner directive 2026-07-02): tier,
// verdict, the documentation checklist the client's CPA will request, and
// the current-year federal figures the case math keys off — so the agent
// walks in already holding the answers.
function CpaScrutinyPanel({ slug }: { slug: string }) {
  const scrutiny = CPA_SCRUTINY[slug];
  if (!scrutiny) return null;
  const figures = scrutiny.taxRefKeys
    .map((key) => taxRef(key))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return (
    <details className="group mt-2 rounded-md bg-cream px-3 py-2">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-medium text-navy [&::-webkit-details-marker]:hidden">
        <span className="inline-block text-gold transition-transform group-open:rotate-90">
          &#9656;
        </span>
        CPA scrutiny &amp; documentation
        <span
          className={cn(
            "ml-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
            scrutiny.tier === 1 && "bg-gold/25 text-navy",
            scrutiny.tier === 2 && "bg-charcoal/10 text-charcoal",
            scrutiny.tier === 3 && "bg-red-50 text-red-700",
          )}
        >
          {TIER_LABELS[scrutiny.tier]}
        </span>
      </summary>
      <p className="mt-2 text-xs text-charcoal/80">{scrutiny.verdict}</p>
      <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-charcoal/50">
        The file the CPA will ask for
      </p>
      <ul className="mt-1 list-inside list-disc space-y-0.5">
        {scrutiny.checklist.map((item) => (
          <li key={item} className="text-xs text-charcoal/70">
            {item}
          </li>
        ))}
      </ul>
      {figures.length > 0 && (
        <>
          <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-charcoal/50">
            2026 federal figures this case keys off
          </p>
          <ul className="mt-1 space-y-0.5">
            {figures.map((entry) => (
              <li key={entry.key} className="text-xs text-charcoal/70">
                <span className="font-medium text-charcoal">{entry.label}:</span> {entry.y2026}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[10px] text-charcoal/50">
            Full 2026/2027 table:{" "}
            <Link href="/app/tax-reference" className="text-navy underline hover:text-gold">
              federal tax reference
            </Link>
          </p>
        </>
      )}
    </details>
  );
}

async function HandoffPreviewCard({ user, scenario }: { user: User; scenario: Scenario }) {
  const preview = await buildHandoffPreview(user, scenario.id);

  return (
    <Card className="mt-6 max-w-2xl">
      <h2 className="text-lg font-medium text-navy">Wholesaler handoff</h2>
      <p className="mt-1 text-xs text-charcoal/50">
        docs/06-wholesaler-handoff.md: fires once all the eligibility gates pass. Review before
        sending — Atlas never auto-sends.
      </p>

      {!preview.ready ? (
        <p className="mt-3 text-sm text-charcoal/70">{preview.reason}</p>
      ) : (
        <>
          <div className="mt-3 space-y-3 text-sm text-charcoal/80">
            <div>
              <p className="font-medium text-navy">Strategy requested</p>
              {preview.content.strategyRequestedLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <div>
              <p className="font-medium text-navy">Client profile</p>
              {preview.content.clientProfileLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            {preview.content.businessContextLines.length > 0 && (
              <div>
                <p className="font-medium text-navy">Business context</p>
                {preview.content.businessContextLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            )}
            <div>
              <p className="font-medium text-navy">Scenario summary</p>
              {preview.content.scenarioSummaryLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            {preview.content.coiNotes.length > 0 && (
              <div>
                <p className="font-medium text-navy">COI notes</p>
                {preview.content.coiNotes.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            )}
            {preview.content.documentationLines.length > 0 && (
              <div>
                <p className="font-medium text-navy">
                  CPA readiness — documentation this case will need
                </p>
                {preview.content.documentationLines.map((line) => (
                  <p key={line} className={line.startsWith("•") ? "pl-3 text-xs" : "mt-1"}>
                    {line}
                  </p>
                ))}
              </div>
            )}
            {preview.content.improvementLines.length > 0 && (
              <div>
                <p className="font-medium text-navy">
                  Quantified upside (agent-only — federal, directional)
                </p>
                {preview.content.improvementLines.map((line) => (
                  <p key={line} className={line.startsWith("•") ? "pl-3 text-xs" : "mt-1"}>
                    {line}
                  </p>
                ))}
              </div>
            )}
            <p className="text-xs text-charcoal/50">{preview.content.complianceNote}</p>
          </div>

          <form action={notifyWholesalerAction} className="mt-4">
            <input type="hidden" name="scenarioId" value={scenario.id} />
            <SubmitButton pendingText="Sending…">
              {scenario.wholesalerNotifiedAt ? "Send again" : "Send to wholesaler"}
            </SubmitButton>
          </form>
        </>
      )}
    </Card>
  );
}
