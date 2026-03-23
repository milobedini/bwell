# Attempts Screen — UI/UX Review

**Date:** 2026-03-22
**Screen:** Therapist Attempts List (`app/(main)/(tabs)/attempts/index.tsx`)
**Component:** `TherapistLatestAttempts` / `TherapistAttemptListItem`

---

## What's Working Well

- **Severity-tinted left borders** — Immediate visual scanning of severity at a glance. The colour coding (green/amber/red/teal) is intuitive and clinically meaningful.
- **Information hierarchy within cards** — Title > patient > score > date flows logically top-to-bottom.
- **Score pills** — The tinted background pills with matching severity text colour are a nice touch. They're scannable without being noisy.
- **Iteration badges** (#2, #6) — Subtle but useful for tracking repeat assessments.
- **Consistent card structure** — Even cards without scores (Activity Diary) maintain the same rhythm, preventing layout jank.

---

## Issues & Recommendations

### 1. No filtering or sorting (High Impact)

The list is a flat chronological dump. A therapist with 20+ patients will struggle. Consider:

- A **filter chip row** at the top (by patient, by questionnaire type, by severity)
- A **sort toggle** (newest first / by severity / by patient)
- The `AttemptFilterDrawer` pattern from the timeline could be reused here

### 2. No grouping or section headers (Medium Impact)

Cards blend together visually. Options:

- **Group by date** ("Today", "This week", "Earlier") with sticky section headers
- **Group by patient** if the therapist is reviewing a caseload
- Even just a subtle date divider between different days would improve scanability

### 3. Cards are vertically dense (Medium Impact)

Each card has 4 rows of information in a relatively tight space. The `gap-2` (8px) between rows is functional but feels slightly cramped on a clinical tool that's read repeatedly. Consider:

- Increasing internal gap to `gap-3` (12px) for breathing room
- Or condensing: put the patient name inline with the title (since in production with multiple patients, this saves a row)

### 4. The "Attempts" header is plain (Low Impact)

It's a single bold word with no context. Consider:

- Adding a subtitle count: "Attempts" + "12 submissions" in `small` grey text below
- This gives the therapist immediate context without scrolling

### 5. Score pill sizing inconsistency (Low Impact)

Single-digit scores (6, 7) and double-digit scores (11, 21) create slightly different pill widths. Consider a `minWidth` on the pill (e.g., `minWidth: 40`) so they align visually when scanning the list.

### 6. Date row could be more compact (Low Impact)

The calendar icon + "4 days ago · 18/03/2026" works, but the relative + absolute combined is verbose. Consider:

- Showing only relative time ("4 days ago") and revealing the absolute date on card press/detail view
- This would shorten the cards

### 7. No pull-to-refresh (Medium Impact)

For a list that updates as patients submit work, pull-to-refresh is expected on mobile. Add `refreshControl` to the FlatList with `onRefresh` / `refreshing` from the query hook.

### 8. Empty top spacing (Low Impact)

There's noticeable gap between the "Attempts" header and the first card. The `contentContainerStyle={{ padding: 16 }}` plus ContentContainer's own padding may be doubling up. Verify the spacing is intentional.

---

## Summary

The card design itself is solid — the severity colour system, information layout, and interactive states are well-executed. The biggest gaps are **list-level UX**: filtering, grouping, and pull-to-refresh. These are the features that matter when a therapist is checking this screen multiple times a day with a real caseload.

### Priority Order

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 1 | Filtering / sorting | High | Medium |
| 7 | Pull-to-refresh | Medium | Low |
| 2 | Date/patient grouping | Medium | Medium |
| 3 | Card internal spacing | Medium | Low |
| 4 | Header subtitle count | Low | Low |
| 5 | Score pill min-width | Low | Low |
| 6 | Compact date display | Low | Low |
| 8 | Top spacing audit | Low | Low |
