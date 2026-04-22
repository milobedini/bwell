# Admin — Future Plan

**Last updated:** 2026-04-22 (§1.1 System Health FE, §1.2 drill-ins, §1.3 archive all shipped on `feat/admin-near-term-followups`)
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

## 1. Near-term follow-ups — shipped

All six near-term follow-ups from the original §1 list are now shipped.
Listed here for provenance; the surfaces live in the admin home stack.

> **Shipped 2026-04-21 (evening pass, on `feat/admin-overhaul`):**
>
> - Programme detail screen — route `home/programmes/[id]`,
>   `useAdminProgrammeDetail` hook, `ProgrammeDetailScreen` composing
>   `FreshnessRow` + enrolment stat cards + per-instrument `OutcomeTriplet` +
>   refactored `CareTierBreakdown` as a tier × triplet table + work section.
>   `LeadProgrammeCard` and `ProgrammeRow` now navigate on press.
> - Lead programme hero when suppressed — `LeadProgrammeCard` drops
>   the 56pt `—` and shows a header-weight "Awaiting data · needs N+ paired
>   assessments" line. Populated rendering unchanged.
> - Audit log list view — route `home/audit`, `useAdminAudit`
>   infinite-query hook (cursor pagination), `AuditRow` with outcome-aware
>   colour + expand-in-place context JSON, `AuditFilterDrawer` with action +
>   actor chips, and an entry link-row on `AdminHome` below the ops footer.
>   **Sort / filter / facet convention audit:** during this pass we noticed
>   the FE was deriving actor filter options from loaded pages (violates the
>   "BE does sorting/filtering/faceting" rule) and corrected it — the BE now
>   returns `facets.actors` on `/admin/audit` with counts, keyed off the
>   current non-actor filter. Shared-types published as `1.0.102`.

> **Shipped 2026-04-22 (on `feat/admin-near-term-followups`):**
>
> - **System health FE view (was §1.1).** New route `home/system` +
>   `AdminSystemHealthScreen` rendering a status-tinted rollup panel
>   (`startedAt` / `completedAt` / duration / rowsWritten + colour-coded
>   success/partial/failure pill) and an audit-events-total card. Copy note
>   explains the nightly 02:00 Europe/London schedule + 60-slot on-boot
>   catch-up. A second link-row ("System health · heart-pulse icon") sits
>   directly under the Audit log row on `AdminHome`. `useAdminSystemHealth`
>   query hook with 1-min staleTime.
> - **Attention-banner drill-ins (was §1.2).** `AttentionBanner` now takes
>   `onPressStalled`, `onPressOrphaned`, `onPressRollup` callbacks alongside
>   the existing `onPressVerification`. `attentionScore` surfaces
>   per-contributor `ctaLabel`s ("View stalled attempts" / "View orphaned
>   assignments" when tripped; "Open system health" always). The rollup row
>   is tappable regardless of freshness — System Health is a useful
>   destination either way.
> - **Stalled attempts list (new).** Route `home/stalled-attempts`,
>   `AdminStalledAttemptsScreen`, `StalledAttemptRow` (module-icon circle,
>   patient username, module title, therapist-or-self-help label, compact
>   stalled-since time). Cursor-paginated, oldest first.
>   `useAdminStalledAttempts` infinite-query hook.
> - **Orphaned assignments list (new).** Route `home/orphaned-assignments`,
>   `AdminOrphanedAssignmentsScreen`, `OrphanedAssignmentRow` with an
>   inline reason pill ("Therapist @user is unverified" vs "Therapist account
>   deleted") coloured amber / red, plus optional due-date chip. Cursor-
>   paginated, newest first. `useAdminOrphanedAssignments` infinite-query
>   hook.
> - **Non-winning prototype decks archived (was §1.3).** Four non-winners
>   moved to `docs/prototypes/admin-overhaul/.archive/` with their own
>   short README-of-why; `clinical-outcomes-first.html` (winner),
>   `compliance-gauge.html` (blend source), and the shipped handoff README
>   remain at the top of `docs/prototypes/admin-overhaul/`.

### 1.x New BE endpoints for the drill-ins

Two small list endpoints ship alongside the FE work:

- `GET /api/admin/attempts/stalled?cursor=&limit=&moduleType=` — base filter
  `{ status: 'started', lastInteractionAt < now − 7d }`, matching the
  `/overview` stalled count exactly. Cursor on `lastInteractionAt` asc,
  oldest first. Response includes `facets.moduleTypes` keyed off the
  unfiltered base set (so the count per type is stable across scroll and
  across filter selections, matching the `/admin/audit` facet convention).
- `GET /api/admin/assignments/orphaned?cursor=&limit=&reason=` — base filter
  `{ therapist: { $exists, $ne: null, $nin: verifiedTherapistIds } }`,
  matching the `/overview` orphaned count exactly. Cursor on `createdAt`
  desc, newest first. Row-level `reason` is derived (`therapist_missing`
  vs `therapist_unverified`) by comparing the therapist id against the
  current unverified-therapist set. Response includes `facets.reasons`
  with per-reason counts.

Both are guarded by `authenticateUser + authorizeAdmin` like the other
admin surfaces. Published in shared-types `1.0.103` as
`AdminStalledAttemptsResponse`, `AdminStalledAttemptRow`,
`AdminOrphanedAssignmentsResponse`, `AdminOrphanedAssignmentRow`, plus
`OrphanReason`.

**Deliberately deferred in this pass:**

- No **nudge** or **reassign** mutations. The non-winning `compliance-gauge`
  deck flagged `POST /api/admin/attempts/:id/nudge` +
  `POST /api/admin/assignments/:id/reassign` — both have real product
  decisions attached (what a "nudge" does, reassignment UX / audit shape,
  step-up auth). Left to §3 below.
- No row-tap-to-user-detail on the new list rows. There is no admin-side
  user-detail route yet (only therapist-side `patients/[id]`). When an
  admin user-profile surface ships, wire both list rows into it.
- No filter drawers on the new list screens. Both lists are self-filtered
  by definition. The BE returns facets already so a drawer can be added
  without an endpoint change.

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

- **Motivation (rescoped 2026-04-21):** the trailing-90d snapshot model
  that landed today (spec §5.3) is a major step up from the old
  within-bucket pairing and is now the production baseline. Remaining
  delta to IAPT-strict: the 90d window is fixed, so a patient with a
  30-day gap in the middle of their treatment is treated as one "episode",
  and a patient with a 6-month gap is silently split into two unrelated
  outcomes. Episode-of-care pairing would replace the fixed window with
  explicit or gap-detected episode boundaries.
- **When relevant:** if we ever want to publish metrics externally or
  benchmark against NHS figures, episodes become load-bearing. Until then
  trailing-90d is defensible.
- **Rough scope (smaller than before):** new `Episode` model with
  `{ userId, programmeId, startedAt, endedAt, endReason }`. Attempts
  reference their episode. `runRollupForBucket` swaps the
  `completedAt ∈ (bucket.endsAt − 90d, bucket.endsAt]` filter for
  per-episode boundaries. The rest of the pipeline is unchanged. FE needs
  a UI for therapists/patients to mark episodes (or a rule-based
  auto-close).
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
- **Now slightly more visible (2026-04-21):** the scheduler catch-up
  (`src/jobs/scheduler.ts::catchUpIfMissed`) replays every missed 02:00
  slot whenever the BE boots after downtime. Each replay re-reads current
  tier, so a tier change plus any subsequent wake causes historical
  reattribution across the cap of 60 replayed days. Not a new risk — same
  "current tier drives all history" design — just triggered more often
  now that Render wakes are enough to fire a replay.
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

### 2.16 Proper scheduler runtime (off free-tier web service)

- **Motivation:** the nightly rollup lives inside the BE web process via
  `node-cron`. The on-boot catch-up (shipped 2026-04-21 in
  `src/jobs/scheduler.ts`) hides the free-tier spin-down by replaying
  missed slots whenever Render wakes, capped at 60 days. This is adequate
  for semi-prod / Expo Go testing but has two structural issues once the
  product has real users:
  - Rollups run inline on the wake-up request path. If Mongo is slow and
    60 slots are being replayed, the first user request competes with the
    backfill (it's fire-and-forget async, but the DB is the same).
  - A truly ≥60-day outage silently drops older history. Escape hatch for
    today: run `npm run rollup-metrics:backfill [months] [weeks]` in the BE
    repo to rebuild historical snapshots beyond the catch-up cap. Manual
    but explicit; idempotent via the existing upsert.
- **Options to promote:**
  - **(a)** Render Cron Jobs — a separate service type that runs on a
    guaranteed schedule regardless of web-service traffic. Extra small
    paid service, own deploy pipeline, runs `npm run rollup-metrics`.
  - **(b)** Extract the rollup job into a Render Background Worker —
    dedicated always-on process, shares the codebase and Mongo connection,
    no web-service coupling.
  - **(c)** Hosted queue + worker (BullMQ + Redis, or similar). Overkill
    for a single nightly job but would scale to more scheduled jobs.
- **Rough scope:** pick one; move `startScheduler()` out of `src/index.ts`
  into a separate entrypoint; keep the catch-up logic as a belt-and-braces
  fallback.
- **When to revisit:** once the BE moves off the Render free tier, or
  once rollup compute starts to compete meaningfully with request
  throughput.

### 2.17 Additional clinical instruments

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
