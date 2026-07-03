import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listBookClients } from "@/lib/book-import";
import { DEFAULT_BOOK_ADDRESSABLE_FILTER } from "@/lib/book-of-business";
import { importBookAction, startCaseFromBookAction } from "./actions";
import { Card } from "@/components/ui/Card";
import { SubmitButton } from "@/components/SubmitButton";
import { CountUp } from "@/components/CountUp";

const AVATAR_LABELS: Record<string, string> = {
  business_owner: "Business Owner",
  high_net_worth: "High Net Worth",
  qualified_fund_heavy: "Qualified Fund Heavy",
  family_legacy: "Family / Legacy",
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; imported?: string; skipped?: string }>;
}) {
  const { error, imported, skipped } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const clients = await listBookClients(user.id);
  const totalScore = clients.reduce((sum, c) => sum + c.scoreY1, 0);
  const addressable = Math.round(totalScore * DEFAULT_BOOK_ADDRESSABLE_FILTER);
  const unclassified = clients.filter((c) => c.avatar === null).length;

  return (
    <div>
      <h1 className="text-3xl">Book of business</h1>
      <p className="mt-2 max-w-2xl text-sm text-charcoal/60">
        Import your actual client list and Atlas ranks it: every client classified into the four
        avatars, scored with the per-avatar Y1 commission model
        (docs/07-progress-dashboard-math.md), highest-value opportunities first. One click turns a
        book client into a case with the intake pre-filled.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {imported && (
        <div className="mt-4 max-w-xl rounded-lg border border-gold/40 bg-gradient-to-r from-gold/15 to-gold/5 px-4 py-3">
          <p className="text-sm text-navy">
            Imported <span className="font-semibold">{imported}</span> client
            {imported === "1" ? "" : "s"}
            {skipped !== "0" && ` (${skipped} row${skipped === "1" ? "" : "s"} skipped — no name)`}.
            They&rsquo;re ranked below.
          </p>
        </div>
      )}

      {clients.length > 0 && (
        <div className="mt-6 grid max-w-2xl gap-4 sm:grid-cols-3">
          <Card className="!p-5">
            <p className="text-xs uppercase tracking-wide text-charcoal/50">Clients in book</p>
            <p className="mt-1 font-serif text-2xl text-navy">{clients.length}</p>
          </Card>
          <Card className="!p-5">
            <p className="text-xs uppercase tracking-wide text-charcoal/50">Book opportunity (Y1)</p>
            <p className="mt-1 font-serif text-2xl text-navy">
              <CountUp value={totalScore} />
            </p>
          </Card>
          <Card className="!p-5">
            <p className="text-xs uppercase tracking-wide text-charcoal/50">
              Addressable ({Math.round(DEFAULT_BOOK_ADDRESSABLE_FILTER * 100)}%)
            </p>
            <p className="mt-1 font-serif text-2xl text-navy">
              <CountUp value={addressable} />
            </p>
          </Card>
        </div>
      )}

      <Card className="mt-6 max-w-2xl">
        <h2 className="text-lg font-medium text-navy">Import your book (CSV)</h2>
        <p className="mt-1 text-xs text-charcoal/50">
          Header row + one client per row. Recognized columns: name (required), age, business
          owner, co-owners, net worth, qualified funds, dependents, notes — flexible about naming
          and formats ($2,500,000 / 2.5m / 750k all work). Values Atlas can&rsquo;t read are left
          blank, never guessed.
        </p>
        <form action={importBookAction} className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            className="text-sm text-charcoal file:mr-3 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-navy hover:file:border-gold"
          />
          <SubmitButton pendingText="Importing…">Import</SubmitButton>
        </form>
      </Card>

      {clients.length === 0 ? (
        <p className="mt-6 text-sm text-charcoal/60">
          No book clients yet — import a CSV above and Atlas will rank the whole list in seconds.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {unclassified > 0 && (
            <p className="text-xs text-charcoal/50">
              {unclassified} client{unclassified === 1 ? "" : "s"} couldn&rsquo;t be classified
              from the imported fields (score 0) — starting a case fills in what the import
              didn&rsquo;t know.
            </p>
          )}
          {clients.map((client) => (
            <Card key={client.id} className="!p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-medium text-navy">{client.name}</h3>
                    {client.avatar ? (
                      <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-medium text-navy">
                        {AVATAR_LABELS[client.avatar]}
                      </span>
                    ) : (
                      <span className="rounded-full bg-charcoal/10 px-2.5 py-0.5 text-xs text-charcoal/60">
                        Needs more info
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-charcoal/60">
                    {[
                      client.age !== null && `age ${client.age}`,
                      client.businessOwner === true &&
                        (client.hasCoOwners === true ? "business owner with co-owners" : "business owner"),
                      client.netWorthEstimate && `net worth ${client.netWorthEstimate.replaceAll("_", " ")}`,
                      client.qualifiedFundsEstimate === "over_500k" && "$500K+ qualified",
                      client.hasDependentsUnder18 === true && "dependents under 18",
                    ]
                      .filter(Boolean)
                      .join(" · ") || "no details imported"}
                  </p>
                  {client.notes && <p className="mt-1 text-xs text-charcoal/50">{client.notes}</p>}
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-2">
                  <p className="text-sm font-medium text-navy">
                    ${client.scoreY1.toLocaleString()}
                    <span className="ml-1 text-xs font-normal text-charcoal/50">Y1 model</span>
                  </p>
                  {client.scenario ? (
                    <Link
                      href={`/app/scenarios/${client.scenario.id}/intake`}
                      className="text-xs text-navy underline hover:text-gold"
                    >
                      View case &rarr;
                    </Link>
                  ) : (
                    <form action={startCaseFromBookAction}>
                      <input type="hidden" name="bookClientId" value={client.id} />
                      <SubmitButton
                        variant="outline"
                        pendingText="Starting…"
                        className="px-3 py-1.5 text-xs"
                      >
                        Start a case
                      </SubmitButton>
                    </form>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
