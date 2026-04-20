# Admin — Future Plan

**Last updated:** 2026-04-20
**Companion to:** [`docs/superpowers/specs/2026-04-20-admin-overhaul-design.md`](../superpowers/specs/2026-04-20-admin-overhaul-design.md) and [`docs/prototypes/admin-overhaul/README.md`](../prototypes/admin-overhaul/README.md)

This document catalogues everything deliberately **not** shipped in the
admin overhaul — both near-term follow-ups that can be built incrementally
from the existing backend, and larger pieces that need their own
brainstorming pass before scoping.

Each item is written so a future session can pick it up from cold. Two
sections:

- **§1 — Near-term follow-ups.** Small, bounded, no new brainstorm needed.
  The BE already exposes everything required; these are FE surfaces or
  small contract tweaks.
- **§2 — Substantive features.** Each one needs its own brainstorm pass
  (spec → plan → build) before work starts. Don't bundle them into the
  current feature branch.

---

## 1. Near-term follow-ups

These are pending work items from the current admin overhaul. The BE
contract supports each of them already. Pick any order.

### 1.1 Programme detail screen (FE)

- **Status:** BE endpoint shipped (`GET /api/admin/programmes/:id`). No FE route.
- **Blocker from the home:** tapping a programme card today goes nowhere.
- **Scope:** new expo-router route under `/admin/programmes/:id` (or add it to
  the main admin tab). Uses the existing response shape
  `AdminProgrammeDetailResponse` — per-instrument and per-care-tier outcome
  breakdowns, enrolment counts, work stats.
- **Component reuse:** `CareTierBreakdown` is already built and unused —
  wire it in here. `OutcomeTriplet` composes naturally inside an
  `outcomesByInstrument` map.
- **Navigation:** update `ProgrammeRow` + `LeadProgrammeCard` to accept
  `onPress`; on tap, navigate to the detail screen.
- **Effort:** small (~1 day). Mostly composition of existing atoms.

### 1.2 Outcomes time-series on home

- **Status:** BE endpoint shipped (`GET /api/admin/outcomes`). No FE component.
- **Where:** inside `LeadProgrammeCard`, below the triplet. Defaults to the
  programme's primary instrument, `granularity=month`, 12 buckets back.
- **Scope:** small time-series chart (reuse `BarSparkline` with adapted
  styling; or new SVG). Each bucket renders the recovery rate with visible
  suppression treatment for zero-denominator cells.
- **Key invariant to respect:** every bucket is in the response even when
  suppressed. Do not filter them out — render them as pale notches so the
  axis stays contiguous.
- **Effort:** small (~1 day).

### 1.3 Audit log list view (FE)

- **Status:** BE endpoint shipped (`GET /api/admin/audit`, paginated, filterable
  by `actorId`/`action`/`resourceType`/`resourceId`). No FE route.
- **Scope:** a screen that lists recent `AdminAuditEvent` rows reverse-chrono
  with filter chips. Minimum filter set: by action. Nice-to-have: by actor,
  by resource. Use infinite scroll via `useInfiniteQuery`
  (pattern: `useAllUsers`).
- **Important:** `AdminAuditEvent.context` is opaque — do not assume a schema.
  Render known top-level fields (`action`, `actor`, `resourceType`, `at`,
  `outcome`) and treat `context` as metadata (pretty-printed JSON block or
  not rendered at all).
- **Effort:** medium (~1.5 days).

### 1.4 System health view (FE)

- **Status:** BE endpoint shipped (`GET /api/admin/system/health`). No FE route.
- **Scope:** small ops-oriented panel — last rollup run (`startedAt`,
  `completedAt`, `status`, `rowsWritten`), total audit events.
- **Placement:** low priority for day-one admin; maybe a "System"
  sub-section within the admin tab. Not required on the home.
- **Effort:** trivial (~0.5 day).

### 1.5 Attention-banner drill-ins

- **Status:** banner contributors for `stalled`, `orphaned`, `rollup` are
  informational only. Only `verification` has an action (opens `TherapistPicker`).
- **Scope:** decide a destination for each:
  - `stalled` → a list of stalled attempts (would need a new endpoint or a
    query-shaped extension to existing attempt endpoints).
  - `orphaned` → a list of orphaned assignments (same — new endpoint or
    extension).
  - `rollup` stale → either a manual-trigger button (runs the CLI equivalent)
    or a link to the System Health view.
- **Dependencies:** first two need BE additions; third doesn't.
- **Effort:** small each, but need BE scoping first for the first two. Treat
  as a mini-brainstorm (see §2 — could graduate).

### 1.6 Archive non-winning prototype decks

- **Status:** all 6 HTML decks still live in
  `docs/prototypes/admin-overhaul/`. mb-development Stage 9 cleanup guidance
  suggests moving non-winners under `.archive/` or deleting.
- **Recommendation:** archive under
  `docs/prototypes/admin-overhaul/.archive/` so the design thinking is
  preserved for future reference (useful when comparing against a new angle).
- **Keep in place:** `clinical-outcomes-first.html` (winner),
  `compliance-gauge.html` (blend source), plus `README.md`.
- **Effort:** trivial (~5 min).

---

## 2. Substantive features — each needs its own brainstorm

These items were in the spec's §2.2 Deferred list. Each one has its own
scoping questions that need answering before code is touched.

### 2.1 Owner tier above admin (billing + security separation)

- **Motivation:** SimplePractice / Linear / Notion all split a top-level
  "owner" tier from "admin" for billing, subscription, security-sensitive
  settings (audit retention, DPIA config, encryption keys). Today bwell has
  one admin; introducing an owner is valuable once there are multiple
  administrators or a formal clinical-safety officer separate from
  operational admin.
- **Scoping questions for a future brainstorm:**
  - Single owner per instance, or multiple with voting on destructive actions?
  - Is the owner the Clinical Safety Officer for DCB0129 purposes?
  - Can admins elevate themselves? (Answer should be no.)
  - Billing UI — Stripe portal link, or in-app?
- **Rough scope:** new `owner` role value, `User.roles` extension, owner-only
  middleware, owner-only routes (billing, subscription, audit-retention
  config). FE: owner-only tab / settings panel.

### 2.2 Impersonation

- **Motivation:** every comparable product (Pigment, Authress, PropelAuth,
  ServiceNow) eventually adds this for support workflows. Today an admin
  cannot see what a specific patient or therapist sees.
- **Scoping questions:**
  - Read-only by default, or allow writes? (Read-only is standard.)
  - Time-bounded session length — 15 min / 30 min / 1 hr?
  - Blocked actions during impersonation: password change / MFA / billing
    / role change / delete. What else?
  - Audit trail: events emitted during an impersonation session must be
    attributable to both the impersonator and the impersonated user —
    `impersonatorId` is already reserved on `AdminAuditEvent`.
- **Rough scope:** JWT extension with `impersonatorId`, middleware that
  enforces the read-only/write rules, end-impersonation endpoint + banner
  visible in-app, audit emission on every impersonated action.

### 2.3 Admin-triggered password reset

- **Motivation:** common support action; every SaaS (Stripe, Linear,
  Auth0) exposes it.
- **Scoping questions:**
  - Confirmation flow — explicit reason required?
  - Rate limits — how many per admin per day?
  - The existing email-based flow is user-initiated. Admin-triggered = an
    admin dispatching that email for another user. Security implication:
    admin-account compromise = "reset anyone's password".
  - Should require re-authentication of the admin (step-up MFA)?
- **Rough scope:** `POST /api/admin/user/:id/password-reset` emitting a
  reset email via existing Mailtrap + an audit event. Small, but the
  security deliberation is the non-trivial part.

### 2.4 Soft-delete user / GDPR right-of-erasure workflow

- **Motivation:** Right-of-erasure (UK GDPR Art. 17) is a workflow that
  admin typically owns. Today no delete path exists at all.
- **Scoping questions:**
  - Soft-delete vs hard-delete vs both (soft for UX, hard for erasure)?
  - What is retained after erasure? Attempt data used in rollups must not
    mutate (historical rollups freeze at rollup time), but must also not
    link to a deleted user.
  - Cascade: if a therapist is erased, what happens to their assignments?
    To their patients? To historic `AdminAuditEvent.actorId` references?
  - Retention window before hard-delete?
- **Rough scope:** `deletedAt` + `isActive` on User, login-path rejection
  of deactivated users, cascade policy, mutation-of-rollup-documents-is-forbidden
  invariant, `POST /api/admin/user/:id/erase` with a confirmation token.
  This one is genuinely large.

### 2.5 Role change (grant / revoke roles)

- **Motivation:** admin can't promote a patient to therapist or vice versa
  today. Any role change today requires direct DB access.
- **Scoping questions:**
  - Confirmation-gated, always audited — what's the confirmation UX?
  - Can admin promote another user to admin? (Privilege-escalation risk;
    answer probably yes but must emit a distinct high-priority audit
    event and require step-up MFA.)
  - Admin self-demotion — allowed? (Usually forbidden, to prevent locking
    out the instance.)
- **Rough scope:** `PATCH /api/admin/user/:id/roles`, audit emission
  (`user.roleChanged` new action), FE confirmation dialog with reason
  capture, self-demotion prevention.

### 2.6 Per-therapist outcome metrics

- **Motivation:** natural drill from care-tier breakdown — "if CBT tier is
  outperforming PWP by 10pp, which individual CBT therapists are driving it?".
  Also genuinely useful for supervision.
- **Why deferred:** employment / clinical-governance territory. Publishing
  per-therapist recovery rates internally could be interpreted as
  performance management. Requires a defensible methodology + HR/legal
  sign-off. Also: most therapists won't have enough paired scores to cross
  `k=5`; the ones who do will draw attention and can be misleading.
- **Rough scope:** the rollup schema **already supports this dimension**
  (`dimension.therapistId` can be added without a schema migration — just
  a new computation branch in the rollup job). The FE + governance piece
  is the work.
- **Research finding:** Spring Health and Lyra deliberately *don't* expose
  this surface to employer admins, citing the same concerns.

### 2.7 Data-quality dashboard (IAPT DQ-equivalent)

- **Motivation:** NHS IAPT publishes a separate Data Quality Dashboard
  surfacing missing-data rates per provider — a distinct admin lens from
  clinical outcomes (quality of incoming data, not the outcomes themselves).
- **Scope:**
  - % of patients with < 2 paired scores (eligible for outcome calc but excluded).
  - % of assignments with no attempt in N weeks.
  - % of therapists whose patients have sparse data.
  - Rollup freshness + age distribution.
- **Rough scope:** new rollup metrics (data-quality kind rather than
  clinical-outcome kind) + a DQ section on the admin surface.
  Additive — doesn't conflict with anything shipped.

### 2.8 Programme catalogue editor (visual)

- **Motivation:** today, admin can create modules via the BE-only
  `POST /api/modules` endpoint (used by seeds). No FE for authoring modules
  / questions / scorebands / programme membership.
- **Scoping questions:**
  - Draft vs published states?
  - Authoring flow for clinical instruments vs non-clinical modules?
  - Review / approval step before a module goes live?
  - Scheduling (go-live at a specific date)?
- **Rough scope:** separate tab/route in the admin surface, new endpoints
  for draft persistence, a review queue. This is its own mini product.

### 2.9 Export / DSAR workflow

- **Motivation:** Right-of-access (UK GDPR Art. 15) — a user can request
  all data held about them. Admin owns the workflow.
- **Scope:**
  - Per-user data-export ZIP (profile + attempts + assignments + audit of
    their record access).
  - Audit each export (new `AuditedAction: 'user.dataExported'`).
  - Delivery mechanism — email link with short-lived signed URL?
- **Rough scope:** export service + object storage + expiry policy.
  Adjacent: audit-log export for a specific actor or resource ID range.

### 2.10 Per-resource access restriction (SimplePractice-style)

- **Motivation:** SimplePractice allows practice owners to restrict which
  team members can see which client records. Today bwell's therapist-patient
  link is all-or-nothing — a verified therapist sees all their assigned
  patients, no cell-level restriction.
- **When relevant:** larger clinics with specialist sub-teams (trauma,
  CAMHS, etc.).
- **Rough scope:** an access-control-list layer on User-to-User relationships,
  policy engine for read decisions, migration for existing unrestricted
  links. Non-trivial.

### 2.11 Episode-of-care concept (strict IAPT denominator)

- **Motivation:** current within-bucket pairing (design spec §5.3) is a
  simplification. IAPT-strict pairing requires an "episode" — a sequence
  of attempts with no gap > X weeks, or explicit start/end markers.
- **When relevant:** if we ever want to publish metrics externally or
  benchmark against NHS figures, episodes become load-bearing.
- **Rough scope:** new `Episode` model with `{ userId, programmeId,
  startedAt, endedAt, endReason }`. Attempts reference their episode.
  Rollup pipeline gets a gap-detection pass. FE needs a UI for
  therapists/patients to mark episodes (or a rule-based auto-close).
- **Dependency:** requires a brainstorm on whether episodes are
  explicit (UI-marked) or implicit (gap-detected); the trade-off is
  fidelity vs UX weight.

### 2.12 Tier-at-time fidelity for rollups

- **Motivation:** today the rollup reads the therapist's *current* tier.
  If a therapist switches CBT → PWP, all of their historic attempts are
  re-attributed to PWP on the next rollup run. This is fine for internal
  admin signals but would be wrong if we ever need historical-fidelity
  tier reporting (e.g. "what was our CBT recovery rate in Q1?" should not
  retroactively move attempts out).
- **Rough scope:** denormalise `therapistTier` onto `ModuleAttempt`
  (similar to the existing `therapist` denormalisation), migrate history,
  rollup reads attempt's tier instead of user's tier.
- **Effort:** moderate. Migration is the tricky part.

### 2.13 Rollup + audit archival policy

- **Motivation:** `AdminAuditEvent` has no automatic deletion today.
  HIPAA suggests 6 years retention; product-UI retention is often 90 days
  with archival to cold storage beyond that. Rollup collection grows
  bounded-but-not-zero.
- **Scoping questions:**
  - In-product UI retention — 90 days (as noted in spec)? 365?
  - Archival target — S3? BigQuery? MongoDB cold collection?
  - Rollup historical-months retention — forever? Keep 24, archive rest?
- **Rough scope:** scheduled archival job, cold-storage adapter, delete-from-hot
  policy, restore-for-audit workflow if ever needed.

### 2.14 Multi-role user handling

- **Motivation:** today a user with `roles: ['patient', 'therapist']` gets
  counted in both role totals (deliberate). What this means for the UI is
  fuzzy — which home do they see? How do outcome rollups treat them (as
  both practitioner and subject)?
- **Scoping questions:**
  - Do we actually need this? Or is it an edge case we should refuse at
    registration?
  - If yes: role-switcher in the FE? Or pick the most-capable role by
    default?
- **Rough scope:** either strict enforcement (single-role users only,
  with a migration path for any existing multi-role users) or a proper
  multi-role UX. Needs a product decision first.

### 2.15 Audit log retention policy enforcement

- **Motivation:** the spec set in-product UI retention as "90 days" but no
  enforcement exists. Audit events are kept forever. Tied to §2.13.
- **Scope:** same work item as §2.13 but specifically for
  `AdminAuditEvent`.

### 2.16 Additional clinical instruments

- **Motivation:** the app positions programmes for OCD, Health Anxiety,
  Phobias, PTSD, Agoraphobia, Social Anxiety — none of which yet have their
  clinical questionnaire seeded. Current instruments: PHQ-9 (Depression),
  GAD-7 (Generalised Anxiety), PDSS (Panic).
- **Standards to add:**
  - **OCI-R** (OCD) — 18 items, cutoff ≥ 21.
  - **IES-R** (PTSD) — 22 items, cutoff ≥ 33.
  - **Mini-SPIN** (Social Anxiety) — 3 items, cutoff ≥ 6.
  - **HAI** (Health Anxiety Inventory) — 18 items, cutoff varies.
  - **MI** (Mobility Inventory for Agoraphobia) — 26 items.
- **Per-instrument work:** reliable-change Δ needs to be looked up in the
  clinical literature (or left null to suppress reliable-improvement for
  that instrument). Seed script update + shared-types `Instrument` enum
  extension + admin dev-seed additions.
- **Effort:** small per instrument (~half a day each).

---

## 3. Non-winning prototype BE-change requests

These were flagged by the non-winning decks during Stage 8. Captured
separately because they're smaller than the §2 items and might graduate
into near-term work if their FE deck is ever revisited.

- **Narrative brief endpoint** — `GET /api/admin/brief?week=<ISO>`
  returning `AdminOverviewResponse` + `{ brief: { paragraphs, generatedAt,
  model } }`. Requires either server-side templating or LLM integration,
  plus persistence so historical briefs are reopenable. Large: feature
  brainstorm, not a small follow-up.
- **Server-sorted `actionQueue`** — a new sorted queue endpoint for a
  mission-control-style FE. Small, if we ever build that angle.
- **One-tap admin mutations** — `POST /api/admin/attempts/:id/nudge` (send
  a therapist notification) + `POST /api/admin/assignments/:id/reassign`.
  Small additive endpoints, mainly useful if the attention banner's
  `stalled` / `orphaned` rows ever get drill-in actions (§1.5).
- **Recent-audit slice on `/overview`** — include the last 5 audit events
  inline on the overview payload so a unified list UI doesn't need two
  network calls. Additive; non-breaking.
- **`shortfall` field on `OutcomeResult`** — derivable client-side as
  `minN - n`, so not required; would let the below-min-N copy say
  "8 more paired assessments needed" precisely without the FE hardcoding
  the 20 threshold.

---

## 4. How to pick up any of these items

All §1 items can be started directly:

1. Read this file's entry + the spec entry for the item.
2. Create a small feature branch: `feat/admin-<slug>`.
3. Build + test + per-file commits + PR.

All §2 items should be brainstormed first:

1. Kick off a new mb-development flow scoped to the single item.
2. Don't bundle multiple §2 items into one brainstorm — each has its own
   scoping questions and privilege-surface trade-offs.
3. Keep this doc as the canonical list so we don't lose items. When an
   item ships, remove it from here (and update the spec if its removal
   affects the deferred list).
