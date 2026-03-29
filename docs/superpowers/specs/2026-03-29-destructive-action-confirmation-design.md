# Destructive Action Confirmation Design

## Problem

Three destructive actions execute immediately without confirmation dialogs, violating Apple HIG and risking accidental data loss:

1. **Remove as client** — `app/(main)/(tabs)/home/clients/index.tsx`
2. **Remove as client** — `app/(main)/(tabs)/home/patients/index.tsx`
3. **Remove assignment** — `components/assignments/AssignmentsListTherapist.tsx`

All three use `ActionMenu` with `variant='destructive'` but call `mutate()` directly on press.

## Approach

Extend `ActionMenu` with a built-in confirmation step. When a destructive action is tapped, the menu content swaps to a confirmation view within the same bottom sheet. This is automatic for all `variant='destructive'` actions — safe by default, zero chance of forgetting to add confirmation for future destructive actions.

## Type Changes

Extend `ActionMenuItem` with optional confirmation fields:

```ts
type ActionMenuItem = {
  icon: IconName;
  label: string;
  onPress: () => void;
  variant?: 'default' | 'destructive';
  confirmTitle?: string;        // e.g. "Remove assignment?"
  confirmDescription?: string;  // e.g. "This will permanently delete..."
  confirmLabel?: string;        // e.g. "Remove" — defaults to action label
};
```

Defaults for destructive actions without custom text:
- `confirmTitle` → "Are you sure?"
- `confirmDescription` → not shown
- `confirmLabel` → the action's `label`

Non-destructive actions are unaffected.

## Internal State & Behavior

One piece of internal state added to `ActionMenu`:

```ts
const [pendingAction, setPendingAction] = useState<ActionMenuItem | null>(null);
```

### Flow

1. User taps a destructive action → set `pendingAction` (instead of calling `handleAction`)
2. Menu content swaps from action list to confirmation view
3. User taps confirm → call `handleAction(pendingAction.onPress)`, clear `pendingAction`
4. User taps cancel → clear `pendingAction`, return to action list (menu stays open)
5. Backdrop tap / dismiss → clear `pendingAction` and close menu entirely
6. `pendingAction` is reset when `visible` becomes `false` (cleanup)

Non-destructive actions call `handleAction` directly — no change.

## Confirmation View Layout

When `pendingAction` is set, the menu card content becomes:

```
┌─────────────────────────────┐
│                             │
│    ⚠ (error-tinted icon)    │
│                             │
│     "Remove assignment?"    │  ← confirmTitle (smallTitle, error color)
│                             │
│  "This will permanently..." │  ← confirmDescription (small, darkGrey) — optional
│                             │
├─────────────────────────────┤
│  [ Remove ]  (red/error bg) │  ← confirmLabel, full-width destructive button
│  [ Cancel ]  (darkGrey text)│  ← returns to action list
└─────────────────────────────┘
```

- Warning icon: `alert-circle-outline` from MaterialCommunityIcons, `Colors.primary.error`, centered
- Title and description centered, padded `px-5 py-4`
- Confirm button: error tint background, error text color
- Cancel: returns to action list (not dismiss) so user can pick a different action
- No animation between states — clean swap within the already-animated sheet

## Call-site Updates

Add custom confirmation text to existing destructive actions:

### `app/(main)/(tabs)/home/clients/index.tsx` — "Remove as client"

```ts
confirmTitle: "Remove client?"
confirmDescription: "This will remove the therapist-client relationship. The patient record will remain."
confirmLabel: "Remove"
```

### `app/(main)/(tabs)/home/patients/index.tsx` — "Remove as client"

```ts
confirmTitle: "Remove client?"
confirmDescription: "This will remove the therapist-client relationship. The patient record will remain."
confirmLabel: "Remove"
```

### `components/assignments/AssignmentsListTherapist.tsx` — "Remove assignment"

```ts
confirmTitle: "Remove assignment?"
confirmDescription: "This will permanently delete the assignment and any associated progress."
confirmLabel: "Remove"
```

## Scope

- Modify: `components/ui/ActionMenu.tsx` (confirmation logic + view)
- Modify: 3 call sites (add confirm text props)
- No new components or files needed
- No changes to mutation hooks or API layer
