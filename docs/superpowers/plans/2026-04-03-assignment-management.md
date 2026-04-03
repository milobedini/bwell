# Assignment Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add edit and remove assignment capabilities to the patient detail screen via long-press on practice cards.

**Architecture:** Long-press on `PatientPracticeCard` triggers haptic feedback and opens an `ActionMenu` with "Edit assignment" and "Remove assignment" actions. Edit navigates to a new `patients/edit.tsx` screen mirroring the create flow with locked client/module fields. Remove uses ActionMenu's built-in destructive confirmation then hard-deletes via existing `useRemoveAssignment` hook. No BE changes needed.

**Tech Stack:** Expo Router, expo-haptics, ActionMenu, DueDateField, RecurrenceField, useUpdateAssignment, useRemoveAssignment

---

### File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `components/therapist/PatientPracticeCard.tsx` | Modify | Add `onLongPress` callback prop |
| `components/therapist/PatientPracticeView.tsx` | Modify | ActionMenu state, edit navigation, remove mutation |
| `app/(main)/(tabs)/patients/edit.tsx` | Create | Edit assignment form screen |
| `app/(main)/(tabs)/patients/_layout.tsx` | Modify | Register edit screen in Stack |

---

### Task 1: Add `onLongPress` to `PatientPracticeCard`

**Files:**
- Modify: `components/therapist/PatientPracticeCard.tsx`

- [ ] **Step 1: Add `onLongPress` prop to the component**

Update the props type and wire it to the `Pressable`:

```tsx
// In PatientPracticeCardProps, add:
onLongPress?: (item: PracticeItem) => void;
```

Update `PatientPracticeCardBase` to destructure `onLongPress` and add a handler:

```tsx
const PatientPracticeCardBase = ({ item, sparkline, patientName, onLongPress }: PatientPracticeCardProps) => {
```

Add the long-press handler with haptic feedback. Import `* as Haptics from 'expo-haptics'` at the top:

```tsx
import * as Haptics from 'expo-haptics';
```

Create the handler inside the component:

```tsx
const handleLongPress = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  onLongPress?.(item);
};
```

Add `onLongPress={handleLongPress}` to the existing `Pressable`. Also remove `disabled={!canNavigate}` — the card should always respond to long-press even if tap navigation is disabled for "not started" items. Instead, guard the `onPress`:

```tsx
<Pressable
  onPress={canNavigate ? handlePress : undefined}
  onLongPress={handleLongPress}
  className="active:opacity-80"
  style={{ backgroundColor: Colors.chip.darkCard, borderRadius: 12, padding: 12 }}
>
```

- [ ] **Step 2: Verify the app builds**

Run: `npm run lint`
Expected: All checks pass

- [ ] **Step 3: Commit**

```bash
git add components/therapist/PatientPracticeCard.tsx
git commit -m "feat: add onLongPress prop to PatientPracticeCard"
```

---

### Task 2: Wire ActionMenu into `PatientPracticeView`

**Files:**
- Modify: `components/therapist/PatientPracticeView.tsx`

- [ ] **Step 1: Add ActionMenu state and remove mutation**

Add these imports at the top of the file:

```tsx
import { useCallback, memo, useState } from 'react';
import { useRouter } from 'expo-router';
import ActionMenu from '../ui/ActionMenu';
import type { ActionMenuItem } from '../ui/ActionMenu';
import { useRemoveAssignment } from '@/hooks/useAssignments';
```

Remove `memo` and `useCallback` from the existing `react` import (they're now in the combined import above).

Inside `PatientPracticeViewBase`, add state and the mutation hook after the existing `usePatientPractice` call:

```tsx
const router = useRouter();
const [menuItem, setMenuItem] = useState<PracticeItem | null>(null);
const removeAssignment = useRemoveAssignment();
```

- [ ] **Step 2: Create the long-press handler and action menu config**

Add the long-press handler:

```tsx
const handleLongPress = useCallback((item: PracticeItem) => {
  setMenuItem(item);
}, []);
```

Add the edit navigation handler:

```tsx
const handleEdit = useCallback(() => {
  if (!menuItem) return;
  router.push({
    pathname: '/(main)/(tabs)/patients/edit',
    params: {
      assignmentId: menuItem.assignmentId,
      patientName,
      moduleTitle: menuItem.moduleTitle,
      programTitle: menuItem.programTitle,
      moduleType: menuItem.moduleType,
      ...(menuItem.dueAt ? { dueAt: menuItem.dueAt } : {}),
      ...(menuItem.recurrence ? { recurrence: JSON.stringify(menuItem.recurrence) } : {}),
      ...(menuItem.notes ? { notes: menuItem.notes } : {}),
      headerTitle: 'Edit Assignment',
    },
  });
}, [menuItem, patientName, router]);
```

Add the remove handler:

```tsx
const handleRemove = useCallback(() => {
  if (!menuItem) return;
  removeAssignment.mutate({ assignmentId: menuItem.assignmentId });
}, [menuItem, removeAssignment]);
```

Build the actions array:

```tsx
const menuActions: ActionMenuItem[] = menuItem
  ? [
      { icon: 'pencil-outline', label: 'Edit assignment', onPress: handleEdit },
      {
        icon: 'delete-outline',
        label: 'Remove assignment',
        onPress: handleRemove,
        variant: 'destructive',
        confirmTitle: 'Remove assignment?',
        confirmDescription: `This will permanently remove the ${menuItem.moduleTitle} assignment. Any in-progress work will be lost.`,
        confirmLabel: 'Remove',
      },
    ]
  : [];
```

- [ ] **Step 3: Pass `onLongPress` to `PatientPracticeCard` in renderItem**

Update the `renderItem` callback to pass `onLongPress`:

```tsx
const renderItem = useCallback(
  ({ item }: SectionListRenderItemInfo<PracticeItem>) => (
    <PatientPracticeCard
      item={item}
      sparkline={data?.sparklines?.[item.moduleId]}
      patientId={patientId}
      patientName={patientName}
      onLongPress={handleLongPress}
    />
  ),
  [data?.sparklines, patientId, patientName, handleLongPress]
);
```

- [ ] **Step 4: Render the ActionMenu**

Add the `ActionMenu` component just before the closing `</ContentContainer>` tag, after the `SectionList` block (inside the outermost fragment or wrapping `<>` if needed — wrap the `ContentContainer` children in a fragment):

```tsx
<ActionMenu
  visible={!!menuItem}
  onDismiss={() => setMenuItem(null)}
  title={menuItem?.moduleTitle}
  subtitle={
    [menuItem?.dueAt ? `Due ${new Date(menuItem.dueAt).toLocaleDateString()}` : 'No due date']
      .filter(Boolean)
      .join(' · ')
  }
  actions={menuActions}
/>
```

This should be placed inside `ContentContainer` but after the conditional content (the `isEmpty` ternary and the `SectionList`). Since `ContentContainer` may only accept one child, wrap the existing children and the `ActionMenu` in a `<>` fragment.

- [ ] **Step 5: Verify the app builds**

Run: `npm run lint`
Expected: All checks pass

- [ ] **Step 6: Commit**

```bash
git add components/therapist/PatientPracticeView.tsx
git commit -m "feat: wire ActionMenu for assignment edit/remove in PatientPracticeView"
```

---

### Task 3: Register the edit screen in the patients stack

**Files:**
- Modify: `app/(main)/(tabs)/patients/_layout.tsx`

- [ ] **Step 1: Add the edit screen to the Stack**

Add a new `Stack.Screen` for the edit route, after the existing `add` screen:

```tsx
<Stack.Screen name="edit" options={nestedScreenOptionsWithTitle('Edit Assignment')} />
```

The full return becomes:

```tsx
<Stack screenOptions={stackScreenOptionsWithTitle('Patients')}>
  <Stack.Screen name="index" />
  <Stack.Screen name="[id]" options={nestedScreenOptions} />
  <Stack.Screen name="attempt/[id]" options={withHeaderFromParams()} />
  <Stack.Screen name="add" options={nestedScreenOptionsWithTitle('Create Assignment')} />
  <Stack.Screen name="edit" options={withHeaderFromParams()} />
</Stack>
```

Use `withHeaderFromParams()` so the header title comes from the `headerTitle` route param ("Edit Assignment").

- [ ] **Step 2: Verify the app builds**

Run: `npm run lint`
Expected: All checks pass

- [ ] **Step 3: Commit**

```bash
git add app/\(main\)/\(tabs\)/patients/_layout.tsx
git commit -m "feat: register edit assignment screen in patients stack"
```

---

### Task 4: Create the edit assignment screen

**Files:**
- Create: `app/(main)/(tabs)/patients/edit.tsx`

- [ ] **Step 1: Create the edit screen**

Create `app/(main)/(tabs)/patients/edit.tsx` with the following content. This mirrors `patients/add.tsx` but with client/module locked and fields pre-populated:

```tsx
import { useCallback, useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ContentContainer from '@/components/ContentContainer';
import ThemedButton from '@/components/ThemedButton';
import DueDateField from '@/components/ui/DueDateField';
import RecurrenceField from '@/components/ui/RecurrenceField';
import SelectField from '@/components/ui/SelectField';
import { Fonts } from '@/constants/Typography';
import { useUpdateAssignment } from '@/hooks/useAssignments';
import type { AssignmentRecurrence, UpdateAssignmentInput } from '@milobedini/shared-types';

const EditAssignment = () => {
  const params = useLocalSearchParams<{
    assignmentId: string;
    patientName: string;
    moduleTitle: string;
    programTitle: string;
    moduleType: string;
    dueAt?: string;
    recurrence?: string;
    notes?: string;
    headerTitle?: string;
  }>();

  const initialRecurrence = useMemo<AssignmentRecurrence | undefined>(
    () => (params.recurrence ? (JSON.parse(params.recurrence) as AssignmentRecurrence) : undefined),
    [params.recurrence]
  );

  const [dueAt, setDueAt] = useState<string | undefined>(params.dueAt);
  const [recurrence, setRecurrence] = useState<AssignmentRecurrence | undefined>(
    initialRecurrence ?? { freq: 'none' }
  );
  const [notes, setNotes] = useState(params.notes ?? '');

  const router = useRouter();
  const updateAssignment = useUpdateAssignment();

  const hasChanges = useMemo(() => {
    const dueAtChanged = (dueAt ?? '') !== (params.dueAt ?? '');
    const notesChanged = notes !== (params.notes ?? '');
    const recurrenceChanged = JSON.stringify(recurrence) !== JSON.stringify(initialRecurrence ?? { freq: 'none' });
    return dueAtChanged || notesChanged || recurrenceChanged;
  }, [dueAt, params.dueAt, notes, params.notes, recurrence, initialRecurrence]);

  const handleSubmit = useCallback(() => {
    const updates: UpdateAssignmentInput = {};
    if ((dueAt ?? '') !== (params.dueAt ?? '')) updates.dueAt = dueAt;
    if (notes !== (params.notes ?? '')) updates.notes = notes;
    if (JSON.stringify(recurrence) !== JSON.stringify(initialRecurrence ?? { freq: 'none' })) {
      updates.recurrence = recurrence;
    }

    updateAssignment.mutate(
      { assignmentId: params.assignmentId!, updates },
      { onSuccess: () => router.back() }
    );
  }, [dueAt, recurrence, notes, params, initialRecurrence, updateAssignment, router]);

  return (
    <ContentContainer>
      {/* Client (read-only) */}
      <SelectField
        label={params.patientName ?? 'Patient'}
        value={params.patientName}
        selected
        leftIcon="check-circle"
        onPress={() => {}}
        disabled
      />
      <Divider />

      {/* Module (read-only) */}
      <SelectField
        label={params.moduleTitle ?? 'Module'}
        value={params.moduleTitle}
        placeholder={`${params.programTitle ?? ''} (${params.moduleType ?? ''})`}
        selected
        leftIcon="check-circle"
        onPress={() => {}}
        disabled
      />
      <Divider />

      {/* Due date (editable) */}
      <DueDateField value={dueAt} onChange={setDueAt} label="Due date" />
      <Divider />

      {/* Recurrence (editable, shown when due date set) */}
      {dueAt && (
        <>
          <RecurrenceField value={recurrence} onChange={setRecurrence} label="Recurrence" />
          <Divider />
        </>
      )}

      {/* Notes (editable) */}
      <TextInput
        autoCapitalize="sentences"
        autoCorrect={true}
        clearButtonMode="while-editing"
        placeholder="Notes for your client (optional)..."
        returnKeyType="done"
        value={notes}
        onChangeText={setNotes}
        className="h-[64px] px-3 text-white"
        placeholderTextColor={'white'}
        style={{ fontFamily: Fonts.Regular }}
      />
      <Divider />

      {/* Buttons */}
      <View className="mt-4 gap-4">
        <ThemedButton
          title={updateAssignment.isPending ? 'Saving...' : 'Save Changes'}
          onPress={handleSubmit}
          compact
          centered
          disabled={!hasChanges || updateAssignment.isPending}
        />
        <ThemedButton title="Cancel" compact variant="error" centered onPress={() => router.back()} />
      </View>
    </ContentContainer>
  );
};

export default EditAssignment;
```

- [ ] **Step 2: Verify the app builds**

Run: `npm run lint`
Expected: All checks pass

- [ ] **Step 3: Commit**

```bash
git add app/\(main\)/\(tabs\)/patients/edit.tsx
git commit -m "feat: add edit assignment screen"
```

---

### Task 5: Validate end-to-end flow

- [ ] **Step 1: Format and lint**

Run: `npx eslint --fix . && npx prettier --write . && npm run lint`
Expected: All checks pass

- [ ] **Step 2: Manual test — long-press opens ActionMenu**

1. Open the app, navigate to Patients → tap a patient
2. Long-press on any practice card
3. Verify: haptic feedback fires, ActionMenu appears with module title, "Edit assignment" and "Remove assignment" actions

- [ ] **Step 3: Manual test — edit assignment**

1. From the ActionMenu, tap "Edit assignment"
2. Verify: edit screen appears with client and module locked, due date / recurrence / notes pre-populated
3. Change the due date, tap "Save Changes"
4. Verify: navigates back, practice list refreshes with updated due date

- [ ] **Step 4: Manual test — remove assignment**

1. Long-press a practice card, tap "Remove assignment"
2. Verify: confirmation screen appears ("Remove assignment?", description, red "Remove" button)
3. Tap "Remove"
4. Verify: toast shows "Assignment removed", card disappears from list

- [ ] **Step 5: Final commit (if any formatting changes)**

```bash
git add -A
git commit -m "style: format assignment management files"
```
