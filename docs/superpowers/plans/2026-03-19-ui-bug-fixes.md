# UI Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 UI bugs documented in `docs/bugs/19-03-26.txt` — stale client list, timeline gap, alternating row width, assignment progress chip, and therapist note styling.

**Architecture:** Each bug is an independent fix touching different screens/components. No shared dependencies between tasks. All fixes are CSS/layout or query invalidation changes — no new API calls or backend changes.

**Tech Stack:** React Native, NativeWind (Tailwind), TanStack React Query, react-native-paper

---

## File Map

| Task | File | Action |
|------|------|--------|
| 1 | `hooks/useUsers.ts:185-188` | Change `invalidateQueries` to use `refetchType: 'all'` for clients |
| 2 | `app/(main)/(tabs)/home/clients/[id]/index.tsx:61,89` | Remove extra statusBarHeight padding, remove ContentContainer `px-4` for timeline |
| 3 | `app/(main)/(tabs)/home/clients/[id]/index.tsx:89` | Override ContentContainer `px-0` so alternating rows span full width |
| 3 | `components/assignments/AssignmentsListPatient.tsx` | Override parent container padding so alternating rows span full width |
| 4 | `components/assignments/AssignmentsListPatient.tsx:59-61` | Wrap percentage in a `StatusChip` |
| 4 | `hooks/useAttempts.ts:190-194` | Add `['assignments']` invalidation to `useSaveModuleAttempt` |
| 5 | `components/attempts/presenters/diary/ActivityDiaryPresenter.tsx:411-434` | Restyle therapist note input to match activity Card pattern |

---

### Task 1: Fix client list not updating after adding patient as client

**Files:**
- Modify: `hooks/useUsers.ts:185-188`

The mutation `useAddRemoveTherapist` invalidates `['clients']`, but since the clients screen is unmounted when you're on the patients screen, the query has no active observers. `invalidateQueries` marks the data stale but doesn't refetch inactive queries by default. When the user navigates to clients, React Query shows stale cache first, then refetches — but the stale data doesn't include the new client.

Fix: use `refetchType: 'all'` to eagerly refetch the clients query even when the screen isn't mounted, so the data is ready when the user navigates back.

- [ ] **Step 1: Update invalidation in useAddRemoveTherapist**

In `hooks/useUsers.ts`, change the `onSuccess` callback:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['patients'], refetchType: 'all' });
  queryClient.invalidateQueries({ queryKey: ['clients'], refetchType: 'all' });
  queryClient.invalidateQueries({ queryKey: ['profile'] });
},
```

- [ ] **Step 2: Verify manually**

1. Log in as therapist
2. Go to All Patients → tap three-dot menu → "Add as client"
3. Navigate to Your Clients
4. Confirm the new client appears immediately without needing to refresh

- [ ] **Step 3: Commit**

```bash
git add hooks/useUsers.ts
git commit -m "fix: eagerly refetch clients/patients queries after add/remove"
```

---

### Task 2: Fix large gap above client timeline

**Files:**
- Modify: `app/(main)/(tabs)/home/clients/[id]/index.tsx:61`

The `Appbar.Header` uses `statusBarHeight={Constants.statusBarHeight + 32}` which adds excessive top padding. The `+ 32` creates the large gap. The screen already sits below the tab navigator header, so the status bar height alone (or a smaller offset) should suffice.

- [ ] **Step 1: Reduce statusBarHeight padding**

In `app/(main)/(tabs)/home/clients/[id]/index.tsx`, change:

```typescript
// Before
statusBarHeight={Constants.statusBarHeight + 32}

// After
statusBarHeight={0}
```

The screen is rendered inside a tab navigator that already handles the status bar area. Setting `statusBarHeight={0}` removes the redundant gap.

- [ ] **Step 2: Verify manually**

1. Log in as therapist → Your Clients → tap a client
2. Confirm the timeline content sits directly below the header with no large gap

- [ ] **Step 3: Commit**

```bash
git add app/\(main\)/\(tabs\)/home/clients/\[id\]/index.tsx
git commit -m "fix: remove extra padding above client timeline header"
```

---

### Task 3: Fix alternating row backgrounds not spanning full width

**Files:**
- Modify: `app/(main)/(tabs)/home/clients/[id]/index.tsx:89`
- Modify: `components/assignments/AssignmentsListPatient.tsx`

Only screens with alternating row backgrounds (`index % 2`) are affected. These are:
- **Client timeline** (`clients/[id]/index.tsx`) — uses `ContentContainer` which adds `px-4`
- **Patient assignments list** (`AssignmentsListPatient.tsx`) — rendered inside a parent with padding

The working reference is `all-users/index.tsx` which uses `Container` (no horizontal padding). Rows have `p-4` on the individual items, so text is inset while backgrounds span full width.

Fix: Override container horizontal padding on screens with alternating rows.

- [ ] **Step 1: Fix client timeline — remove container padding**

In `app/(main)/(tabs)/home/clients/[id]/index.tsx`:

Change the `ContentContainer` to remove horizontal padding:
```tsx
<ContentContainer className="px-0">
```

The rows already have `p-4` on each `TouchableOpacity` (line 114), so text stays inset while backgrounds bleed edge-to-edge.

- [ ] **Step 2: Check AssignmentsListPatient parent container**

`AssignmentsListPatient` is a standalone `FlatList` component with `p-4` on each row. Check where it's rendered — if the parent screen wraps it in `ContentContainer`, override with `className="px-0"`. The FlatList rows already have `p-4` for text inset.

- [ ] **Step 3: Verify manually**

1. Therapist: Client → Timeline → alternating rows span full width
2. Patient: Active assignments → alternating rows span full width
3. Admin: All Users → still looks correct (unchanged)

- [ ] **Step 4: Commit**

```bash
git add app/\(main\)/\(tabs\)/home/clients/\[id\]/index.tsx
git commit -m "fix: alternating row backgrounds span full screen width"
```

---

### Task 4: Fix assignment progress display and stale data

**Files:**
- Modify: `components/assignments/AssignmentsListPatient.tsx:59-61`
- Modify: `hooks/useAttempts.ts:190-194`

Two sub-issues: (a) progress percentage is plain text instead of a chip, (b) saving progress doesn't invalidate the assignments query so the list shows stale percentages.

- [ ] **Step 1: Replace plain text percentage with a StatusChip**

In `components/assignments/AssignmentsListPatient.tsx`, replace lines 59-61:

```tsx
// Before
{isInProgress && item.percentComplete !== undefined && (
  <ThemedText type="default">{Math.round(item.percentComplete)}%</ThemedText>
)}

// After
{isInProgress && item.percentComplete !== undefined && (
  <StatusChip
    label={`${Math.round(item.percentComplete)}%`}
    color={Colors.chip.amber}
    borderColor={Colors.chip.amberBorder}
    icon="progress-clock"
  />
)}
```

Update existing imports — add `StatusChip` to the existing Chip import on line 13, and add a new `Colors` import:
```tsx
// Line 13: add StatusChip to existing import
import { AssignmentStatusChip, DueChip, RecurrenceChip, StatusChip, TimeLeftChip } from '../ui/Chip';

// New import
import { Colors } from '@/constants/Colors';
```

- [ ] **Step 2: Add assignments invalidation to useSaveModuleAttempt**

In `hooks/useAttempts.ts`, add to `useSaveModuleAttempt.onSuccess`:

```typescript
onSuccess: () => {
  qc.invalidateQueries({ queryKey: ['attempts', 'detail'] });
  qc.invalidateQueries({ queryKey: ['attempts', 'mine'] });
  qc.invalidateQueries({ queryKey: ['attempts', 'therapist', 'patient-timeline'] });
  qc.invalidateQueries({ queryKey: ['assignments'] }); // <-- add this
},
```

- [ ] **Step 3: Verify manually**

1. Log in as patient
2. Active assignments → confirm percentage shows in an amber chip (not plain text)
3. Tap "Continue" on an in-progress assignment → make changes → save & exit
4. Assignments list → confirm percentage is updated

- [ ] **Step 4: Commit**

```bash
git add components/assignments/AssignmentsListPatient.tsx hooks/useAttempts.ts
git commit -m "fix: show assignment progress in chip, invalidate assignments on save"
```

---

### Task 5: Restyle therapist note input to match activity cards

**Files:**
- Modify: `components/attempts/presenters/diary/ActivityDiaryPresenter.tsx:411-434`

The therapist note uses a raw `View` with inline margins and a borderless TextInput. It should match the `Card`-wrapped pattern used by activity slots (lines 210-284).

- [ ] **Step 1: Restyle therapist note section**

In `components/attempts/presenters/diary/ActivityDiaryPresenter.tsx`, replace lines 411-434:

```tsx
// Before
{canEdit && (
  <View style={{ marginBottom: 12, marginHorizontal: 8 }}>
    <ThemedText style={{ fontSize: 12, color: Colors.sway.darkGrey, marginBottom: 4 }}>
      Therapist note
    </ThemedText>
    <TextInput
      mode="flat"
      placeholder="Anything you'd like your therapist to know this week..."
      placeholderTextColor={Colors.sway.darkGrey}
      value={userNoteText}
      onChangeText={(t) => {
        setUserNoteText(t);
        setNoteDirty(true);
      }}
      multiline
      maxLength={500}
      style={{ backgroundColor: 'transparent', minHeight: 64 }}
      className="border border-sway-darkGrey"
      textColor="white"
      underlineColor="transparent"
      activeUnderlineColor="transparent"
      theme={{ colors: { onSurfaceVariant: Colors.sway.darkGrey } }}
    />
  </View>
)}

// After
{canEdit && (
  <Card
    style={{
      backgroundColor: Colors.sway.buttonBackground,
      marginBottom: 10,
      marginHorizontal: 8
    }}
  >
    <Card.Title
      title="Note for therapist"
      titleStyle={{ color: 'white', fontFamily: Fonts.Bold }}
    />
    <Card.Content>
      <TextInput
        mode="flat"
        placeholder="Anything you'd like your therapist to know this week..."
        placeholderTextColor="white"
        value={userNoteText}
        onChangeText={(t) => {
          setUserNoteText(t);
          setNoteDirty(true);
        }}
        multiline
        maxLength={500}
        style={{ backgroundColor: 'transparent', minHeight: 64 }}
        className="overflow-hidden text-ellipsis border border-sway-darkGrey text-white"
        textColor="white"
        underlineColor="transparent"
        activeUnderlineColor={Colors.sway.bright}
        theme={{ colors: { onSurfaceVariant: Colors.sway.lightGrey } }}
        clearButtonMode="always"
      />
    </Card.Content>
  </Card>
)}
```

Key changes:
- Wraps in `Card` with same `backgroundColor` as activity slots
- Uses `Card.Title` with `Fonts.Bold` like activity slots
- Matches `placeholderTextColor`, `activeUnderlineColor`, and `theme.colors` to activity TextInput pattern
- Adds `clearButtonMode="always"` for consistency

- [ ] **Step 2: Verify manually**

1. Log in as patient → open an in-progress activity diary assignment
2. Scroll to bottom — therapist note input should look like the activity cards above it
3. Type a note → save → confirm it persists

- [ ] **Step 3: Commit**

```bash
git add components/attempts/presenters/diary/ActivityDiaryPresenter.tsx
git commit -m "fix: restyle therapist note input to match activity card pattern"
```
