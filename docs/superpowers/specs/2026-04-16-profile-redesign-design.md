# Profile Tab Redesign — Design Spec

**Date:** 2026-04-16
**Scope:** Redesign the profile tab for both patients and therapists, transforming it from a settings dump into an informative personal dashboard with role-aware content.

## Summary

The profile tab currently shows basic user details and a flat list of action buttons (Edit Name, Change Password, Your Clients, All Patients, Log Out). The redesign restructures this into a purposeful screen with four distinct sections: identity header, relationship card, stats strip, and grouped settings. The same single scrollable screen is retained (no tab splitting or new routes), with role-based content swapped in per section.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Overall approach | Refresh in place (single scrollable screen) | Not enough content to justify tab splitting; avoids duplicating the home dashboard |
| Identity header | Left-aligned compact (avatar + name beside) | Space-efficient, modern feel, keeps focus on content below |
| Stats strip | Single row card with dividers | Glanceable without dominating the page; compact and unified |
| Patient stats weighting | Clinical progress primary, engagement secondary, assignments tertiary | CBT app should lead with clinical signal, not gamified streaks |
| Therapist stats | Caseload-focused (clients, attention, submitted, overdue) | Therapists care about patient outcomes, not their own engagement |
| Relationship section | Prominent card (not a settings row) | Therapeutic relationship is core to guided CBT; deserves visual weight |
| Settings layout | Grouped inset lists with section headers and icons | Apple HIG standard; separates mundane from destructive actions |
| Avatar | Generated initials (no photo upload) | Photo upload is a separate infrastructure task; initials are consistent with existing app patterns |
| Empty states | Show sections with dashes and gentle prompts | Consistent layout between new and established users; no pressure language |

## Screen Structure

### Patient Profile

```
ScrollView
├── ProfileHeader (left-aligned compact)
│   ├── Initials avatar (56px, teal gradient)
│   ├── Name (22px, bold)
│   └── Username · Role badge (inline)
│
├── TherapistCard
│   ├── Therapist avatar (44px, purple gradient)
│   ├── "Your Therapist" label
│   ├── Therapist name
│   ├── Verification badge
│   └── Chevron (tappable)
│   └── [Empty state: "No therapist assigned"]
│
├── ProfileStatsStrip (patient variant)
│   ├── Latest questionnaire score + severity band + trend
│   ├── Sessions this week (count)
│   └── Assignments due (count, guided patients only)
│   └── [Empty state: dashes + "Complete your first session..."]
│
├── Settings: Account
│   ├── Edit Name → dialog
│   ├── Change Password → dialog
│   └── Email (display only)
│
├── Settings: Support
│   ├── Help & FAQ → TBD screen
│   ├── Send Feedback → TBD screen
│   └── About (display version)
│
└── Settings: Danger Zone
    └── Log Out (red, standalone)
```

### Therapist Profile

```
ScrollView
├── ProfileHeader (left-aligned compact)
│   ├── Initials avatar (56px, purple gradient)
│   ├── Name (22px, bold)
│   ├── Username · Role badge (inline)
│   └── Verification status (teal verified / amber pending)
│
├── ClientsSummaryCard
│   ├── "Your Clients" label + chevron
│   ├── Stacked client avatars (first 4) + overflow count
│   └── "N active clients" count
│   └── [Empty state: "No clients yet"]
│
├── ProfileStatsStrip (therapist variant)
│   ├── Total clients
│   ├── Needs attention (red if > 0)
│   ├── Submitted this week (teal)
│   └── Overdue assignments (amber)
│
├── Settings: Account
│   ├── Edit Name → dialog
│   ├── Change Password → dialog
│   └── Email (display only)
│
├── Settings: Client Management
│   └── All Patients → existing nested route
│
├── Settings: Support
│   ├── Help & FAQ → TBD screen
│   ├── Send Feedback → TBD screen
│   └── About (display version)
│
└── Settings: Danger Zone
    └── Log Out (red, standalone)
```

## API Design

### New endpoint: `GET /user/profile-stats`

Role-aware stats endpoint. The BE checks the requesting user's role and returns the appropriate shape.

**Patient response:**

```typescript
interface PatientProfileStats {
  latestScore: {
    moduleTitle: string;
    score: number;
    band: string;
    trend: 'improving' | 'worsening' | 'stable';
  } | null;
  sessionsThisWeek: number;
  assignmentsDue: number;
}
```

- `latestScore` — most recent submitted questionnaire attempt. `null` if no questionnaires completed. `trend` computed by comparing latest vs previous score for the same questionnaire.
- `sessionsThisWeek` — count of submitted attempts since Monday 00:00 UTC of the current week.
- `assignmentsDue` — count of assignments with status `assigned` or `in_progress`. `0` for self-help patients with no therapist.

**Therapist response:**

No new endpoint needed. The existing `GET /therapist/dashboard` already returns:

```typescript
interface TherapistDashboardStats {
  totalClients: number;
  needsAttention: number;
  submittedThisWeek: number;
  overdueAssignments: number;
}
```

**Existing endpoints used (no changes):**

- `GET /user` — profile data (name, email, roles, therapist ref, verification status)
- `GET /therapist/dashboard` — therapist caseload stats
- `GET /clients` — therapist's client list (slice first 4 client-side for avatar stack; client lists are small enough that fetching all is fine)

## Component Architecture

### New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ProfileHeader` | `components/profile/ProfileHeader.tsx` | Left-aligned identity header: avatar, name, username, role badge, verification (therapists) |
| `TherapistCard` | `components/profile/TherapistCard.tsx` | Patient's therapist relationship card with empty state |
| `ClientsSummaryCard` | `components/profile/ClientsSummaryCard.tsx` | Therapist's stacked client avatars + count, tappable |
| `ProfileStatsStrip` | `components/profile/ProfileStatsStrip.tsx` | Single row stats card, renders patient or therapist metrics based on role |
| `SettingsGroup` | `components/profile/SettingsGroup.tsx` | Reusable grouped inset list with section header |
| `SettingsRow` | `components/profile/SettingsRow.tsx` | Single row: leading icon, label, trailing value or chevron, onPress handler |

### Modified

| File | Change |
|------|--------|
| `app/(main)/(tabs)/profile/index.tsx` | Rewritten to compose new components in a ScrollView with role-based conditional rendering |

### Kept As-Is

| File | Reason |
|------|--------|
| `components/profile/EditNameDialog.tsx` | Dialog works fine; trigger changes from SecondaryButton to SettingsRow |
| `components/profile/ChangePasswordDialog.tsx` | Same as above |
| `app/(main)/(tabs)/profile/patients/index.tsx` | All Patients screen, no changes needed |

### Removed

| File | Replaced By |
|------|-------------|
| `components/profile/ProfileDetails.tsx` | `ProfileHeader`, `TherapistCard`, `ClientsSummaryCard` |

### New Hook

| Hook | Location | Purpose |
|------|----------|---------|
| `useProfileStats` | `hooks/useProfileStats.ts` | Fetches `/user/profile-stats` for patients; uses existing dashboard endpoint for therapists |

## Shared Types

Add to `@milobedini/shared-types`:

```typescript
interface PatientProfileStatsResponse {
  latestScore: {
    moduleTitle: string;
    score: number;
    band: string;
    trend: 'improving' | 'worsening' | 'stable';
  } | null;
  sessionsThisWeek: number;
  assignmentsDue: number;
}
```

## Empty States & Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| Patient, no therapist | TherapistCard shows "No therapist assigned", muted text, not tappable |
| Patient, no data (fresh account) | Stats strip shows dashes ("—") with prompt: "Complete your first session to see your progress here" |
| Patient, no questionnaire scores | First stat cell shows "—", no trend indicator; other stats render normally |
| Therapist, no clients | ClientsSummaryCard shows "No clients yet"; stats strip shows all zeros |
| Therapist, pending verification | Amber "Pending Verification" badge instead of teal "Verified" |
| Loading | Identity header from auth store (instant); stats + relationship card show skeleton placeholders |
| Stats endpoint error | Stats strip shows "Unable to load" with retry button; rest of profile renders normally |

## Out of Scope

- Photo/avatar uploads — separate infrastructure task, defer
- Push notification preferences — no push notifications in the app yet
- Privacy & Data section (data export, delete account) — important but not part of this redesign
- Help & FAQ content — rows are added but link to placeholder/TBD screens
- Send Feedback flow — row is added but implementation is a separate feature
