# UI/UX Polish Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise the overall polish and professionalism of the bwell app across chips, styling, spacing, typography, accessibility, empty states, and interactive feedback.

**Architecture:** Seven independent improvements that share the same colour system (`constants/Colors.ts`), text system (`ThemedText`), and component library. Most changes are leaf-level — modifying existing components in place. One new component (`EmptyState`) is created. The chip file (`components/ui/Chip.tsx`) gets the biggest rewrite. Tailwind config gets new colour tokens. Section 5 (accessibility) ships as a separate PR.

**Tech Stack:** Expo SDK 54, React Native 0.81, NativeWind (Tailwind CSS), react-native-paper (used by some components, being removed from Chip.tsx), MaterialCommunityIcons, Lottie

**Spec:** `docs/superpowers/specs/2026-03-18-ui-ux-polish-design.md`

**Validation command:** `npm run lint` (runs expo lint, eslint, prettier check, type check)

**Pre-commit:** Run `npx prettier --write .` then `npx eslint --fix .` before staging

---

## File Map

### Created
- `components/ui/EmptyState.tsx` — Reusable empty state component

### Modified
- `components/ui/Chip.tsx` — Full rewrite: StatusChip base + all chip variants
- `components/ThemedText.tsx` — Web font size adjustments
- `components/ThemedButton.tsx` — Pressable migration, hover/disabled states
- `components/Collapsible.tsx` — activeOpacity standardisation
- `components/ui/IconButton.tsx` — disabled state, accessibilityRole
- `tailwind.config.js` — Add chip.* and diary.* colour tokens
- `components/assignments/PatientActiveAssignments.tsx` — EmptyState replacement
- `components/assignments/PatientCompletedAssignments.tsx` — EmptyState replacement
- `components/assignments/TherapistActiveAssignments.tsx` — EmptyState replacement
- `components/attempts/PatientAttempts.tsx` — EmptyState replacement
- `components/attempts/TherapistLatestAttempts.tsx` — EmptyState replacement
- `components/ui/SearchPickerDialog.tsx` — EmptyState replacement
- `app/(main)/(tabs)/home/clients/index.tsx` — EmptyState replacement
- `components/attempts/presenters/AttemptPresenter.tsx` — EmptyState replacement

---

## Task 1: Add colour tokens to Tailwind config

**Files:**
- Modify: `tailwind.config.js`

- [ ] **Step 1: Add chip and diary colour tokens**

In `tailwind.config.js`, add the `chip` and `diary` objects inside `theme.colors` (after the existing `sway` block). These mirror `constants/Colors.ts`:

```js
chip: {
  infoBlue: '#93C5FD',
  infoBlueBorder: '#1E3A8A',
  teal: '#2DD4BF',
  tealBorder: '#164E4E',
  amber: '#FBBF24',
  amberBorder: '#7C5E12',
  red: '#F87171',
  redBorder: '#7F1D1D',
  green: '#34D399',
  greenBorder: '#065F46',
  neutral: '#E6E8EF',
  neutralBorder: '#3B3F51',
  darkCard: '#262E42',
  darkCardAlt: '#334368',
  darkCardDeep: '#0B1A2A',
  dotInactive: '#3A496B'
},
diary: {
  moodWarm: '#f4a261',
  moodCool: '#5b8def',
  closeness: '#e76f9a',
  enjoyment: '#a78bfa',
  promptBg: '#1a3a4a'
}
```

- [ ] **Step 2: Validate**

Run: `npm run lint`
Expected: PASS (no type errors, no lint errors)

- [ ] **Step 3: Commit**

```bash
npx prettier --write . && npx eslint --fix .
git add tailwind.config.js
git commit -m "feat(ui): add chip and diary colour tokens to tailwind config"
```

---

## Task 2: Rewrite Chip.tsx with StatusChip base

**Files:**
- Modify: `components/ui/Chip.tsx`

- [ ] **Step 1: Create the StatusChip base component**

Replace the entire file. The new `StatusChip` is a `View` + `ThemedText` component:

```tsx
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { Colors } from '@/constants/Colors';
import { AccessPolicy, AssignmentStatus, CanStartReason } from '@/types/types';
import type { AssignmentRecurrence, AvailableModulesItem } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import MaterialIcons from '@react-native-vector-icons/material-icons';

import { ThemedText } from '../ThemedText';

import hourglass from '@/assets/lotties/hourglass.json';

type StatusChipProps = {
  label: string;
  color: string;
  borderColor: string;
  icon?: string;
  iconElement?: ReactNode;
  className?: string;
};

const StatusChip = ({ label, color, borderColor, icon, iconElement, className }: StatusChipProps) => (
  <View
    className={`flex-row items-center gap-1 rounded-2xl border px-3 py-1 ${className ?? 'self-start'}`}
    style={{ borderColor }}
  >
    {iconElement ??
      (icon ? (
        <MaterialCommunityIcons name={icon} size={14} color={color} />
      ) : null)}
    <ThemedText type="small" style={{ color, fontSize: 12, lineHeight: 16 }}>
      {label}
    </ThemedText>
  </View>
);
```

- [ ] **Step 2: Rewrite PendingChip**

```tsx
const PendingChip = ({ animate }: { animate?: boolean }) => (
  <StatusChip
    label="Pending verification"
    color={Colors.primary.info}
    borderColor={Colors.sway.bright}
    iconElement={
      animate ? (
        <LottieView source={hourglass} autoPlay loop style={{ width: 20, height: 20 }} />
      ) : (
        <MaterialIcons name="hourglass-top" size={14} color={Colors.primary.info} />
      )
    }
  />
);
```

- [ ] **Step 3: Rewrite AccessPolicyChip**

```tsx
type AccessPolicyChipProps = {
  accessPolicy: AccessPolicy;
};

const AccessPolicyChip = ({ accessPolicy }: AccessPolicyChipProps) => {
  switch (accessPolicy) {
    case AccessPolicy.ASSIGNED:
      return (
        <StatusChip
          label="Assigned"
          color={Colors.chip.infoBlue}
          borderColor={Colors.chip.infoBlueBorder}
          icon="calendar-clock"
        />
      );
    case AccessPolicy.OPEN:
      return (
        <StatusChip
          label="Open"
          color={Colors.chip.teal}
          borderColor={Colors.chip.tealBorder}
          icon="lock-open-variant-outline"
        />
      );
    default:
      return null;
  }
};
```

- [ ] **Step 4: Rewrite BlockedChip and CanStartChip**

```tsx
type CanStartChipProps = {
  meta: AvailableModulesItem['meta'];
};

const BlockedChip = (reason: CanStartReason): ReactNode => {
  switch (reason) {
    case CanStartReason.REQUIRES_ASSIGNMENT:
      return (
        <StatusChip
          label="Needs assignment"
          color={Colors.chip.amber}
          borderColor={Colors.chip.amberBorder}
          icon="calendar-clock"
        />
      );
    default:
      return (
        <StatusChip
          label="Sign in"
          color={Colors.chip.red}
          borderColor={Colors.chip.redBorder}
          icon="calendar-clock"
        />
      );
  }
};

const CanStartChip = ({ meta }: CanStartChipProps) => {
  const { canStart, canStartReason } = meta;
  if (canStart)
    return (
      <StatusChip
        label="Ready"
        color={Colors.chip.green}
        borderColor={Colors.chip.greenBorder}
        icon="check-circle-outline"
      />
    );
  return BlockedChip(canStartReason as CanStartReason);
};
```

- [ ] **Step 5: Rewrite AssignmentStatusChip**

```tsx
type AssignmentStatusChipProps = {
  status: AssignmentStatus;
};

const AssignmentStatusChip = ({ status }: AssignmentStatusChipProps) => {
  switch (status) {
    case AssignmentStatus.ASSIGNED:
      return (
        <StatusChip
          label="Assigned"
          color={Colors.chip.infoBlue}
          borderColor={Colors.chip.infoBlueBorder}
          icon="clipboard-text-clock"
        />
      );
    case AssignmentStatus.IN_PROGRESS:
      return (
        <View className="self-start rounded-2xl" style={{ backgroundColor: Colors.primary.warning }}>
          <StatusChip
            label="In progress"
            color={Colors.primary.black}
            borderColor={Colors.primary.warning}
            iconElement={
              <MaterialCommunityIcons name="progress-clock" size={14} color={Colors.primary.black} />
            }
          />
        </View>
      );
    default:
      return null;
  }
};
```

Note: The IN_PROGRESS chip preserves its yellow background by wrapping StatusChip in a View with `backgroundColor: Colors.primary.warning`.

- [ ] **Step 6: Rewrite DueChip**

```tsx
const DueChip = ({ dueAt, completed }: { dueAt?: string; completed?: boolean }) => {
  if (!dueAt)
    return (
      <StatusChip
        label="No deadline"
        color={Colors.chip.neutral}
        borderColor={Colors.chip.neutralBorder}
        icon="calendar"
      />
    );

  const due = new Date(dueAt);

  if (completed)
    return (
      <StatusChip
        label={`Completed ${due.toLocaleDateString()}`}
        color={Colors.chip.green}
        borderColor={Colors.chip.greenBorder}
        icon="check-circle-outline"
      />
    );

  return (
    <StatusChip
      label={`Due ${due.toLocaleDateString()}`}
      color={Colors.chip.neutral}
      borderColor={Colors.chip.neutralBorder}
      icon="calendar"
    />
  );
};
```

- [ ] **Step 7: Rewrite TimeLeftChip**

```tsx
const TimeLeftChip = ({ dueAt }: { dueAt: string }) => {
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return null;

  const diffMs = due.getTime() - Date.now();

  let icon = 'calendar-clock';
  let color = Colors.chip.infoBlue;
  let border = Colors.chip.infoBlueBorder;
  let label = '';

  if (diffMs <= 0) {
    icon = 'calendar-remove';
    color = Colors.chip.red;
    border = Colors.chip.redBorder;
    label = 'Overdue';
  } else if (diffMs < 24 * 60 * 60 * 1000) {
    const hours = Math.max(1, Math.round(diffMs / 36e5));
    icon = 'clock-alert';
    color = Colors.chip.amber;
    border = Colors.chip.amberBorder;
    label = `${hours} ${hours === 1 ? 'hour' : 'hours'} left`;
  } else {
    const days = Math.ceil(diffMs / 86400000);
    icon = 'calendar-clock';
    label = `${days} ${days === 1 ? 'day' : 'days'} left`;
  }

  return <StatusChip label={label} color={color} borderColor={border} icon={icon} />;
};
```

- [ ] **Step 8: Rewrite RecurrenceChip**

```tsx
const RecurrenceChip = ({ recurrence }: { recurrence: AssignmentRecurrence }) => {
  if (!recurrence?.freq || recurrence.freq === 'none') return null;

  const freq = recurrence.freq.toLowerCase();
  const interval = recurrence.interval ?? 1;

  let label = '';
  let icon = 'repeat';
  const color = Colors.chip.infoBlue;
  const border = Colors.chip.infoBlueBorder;

  if (freq === 'weekly') {
    if (interval === 1) label = 'Weekly';
    else if (interval === 2) label = 'Biweekly';
    else label = `Every ${interval}w`;
    icon = 'calendar-week';
  } else if (freq === 'monthly') {
    if (interval === 1) label = 'Monthly';
    else label = `Every ${interval}m`;
    icon = 'calendar-month';
  } else {
    return null;
  }

  return <StatusChip label={label} color={color} borderColor={border} icon={icon} />;
};
```

- [ ] **Step 9: Rewrite DateChip**

```tsx
const DateChip = ({ dateString, prefix }: { dateString: string; prefix?: string }) => {
  const date = new Date(dateString);

  return (
    <StatusChip
      label={`${prefix ? `${prefix} ` : ''}${date.toLocaleDateString()}`}
      color={Colors.chip.neutral}
      borderColor={Colors.chip.neutralBorder}
      icon="calendar"
    />
  );
};
```

- [ ] **Step 10: Rewrite SaveProgressChip**

```tsx
type SaveProgressChipProps = {
  isSaving: boolean;
  saved: boolean;
};

const SaveProgressChip = ({ isSaving, saved }: SaveProgressChipProps) => {
  if (!isSaving && !saved) return null;

  if (isSaving)
    return (
      <StatusChip
        label="Saving"
        color={Colors.chip.green}
        borderColor={Colors.chip.greenBorder}
        className="mt-2 self-center"
        iconElement={<ActivityIndicator animating color={Colors.sway.bright} size="small" />}
      />
    );

  if (saved)
    return (
      <StatusChip
        label="Saved"
        color={Colors.chip.green}
        borderColor={Colors.chip.greenBorder}
        className="mt-2 self-center"
        icon="check-circle-outline"
      />
    );

  return null;
};
```

- [ ] **Step 11: Add exports**

```tsx
export {
  AccessPolicyChip,
  AssignmentStatusChip,
  CanStartChip,
  DateChip,
  DueChip,
  PendingChip,
  RecurrenceChip,
  SaveProgressChip,
  StatusChip,
  TimeLeftChip
};
```

- [ ] **Step 12: Validate**

Run: `npm run lint`
Expected: PASS — all consumer files import named exports which have not changed, so no downstream breakage.

- [ ] **Step 13: Commit**

```bash
npx prettier --write . && npx eslint --fix .
git add components/ui/Chip.tsx
git commit -m "feat(ui): rewrite chips with StatusChip base component"
```

---

## Task 3: Fix web font sizing in ThemedText

**Files:**
- Modify: `components/ThemedText.tsx`

- [ ] **Step 1: Update Platform.select default values**

Change the `default` (web) values in the `styleMap`:

- `title`: fontSize `70` -> `36`, lineHeight `72` -> `40`
- `subtitle`: fontSize `50` -> `28`, lineHeight `50` -> `32`
- `smallTitle`: fontSize `30` -> `22`, lineHeight `30` -> `24`
- `italic`: fontSize `20` -> `18` (lineHeight `24` stays)
- `link`: fontSize `15` -> `14`, lineHeight `18` -> `16`

Leave `default`, `small`, `smallBold`, `button`, `error`, `profileButtonText` unchanged.

- [ ] **Step 2: Validate**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
npx prettier --write . && npx eslint --fix .
git add components/ThemedText.tsx
git commit -m "fix(ui): align web font sizes with mobile scale"
```

---

## Task 4: Create EmptyState component

**Files:**
- Create: `components/ui/EmptyState.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { Colors } from '@/constants/Colors';

import { ThemedText } from '../ThemedText';
import ThemedButton from '../ThemedButton';

type EmptyStateProps = {
  icon: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
};

const EmptyState = ({ icon, title, subtitle, action }: EmptyStateProps) => (
  <View className="flex-1 items-center justify-center gap-4 p-8">
    <MaterialCommunityIcons name={icon} size={40} color={Colors.sway.darkGrey} />
    <ThemedText type="smallTitle" className="text-center">
      {title}
    </ThemedText>
    {subtitle ? (
      <ThemedText type="small" className="text-center" style={{ color: Colors.sway.darkGrey }}>
        {subtitle}
      </ThemedText>
    ) : null}
    {action ? <ThemedButton title={action.label} onPress={action.onPress} compact /> : null}
  </View>
);

export default EmptyState;
```

- [ ] **Step 2: Validate**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
npx prettier --write . && npx eslint --fix .
git add components/ui/EmptyState.tsx
git commit -m "feat(ui): add reusable EmptyState component"
```

---

## Task 5: Replace all inline empty states with EmptyState

**Files:**
- Modify: `components/assignments/PatientActiveAssignments.tsx`
- Modify: `components/assignments/PatientCompletedAssignments.tsx`
- Modify: `components/assignments/TherapistActiveAssignments.tsx`
- Modify: `components/attempts/PatientAttempts.tsx`
- Modify: `components/attempts/TherapistLatestAttempts.tsx`
- Modify: `components/ui/SearchPickerDialog.tsx`
- Modify: `app/(main)/(tabs)/home/clients/index.tsx`
- Modify: `components/attempts/presenters/AttemptPresenter.tsx`

- [ ] **Step 1: PatientActiveAssignments**

Replace line 23:
```tsx
<ThemedText className="p-4">No active assignments...</ThemedText>
```
with:
```tsx
<EmptyState icon="clipboard-text-outline" title="No active assignments" />
```

Add import: `import EmptyState from '../ui/EmptyState';`

- [ ] **Step 2: PatientCompletedAssignments**

Replace line 23:
```tsx
<ThemedText className="p-4">No completed assignments...</ThemedText>
```
with:
```tsx
<EmptyState icon="check-all" title="No completed assignments" />
```

Add import: `import EmptyState from '../ui/EmptyState';`

- [ ] **Step 3: TherapistActiveAssignments**

Replace lines 23-28 (the empty state View with text + PrimaryButton):
```tsx
<View>
  <ThemedText className="mt-2 px-4 text-center">You have no active assignments currently...</ThemedText>
  <Link asChild href={{ pathname: '/assignments/add', params: { headerTitle: 'Create Assignment' } }} push>
    <PrimaryButton title="Create assignment" logo />
  </Link>
</View>
```
with:
```tsx
<EmptyState
  icon="clipboard-text-outline"
  title="No active assignments"
  action={{
    label: 'Create assignment',
    onPress: () => router.push({ pathname: '/assignments/add', params: { headerTitle: 'Create Assignment' } })
  }}
/>
```

Add imports: `import EmptyState from '../ui/EmptyState';` and `import { useRouter } from 'expo-router';`
Add inside the component: `const router = useRouter();`
Remove the `Link` and `PrimaryButton` imports if no longer used elsewhere in the file. Remove `View` import if no longer used.

- [ ] **Step 4: PatientAttempts**

Replace lines 78-80:
```tsx
<View>
  <ThemedText>No {view} attempts</ThemedText>
</View>
```
with:
```tsx
<EmptyState icon="file-document-outline" title={`No ${view} attempts`} />
```

Add import: `import EmptyState from '../ui/EmptyState';`

- [ ] **Step 5: TherapistLatestAttempts**

Replace line 61:
```tsx
<ThemedText className="p-4">No submissions...</ThemedText>
```
with:
```tsx
<EmptyState icon="file-document-outline" title="No submissions" />
```

Add import: `import EmptyState from '../ui/EmptyState';`

- [ ] **Step 6: SearchPickerDialog**

Replace line 122-123:
```tsx
<List.Item title="No results" />
```
with:
```tsx
<EmptyState icon="magnify" title="No results" />
```

Add import: `import EmptyState from '@/components/ui/EmptyState';`

- [ ] **Step 7: clients/index.tsx**

Replace lines 44-53 (the empty clients state):
```tsx
return (
  <ContentContainer>
    <ContentContainer className="mt-4 gap-4">
      <ThemedText type="subtitle">You have no clients (yet!)</ThemedText>
      <Link asChild href={'/home/patients'}>
        <ThemedButton>View all patients</ThemedButton>
      </Link>
    </ContentContainer>
  </ContentContainer>
);
```
with:
```tsx
return (
  <ContentContainer>
    <EmptyState
      icon="account-group-outline"
      title="No clients yet"
      action={{ label: 'View all patients', onPress: () => router.push('/home/patients') }}
    />
  </ContentContainer>
);
```

Add import: `import EmptyState from '@/components/ui/EmptyState';`
Add `useRouter`: `const router = useRouter();` (check if already available from `expo-router` import).
Remove `ThemedButton` import if no longer used. Remove `Link` import if no longer used elsewhere.

- [ ] **Step 8: AttemptPresenter**

Replace lines 25-28:
```tsx
<Container>
  <ThemedText className="px-4">No module type attempt presenter yet</ThemedText>
</Container>
```
with:
```tsx
<Container>
  <EmptyState
    icon="puzzle-outline"
    title="Not available yet"
    action={{ label: 'Go back', onPress: () => router.back() }}
  />
</Container>
```

Add imports: `import EmptyState from '@/components/ui/EmptyState';` and `import { useRouter } from 'expo-router';`
Add inside the component: `const router = useRouter();`

- [ ] **Step 9: Clean up unused imports**

Go through each modified file and remove imports that are no longer used (e.g. `ThemedText` if it was only used for the empty state text, `View` if no longer needed, `Link`, `PrimaryButton`, etc.).

- [ ] **Step 10: Validate**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
npx prettier --write . && npx eslint --fix .
git add components/ui/EmptyState.tsx components/assignments/PatientActiveAssignments.tsx components/assignments/PatientCompletedAssignments.tsx components/assignments/TherapistActiveAssignments.tsx components/attempts/PatientAttempts.tsx components/attempts/TherapistLatestAttempts.tsx components/ui/SearchPickerDialog.tsx app/(main)/(tabs)/home/clients/index.tsx components/attempts/presenters/AttemptPresenter.tsx
git commit -m "feat(ui): replace inline empty states with EmptyState component"
```

---

## Task 6: Migrate ThemedButton to Pressable with interactive states

**Files:**
- Modify: `components/ThemedButton.tsx`

- [ ] **Step 1: Rewrite ThemedButton with Pressable**

Replace `TouchableOpacity` with `Pressable` for all three button variants. Add hover and pressed styling:

```tsx
import { Image, Pressable, PressableProps } from 'react-native';
import { clsx } from 'clsx';

import { ThemedText } from './ThemedText';

import bWellIcon from '../assets/images/icon.png';

type ThemedButtonProps = PressableProps & {
  compact?: boolean;
  title?: string;
  logo?: boolean;
  textClasses?: string;
  logoClasses?: string;
  variant?: 'default' | 'error';
  centered?: boolean;
  children?: React.ReactNode;
};

const ThemedButton = (props: ThemedButtonProps) => {
  const { className, children, disabled, compact, title, variant = 'default', centered, ...rest } = props;
  return (
    <Pressable
      disabled={disabled}
      className={clsx(
        'rounded-md p-4',
        disabled && 'bg-sway-darkGrey',
        compact && 'w-[200] px-3 py-2',
        variant === 'error' && 'bg-error',
        variant === 'default' && !disabled && 'bg-sway-bright',
        centered && 'self-center',
        className
      )}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      {...rest}
    >
      {({ pressed }) => (
        <ThemedText type="button" className="text-center" style={{ opacity: pressed ? 0.7 : 1 }}>
          {title ?? children}
        </ThemedText>
      )}
    </Pressable>
  );
};

const PrimaryButton = ({ onPress, title, logo, className, textClasses, logoClasses, variant }: ThemedButtonProps) => (
  <Pressable
    onPress={onPress}
    className={clsx(
      'w-[300] flex-row items-center justify-evenly self-center rounded-lg border',
      !variant && 'border-sway-bright bg-sway-buttonBackground',
      variant === 'error' && 'bg-error text-black',
      className
    )}
    accessibilityRole="button"
  >
    {({ pressed }) => (
      <>
        <ThemedText
          type="title"
          className={clsx('max-w-[50%] text-center', textClasses)}
          style={{ fontSize: 20, opacity: pressed ? 0.4 : 1 }}
          onLight={variant === 'error'}
        >
          {title}
        </ThemedText>
        {logo && <Image source={bWellIcon} className={clsx('h-[120] w-[120]', logoClasses)} />}
      </>
    )}
  </Pressable>
);

const SecondaryButton = ({ onPress, title, children }: ThemedButtonProps) => (
  <Pressable
    onPress={onPress}
    className="my-2.5 w-full rounded-xl bg-sway-buttonBackground p-3"
    accessibilityRole="button"
  >
    {({ pressed }) => (
      <ThemedText type="profileButtonText" style={{ opacity: pressed ? 0.7 : 1 }}>
        {title ?? children}
      </ThemedText>
    )}
  </Pressable>
);

export default ThemedButton;
export { PrimaryButton, SecondaryButton };
```

- [ ] **Step 2: Validate**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
npx prettier --write . && npx eslint --fix .
git add components/ThemedButton.tsx
git commit -m "feat(ui): migrate buttons to Pressable with interactive states"
```

---

## Task 7: Fix IconButton and Collapsible interactive states

**Files:**
- Modify: `components/ui/IconButton.tsx`
- Modify: `components/Collapsible.tsx`

- [ ] **Step 1: Update IconButton**

Add disabled state styling and accessibilityRole:

```tsx
import { OpaqueColorValue, Pressable, PressableProps } from 'react-native';
import { Colors } from '@/constants/Colors';

import { IconSymbol, IconSymbolProps } from './IconSymbol';

type IconButtonProps = PressableProps &
  IconSymbolProps & {
    color?: string | OpaqueColorValue;
  };

const IconButton = ({ onPress, className, color, disabled, ...iconProps }: IconButtonProps) => (
  <Pressable
    onPress={onPress}
    className={className}
    disabled={disabled}
    style={({ pressed }) => ({ opacity: disabled ? 0.4 : pressed ? 0.7 : 1 })}
    accessibilityRole="button"
    accessibilityState={{ disabled: !!disabled }}
  >
    <IconSymbol color={color || Colors.sway.bright} {...iconProps} />
  </Pressable>
);

export default IconButton;
```

- [ ] **Step 2: Update Collapsible activeOpacity**

In `components/Collapsible.tsx`, change `activeOpacity={0.8}` to `activeOpacity={0.7}` on line 12.

- [ ] **Step 3: Validate**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
npx prettier --write . && npx eslint --fix .
git add components/ui/IconButton.tsx components/Collapsible.tsx
git commit -m "feat(ui): add disabled states to IconButton, standardise Collapsible opacity"
```

---

## Task 8 (separate PR): Accessibility labels

> This task should be done on a separate branch and merged as its own PR to reduce blast radius.

**Files:** ~28 component files (see spec Section 5 for full list)

- [ ] **Step 1: Create a new branch**

```bash
git checkout -b feat/accessibility-labels
```

- [ ] **Step 2: Add accessibilityLabel to core UI components**

For `ThemedButton`, `PrimaryButton`, `SecondaryButton` — already handled in Task 6 (accessibilityRole added). Now ensure consumers pass meaningful labels. For each button usage across the codebase, add `accessibilityLabel` where the button text is not self-explanatory.

For buttons that already have `title` prop text, the text serves as the accessible name. Focus on buttons using `children` or icon-only buttons.

- [ ] **Step 3: Add labels to list item touchables**

For each `TouchableOpacity`/`Pressable` wrapping a list item in:
- `components/assignments/AssignmentsListPatient.tsx`
- `components/assignments/AssignmentsListTherapist.tsx`
- `components/attempts/PatientAttempts.tsx`
- `components/attempts/TherapistLatestAttempts.tsx`
- `app/(main)/(tabs)/home/clients/index.tsx`

Add `accessibilityLabel` with the item title/name, e.g.:
```tsx
accessibilityLabel={`View ${item.module.title}`}
```

- [ ] **Step 4: Add labels to presenter interactive elements**

For diary `DayChip`, questionnaire `QuestionSlide` chips, and `FilterDrawer` controls — add `accessibilityLabel` describing the action.

- [ ] **Step 5: Add labels to auth components**

For `AuthSubmitButton`, `AuthLink`, `AuthSheetHandle` — add appropriate `accessibilityLabel` and `accessibilityRole` props.

- [ ] **Step 6: Validate**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 7: Commit and open PR**

```bash
npx prettier --write . && npx eslint --fix .
git add -A
git commit -m "feat(a11y): add accessibility labels to interactive elements"
git push -u origin feat/accessibility-labels
```

Open PR targeting main.

---

## Deferred: Section 2 (Styling Convention Migration) and Section 3 (Spacing Scale)

The spec's Section 2 (migrating ~124 static inline styles to className in FilterDrawer, QuestionnairePresenter, ActivityDiaryPresenter, AuthSubmitButton, ReflectionPrompt) and Section 3 (migrating off-scale spacing values like 6px, 22px, 10px) are deferred to a follow-up pass. Rationale:

- Task 1 (Tailwind colour tokens) lays the groundwork needed for the className migration
- The styling migration is a large, file-by-file refactor that benefits from being done after the chip rewrite and empty state changes settle
- Section 3 piggybacks on Section 2 per the spec ("they happen together")
- The CLAUDE.md convention documentation update is also deferred until after the migration is complete and proven

These should be tackled as the next UI/UX polish iteration after this plan is complete.
