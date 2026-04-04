# Therapist Dashboard UX Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the therapist dashboard client cards with reason tags, tap affordance, and week-scoped assignment framing.

**Architecture:** BE shared-types + controller update to reshape `DashboardAssignmentSummary` into week-scoped fields (`completedThisWeek`, `overdueTotal`, `pendingThisWeek`). FE `ClientCard` component updated to render reason pills, a chevron, and new text/dot/bar framing. One new color token (`tint.infoBorder`) added.

**Tech Stack:** TypeScript, MongoDB/Mongoose (BE), React Native / Expo / NativeWind (FE), `@milobedini/shared-types`

---

## File Structure

### Backend (`../cbt/`)
- **Modify:** `src/shared-types/types.ts` — update `DashboardAssignmentSummary` type fields
- **Modify:** `src/controllers/therapistDashboardController.ts` — repartition assignment counts

### Frontend (`bwell/`)
- **Modify:** `constants/Colors.ts` — add `tint.infoBorder` token
- **Modify:** `components/home/dashboard/ClientCard.tsx` — reason tags, chevron, week-scoped rendering

---

### Task 1: Update shared types

**Files:**
- Modify: `../cbt/src/shared-types/types.ts:867-871`

- [ ] **Step 1: Update `DashboardAssignmentSummary` type**

In `../cbt/src/shared-types/types.ts`, replace the existing type (lines 867–871):

```typescript
// Replace this:
export type DashboardAssignmentSummary = {
  total: number
  completed: number
  overdue: number
}

// With this:
export type DashboardAssignmentSummary = {
  completedThisWeek: number
  overdueTotal: number
  pendingThisWeek: number
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd ../cbt && npx tsc --noEmit 2>&1 | head -20`
Expected: Compilation errors in `therapistDashboardController.ts` referencing old field names (`total`, `completed`, `overdue`). This confirms the type change propagated and the controller needs updating (Task 2).

- [ ] **Step 3: Commit**

```bash
cd ../cbt
git add src/shared-types/types.ts
git commit -m "refactor: update DashboardAssignmentSummary to week-scoped fields"
```

---

### Task 2: Update dashboard controller

**Files:**
- Modify: `../cbt/src/controllers/therapistDashboardController.ts:306-322`

- [ ] **Step 1: Update assignment partitioning logic**

In `../cbt/src/controllers/therapistDashboardController.ts`, replace the assignment summary block (lines 306–322) with:

```typescript
      // Assignments
      const patientAssignments = assignmentsByPatient.get(pid) ?? {
        active: [],
        completedThisWeek: [],
      };

      // Partition active assignments
      let overdueCount = 0;
      let pendingThisWeekCount = 0;
      for (const a of patientAssignments.active) {
        if (a.dueAt && new Date(a.dueAt) < now) {
          overdueCount++;
        } else if (a.dueAt && new Date(a.dueAt) >= now && new Date(a.dueAt) < weekEnd) {
          pendingThisWeekCount++;
        }
        // Assignments with dueAt >= weekEnd or no dueAt are excluded from summary
      }
      totalOverdueAssignments += overdueCount;

      const assignments: DashboardAssignmentSummary = {
        completedThisWeek: patientAssignments.completedThisWeek.length,
        overdueTotal: overdueCount,
        pendingThisWeek: pendingThisWeekCount,
      };
```

Note: `weekEnd` is already in scope from the `getWeekBoundaries()` call at line 73.

- [ ] **Step 2: Verify types compile**

Run: `cd ../cbt && npx tsc --noEmit`
Expected: No errors. The controller now builds `DashboardAssignmentSummary` with the new field names.

- [ ] **Step 3: Manually verify with dev server**

Run: `cd ../cbt && npm run dev`
Hit the endpoint (or check via the FE dashboard) to confirm the response shape now has `completedThisWeek`, `overdueTotal`, `pendingThisWeek` instead of `total`, `completed`, `overdue`.

- [ ] **Step 4: Commit**

```bash
cd ../cbt
git add src/controllers/therapistDashboardController.ts
git commit -m "refactor: partition dashboard assignments into week-scoped fields"
```

---

### Task 3: Publish shared types and update FE

**Files:**
- Modify: `../cbt/` (publish)
- Modify: `bwell/package.json` (update dependency)

- [ ] **Step 1: Publish shared-types**

```bash
cd ../cbt && npm run publish
```

- [ ] **Step 2: Update FE dependency**

```bash
cd /Users/milobedini/Documents/git/bwell && npm run update-types
```

- [ ] **Step 3: Verify the new types are available**

Run: `cd /Users/milobedini/Documents/git/bwell && npx tsc --noEmit 2>&1 | head -20`
Expected: Compilation errors in `ClientCard.tsx` referencing old field names (`assignments.total`, `assignments.completed`, `assignments.overdue`). This confirms the new types arrived.

- [ ] **Step 4: Commit**

```bash
cd /Users/milobedini/Documents/git/bwell
git add package.json package-lock.json
git commit -m "chore: update shared-types with week-scoped assignment fields"
```

---

### Task 4: Add `tint.infoBorder` color token

**Files:**
- Modify: `constants/Colors.ts:50-56`

- [ ] **Step 1: Add the token**

In `constants/Colors.ts`, add `infoBorder` to the `tint` object (after line 55, the `info` entry):

```typescript
  tint: {
    teal: 'rgba(24,205,186,0.15)',
    tealBorder: 'rgba(24,205,186,0.3)',
    error: 'rgba(255,109,94,0.15)',
    errorBorder: 'rgba(255,109,94,0.3)',
    info: 'rgba(255,209,93,0.15)',
    infoBorder: 'rgba(255,209,93,0.3)',
    neutral: 'rgba(166,173,187,0.12)'
  },
```

The pattern follows the existing `error`/`errorBorder` and `teal`/`tealBorder` pairs: same RGB at 0.3 opacity for the border.

- [ ] **Step 2: Commit**

```bash
git add constants/Colors.ts
git commit -m "feat: add tint.infoBorder color token"
```

---

### Task 5: Add reason tags to attention cards

**Files:**
- Modify: `components/home/dashboard/ClientCard.tsx`

- [ ] **Step 1: Add the `ReasonTags` component and render it**

In `ClientCard.tsx`, add a new component after the `ScoreDelta` component (after line 42), and update the middle row to include it.

Add this component after `ScoreDelta`:

```typescript
const REASON_TAG_CONFIG: Record<string, { label: string; bg: string; border: string; text: string }> = {
  severe_score: {
    label: 'Severe',
    bg: Colors.tint.error,
    border: Colors.tint.errorBorder,
    text: Colors.primary.error
  },
  worsening: {
    label: 'Worsening',
    bg: Colors.tint.info,
    border: Colors.tint.infoBorder,
    text: Colors.primary.warning
  },
  overdue: {
    label: 'Overdue',
    bg: Colors.tint.info,
    border: Colors.tint.infoBorder,
    text: Colors.primary.warning
  }
};

type ReasonTagsProps = {
  reasons: DashboardClientItem['reasons'];
  bucket: BucketType;
};

const ReasonTags = ({ reasons, bucket }: ReasonTagsProps) => {
  if (bucket !== 'attention' || reasons.length === 0) return null;

  return (
    <>
      {reasons.map((reason) => {
        const config = REASON_TAG_CONFIG[reason];
        if (!config) return null;
        return (
          <View
            key={reason}
            style={{
              backgroundColor: config.bg,
              borderColor: config.border,
              borderWidth: 1,
              borderRadius: 10,
              paddingHorizontal: 8,
              paddingVertical: 2
            }}
          >
            <ThemedText
              type="small"
              style={{ color: config.text, fontSize: 11, fontWeight: '600' }}
            >
              {config.label}
            </ThemedText>
          </View>
        );
      })}
    </>
  );
};
```

Then update the middle row in `ClientCard` (currently lines 161–182). Change the outer `View` to use `flex-wrap` and add `ReasonTags` after the `ScoreDelta`:

```typescript
        {/* Middle row: score badge + delta + reason tags + assignment dots */}
        <View className="mt-2 flex-row flex-wrap items-center gap-2">
          {latestScore ? (
            <View
              className="flex-row items-center gap-1 rounded-lg px-2.5 py-1"
              style={{ backgroundColor: severity.pillBg }}
            >
              <ThemedText type="smallBold" style={{ color: severity.text }}>
                {latestScore.moduleTitle}: {latestScore.score}
              </ThemedText>
            </View>
          ) : (
            <View className="rounded-lg px-2.5 py-1" style={{ backgroundColor: Colors.tint.neutral }}>
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
                No scores
              </ThemedText>
            </View>
          )}
          {latestScore && <ScoreDelta current={latestScore.score} previous={previousScore?.score ?? null} />}
          <ReasonTags reasons={item.reasons} bucket={bucket} />
          <View className="ml-auto">
            <AssignmentDots
              total={assignments.completedThisWeek + assignments.overdueTotal + assignments.pendingThisWeek}
              completed={assignments.completedThisWeek}
              overdue={assignments.overdueTotal}
            />
          </View>
        </View>
```

Note: the `gap` changes from `gap-3` to `gap-2` to keep the reason pills compact alongside the score badge.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | head -10`
Expected: May still have errors from bottom row (old field names) — that's fine, Task 7 fixes those.

- [ ] **Step 3: Commit**

```bash
git add components/home/dashboard/ClientCard.tsx
git commit -m "feat: add reason tags to attention cards on dashboard"
```

---

### Task 6: Add chevron tap affordance

**Files:**
- Modify: `components/home/dashboard/ClientCard.tsx`

- [ ] **Step 1: Add the import and chevron element**

Add the import at the top of `ClientCard.tsx`:

```typescript
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
```

Inside the `<Pressable>` in the `ClientCard` component, add the chevron as the last child (before the closing `</Pressable>`):

```typescript
        {/* Chevron disclosure indicator */}
        <View
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: [{ translateY: -9 }]
          }}
        >
          <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.chip.dotInactive} />
        </View>
```

Also update the top row `View` to add right padding so "last active" text doesn't overlap the chevron. Change:

```typescript
        <View className="flex-row items-start justify-between">
```

To:

```typescript
        <View className="flex-row items-start justify-between pr-5">
```

- [ ] **Step 2: Commit**

```bash
git add components/home/dashboard/ClientCard.tsx
git commit -m "feat: add chevron tap affordance to dashboard client cards"
```

---

### Task 7: Update completion text, dots, and bar to week-scoped fields

**Files:**
- Modify: `components/home/dashboard/ClientCard.tsx`

- [ ] **Step 1: Update `AssignmentDotsProps` and `ProgressBarProps`**

Update the `AssignmentDotsProps` type (currently lines 44–48):

```typescript
type AssignmentDotsProps = {
  completedThisWeek: number;
  overdueTotal: number;
  pendingThisWeek: number;
};
```

Update `getStatus` to use new field names:

```typescript
const getStatus = (i: number, completedThisWeek: number, overdueTotal: number): 'done' | 'overdue' | 'pending' => {
  if (i < completedThisWeek) return 'done';
  if (i < completedThisWeek + overdueTotal) return 'overdue';
  return 'pending';
};
```

Update `AssignmentDots` component:

```typescript
const AssignmentDots = ({ completedThisWeek, overdueTotal, pendingThisWeek }: AssignmentDotsProps) => {
  const total = completedThisWeek + overdueTotal + pendingThisWeek;
  const visible = Math.min(total, MAX_DOTS);
  const overflow = total - MAX_DOTS;

  return (
    <View className="flex-row items-center gap-1.5">
      {Array.from({ length: visible }, (_, i) => (
        <View key={i} style={DOT_STYLES[getStatus(i, completedThisWeek, overdueTotal)]} />
      ))}
      {overflow > 0 && (
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 11 }}>
          +{overflow}
        </ThemedText>
      )}
    </View>
  );
};
```

Update `ProgressBar` props and internals:

```typescript
type ProgressBarProps = {
  completedThisWeek: number;
  total: number;
};

const ProgressBar = ({ completedThisWeek, total }: ProgressBarProps) => {
  const pct = total > 0 ? (completedThisWeek / total) * 100 : 0;

  return (
    <View
      style={{
        width: 80,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.chip.darkCardDeep
      }}
    >
      <View
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 2,
          backgroundColor: pct > 0 ? Colors.sway.bright : 'transparent'
        }}
      />
    </View>
  );
};
```

- [ ] **Step 2: Update the `AssignmentDots` call in the middle row**

Already done in Task 5, but verify the call looks like:

```typescript
            <AssignmentDots
              completedThisWeek={assignments.completedThisWeek}
              overdueTotal={assignments.overdueTotal}
              pendingThisWeek={assignments.pendingThisWeek}
            />
```

- [ ] **Step 3: Update the bottom row with week-scoped text**

Replace the bottom row block (currently lines 184–200) with:

```typescript
        {/* Bottom row: week-scoped completion text + progress bar */}
        <View className="mt-1.5 flex-row items-center justify-between">
          <CompletionText assignments={assignments} />
          <ProgressBar
            completedThisWeek={assignments.completedThisWeek}
            total={assignments.completedThisWeek + assignments.overdueTotal + assignments.pendingThisWeek}
          />
        </View>
```

Add the `CompletionText` component (after `ProgressBar`, before `ClientCardProps`):

```typescript
const CompletionText = ({ assignments }: { assignments: DashboardAssignmentSummary }) => {
  const { completedThisWeek, overdueTotal, pendingThisWeek } = assignments;
  const total = completedThisWeek + overdueTotal + pendingThisWeek;

  if (total === 0) {
    return (
      <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
        No assignments this week
      </ThemedText>
    );
  }

  const allDone = completedThisWeek > 0 && overdueTotal === 0 && pendingThisWeek === 0;

  const segments: Array<{ count: number; label: string }> = [];
  if (completedThisWeek > 0) segments.push({ count: completedThisWeek, label: 'done' });
  if (overdueTotal > 0) segments.push({ count: overdueTotal, label: 'overdue' });
  if (pendingThisWeek > 0) segments.push({ count: pendingThisWeek, label: 'pending' });

  return (
    <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
      {segments.map((seg, i) => (
        <ThemedText key={seg.label} type="small" style={{ color: Colors.sway.darkGrey }}>
          {i > 0 && ' · '}
          <ThemedText type="small" style={{ color: Colors.sway.lightGrey }}>
            {seg.count}
          </ThemedText>
          {' '}{seg.label}
        </ThemedText>
      ))}
      {allDone && ' ✓'}
    </ThemedText>
  );
};
```

Add the import for `DashboardAssignmentSummary` — it's already imported via `DashboardClientItem`, but we need it directly for the `CompletionText` prop type. Update the import line:

```typescript
import { DashboardAssignmentSummary, DashboardClientItem } from '@milobedini/shared-types';
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Run lint**

Run: `npm run lint`
Expected: All checks pass.

- [ ] **Step 6: Commit**

```bash
git add components/home/dashboard/ClientCard.tsx
git commit -m "feat: week-scoped assignment text, dots, and progress bar"
```

---

### Task 8: Format and validate

**Files:**
- All modified files

- [ ] **Step 1: Format**

```bash
npx prettier --write .
```

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: All checks pass.

- [ ] **Step 3: Visual check**

Start the dev server (`npx expo start`) and verify the dashboard:
- Attention cards show reason tags (Severe, Worsening, Overdue)
- All cards have a subtle chevron on the right
- Bottom row reads "X done · Y overdue · Z pending" with dots and bar matching
- Cards with no assignments this week show "No assignments this week"

- [ ] **Step 4: Final commit if formatting changed anything**

```bash
git add -A
git commit -m "style: format"
```
