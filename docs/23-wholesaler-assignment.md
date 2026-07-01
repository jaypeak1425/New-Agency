# Wholesaler Assignment + Notification

## Purpose
Added to Phase 3 scope after Phase 2 shipped, at Jay's request. A wholesaler can be assigned to a
specific agent so that the wholesaler has standing visibility into that agent's cases, and is
proactively notified (in-app + email) whenever the agent is working a case with them — the trigger
for the wholesaler to call the agent and talk through it.

This is distinct from, and layers on top of, the existing **Wholesaler Handoff Template**
(`docs/06-wholesaler-handoff.md`): that doc's illustration-request email is per-scenario,
agent-initiated, and can go to any wholesaler contact on file. This feature is a standing
agent↔wholesaler relationship with its own login and its own notification, independent of whether
a specific illustration request has been sent.

**Last updated:** July 1, 2026

---

## 1. The Model

- **Wholesalers are login-capable system users.** A new `wholesaler` role alongside the existing
  `user` (agent) and `admin` roles. Wholesalers are not paying customers — they don't have a
  subscription, don't go through onboarding, and don't see the agent dashboard (`/app`). They have
  their own portal (`/wholesaler`).
- **One wholesaler per agent.** An admin assigns a single wholesaler to an agent. (The existing
  wholesaler-handoff doc allows an agent to have multiple wholesaler contacts by product type —
  that's unchanged and separate; this assignment is the one wholesaler who gets standing
  visibility + proactive notifications.)
- **Admin creates wholesaler accounts.** There's no self-serve wholesaler signup. Admin creates the
  account (email + name); the wholesaler gets a password-setup email (reusing the existing
  password-reset flow as an invite mechanism) and then assigns them to one or more agents.

## 2. The Trigger

The wholesaler is notified at the **wholesaler-handoff moment** — the same trigger as
`docs/06-wholesaler-handoff.md` Section 1 (all five eligibility gates pass and the agent sends the
illustration request). When that happens:

1. The illustration-request email still goes out per the existing spec (unchanged).
2. If the agent has an assigned wholesaler, that wholesaler additionally gets:
   - An email: "An agent you work with is working a case" — the agent's name, the case label, a
     link into their portal.
   - The case appears (or updates) in their portal's case list.

Until Phase 3's real eligibility-gate/recommendation engine exists, the agent-side "Scenarios" page
is a minimal case record (a label + free-text notes) with an explicit "Notify my wholesaler"
action, standing in for the full gate-driven trigger. When the real recommendation engine and
eligibility gates ship, this action is replaced by the automatic trigger described above — the
notification/portal mechanics underneath don't change.

## 3. The Wholesaler Portal

`/wholesaler` (role = `wholesaler` only, same auth pattern as `/admin`):

- Lists the wholesaler's assigned agents.
- For each agent, lists their cases (label, notes, status, last notified timestamp).
- Read-only. The wholesaler doesn't edit the case — they call the agent.

## 4. Admin Controls

On `/admin`:

- **Create wholesaler**: email + name → creates the account, sends a password-setup email.
- **Assign wholesaler**: per-agent control to set/change/clear their assigned wholesaler (dropdown
  of existing wholesaler accounts).

Every assignment change and every wholesaler-account creation is logged to `audit_log`, per
CLAUDE.md's auditability rule.

## 5. What the Dev Builds Against This Doc

- `wholesaler` added to the user role enum
- `assignedWholesalerId` self-relation on the user record (one wholesaler, many agents)
- Admin actions: create wholesaler account, assign/unassign wholesaler per agent
- Agent-side minimal case record (label + notes) with a "Notify my wholesaler" action, as a bridge
  until the real intake/recommendation engine and eligibility gates exist
- Wholesaler portal: role-gated route, case list scoped to assigned agents
- Email template: wholesaler case notification
- Role-based routing: wholesalers redirected away from `/app`/`/billing`/`/onboarding` to
  `/wholesaler`; agents/admins redirected away from `/wholesaler`

**Auditable:** wholesaler account creation, assignment changes, and every notification sent are
logged to `audit_log`.

---

*Last updated: July 1, 2026. Built as the first slice of Phase 3 since it doesn't depend on the
Brain/strategy library.*
