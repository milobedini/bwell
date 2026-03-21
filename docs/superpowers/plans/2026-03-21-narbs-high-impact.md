# NARBS High-Impact Performance Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 5 high-impact performance fixes from the NARBS audit: lazy tabs, React.memo + useCallback on FlatList components, expo-image migration, and Hermes engine.

**Architecture:** Sequential commits on a single feature branch. Each task is independent and produces a working app. No new files created except one extracted component (`AssignmentListItemTherapist`).

**Tech Stack:** React Native, Expo Router, expo-image, react-native-reanimated

**Spec:** `docs/superpowers/specs/2026-03-21-narbs-high-impact-design.md`

---

## Task 1: Add lazy loading to tab navigator

**Files:**
- Modify: `app/(main)/(tabs)/_layout.tsx`

- [ ] **Step 1: Add `lazy` prop to `<Tabs>`**

In `app/(main)/(tabs)/_layout.tsx`, add `lazy={true}` as a prop on the `<Tabs>` component (currently around line 36):

```tsx
<Tabs
  lazy={true}
  screenOptions={{
```

This defers mounting of all non-initial tab screens until they are first focused.

- [ ] **Step 2: Verify the app starts on the home tab**

Run: `npx expo start` and confirm:
- Home tab loads immediately
- Other tabs show no content until tapped
- No errors in Metro console

- [ ] **Step 3: Run validation**

Run: `npm run lint`
Expected: All checks pass

- [ ] **Step 4: Commit**

```bash
git add app/\(main\)/\(tabs\)/_layout.tsx
git commit -m "perf: add lazy loading to tab navigator"
```

---

## Task 2: Add React.memo to UserListItem

**Files:**
- Modify: `components/admin/UserListItem.tsx`

- [ ] **Step 1: Import memo and wrap component**

In `components/admin/UserListItem.tsx`, add `memo` to imports and wrap the export:

```tsx
import { memo } from 'react';
```

Change the bottom of the file from:

```tsx
export default UserListItem;
```

to:

```tsx
export default memo(UserListItem);
```

- [ ] **Step 2: Run validation**

Run: `npm run lint`
Expected: All checks pass

---

## Task 3: Add React.memo to QuestionSlide

**Files:**
- Modify: `components/attempts/presenters/questionnaires/QuestionSlide.tsx`

- [ ] **Step 1: Import memo and wrap component**

In `components/attempts/presenters/questionnaires/QuestionSlide.tsx`, add `memo` to the existing React import (line 1 already imports `useMemo`):

```tsx
import { memo, useMemo } from 'react';
```

Change the bottom of the file from:

```tsx
export default QuestionSlide;
```

to:

```tsx
export default memo(QuestionSlide);
```

- [ ] **Step 2: Run validation**

Run: `npm run lint`
Expected: All checks pass

---

## Task 4: Extract ModuleListItem, add React.memo, and useCallback to ModulesList

**Files:**
- Modify: `components/module/ModulesList.tsx`

- [ ] **Step 1: Extract item component and wrap in memo**

In `components/module/ModulesList.tsx`, extract the inline `renderItem` content (lines 23-55) into a separate memoized component defined above `ModulesList`. The extracted component receives `item` and `programId` as props:

```tsx
import { memo, useCallback } from 'react';

// ... existing imports ...

interface ModuleListItemProps {
  item: AvailableModulesItem;
  programId: string;
}

const ModuleListItem = memo(({ item, programId }: ModuleListItemProps) => {
  const { module, meta } = item;
  return (
    <View key={module._id} className="gap-4 px-4">
      <View className="flex-row flex-wrap items-center gap-2">
        <ThemedText type="subtitle">{module.title}</ThemedText>
        <AssignmentStatusChip status={meta.assignmentStatus as AssignmentStatus} />
        {meta.dueAt && <DueChip dueAt={meta.dueAt} />}
      </View>
      <View className="gap-2">
        <ThemedText className="uppercase">Access Policy</ThemedText>
        <View className="flex-row flex-wrap gap-2">
          <AccessPolicyChip accessPolicy={module.accessPolicy as AccessPolicy} />
          <CanStartChip meta={meta} />
        </View>
      </View>
      <ThemedText>{module.description}</ThemedText>
      <ThemedText type="italic" className="capitalize">
        {module.type}
      </ThemedText>
      <Link
        asChild
        push
        href={{
          pathname: '/programs/[id]/modules/[moduleId]',
          params: { id: programId, moduleId: module._id, headerTitle: module.title }
        }}
      >
        <ThemedButton>Preview</ThemedButton>
      </Link>
    </View>
  );
});
```

Also extract the `ItemSeparatorComponent` to a stable const outside the component:

```tsx
const ModuleListSeparator = () => <Divider bold className="my-4" />;
```

- [ ] **Step 2: Replace inline renderItem with useCallback referencing the extracted component**

```tsx
const renderItem = useCallback(
  ({ item }: { item: AvailableModulesItem }) => (
    <ModuleListItem item={item} programId={programId as string} />
  ),
  [programId],
);

// In the FlatList:
<FlatList
  data={data}
  renderItem={renderItem}
  keyExtractor={(item) => item.module._id}
  ItemSeparatorComponent={ModuleListSeparator}
/>
```

- [ ] **Step 3: Run validation**

Run: `npm run lint`
Expected: All checks pass

---

## Task 5: Extract renderItem to useCallback in PatientAttempts

**Files:**
- Modify: `components/attempts/PatientAttempts.tsx`

- [ ] **Step 1: Wrap handleAttemptPress in useCallback**

`handleAttemptPress` (line 41) is currently a plain function. Wrap it:

```tsx
const handleAttemptPress = useCallback(
  (id: string, title: string) => {
    pushedChild.current = true;
    router.push({ pathname: '/attempts/[id]', params: { id, headerTitle: title } });
  },
  [router],
);
```

`useCallback` is already imported (line 1).

- [ ] **Step 2: Extract renderItem to useCallback**

Move the inline `renderItem` (lines 84-103) to a `const` above the JSX:

```tsx
const renderItem = useCallback(
  ({ item, index }: { item: any; index: number }) => {
    const bgColor = index % 2 === 0 ? '' : 'bg-sway-buttonBackground';
    return (
      <TouchableOpacity
        key={item._id}
        onPress={() => handleAttemptPress(item._id, item.module.title)}
        className={clsx('gap-1 p-4', bgColor)}
      >
        <ThemedText type="smallTitle">{item.module.title}</ThemedText>
        {!!item.totalScore && (
          <ThemedText>
            {item.totalScore} {item.scoreBandLabel}
          </ThemedText>
        )}
        <View className="flex-row items-center gap-4">
          <DateChip prefix={item.status} dateString={item.completedAt || item.lastInteractionAt || ''} />
        </View>
      </TouchableOpacity>
    );
  },
  [handleAttemptPress],
);
```

Then use `renderItem={renderItem}` on the FlatList.

- [ ] **Step 3: Run validation**

Run: `npm run lint`
Expected: All checks pass

---

## Task 6: Extract renderItem to useCallback in AssignmentsListPatient

**Files:**
- Modify: `components/assignments/AssignmentsListPatient.tsx`

- [ ] **Step 1: Extract renderItem to useCallback**

Move the inline `renderItem` (lines 47-119) to a `const` above the JSX. `useCallback` is already imported:

```tsx
const renderItem = useCallback(
  ({ item, index }: { item: MyAssignmentView; index: number }) => {
    const bgColor = index % 2 === 0 ? '' : 'bg-sway-buttonBackground';
    return (
      // ... existing renderItem JSX ...
    );
  },
  [completed, createAttemptFromAssignment],
);
```

Then use `renderItem={renderItem}` on the FlatList.

- [ ] **Step 2: Run validation**

Run: `npm run lint`
Expected: All checks pass

---

## Task 7: Extract AssignmentListItemTherapist and add useCallback in AssignmentsListTherapist

**Files:**
- Modify: `components/assignments/AssignmentsListTherapist.tsx`

- [ ] **Step 1: Extract a memoized item component**

The inline `renderItem` (lines 47-83) references `menuFor` state, which changes on every menu toggle. Extract a separate memoized component above `AssignmentsListTherapist`:

```tsx
interface AssignmentListItemTherapistProps {
  item: MyAssignmentView;
  index: number;
  menuVisible: boolean;
  onOpenMenu: (id: string) => void;
  onCloseMenu: () => void;
  onRemove: (id: string) => void;
}

const AssignmentListItemTherapist = memo(
  ({ item, index, menuVisible, onOpenMenu, onCloseMenu, onRemove }: AssignmentListItemTherapistProps) => {
    const bgColor = index % 2 === 0 ? '' : 'bg-sway-buttonBackground';
    return (
      // ... existing renderItem JSX, using props instead of closure variables ...
      // menuFor === item._id  →  menuVisible
      // setMenuFor(item._id)  →  onOpenMenu(item._id)
      // closeMenu()           →  onCloseMenu()
      // handleRemoveAssignment(item._id)  →  onRemove(item._id)
    );
  },
);
```

- [ ] **Step 2: Add onOpenMenu callback and replace FlatList renderItem**

```tsx
const openMenu = useCallback((id: string) => setMenuFor(id), []);

const renderItem = useCallback(
  ({ item, index }: { item: MyAssignmentView; index: number }) => (
    <AssignmentListItemTherapist
      item={item}
      index={index}
      menuVisible={menuFor === item._id}
      onOpenMenu={openMenu}
      onCloseMenu={closeMenu}
      onRemove={handleRemoveAssignment}
    />
  ),
  [menuFor, openMenu, closeMenu, handleRemoveAssignment],
);
```

Note: `menuFor` is in the dependency array so the correct `menuVisible` is passed, but the item component is memoized so only the item whose `menuVisible` changed will re-render.

- [ ] **Step 3: Run validation**

Run: `npm run lint`
Expected: All checks pass

---

## Task 8: Extract renderItem to useCallback in TherapistLatestAttempts

**Files:**
- Modify: `components/attempts/TherapistLatestAttempts.tsx`

- [ ] **Step 1: Import useCallback and extract renderItem**

Add `useCallback` to imports:

```tsx
import { useCallback } from 'react';
```

Move the inline `renderItem` (lines 28-59) to a `const`:

```tsx
const renderItem = useCallback(
  ({ item, index }: { item: any; index: number }) => {
    const bgColor = index % 2 === 0 ? '' : 'bg-sway-buttonBackground';
    return (
      <Link href={`/attempts/${item._id}?title=${encodeURIComponent(item.module.title)}`} asChild>
        {/* ... rest of existing JSX ... */}
      </Link>
    );
  },
  [],
);
```

Then use `renderItem={renderItem}` on the FlatList.

- [ ] **Step 2: Run validation**

Run: `npm run lint`
Expected: All checks pass

---

## Task 9: Commit React.memo + useCallback changes

- [ ] **Step 1: Format and commit**

```bash
npx prettier --write .
git add components/admin/UserListItem.tsx components/attempts/presenters/questionnaires/QuestionSlide.tsx components/module/ModulesList.tsx components/attempts/PatientAttempts.tsx components/assignments/AssignmentsListPatient.tsx components/assignments/AssignmentsListTherapist.tsx components/attempts/TherapistLatestAttempts.tsx
git commit -m "perf: add React.memo and useCallback to FlatList components"
```

---

## Task 10: Migrate Imagery.tsx to expo-image

**Files:**
- Modify: `components/brand/Imagery.tsx`

- [ ] **Step 1: Replace imports and update types**

Change:

```tsx
import { Image, type ImageProps } from 'react-native';
```

to:

```tsx
import { Image, type ImageProps } from 'expo-image';
```

- [ ] **Step 2: Remove direct width/height props, keep in style only**

`BWellIcon` and `BWellLogo` currently pass `width` and `height` as direct props on `Image`. expo-image does not accept these as top-level props. Remove them and ensure dimensions are in `style` only (they already have `style` with width/height, so just remove the duplicate top-level props).

- [ ] **Step 3: Run validation**

Run: `npm run lint`
Expected: All checks pass

---

## Task 11: Migrate LoginLogo.tsx to expo-image

**Files:**
- Modify: `components/sign-in/LoginLogo.tsx`

- [ ] **Step 1: Replace import**

Change:

```tsx
import { Image, View } from 'react-native';
```

to:

```tsx
import { View } from 'react-native';
import { Image } from 'expo-image';
```

- [ ] **Step 2: Move resizeMode from style to contentFit prop**

The current code has `resizeMode: 'cover'` inside the `style` object. Remove it from `style` and add `contentFit="cover"` as a prop on `Image`.

- [ ] **Step 3: Run validation**

Run: `npm run lint`
Expected: All checks pass

---

## Task 12: Migrate ready.tsx to expo-image

**Files:**
- Modify: `app/(welcome)/ready.tsx`

- [ ] **Step 1: Replace import**

Change:

```tsx
import { Image, StyleSheet } from 'react-native';
```

to:

```tsx
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';
```

- [ ] **Step 2: Move resizeMode from StyleSheet to contentFit prop**

Remove `resizeMode: 'contain'` from the `styles.logo` StyleSheet definition. Add `contentFit="contain"` as a prop on the `Image` component.

- [ ] **Step 3: Run validation**

Run: `npm run lint`
Expected: All checks pass

---

## Task 13: Migrate HomeScreen.tsx to expo-image

**Files:**
- Modify: `components/home/HomeScreen.tsx`

- [ ] **Step 1: Replace import**

Change:

```tsx
import { Image, useWindowDimensions, View } from 'react-native';
```

to:

```tsx
import { useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
```

- [ ] **Step 2: Ensure dimensions are in style**

The current `Image` (around line 50) uses `className` for dimensions via NativeWind. Verify it works with expo-image (expo-image supports `className` via NativeWind). If `resizeMode` is set anywhere, replace with `contentFit`.

- [ ] **Step 3: Run validation**

Run: `npm run lint`
Expected: All checks pass

---

## Task 14: Migrate ThemedButton.tsx to expo-image

**Files:**
- Modify: `components/ThemedButton.tsx`

- [ ] **Step 1: Replace import**

Change:

```tsx
import { Image, Pressable, PressableProps } from 'react-native';
```

to:

```tsx
import { Pressable, PressableProps } from 'react-native';
import { Image } from 'expo-image';
```

- [ ] **Step 2: Verify PrimaryButton Image renders correctly**

The `PrimaryButton` component uses `Image` with `className` for sizing. Verify expo-image renders the icon correctly with the existing className props.

- [ ] **Step 3: Run validation**

Run: `npm run lint`
Expected: All checks pass

---

## Task 15: Migrate Item.tsx (ImageBackground) to expo-image

**Files:**
- Modify: `components/welcome/Item.tsx`

- [ ] **Step 1: Replace import and type**

Change:

```tsx
import { ImageBackground, type ImageSourcePropType, useWindowDimensions } from 'react-native';
```

to:

```tsx
import { View, useWindowDimensions } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
```

Update the `item` prop type from `ImageSourcePropType` to `ImageSource`.

- [ ] **Step 2: Replace ImageBackground with Image + View overlay**

The current `ImageBackground` has no children — it renders only the background image. Replace with expo-image `Image`:

```tsx
export const Item = ({ item }: ItemProp) => {
  const { width, height } = useWindowDimensions();

  return (
    <View style={{ width, height, backgroundColor: Colors.primary.black }}>
      <Image
        source={item.image}
        style={{ flex: 1, opacity: 0.7 }}
        contentFit="cover"
      />
    </View>
  );
};
```

This preserves the `backgroundColor`, `opacity: 0.7`, and `contentFit="cover"` from the original `imageStyle`.

- [ ] **Step 3: Run validation**

Run: `npm run lint`
Expected: All checks pass

---

## Task 16: Migrate tab bar icons to expo-image

**Files:**
- Modify: `app/(main)/(tabs)/_layout.tsx`

- [ ] **Step 1: Replace Image import**

Change the `Image` import from `react-native` to `expo-image`:

```tsx
import { Image } from 'expo-image';
```

Keep other `react-native` imports (if any remain needed).

- [ ] **Step 2: Move width/height to style**

The tab bar icon `Image` (around lines 42-50) passes `width={size * 2}` and `height={size * 2}` as direct props. Move these to `style`:

```tsx
<Image
  source={focused ? icon : disabledIcon}
  style={{ width: size * 2, height: size * 2 }}
  contentFit="contain"
/>
```

- [ ] **Step 3: Run validation**

Run: `npm run lint`
Expected: All checks pass

---

## Task 17: Commit expo-image migration

- [ ] **Step 1: Format and commit**

```bash
npx prettier --write .
git add components/brand/Imagery.tsx components/sign-in/LoginLogo.tsx app/\(welcome\)/ready.tsx components/home/HomeScreen.tsx components/ThemedButton.tsx components/welcome/Item.tsx app/\(main\)/\(tabs\)/_layout.tsx
git commit -m "perf: migrate Image to expo-image"
```

---

## Task 18: Enable Hermes engine

**Files:**
- Modify: `app.config.js`

- [ ] **Step 1: Check if Hermes is already active**

In the running dev app, open the Metro console or run in the JS debugger:

```js
console.log('Hermes:', typeof HermesInternal !== 'undefined');
```

If Hermes is already active, this commit is for explicit documentation. If not, it enables a ~15-20% JS parsing speedup.

- [ ] **Step 2: Add jsEngine to config**

In `app.config.js`, add `jsEngine: 'hermes'` at the top level of the `expo` object (after `newArchEnabled`):

```js
newArchEnabled: true,
jsEngine: 'hermes',
```

- [ ] **Step 3: Run validation**

Run: `npm run lint`
Expected: All checks pass

- [ ] **Step 4: Format and commit**

```bash
npx prettier --write .
git add app.config.js
git commit -m "perf: enable Hermes engine"
```

- [ ] **Step 5: Smoke test**

Manually test: auth flow, questionnaire pager, activity diary, tab navigation. Watch for `Date`/`Intl` issues.
