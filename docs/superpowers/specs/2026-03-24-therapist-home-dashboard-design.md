# Therapist Home Dashboard — Design Spec

## Problem

The therapist home screen is two navigation buttons ("Your clients", "All patients"). A therapist checking between sessions needs at-a-glance answers to: who submitted homework this week, who has overdue work, and are there any concerning scores. Currently they must navigate through multiple screens to find this information.

## Solution

Replace the two-button home screen with a triage-based dashboard that surfaces client status grouped by urgency, with a summary stat strip for instant orientation.

## Design Decisions

### Week Model

Monday–Sunday, matching the Activity Diary's existing week model. Dashboard resets each Monday. All "this week" references use this boundary.

### Triage Buckets

Clients are grouped into three buckets, displayed in this order:

1. **Needs Attention** (red accent) — clients matching any of:
   - Latest questionnaire score is severe or moderately severe (per instrument thresholds: PHQ-9 >= 15, GAD-7 >= 10, PDSS >= 9)
   - Score increased vs previous attempt of the same questionnaire type (worsening trend)
   - Any active assignment is overdue
   - Sorted by: severity first, then overdue count, then last active (descending)

2. **Completed This Week** (teal accent) — clients who submitted at least one assignment attempt this week (Mon–Sun) and do not qualify for "Needs Attention"
   - Sorted by most recent submission first

3. **No Activity** (grey accent) — clients with zero submissions this week who do not qualify for "Needs Attention"
   - Sorted by days since last active (longest gap first)

A client appears in exactly one bucket (highest priority wins). Empty buckets are hidden entirely — not shown with empty state text.

### Stat Pills

Four tappable pills at the top of the dashboard:

| Pill | Color | Value |
|------|-------|-------|
| Clients | Neutral (`#a6adbb`) | Total assigned clients |
| Attention | Error (`#FF6D5E`) | Count of clients in "Needs Attention" bucket |
| Submitted | Teal (`#18cdba`) | Count of clients who submitted at least one attempt this week |
| Overdue | Warning (`#FFB300`) | Total number of overdue assignments across all clients |

Tapping a pill scrolls the dashboard to the corresponding bucket. "Clients" scrolls to top. "Overdue" scrolls to "Needs Attention" (where overdue clients appear).

### Client Cards

Each client card displays:

- **Name** — top left
- **Last active** — top right, relative timestamp ("2h ago", "Yesterday", "5d ago")
- **Score badge** — latest questionnaire score with severity band colour:
  - Severe: red tint (`rgba(255,109,94,0.15)`)
  - Moderate: amber tint (`rgba(255,179,0,0.15)`)
  - Mild: teal tint (`rgba(24,205,186,0.15)`)
  - Minimal/none: neutral tint
  - "No scores" if client has never completed a questionnaire
- **Score delta** — comparison to previous attempt of same questionnaire:
  - Red up arrow (`#FF6D5E`) = score increased (worsening)
  - Green down arrow (`#76AB70`) = score decreased (improving)
  - Grey dash (`#a6adbb`) = no change
  - Hidden if no previous score to compare
- **Assignment dots** — one dot per active assignment:
  - Teal (`#18cdba`) = completed
  - Grey (`#3A496B`) = pending
  - Red with glow (`#FF6D5E`) = overdue
- **Progress bar** — fraction of assignments completed, teal fill on dark track
- **Completion text** — "2/3 completed" (numerator = submitted attempts this week, denominator = active assignments this week)
- **Left border** — colour matches severity signal:
  - Severe score: `#FF6D5E`
  - Worsening/overdue: `#FFB300`
  - Completed: `#18cdba`
  - Inactive: `#3A496B`

Tapping a card navigates to `/home/clients/[id]` (existing `ClientDetail` timeline screen).

### Greeting

- Time-aware greeting: "Good morning/afternoon/evening, {firstName}"
- Subtitle: "Week of {weekStartDate}" (e.g. "Week of 24 Mar")

### Empty States

| Scenario | Behaviour |
|----------|-----------|
| Zero clients | All stat pills show 0. No buckets. EmptyState: "No clients yet" + CTA "Browse patients" → `/home/patients` |
| Clients but zero assignments | Stat pills show client count, rest 0. All clients in "No Activity". Banner: "Assign homework to get started" |
| All clients completed everything | Only "Completed This Week" bucket shown. "Needs Attention" and "No Activity" hidden |
| Monday morning (fresh week) | Clients with recurring/active assignments appear in "No Activity". Clients with no assignments this week don't appear |

### Pull-to-Refresh

Dashboard `ScrollView` has `refreshControl` that calls `refetch()` on the dashboard query.

## Backend

### New Endpoint

**`GET /user/therapist/dashboard`**

Authenticated, therapist-only. Returns:

```json
{
  "weekStart": "2026-03-23T00:00:00.000Z",
  "stats": {
    "totalClients": 8,
    "needsAttention": 2,
    "submittedThisWeek": 4,
    "overdueAssignments": 3
  },
  "needsAttention": [
    {
      "patient": { "_id": "...", "firstName": "Alex", "lastName": "Mitchell" },
      "latestScore": {
        "moduleTitle": "PHQ-9",
        "score": 19,
        "band": "severe",
        "submittedAt": "2026-03-24T07:30:00Z"
      },
      "previousScore": { "score": 16 },
      "assignments": { "total": 3, "completed": 1, "overdue": 1 },
      "lastActive": "2026-03-24T07:30:00Z",
      "reasons": ["severe_score", "worsening"]
    }
  ],
  "completedThisWeek": [],
  "noActivity": []
}
```

Each bucket item has the same shape. `previousScore` is null if no prior attempt exists. `reasons` is an array of why the client is in "Needs Attention" (empty array for other buckets).

**Score delta logic:** Compare latest submitted attempt to the most recent previous attempt of the same `moduleId`. Only scored questionnaire types have deltas.

**"Last active" definition:** Timestamp of the client's most recent attempt submission (any module type), or account creation date if never submitted.

### Threshold Configuration

Questionnaire severity thresholds should be defined per module type in the BE (they may already exist for score band calculation). The dashboard endpoint reuses the same thresholds to determine "severe/moderately severe" classification.

## Frontend

### New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `TherapistDashboard` | `components/home/TherapistDashboard.tsx` | Main dashboard, replaces two-button layout |
| `StatStrip` | `components/home/dashboard/StatStrip.tsx` | Four stat pills with scroll-to-bucket callbacks |
| `ClientCard` | `components/home/dashboard/ClientCard.tsx` | Individual client card with score, delta, dots, progress |
| `TriageBucket` | `components/home/dashboard/TriageBucket.tsx` | Section header + list of ClientCards |

### New Hook

| Hook | File | Endpoint |
|------|------|----------|
| `useTherapistDashboard` | `hooks/useTherapistDashboard.ts` | `GET /user/therapist/dashboard` |

Standard `useQuery` with 1-hour `staleTime` (project default). Pull-to-refresh calls `refetch()`.

### Integration

- `VerifiedTherapistHome` renders `<TherapistDashboard />` instead of the two `PrimaryButton` links
- The existing `HomeScreen` wrapper (animated gradient backdrop) is preserved — dashboard renders inside it
- Scroll-to-bucket uses `ScrollView` refs — each `TriageBucket` exposes a ref, `StatStrip` pill press calls `scrollTo`

### Profile Screen Changes

In `app/(main)/(tabs)/profile/index.tsx`:

- **Remove** the "Another button" placeholder (`SecondaryButton` with no `onPress`)
- **Remove** the "Patient history" link (redundant — dashboard surfaces submissions better)
- **Add** two new therapist-gated buttons:
  - "Your Clients" → `/home/clients`
  - "All Patients" → `/home/patients`
- Positioned between Profile Details and Log Out

## Out of Scope

- Notification badges or push notifications for overdue/severe scores
- Customisable thresholds per therapist
- Patient home dashboard (separate spec)
- Score trend charts or graphs — text-based deltas are sufficient for mobile between-session checks
