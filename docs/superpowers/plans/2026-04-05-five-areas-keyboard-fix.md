# Five Areas Model: Node-Expand Modal Input — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the below-diagram input area with a full-screen animated modal that opens when a node is tapped, giving the text input the full screen height above the keyboard.

**Architecture:** The edit mode becomes two states: (A) diagram visible with a "tap to begin" prompt, and (B) a modal overlay with the area title, hint, input, and nav buttons. Tapping a node triggers a Moti fade animation from state A to B. Navigation between areas cross-fades within the modal. The `useFiveAreasState` hook is unchanged — all changes are in the presentation layer.

**Tech Stack:** React Native, Moti (AnimatePresence/MotiView), KeyboardAvoidingWrapper, Skia canvas (existing diagram)

**Spec:** `docs/superpowers/specs/2026-04-05-five-areas-keyboard-fix-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `components/attempts/presenters/five-areas/FiveAreasPresenter.tsx` | Modify | Orchestrate two-state edit mode (diagram idle vs modal open) |
| `components/attempts/presenters/five-areas/AreaInputModal.tsx` | Create | Self-contained modal content: animated title, hint, input, nav buttons |
| `components/attempts/presenters/five-areas/AreaStep.tsx` | Delete | Replaced by AreaInputModal |
| `components/attempts/presenters/five-areas/FiveAreasDiagram.tsx` | Modify | Accept `dimmed` prop to reduce opacity |
| `components/attempts/presenters/five-areas/useFiveAreasState.ts` | Modify | Add `modalOpen` state + `openModal`/`closeModal` methods |

---

### Task 1: Add `modalOpen` state to the hook

**Files:**
- Modify: `components/attempts/presenters/five-areas/useFiveAreasState.ts`

- [ ] **Step 1: Add `modalOpen` state and handlers**

Add a `modalOpen` boolean to track whether the input modal is visible. Add `openModal` (called when a node is tapped in edit mode) and `closeModal` (called when Back is pressed on step 1).

In `useFiveAreasState.ts`, add after `const [showReview, setShowReview] = useState(false);` (line 48):

```ts
const [modalOpen, setModalOpen] = useState(false);
```

Add `openModal` callback after the existing `goToStep` callback (after line 141):

```ts
const openModal = useCallback(
  (step: number) => {
    if (step < 0 || step >= AREA_KEYS.length) return;
    if (step > highestStep && step !== currentStep) return;

    Haptics.selectionAsync().catch(() => {});
    saveDirtyAndThen(() => {
      setCurrentStep(step);
      setShowReview(false);
      setModalOpen(true);
    });
  },
  [highestStep, currentStep, saveDirtyAndThen]
);

const closeModal = useCallback(() => {
  saveDirtyAndThen(() => setModalOpen(false));
}, [saveDirtyAndThen]);
```

Update `goBack` to close the modal when on step 1 instead of doing nothing:

Replace the existing `goBack` (lines 123-126):

```ts
const goBack = useCallback(() => {
  if (currentStep <= 0) {
    saveDirtyAndThen(() => setModalOpen(false));
    return;
  }
  saveDirtyAndThen(() => setCurrentStep((s) => s - 1));
}, [currentStep, saveDirtyAndThen]);
```

Update `goForward` to close modal when entering review:

Replace the existing `goForward` (lines 111-121):

```ts
const goForward = useCallback(() => {
  if (currentStep >= AREA_KEYS.length - 1) {
    saveDirtyAndThen(() => {
      setModalOpen(false);
      setShowReview(true);
    });
    return;
  }
  saveDirtyAndThen(() => {
    const next = currentStep + 1;
    setCurrentStep(next);
    setHighestStep((h) => Math.max(h, next));
  });
}, [currentStep, saveDirtyAndThen]);
```

Add `modalOpen`, `openModal`, and `closeModal` to the return object:

```ts
return {
  fields,
  currentStep,
  currentKey,
  showReview,
  modalOpen,
  highestStep,
  completedSteps,
  canEdit,
  isSaving,
  isSubmitting,
  updateField,
  goForward,
  goBack,
  goToStep,
  openModal,
  closeModal,
  handleSubmit
};
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit --incremental 2>&1 | head -20`
Expected: No errors (AreaStep.tsx still compiles, new exports are unused but valid)

- [ ] **Step 3: Commit**

```bash
git add components/attempts/presenters/five-areas/useFiveAreasState.ts
git commit -m "feat(five-areas): add modalOpen state and open/close handlers to hook"
```

---

### Task 2: Add `dimmed` prop to FiveAreasDiagram

**Files:**
- Modify: `components/attempts/presenters/five-areas/FiveAreasDiagram.tsx`

- [ ] **Step 1: Add `dimmed` prop**

Add `dimmed?: boolean` to the `FiveAreasDiagramProps` type (line 18-24):

```ts
type FiveAreasDiagramProps = {
  currentStep: number;
  completedSteps: Set<AreaKey>;
  onNodePress?: (step: number) => void;
  snippets?: Partial<Record<AreaKey, string>>;
  mode: 'edit' | 'view';
  dimmed?: boolean;
};
```

Update the component signature to destructure `dimmed` (line 119):

```ts
const FiveAreasDiagram = memo(({ currentStep, completedSteps, onNodePress, snippets, mode, dimmed }: FiveAreasDiagramProps) => {
```

Wrap the returned `Pressable` in a `View` with animated opacity. Add `import { View } from 'react-native';` to the existing `react-native` import (line 2):

```ts
import { Pressable, useWindowDimensions, View } from 'react-native';
```

Replace the return block (lines 172-268) — wrap in a View with opacity:

```tsx
return (
  <View style={{ opacity: dimmed ? 0.15 : 1 }}>
    <Pressable onPressIn={dimmed ? undefined : handlePress}>
      <Canvas style={{ width: canvasWidth, height: canvasHeight }} pointerEvents="none">
        {/* ... all existing canvas children unchanged ... */}
      </Canvas>
    </Pressable>
  </View>
);
```

Key changes: `opacity: dimmed ? 0.15 : 1` on the wrapper, and `dimmed ? undefined : handlePress` to disable touch when dimmed.

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit --incremental 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/attempts/presenters/five-areas/FiveAreasDiagram.tsx
git commit -m "feat(five-areas): add dimmed prop to FiveAreasDiagram"
```

---

### Task 3: Create AreaInputModal component

**Files:**
- Create: `components/attempts/presenters/five-areas/AreaInputModal.tsx`

- [ ] **Step 1: Create the AreaInputModal component**

This is the self-contained modal that shows the area title, collapsible hint, text input, and Back/Next buttons. It uses `KeyboardAvoidingWrapper` to stay above the keyboard.

Create `components/attempts/presenters/five-areas/AreaInputModal.tsx`:

```tsx
import { useCallback, useEffect, useRef } from 'react';
import { Keyboard, Pressable, TextInput, View } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import KeyboardAvoidingWrapper from '@/components/ui/KeyboardAvoidingWrapper';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import useToggle from '@/hooks/useToggle';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import { AREA_HINTS, AREA_KEYS, AREA_LABELS, type AreaKey } from './useFiveAreasState';

type AreaInputModalProps = {
  areaKey: AreaKey;
  currentStep: number;
  value: string;
  onChangeText: (text: string) => void;
  onNext: () => void;
  onBack: () => void;
  isSaving: boolean;
};

const AreaInputModal = ({
  areaKey,
  currentStep,
  value,
  onChangeText,
  onNext,
  onBack,
  isSaving
}: AreaInputModalProps) => {
  const [hintVisible, toggleHint] = useToggle(true);
  const inputRef = useRef<TextInput>(null);
  const isReflection = areaKey === 'reflection';
  const accentColor = isReflection ? Colors.primary.info : Colors.sway.bright;
  const isLastStep = currentStep === AREA_KEYS.length - 1;

  // Auto-focus input when area changes
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, [areaKey]);

  // Hide hint when keyboard opens to save space
  const [, , setHintVisible] = useToggle(true);
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setHintVisible(false));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setHintVisible(true));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [setHintVisible]);

  const handleSubmitEditing = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <KeyboardAvoidingWrapper>
      <View className="flex-1 px-4">
        {/* Title */}
        <AnimatePresence exitBeforeEnter>
          <MotiView
            key={areaKey}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -10 }}
            transition={{ type: 'timing', duration: 250 }}
          >
            <View className="items-center pb-1 pt-3">
              <ThemedText type="subtitle" style={{ color: accentColor }}>
                {AREA_LABELS[areaKey]}
              </ThemedText>
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 2 }}>
                {currentStep + 1} of {AREA_KEYS.length}
              </ThemedText>
            </View>
          </MotiView>
        </AnimatePresence>

        {/* Hint */}
        {hintVisible && (
          <Pressable onPress={toggleHint} className="mb-2 mt-2 flex-row items-center rounded-lg px-3 py-2" style={{ backgroundColor: Colors.chip.pill }}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={16} color={Colors.sway.darkGrey} />
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginLeft: 6, flex: 1 }}>
              {AREA_HINTS[areaKey]}
            </ThemedText>
          </Pressable>
        )}

        {/* Input */}
        <AnimatePresence exitBeforeEnter>
          <MotiView
            key={areaKey}
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'timing', duration: 200 }}
            style={{ flex: 1 }}
          >
            <TextInput
              ref={inputRef}
              className="flex-1 rounded-xl p-4"
              style={{
                backgroundColor: Colors.chip.darkCard,
                color: Colors.sway.lightGrey,
                fontFamily: Fonts.Regular,
                fontSize: 18,
                textAlignVertical: 'top',
                borderWidth: 1,
                borderColor: Colors.chip.darkCardAlt
              }}
              value={value}
              onChangeText={onChangeText}
              placeholder={AREA_HINTS[areaKey]}
              placeholderTextColor={Colors.sway.darkGrey}
              multiline
              scrollEnabled
              returnKeyType="done"
              submitBehavior="blurAndSubmit"
              onSubmitEditing={handleSubmitEditing}
            />
          </MotiView>
        </AnimatePresence>

        {/* Navigation buttons */}
        <View className="flex-row gap-3 pb-4 pt-3">
          <ThemedButton
            className="flex-1"
            variant="outline"
            title="Back"
            onPress={onBack}
            disabled={isSaving}
          />
          <ThemedButton
            className="flex-1"
            title={isLastStep ? 'Review' : 'Next'}
            onPress={onNext}
            disabled={isSaving || !value.trim()}
          />
        </View>
      </View>
    </KeyboardAvoidingWrapper>
  );
};

export default AreaInputModal;
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit --incremental 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/attempts/presenters/five-areas/AreaInputModal.tsx
git commit -m "feat(five-areas): create AreaInputModal component"
```

---

### Task 4: Rewrite FiveAreasPresenter edit mode

**Files:**
- Modify: `components/attempts/presenters/five-areas/FiveAreasPresenter.tsx`
- Delete: `components/attempts/presenters/five-areas/AreaStep.tsx`

- [ ] **Step 1: Rewrite the edit mode section of FiveAreasPresenter**

Replace the entire `FiveAreasPresenter.tsx` file. The review/view mode is unchanged. The edit mode now has two states: diagram idle (with prompt) and modal open (AreaInputModal overlay).

```tsx
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';
import ContentContainer from '@/components/ContentContainer';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import type { AttemptDetailResponseItem } from '@milobedini/shared-types';

import AreaInputModal from './AreaInputModal';
import AreaReviewCard from './AreaReviewCard';
import FiveAreasDiagram from './FiveAreasDiagram';
import { AREA_KEYS, AREA_LABELS, type AreaKey, useFiveAreasState } from './useFiveAreasState';

type FiveAreasPresenterProps = {
  attempt: AttemptDetailResponseItem;
  mode: 'view' | 'edit';
  patientName?: string;
};

const FiveAreasPresenter = ({ attempt, mode, patientName }: FiveAreasPresenterProps) => {
  const state = useFiveAreasState({ attempt, mode });
  const [tooltipKey, setTooltipKey] = useState<AreaKey | null>(null);

  const handleNodePress = useCallback(
    (step: number) => {
      if (state.canEdit) {
        state.openModal(step);
        return;
      }
      const key = AREA_KEYS[step];
      setTooltipKey((prev) => (prev === key ? null : key));
    },
    [state]
  );

  const dismissTooltip = useCallback(() => setTooltipKey(null), []);

  // ── Review mode (patient post-submit or therapist reviewing) ──
  if (!state.canEdit || state.showReview) {
    return (
      <ContentContainer>
        {/* In-progress indicator for therapist */}
        {mode === 'view' && attempt.status !== 'submitted' && (
          <View
            className="mb-4 rounded-lg p-3"
            style={{
              backgroundColor: Colors.tint.info,
              borderColor: Colors.primary.info,
              borderWidth: 1
            }}
          >
            <ThemedText type="small" style={{ color: Colors.primary.info }}>
              This entry is still in progress.
            </ThemedText>
          </View>
        )}

        {/* Diagram with snippets */}
        <FiveAreasDiagram
          currentStep={state.currentStep}
          completedSteps={state.completedSteps}
          snippets={state.fields}
          mode="view"
          onNodePress={handleNodePress}
        />

        {/* Tooltip overlay — covers entire screen so taps outside dismiss */}
        {tooltipKey && (
          <Pressable onPress={dismissTooltip} className="absolute inset-0 z-10 items-center justify-center">
            <View
              className="mx-6 rounded-xl p-4"
              style={{
                backgroundColor: Colors.chip.darkCard,
                borderWidth: 1,
                borderColor: Colors.sway.bright,
                maxWidth: 300
              }}
            >
              <ThemedText type="smallBold" style={{ color: Colors.sway.bright, marginBottom: 6 }}>
                {AREA_LABELS[tooltipKey]}
              </ThemedText>
              <ThemedText>{state.fields[tooltipKey] || '—'}</ThemedText>
            </View>
          </Pressable>
        )}

        {/* Full text cards */}
        <ScrollView className="mt-4" contentContainerStyle={{ paddingBottom: 40 }}>
          {AREA_KEYS.map((key) => (
            <AreaReviewCard key={key} areaKey={key} value={state.fields[key] ?? ''} />
          ))}

          {/* User note */}
          {attempt.userNote && (
            <View className="mt-2">
              <ThemedText type="smallBold" style={{ marginBottom: 6 }}>
                {patientName ? `${patientName}'s Note` : 'Personal Note'}
              </ThemedText>
              <View className="rounded-xl p-4" style={{ backgroundColor: Colors.chip.darkCard }}>
                <ThemedText>{attempt.userNote}</ThemedText>
              </View>
            </View>
          )}

          {/* Submit button (only in review-before-submit) */}
          {state.canEdit && state.showReview && (
            <View className="mt-6">
              <ThemedButton
                title={state.isSubmitting ? 'Submitting...' : 'Submit'}
                onPress={state.handleSubmit}
                disabled={state.isSubmitting}
              />
            </View>
          )}
        </ScrollView>
      </ContentContainer>
    );
  }

  // ── Edit mode (two-state: diagram idle vs modal open) ──
  return (
    <ContentContainer padded={false}>
      <View className="flex-1">
        {/* Diagram — always rendered, dimmed when modal is open */}
        <View className="px-4 pt-2">
          <FiveAreasDiagram
            currentStep={state.currentStep}
            completedSteps={state.completedSteps}
            onNodePress={handleNodePress}
            mode="edit"
            dimmed={state.modalOpen}
          />
        </View>

        {/* Idle state: step indicator + prompt */}
        {!state.modalOpen && (
          <View className="items-center px-4 pt-2">
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey, textAlign: 'center' }}>
              Step {state.currentStep + 1} of {AREA_KEYS.length}
            </ThemedText>
            <ThemedText
              type="small"
              style={{ color: Colors.sway.darkGrey, textAlign: 'center', marginTop: 8 }}
            >
              Tap a node to {state.highestStep > 0 || state.fields[AREA_KEYS[0]]?.trim() ? 'continue' : 'begin'}
            </ThemedText>
          </View>
        )}

        {/* Modal overlay */}
        <AnimatePresence>
          {state.modalOpen && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'timing', duration: 250 }}
              className="absolute inset-0 bg-sway-dark"
            >
              <AreaInputModal
                areaKey={state.currentKey}
                currentStep={state.currentStep}
                value={state.fields[state.currentKey] ?? ''}
                onChangeText={(text) => state.updateField(state.currentKey, text)}
                onNext={state.goForward}
                onBack={state.goBack}
                isSaving={state.isSaving}
              />
            </MotiView>
          )}
        </AnimatePresence>
      </View>
    </ContentContainer>
  );
};

export default FiveAreasPresenter;
```

- [ ] **Step 2: Delete AreaStep.tsx**

```bash
rm components/attempts/presenters/five-areas/AreaStep.tsx
```

- [ ] **Step 3: Run lint and type check**

Run: `npx eslint --fix . && npx prettier --write . && npm run lint 2>&1 | tail -20`
Expected: All checks pass

- [ ] **Step 4: Commit**

```bash
git add components/attempts/presenters/five-areas/FiveAreasPresenter.tsx components/attempts/presenters/five-areas/useFiveAreasState.ts
git add -u components/attempts/presenters/five-areas/AreaStep.tsx
git commit -m "feat(five-areas): replace stepped input with node-expand modal"
```

---

### Task 5: Manual device testing and polish

**Files:**
- Possibly modify: any of the above files for adjustments

- [ ] **Step 1: Start the dev server and test on iOS simulator**

Run: `npx expo start`

Test the following scenarios:
1. Navigate to a Five Areas module in edit mode
2. Verify the diagram is visible with "Tap a node to begin" prompt
3. Tap the Situation node — modal should fade in over the diagram
4. Verify keyboard opens and input is fully visible above keyboard
5. Type text, press Done — keyboard dismisses, input stays
6. Press Next — content cross-fades to Thoughts
7. Press Back on step 1 — modal closes, diagram reappears
8. Press Review on last step — modal closes, review screen shows
9. Test tapping different nodes from the diagram idle state
10. Test resuming an in-progress attempt (fields pre-populated)

- [ ] **Step 2: Fix any visual issues found during testing**

Common adjustments that may be needed:
- `keyboardVerticalOffset` on KeyboardAvoidingWrapper may need tuning
- Animation timing may need adjustment
- The `absolute inset-0` modal may need explicit top offset if header overlaps

- [ ] **Step 3: Run full validation**

Run: `npx eslint --fix . && npx prettier --write . && npm run lint`
Expected: All checks pass

- [ ] **Step 4: Commit any polish fixes**

```bash
git add -A
git commit -m "fix(five-areas): polish modal layout and keyboard handling"
```

---

### Task 6: Clean up hint visibility logic in AreaInputModal

The current Task 3 implementation has a bug: it creates two `useToggle` hooks for hint visibility. This task fixes it to use a single state with keyboard-driven auto-hide.

**Files:**
- Modify: `components/attempts/presenters/five-areas/AreaInputModal.tsx`

- [ ] **Step 1: Fix the hint visibility state**

Replace the two separate `useToggle` calls with a single `useState` and keyboard listeners:

At the top of the component, replace:

```ts
const [hintVisible, toggleHint] = useToggle(true);
```

and the second `useToggle` block with:

```ts
const [hintManuallyHidden, , setHintManuallyHidden] = useToggle(false);
const [keyboardOpen, setKeyboardOpen] = useState(false);

useEffect(() => {
  const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
  const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
  return () => {
    showSub.remove();
    hideSub.remove();
  };
}, []);

const hintVisible = !hintManuallyHidden && !keyboardOpen;
const toggleHint = useCallback(() => setHintManuallyHidden((prev) => !prev), [setHintManuallyHidden]);
```

Add `useState` to the react import:

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
```

- [ ] **Step 2: Run validation**

Run: `npx eslint --fix . && npx prettier --write . && npm run lint 2>&1 | tail -20`
Expected: All checks pass

- [ ] **Step 3: Commit**

```bash
git add components/attempts/presenters/five-areas/AreaInputModal.tsx
git commit -m "fix(five-areas): consolidate hint visibility state in AreaInputModal"
```
