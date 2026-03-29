# Destructive Action Confirmation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a built-in confirmation step to ActionMenu so all destructive actions require explicit user confirmation before executing.

**Architecture:** Extend `ActionMenu` with internal `pendingAction` state. When a `variant='destructive'` action is tapped, swap the menu content to a confirmation view (warning icon, title, description, confirm/cancel buttons). Non-destructive actions are unaffected. Then add custom confirmation text to the 3 existing destructive call sites.

**Tech Stack:** React Native, Moti, react-native-paper (Icon), NativeWind, existing ActionMenu component

---

### Task 1: Extend ActionMenuItem type with confirmation fields

**Files:**
- Modify: `components/ui/ActionMenu.tsx:10-15`

- [ ] **Step 1: Add optional confirmation fields to ActionMenuItem type**

Replace the existing `ActionMenuItem` type (lines 10–15):

```ts
type ActionMenuItem = {
  icon: IconName;
  label: string;
  onPress: () => void;
  variant?: 'default' | 'destructive';
  confirmTitle?: string;
  confirmDescription?: string;
  confirmLabel?: string;
};
```

- [ ] **Step 2: Validate types compile**

Run: `npx tsc --noEmit --incremental`
Expected: no errors (new fields are optional, so all existing call sites remain valid)

- [ ] **Step 3: Commit**

```bash
git add components/ui/ActionMenu.tsx
git commit -m "feat(ActionMenu): add confirmation fields to ActionMenuItem type"
```

---

### Task 2: Add confirmation state and logic to ActionMenu

**Files:**
- Modify: `components/ui/ActionMenu.tsx:1,25-32`

- [ ] **Step 1: Add useState import and pendingAction state**

Update the import on line 1 to include `useState` and `useEffect`:

```ts
import { type ComponentProps, useCallback, useEffect, useState } from 'react';
```

Inside the `ActionMenu` component (after line 25, before the `handleAction` callback), add:

```ts
const [pendingAction, setPendingAction] = useState<ActionMenuItem | null>(null);

// Reset pending action when menu closes
useEffect(() => {
  if (!visible) setPendingAction(null);
}, [visible]);
```

- [ ] **Step 2: Modify action press handler to intercept destructive actions**

Replace the existing `handleAction` callback (lines 26–32) and add a new handler:

```ts
const handleAction = useCallback(
  (onPress: () => void) => {
    onDismiss();
    onPress();
  },
  [onDismiss]
);

const handleActionPress = useCallback(
  (action: ActionMenuItem) => {
    if (action.variant === 'destructive') {
      setPendingAction(action);
    } else {
      handleAction(action.onPress);
    }
  },
  [handleAction]
);

const handleConfirm = useCallback(() => {
  if (pendingAction) {
    handleAction(pendingAction.onPress);
    setPendingAction(null);
  }
}, [pendingAction, handleAction]);

const handleCancelConfirm = useCallback(() => {
  setPendingAction(null);
}, []);
```

- [ ] **Step 3: Update Pressable onPress in the actions list**

Change line 89 from:

```tsx
onPress={() => handleAction(action.onPress)}
```

to:

```tsx
onPress={() => handleActionPress(action)}
```

- [ ] **Step 4: Validate types compile**

Run: `npx tsc --noEmit --incremental`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add components/ui/ActionMenu.tsx
git commit -m "feat(ActionMenu): add confirmation state and destructive action interception"
```

---

### Task 3: Add confirmation view to ActionMenu

**Files:**
- Modify: `components/ui/ActionMenu.tsx:62-122` (menu card content area)

- [ ] **Step 1: Wrap existing content in a conditional and add confirmation view**

Inside the `MotiView` menu card (after the opening tag on line 62), wrap the existing Header, Actions, and Cancel sections in a conditional, and add the confirmation view as the alternate branch:

```tsx
{pendingAction ? (
  /* Confirmation view */
  <View className="items-center px-5 py-6">
    <View
      className="mb-4 h-12 w-12 items-center justify-center rounded-full"
      style={{ backgroundColor: Colors.tint.error }}
    >
      <Icon name="alert-circle-outline" size={28} color={Colors.primary.error} />
    </View>
    <ThemedText type="smallTitle" style={{ color: Colors.primary.error }} className="text-center">
      {pendingAction.confirmTitle ?? 'Are you sure?'}
    </ThemedText>
    {pendingAction.confirmDescription && (
      <ThemedText
        type="small"
        style={{ color: Colors.sway.darkGrey }}
        className="mt-2 text-center"
      >
        {pendingAction.confirmDescription}
      </ThemedText>
    )}
  </View>
) : (
  <>
    {/* Header */}
    {(title || subtitle) && (
      <View className="border-b px-5 pb-3 pt-5" style={{ borderBottomColor: Colors.chip.darkCardAlt }}>
        {title && (
          <ThemedText type="smallTitle" className="text-center">
            {title}
          </ThemedText>
        )}
        {subtitle && (
          <ThemedText type="small" className="mt-1 text-center" style={{ color: Colors.sway.darkGrey }}>
            {subtitle}
          </ThemedText>
        )}
      </View>
    )}

    {/* Actions */}
    <View className="py-1">
      {actions.map((action, index) => {
        const isDestructive = action.variant === 'destructive';
        const iconColor = isDestructive ? Colors.primary.error : Colors.sway.bright;
        const textColor = isDestructive ? Colors.primary.error : Colors.sway.lightGrey;

        return (
          <Pressable
            key={action.label}
            onPress={() => handleActionPress(action)}
            className="flex-row items-center px-5 py-4 active:bg-chip-darkCardAlt active:opacity-70"
          >
            <View
              className="mr-4 h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: isDestructive ? Colors.tint.error : Colors.tint.teal }}
            >
              <Icon name={action.icon} size={20} color={iconColor} />
            </View>
            <ThemedText type="default" style={{ color: textColor }}>
              {action.label}
            </ThemedText>
            {index < actions.length - 1 && (
              <View
                className="absolute bottom-0 left-5 right-5 h-px"
                style={{ backgroundColor: Colors.chip.darkCardAlt }}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  </>
)}
```

- [ ] **Step 2: Replace the Cancel button section with a conditional**

Replace the existing Cancel button section (lines 112–122) with:

```tsx
{/* Bottom buttons */}
<View className="border-t px-5 py-1" style={{ borderTopColor: Colors.chip.darkCardAlt }}>
  {pendingAction ? (
    <>
      <Pressable
        onPress={handleConfirm}
        className="items-center rounded-xl py-4 active:opacity-70"
        style={{ backgroundColor: Colors.tint.error }}
      >
        <ThemedText type="button" style={{ color: Colors.primary.error }}>
          {pendingAction.confirmLabel ?? pendingAction.label}
        </ThemedText>
      </Pressable>
      <Pressable
        onPress={handleCancelConfirm}
        className="items-center py-4 active:opacity-70"
      >
        <ThemedText type="default" style={{ color: Colors.sway.darkGrey }}>
          Cancel
        </ThemedText>
      </Pressable>
    </>
  ) : (
    <Pressable
      onPress={onDismiss}
      className="items-center py-4 active:bg-chip-darkCardAlt active:opacity-70"
    >
      <ThemedText type="default" style={{ color: Colors.sway.darkGrey }}>
        Cancel
      </ThemedText>
    </Pressable>
  )}
</View>
```

- [ ] **Step 3: Validate types compile**

Run: `npx tsc --noEmit --incremental`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add components/ui/ActionMenu.tsx
git commit -m "feat(ActionMenu): add confirmation view for destructive actions"
```

---

### Task 4: Add confirmation text to clients list

**Files:**
- Modify: `app/(main)/(tabs)/home/clients/index.tsx:134-139`

- [ ] **Step 1: Add confirmation props to the destructive action**

Replace the "Remove as client" action item (lines 134–139):

```ts
{
  icon: 'account-off-outline',
  label: 'Remove as client',
  onPress: handleRemoveClient,
  variant: 'destructive' as const,
  confirmTitle: 'Remove client?',
  confirmDescription: 'This will remove the therapist-client relationship. The patient record will remain.',
  confirmLabel: 'Remove'
}
```

- [ ] **Step 2: Validate types compile**

Run: `npx tsc --noEmit --incremental`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/(main)/(tabs)/home/clients/index.tsx"
git commit -m "feat(clients): add confirmation text for remove client action"
```

---

### Task 5: Add confirmation text to patients list

**Files:**
- Modify: `app/(main)/(tabs)/home/patients/index.tsx:114-119`

- [ ] **Step 1: Add confirmation props to the destructive action**

Replace the "Remove as client" action item (lines 114–119):

```ts
{
  icon: isClient ? 'star-off' : 'star',
  label: isClient ? 'Remove as client' : 'Add as client',
  onPress: handleAddRemoveClient,
  variant: isClient ? ('destructive' as const) : ('default' as const),
  ...(isClient && {
    confirmTitle: 'Remove client?',
    confirmDescription: 'This will remove the therapist-client relationship. The patient record will remain.',
    confirmLabel: 'Remove'
  })
}
```

- [ ] **Step 2: Validate types compile**

Run: `npx tsc --noEmit --incremental`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/(main)/(tabs)/home/patients/index.tsx"
git commit -m "feat(patients): add confirmation text for remove client action"
```

---

### Task 6: Add confirmation text to therapist assignments list

**Files:**
- Modify: `components/assignments/AssignmentsListTherapist.tsx:279-284`

- [ ] **Step 1: Add confirmation props to the destructive action**

Replace the "Remove assignment" action item (lines 279–284):

```ts
{
  icon: 'delete-outline' as const,
  label: 'Remove assignment',
  onPress: handleRemove,
  variant: 'destructive' as const,
  confirmTitle: 'Remove assignment?',
  confirmDescription: 'This will permanently delete the assignment and any associated progress.',
  confirmLabel: 'Remove'
}
```

- [ ] **Step 2: Validate types compile**

Run: `npx tsc --noEmit --incremental`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/assignments/AssignmentsListTherapist.tsx
git commit -m "feat(assignments): add confirmation text for remove assignment action"
```

---

### Task 7: Run full validation and format

**Files:**
- All modified files

- [ ] **Step 1: Run eslint auto-fix**

Run: `npx eslint --fix .`
Expected: no errors

- [ ] **Step 2: Run prettier**

Run: `npx prettier --write .`
Expected: files formatted

- [ ] **Step 3: Run full lint validation**

Run: `npm run lint`
Expected: all checks pass (expo lint, eslint, prettier, type check)

- [ ] **Step 4: Commit any formatting changes**

```bash
git add -A
git commit -m "style: format after destructive action confirmation changes"
```

---

### Task 8: Manual QA

- [ ] **Step 1: Test clients list** — open clients tab, tap menu on a client, tap "Remove as client", verify confirmation view appears with title "Remove client?", description text, and red "Remove" button. Tap "Cancel" and verify it returns to action list. Tap "Remove" and verify the mutation fires.

- [ ] **Step 2: Test patients list** — open patients tab, tap menu on a patient who is a client, tap "Remove as client", verify confirmation appears. Also verify that "Add as client" (non-destructive) does NOT show confirmation.

- [ ] **Step 3: Test assignments list** — open assignments tab, tap menu on an assignment, tap "Remove assignment", verify confirmation appears. Verify "Edit assignment" (non-destructive) does NOT show confirmation.

- [ ] **Step 4: Test dismiss behavior** — verify tapping the backdrop during confirmation closes the menu entirely. Verify the confirmation state resets when reopening the menu.
