# Master Dashboard Spec

## Purpose
The master dashboard is the internal control room for the team (you, your operators, your future sales and customer success hires) and the IMO principals who white-label the product. It shows every aspect of the business in one place: every client (agent and IMO), channel attribution, MRR by segment, activity, churn, support, the Opportunity Flow with the Learning Loop, and the Compliance Flag Queue.

**This doc is what the developer builds against.** It includes every screen, every metric, every workflow, the data model, the integration points, and the audit log requirements.

---

## 1. Who Sees the Master Dashboard

Three audiences, three views:

- **You and your operators (internal team):** Full visibility into every agent, every IMO, every metric, every opportunity, every compliance flag. This is the command center.
- **IMO principals (white-label customers):** Visibility into their own agents, their own seats, their own MRR, their own activity. They don't see other IMOs' data.
- **Agents (end users):** See the per-agent view only. They don't see the master dashboard.

**The IMO principal view is a filtered version of the internal team view** — same data model, but scoped to their organization.

---

## 2. The Internal Team View (Command Center)

The internal team view has six modules, accessible from a top nav:

### Module 1: Clients (the master client list)

**The single source of truth for every customer.** Two tabs: Agents and IMOs.

**Agents tab columns:**
- Name
- Email
- Plan (monthly $97 / annual $970-$980)
- Status (active / past due / cancelled / suspended)
- MRR contribution ($97 or annual ÷ 12)
- Signup date
- Channel (organic / paid / referral / IMO-sourced / Dream 100 / etc.)
- Last login
- Activity score (high / medium / low based on engagement)
- Churn risk (low / medium / high)

**IMOs tab columns:**
- Name (IMO / FMO / BGA / GA)
- Primary contact
- Plan (white-label tier — 50 / 100 / 500+ seats)
- Seats purchased
- Seats active
- Seats churning
- MRR contribution ($75 × active seats)
- Signup date
- Channel (Dream 100 / referral / event / etc.)
- IMO principal view access (yes / no)

**Filters and sorting:** Every column is sortable and filterable. The default view is "active clients sorted by MRR contribution descending."

**Bulk actions:** Suspend access, revoke access, send broadcast email, export CSV.

### Module 2: Revenue

**The financial health of the business.** Four widgets:

**Widget 1: Total MRR**
- Big number at the top: total monthly recurring revenue
- Breakdown: individual agents ($97 × active monthly count) + annual prepay ($X ÷ 12) + IMO white-label ($75 × active seats)
- Trend: line chart showing MRR over time (last 30 / 90 / 365 days)
- Goal tracking: if there's a $30K MRR target, show progress

**Widget 2: New MRR This Month**
- New agent subscriptions (count + MRR)
- New IMO contracts (count + MRR)
- Expansion (existing IMOs adding seats, existing agents upgrading to annual)
- Net new MRR (new + expansion - churned)

**Widget 3: Churned MRR This Month**
- Cancelled subscriptions (count + MRR)
- Suspended (count + MRR)
- Lapsed on annual (count + MRR)
- Churn rate (% of starting MRR)

**Widget 4: MRR by Segment**
- Pie chart: individual agents (monthly) / individual agents (annual) / IMOs
- Table: each segment with count, MRR, % of total

### Module 3: Activity

**What every client is doing (or not doing).** Three sub-modules:

**Sub-module 3A: Engagement Scores**
- Every agent has an activity score: high / medium / low
- High: logged in within 7 days, added a prospect within 30 days, generated a scenario within 60 days
- Medium: logged in within 14 days, added a prospect within 90 days
- Low: no login in 14+ days, no prospect added in 90+ days
- The dashboard flags low-engagement agents for re-engagement campaigns

**Sub-module 3B: Top Active Agents**
- The 20 most active agents in the last 7 days
- Sorted by: prospects added, scenarios generated, wholesaler handoffs sent, pitches built
- Each row links to the agent's full activity log

**Sub-module 3C: Activity Trends**
- Total scenarios generated this week / month / quarter
- Total wholesaler handoffs sent
- Total pitches built
- Total COI actions surfaced
- Total pivots triggered
- Trend lines over time

### Module 4: Churn

**Who's at risk, who's gone, who's coming back.**

**Sub-module 4A: At-Risk Agents**
- Agents with declining activity (down >40% vs. their 90-day average)
- Agents who haven't logged in 14+ days
- Agents who have 0 active scenarios and haven't added a prospect in 60+ days
- Each row: name, last login, last activity, MRR at risk, suggested re-engagement action

**Sub-module 4B: Churned This Month**
- Cancelled subscriptions (count + MRR)
- Top reasons (from cancellation survey, if implemented)
- Each row: name, cancellation date, plan, MRR lost, reason

**Sub-module 4C: Win-Back Queue**
- Churned agents in the last 90 days
- Status: not yet contacted / contacted / re-engaged / lost
- Suggested action: re-engagement email, personal call, special offer

### Module 5: Support

**What clients are asking and where they're stuck.**

**Sub-module 5A: Open Tickets**
- Every support ticket (from in-app, email, or chat)
- Status: open / in progress / waiting on client / resolved
- Priority: low / medium / high
- Assigned to: [team member name]
- Each row: client, subject, last update, days open

**Sub-module 5B: Common Questions**
- Top 10 questions in the last 30 days
- Categorized: onboarding / intake flow / underwriting / strategy / wholesaler / billing / technical
- Each one links to the help doc or a suggested response template

**Sub-module 5C: Friction Points**
- Where clients get stuck in the app
- Funnel analysis: % of users who complete onboarding, % who run their first scenario, % who send their first handoff
- Drop-off points: which step loses the most users
- Suggested fixes

### Module 6: Compliance

**The Compliance Flag Queue** (built in detail below in Section 5).

---

## 3. The Opportunity Flow with the Learning Loop

The Opportunity Flow is the most important module in the master dashboard. It's how the team (you, your operators, your customer success hires) works with agents to verify recommendations, modify the engine's output, and make the brain smarter with every review.

### The Flow

**Step 1: An agent runs a scenario.**
The scenario is logged: prospect profile, strategy recommendation, expected commission value, status.

**Step 2: The team sees the scenario on the Opportunity Flow.**
The Opportunity Flow is a live feed of every active scenario, sorted by recency. Each row:
- Agent name + IMO affiliation
- Prospect (anonymized — "Smith Industries" not real client name)
- Avatar (Business Owner / HNW / Qualified Fund Heavy / Family-Legacy)
- Strategy recommended
- Expected commission value
- Status (intake complete / wholesaler handoff sent / proposal pending / in underwriting / closed)
- Last activity

**Step 3: The team reviews the scenario.**
A team member clicks on a row and sees the full scenario: the prospect profile, the intake answers, the strategy recommendation, the wholesaler handoff (if sent), the pitch deck (if built), the COI action (if surfaced).

The team member can:
- **Verify** the recommendation is correct (one click: "Looks good, no changes")
- **Modify** the recommendation (edit the strategy, edit the pitch order, edit the COI action, edit the language)
- **Flag** the recommendation for the compliance officer (if there's a language or technical concern)
- **Request** more information from the agent (send a note)

**Step 4: The Learning Loop kicks in.**
Every verification, modification, or flag is logged. The modification is stored as a "learning event" attached to the scenario.

When a similar scenario comes in (same avatar + similar client profile + similar strategy context), the engine looks at the prior learning events and applies them:
- If a team member modified a strategy recommendation for a 50/50 C-Corp buy-sell scenario 3 weeks ago, the engine applies that modification to the next 50/50 C-Corp buy-sell scenario
- If a team member added a COI action ("flag the CPA sign-off on §162 deductibility"), the engine surfaces that action in similar scenarios
- If a team member re-ordered the pitch order ("lead with REBA, not buy-sell, for clients with strong key employee focus"), the engine applies that re-ordering

**The Learning Loop makes the engine smarter with every review.** Over time, the engine's recommendations converge on the team's actual case-design thinking. The brain you launch with is the worst brain you'll ever have.

### The Learning Event Log

Every verification, modification, or flag creates a learning event:
- Scenario ID
- Team member (who reviewed)
- Action (verified / modified / flagged)
- If modified: what was changed (strategy / pitch order / COI action / language)
- Reason (free text, optional)
- Timestamp

The Learning Event Log is searchable and filterable. The team can see patterns: "We've modified 12 buy-sell recommendations in the last 30 days — most of the changes were around the pitch order. Let me update the engine to default to the new order."

---

## 4. The Compliance Flag Queue

The Compliance Flag Queue is where every output that needs human review lives. There are three trigger types:

### Trigger 1: Filter-caught
The compliance filter catches a non-compliant phrase in an output. The output is held. The compliance officer reviews it in the queue and either:
- Clears it (with a rephrased version)
- Rejects it (with notes for the agent)
- Escalates it (to a senior reviewer for judgment)

### Trigger 2: Pre-launch (new strategy)
Before a new strategy goes live in the brain, it must pass compliance review. The queue holds the new strategy card, the supporting documentation, and the human team's sign-off.

### Trigger 3: Periodic audit
Every 90 days, the compliance officer runs a random audit of 5% of generated outputs. The selected outputs are pulled into the queue for review.

### The Queue UI

- List of every held item, sorted by age (oldest first)
- Each row: trigger type, who/what generated it, the output (read-only), the agent/client context, age
- The compliance officer clicks an item, sees the full context, and takes one of these actions:
  - Clear (output is released)
  - Rephrase (output is rewritten, agent sees the new version)
  - Reject (output is not released, agent is notified with the reason)
  - Escalate (sent to a senior reviewer)

**Every action is logged** for audit purposes. The compliance officer's work is auditable, the engine's output is auditable, and the resolution is auditable.

---

## 5. The IMO Principal View

The IMO principal view is a filtered version of the internal team view, scoped to their organization.

**The IMO principal sees:**
- Their own agents (list + activity + churn risk)
- Their own MRR contribution
- Their own seat utilization (purchased / active / churning)
- Their own agents' Opportunity Flow (read-only — the IMO principal can review but not modify)
- Their own compliance flags
- Their own support tickets

**The IMO principal does NOT see:**
- Other IMOs' data
- Your internal cost / margin data
- Other IMOs' pricing or contract terms

**The IMO principal can:**
- View their agents' activity
- Receive alerts when an agent is at risk of churning
- Add seats (which triggers a billing event)
- Remove seats (which triggers a credit)
- Contact their agents via in-app messaging
- Export their own data to CSV

**The IMO principal cannot:**
- Modify the engine's recommendations (only your internal team can)
- Modify the compliance language
- Change the pricing (it's set by your contract)
- Access other IMOs' data

---

## 6. The Agent Self-Service View

Agents see a simplified version focused on their own work:

- Their own dashboard (the Progress Dashboard, see the Progress Dashboard Math doc)
- Their own prospects (list + status)
- Their own scenarios (list + status)
- Their own wholesaler handoffs (sent + drafts)
- Their own pitches (built + drafts)
- Their own COI actions (to-do list)
- Their own settings (profile, output preferences, notification preferences)

**Agents do not see:**
- The master dashboard
- Other agents' data
- Compliance flags
- Internal team workflows

**Agents can:**
- Run "I've got a guy" scenarios
- Build pitches
- Send wholesaler handoffs
- Log activity (calls, meetings, proposals)
- Update their profile
- Contact support

---

## 7. The Data Model

The master dashboard reads from a unified data model. The core tables:

| Table | Key fields |
|---|---|
| `users` | id, email, name, plan, status, signup_date, channel, last_login, imo_id (FK) |
| `imos` | id, name, plan, seats_purchased, seats_active, primary_contact, signup_date, contract_terms |
| `scenarios` | id, user_id (FK), prospect_name, prospect_profile_json, avatar, strategy_recommended, status, expected_commission_value, created_at, last_activity |
| `pitches` | id, scenario_id (FK), content_json, status, created_at |
| `handoffs` | id, scenario_id (FK), wholesaler_email, content, status, sent_at |
| `learning_events` | id, scenario_id (FK), team_member_id (FK), action, changes_json, reason, created_at |
| `compliance_flags` | id, output_id, trigger_type, content, status, reviewer_id, resolution, created_at, resolved_at |
| `support_tickets` | id, user_id (FK), subject, content, status, priority, assigned_to, created_at, resolved_at |
| `churn_signals` | id, user_id (FK), signal_type, severity, created_at, resolved_at |

**The data model supports the audit log requirement:** every meaningful action is logged with timestamp, actor, and the change made.

---

## 8. The 8 KPIs the Dashboard Tracks

| KPI | Calculation | Why it matters |
|---|---|---|
| **MRR** | Sum of active monthly subscriptions + (annual ÷ 12) + (IMO seats × $75) | The headline number |
| **Net New MRR** | New MRR + expansion - churned MRR | The growth rate |
| **Churn rate** | Churned MRR ÷ starting MRR | The retention health |
| **CAC** | (Marketing spend + sales spend) ÷ new customers | The acquisition cost |
| **LTV** | Avg MRR per customer ÷ monthly churn rate | The lifetime value |
| **LTV:CAC ratio** | LTV ÷ CAC | The unit economics health (target: >3:1) |
| **Activation rate** | % of new users who run their first scenario within 7 days | The product engagement |
| **Engagement score (avg)** | Average activity score across all active agents | The product stickiness |

---

## 9. The Audit Log Requirements

Every meaningful action in the dashboard is auditable:

1. **Grant / revoke / suspend access:** Who, when, which user, why
2. **Modify a recommendation:** Who, when, which scenario, what changed, why
3. **Clear / reject / escalate a compliance flag:** Who, when, which flag, the resolution
4. **Add / remove seats:** Who, when, which IMO, the billing event
5. **Send a broadcast email:** Who, when, which segment, the content
6. **View sensitive data (e.g., a specific agent's full activity log):** Who, when, which agent
7. **Change a pricing tier:** Who, when, which user/IMO, the change
8. **Export data:** Who, when, what was exported, the destination

The audit log is immutable, timestamped, and queryable. The compliance officer can pull any action history for any user, IMO, or scenario.

---

## 10. What the Dev Builds Against This Doc

- **A unified data model** (Section 7) with all the core tables
- **Six internal team modules** (Clients, Revenue, Activity, Churn, Support, Compliance)
- **The Opportunity Flow with Learning Loop** — the live feed, the review UI, the learning event log
- **The Compliance Flag Queue** — the trigger handlers, the queue UI, the resolution workflow
- **The IMO principal view** — filtered and scoped
- **The agent self-service view** — simplified, focused on the agent's own work
- **The 8 KPIs** — calculated in real time
- **The audit log** — immutable, timestamped, queryable
- **The bulk actions** — suspend, revoke, broadcast, export
- **The channel attribution model** — every signup tagged with its source
- **The churn detection system** — activity score, at-risk flags, win-back queue
- **The support integration** — in-app, email, chat, ticket routing
- **The IMO white-label support** — per-IMO branding, per-IMO data scoping

**All views are auditable.** The Learning Loop reads from the audit log. The Compliance Flag Queue reads from the audit log. The team reviews cases using the audit log. The brain gets smarter because the audit log captures every modification.

---

*Last updated: June 30, 2026. Default close rate: 40%. Default book addressable filter: 15%. All other assumptions marked in the build status doc.*
