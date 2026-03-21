# Therapist Attempts Card Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the therapist Attempts tab list items from flat rows into severity-tinted cards with module type icons, score pills, iteration badges, and relative time.

**Architecture:** Backend adds `moduleType` to the existing projection. Frontend adds two small utils (`timeAgo`, `getSeverityColors`) and rewrites the list item component as a card with severity-coded left border.

**Tech Stack:** React Native, NativeWind, expo-router, MaterialCommunityIcons, TanStack Query, MongoDB aggregation

**Spec:** `docs/superpowers/specs/2026-03-21-therapist-attempts-card-redesign-design.md`

---

### Task 1: Backend — Add `moduleType` to projection

**Files:**
- Modify: `../cbt/src/controllers/attemptsController.ts:594-604`
- Modify: `../cbt/src/shared-types/types.ts:338-352`

- [ ] **Step 1: Add `moduleType: 1` to the `$project` stage**

In `../cbt/src/controllers/attemptsController.ts`, update the `$project` stage in `getTherapistLatest`:

```typescript
{
  $project: {
    _id: 1,
    user: { _id: 1, username: 1, email: 1, name: 1 },
    module: { _id: 1, title: 1 },
    moduleType: 1,
    totalScore: 1,
    scoreBandLabel: 1,
    band: 1,
    completedAt: 1,
    weekStart: 1,
    iteration: 1,
  },
},
```

- [ ] **Step 2: Add `moduleType` to `TherapistLatestRow` shared type**

In `../cbt/src/shared-types/types.ts`, add `moduleType` to the type:

```typescript
export type TherapistLatestRow = {
  _id: string
  user: TherapistUserPreview
  module: TherapistModulePreview

  // fields from the latest attempt (flattened)
  moduleType?: 'questionnaire' | 'psychoeducation' | 'exercise' | 'activity_diary'
  iteration?: number
  completedAt?: string
  totalScore?: number
  scoreBandLabel?: string
  weekStart?: string
  band?: ScoreBandSummary

  percentComplete?: number
}
```

- [ ] **Step 3: Publish shared types and update frontend**

```bash
cd ../cbt && npm run publish-types
cd ../bwell && npm run update-types
```

- [ ] **Step 4: Verify the type is available**

Run `npm run lint` in `bwell/` to confirm types resolve correctly.

- [ ] **Step 5: Commit**

```bash
cd ../cbt && git add src/controllers/attemptsController.ts src/shared-types/types.ts && git commit -m "feat: add moduleType to therapist latest attempts projection"
cd ../bwell && git add package.json package-lock.json && git commit -m "chore: update shared-types for moduleType field"
```

---

### Task 2: Add `timeAgo` utility

**Files:**
- Modify: `utils/dates.ts`

- [ ] **Step 1: Add `timeAgo` function to `utils/dates.ts`**

Append to the existing file:

```typescript
type TimeAgoResult = {
  relative: string | null;
  formatted: string;
};

export const timeAgo = (input: string): TimeAgoResult => {
  const date = new Date(input);
  const formatted = dateString(input);
  const diffMs = Date.now() - date.getTime();

  if (diffMs < 60_000) return { relative: 'just now', formatted };

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60)
    return {
      relative: minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`,
      formatted
    };

  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 24)
    return {
      relative: hours === 1 ? '1 hour ago' : `${hours} hours ago`,
      formatted
    };

  const days = Math.floor(diffMs / 86_400_000);
  if (days < 7)
    return {
      relative: days === 1 ? '1 day ago' : `${days} days ago`,
      formatted
    };

  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return {
      relative: weeks === 1 ? '1 week ago' : `${weeks} weeks ago`,
      formatted
    };
  }

  return { relative: null, formatted };
};
```

- [ ] **Step 2: Validate**

Run `npm run lint` to confirm no type errors.

- [ ] **Step 3: Commit**

```bash
git add utils/dates.ts && git commit -m "feat: add timeAgo utility for relative date display"
```

---

### Task 3: Add `getSeverityColors` utility

**Files:**
- Create: `utils/severity.ts`

- [ ] **Step 1: Create `utils/severity.ts`**

```typescript
import { Colors } from '@/constants/Colors';

type SeverityColors = {
  border: string;
  pillBg: string;
};

const SEVERITY_MAP: ReadonlyArray<{ pattern: RegExp; border: string; pillBg: string }> = [
  { pattern: /severe|high/i, border: Colors.chip.red, pillBg: Colors.tint.error },
  { pattern: /moderate/i, border: Colors.chip.amber, pillBg: Colors.tint.info },
  { pattern: /mild|minimal|low/i, border: Colors.chip.green, pillBg: Colors.tint.teal }
];

const DEFAULT_COLORS: SeverityColors = {
  border: Colors.sway.bright,
  pillBg: 'transparent'
};

export const getSeverityColors = (label?: string | null): SeverityColors => {
  if (!label) return DEFAULT_COLORS;
  const match = SEVERITY_MAP.find((s) => s.pattern.test(label));
  return match ? { border: match.border, pillBg: match.pillBg } : DEFAULT_COLORS;
};
```

- [ ] **Step 2: Validate**

Run `npm run lint` to confirm no type errors.

- [ ] **Step 3: Commit**

```bash
git add utils/severity.ts && git commit -m "feat: add getSeverityColors helper for score band colour mapping"
```

---

### Task 4: Redesign `TherapistLatestAttempts` component

**Files:**
- Modify: `components/attempts/TherapistLatestAttempts.tsx`

- [ ] **Step 1: Rewrite the component**

Replace the full contents of `components/attempts/TherapistLatestAttempts.tsx`:

```tsx
import { type ComponentProps, memo, useCallback } from 'react';
import { FlatList, type ListRenderItemInfo, Pressable, View } from 'react-native';
import { Link } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useTherapistGetLatestAttempts } from '@/hooks/useAttempts';
import { dateString, timeAgo } from '@/utils/dates';
import { getSeverityColors } from '@/utils/severity';
import type { TherapistLatestRow } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import ContentContainer from '../ContentContainer';
import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';
import EmptyState from '../ui/EmptyState';

type MCIName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const MODULE_TYPE_ICONS: Record<string, MCIName> = {
  questionnaire: 'clipboard-text-outline',
  activity_diary: 'calendar-week',
  psychoeducation: 'book-open-outline',
  exercise: 'pencil-outline'
};

const getModuleIcon = (moduleType?: string): MCIName =>
  (moduleType && MODULE_TYPE_ICONS[moduleType]) || 'file-document-outline';

const ItemSeparator = () => <View className="h-3" />;

const TherapistAttemptListItemBase = ({ item }: { item: TherapistLatestRow }) => {
  const severity = getSeverityColors(item.scoreBandLabel);
  const { relative, formatted } = timeAgo(item.completedAt || '');
  const icon = getModuleIcon(item.moduleType);

  return (
    <Link
      asChild
      href={{
        pathname: '/attempts/[id]',
        params: {
          id: item._id,
          headerTitle: `${item.module.title} (${dateString(item.completedAt || '')})`
        }
      }}
      push
    >
      <Pressable
        className="overflow-hidden rounded-xl bg-chip-darkCard"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <View className="flex-row">
          {/* Severity accent border */}
          <View className="w-1 rounded-l-xl" style={{ backgroundColor: severity.border }} />

          <View className="flex-1 gap-2 p-4">
            {/* Row 1: Icon + Title + Iteration */}
            <View className="flex-row items-center gap-2">
              <MaterialCommunityIcons name={icon} size={18} color={Colors.sway.darkGrey} />
              <ThemedText type="smallTitle" className="flex-1 flex-shrink" numberOfLines={1}>
                {item.module.title}
              </ThemedText>
              {!!item.iteration && item.iteration > 1 && (
                <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: Colors.tint.teal }}>
                  <ThemedText type="small" style={{ color: Colors.sway.bright, fontSize: 12 }}>
                    #{item.iteration}
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Row 2: Patient name */}
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
              {item.user.name}
            </ThemedText>

            {/* Row 3: Score pill + band label (questionnaires only) */}
            {!!item.totalScore && (
              <View className="flex-row items-center gap-2">
                <View className="rounded-lg px-3 py-1" style={{ backgroundColor: severity.pillBg }}>
                  <ThemedText type="smallBold" style={{ color: severity.border }}>
                    {item.totalScore}
                  </ThemedText>
                </View>
                <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
                  {item.scoreBandLabel}
                </ThemedText>
              </View>
            )}

            {/* Row 4: Relative time + date */}
            <View className="flex-row items-center gap-1">
              <MaterialCommunityIcons name="calendar" size={14} color={Colors.sway.darkGrey} />
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 12 }}>
                {relative ? `${relative} · ${formatted}` : formatted}
              </ThemedText>
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  );
};

const TherapistAttemptListItem = memo(TherapistAttemptListItemBase);

const TherapistLatestAttempts = () => {
  const { data, isPending, isError } = useTherapistGetLatestAttempts();

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TherapistLatestRow>) => <TherapistAttemptListItem item={item} />,
    []
  );

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;
  if (!data) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <ContentContainer padded={false}>
      {data.length ? (
        <FlatList
          data={data}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ItemSeparatorComponent={ItemSeparator}
          contentContainerStyle={{ padding: 16 }}
        />
      ) : (
        <EmptyState
          icon="clipboard-text-outline"
          title="No submissions yet"
          subtitle="Completed work from your patients will appear here"
        />
      )}
    </ContentContainer>
  );
};

export default TherapistLatestAttempts;
```

Key changes from current implementation:
- `TouchableOpacity` → `Pressable` with pressed opacity (project convention)
- Alternating bg rows → individual `chip.darkCard` cards with `gap-3` separation
- `subtitle` text type → `smallTitle` for the module title (smaller, saves space)
- Combined "title by patient" → separate rows for module title and patient name
- Raw `DateChip` → relative time with `timeAgo()` + formatted date
- Added severity-coloured left accent border (3px via `w-1`)
- Added module type icon from `MODULE_TYPE_ICONS` map
- Added iteration badge `#N` (only when > 1)
- Added score pill with severity-tinted background
- Removed `index` prop (no longer needed without alternating rows)
- Removed `withAnchor` prop from Link (non-standard)

- [ ] **Step 2: Validate**

Run `npm run lint` to confirm no lint/type errors.

- [ ] **Step 3: Visual check**

Run `npx expo start` and navigate to the therapist Attempts tab. Verify:
- Cards render with rounded corners and dark card background
- Left accent border is coloured by severity (red/amber/green/teal)
- Module type icon appears next to the title
- Iteration badge appears for attempts with iteration > 1
- Score pill shows with severity-tinted background for questionnaires
- Activity diaries show teal border, no score pill
- Relative time displays correctly
- Empty state shows updated message
- Pressing a card navigates to the attempt detail

- [ ] **Step 4: Commit**

```bash
git add components/attempts/TherapistLatestAttempts.tsx && git commit -m "feat: redesign therapist attempts list with severity-tinted cards"
```

---

### Task 5: Final validation

- [ ] **Step 1: Full lint pass**

```bash
npm run lint
```

Expected: all checks pass (eslint, prettier, type-check).

- [ ] **Step 2: Format**

```bash
npx prettier --write .
```

- [ ] **Step 3: Final commit if needed**

If prettier changed anything:

```bash
git add utils/ components/attempts/TherapistLatestAttempts.tsx && git commit -m "style: format"
```
