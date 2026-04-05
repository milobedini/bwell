# Five Areas Model: Node-Expand Modal Input

## Problem

The Five Areas Model edit flow places the text input below a large Skia diagram. On a physical device, the keyboard covers the input entirely — the diagram takes ~60% of screen height, leaving no room for input + keyboard.

## Solution

Replace the below-diagram input area with a full-screen modal that opens when a node is tapped. The node's label animates up from its position on the diagram to become the centred title of the modal, while the diagram fades out behind it. This gives the input the full screen height above the keyboard.

## Design

### Two states for edit mode

**State A — Diagram visible (no node selected):**
- Full diagram as it exists today
- Step indicator ("Step 1 of 6") below diagram
- Prompt text: "Tap a node to begin" (or "Tap a node to continue" if resuming)
- Completed nodes show teal fill/stroke as they do now
- Tapping any reachable node transitions to State B

**State B — Modal open (node selected):**
- Diagram fades to ~15% opacity or hides entirely
- Modal overlays the full screen content area (below the header)
- Layout top-to-bottom:
  1. **Title** — area label, centred, teal (gold for Reflection), large (`subtitle` type)
  2. **Step counter** — "1 of 6", centred, small, `darkGrey`
  3. **Hint** (collapsible) — prompt text in a pill, toggle via lightbulb icon. Auto-hidden when keyboard is open to save space
  4. **TextInput** — `flex-1`, multiline, `returnKeyType="done"`, `submitBehavior="blurAndSubmit"`, dismisses keyboard on Done
  5. **Button row** — Back (outline, hidden on step 1) + Next/Review (solid teal)
- Wrapped in `KeyboardAvoidingWrapper` so buttons stay above keyboard

### Animation

**Node tap → modal open:**
1. Capture the tapped node's screen position (from Skia node coordinates + canvas offset)
2. Animate the label text from the node position to the centred title position (translate + scale) using Reanimated shared value or Moti
3. Simultaneously fade the diagram to 0.15 opacity
4. Fade in the rest of the modal content (hint, input, buttons)
5. Auto-focus the TextInput after animation completes

**Next/Back within modal:**
- Cross-fade: current title/content fades out, new title/content fades in
- No return to diagram between steps — stays in modal

**Modal close (Review pressed on last step, or Back on step 1):**
- Reverse animation: title flies back to the node position, diagram fades back to full opacity
- Transition to review screen (existing flow) or back to diagram idle

**Simplified fallback:** If the shared-element animation proves too complex, a simpler approach works: fade diagram out, fade modal in with the title scaling from small to full size (no positional tracking needed). This still creates the visual connection without the complexity of tracking node screen positions.

### Keyboard handling

- `returnKeyType="done"` shows Done button on keyboard
- `submitBehavior="blurAndSubmit"` + `onSubmitEditing={Keyboard.dismiss}` dismisses keyboard on Done tap
- `KeyboardAvoidingWrapper` ensures buttons stay visible above keyboard
- Hint pill auto-collapses when keyboard opens (use `Keyboard.addListener` or `useKeyboardHandler`) to maximise input space

### Navigation

- **Next** — saves dirty fields, cross-fades to next area's modal content
- **Back** — saves dirty fields, cross-fades to previous area. On step 1, closes modal back to diagram
- **Tap node on diagram** — only available in State A (diagram visible). Same as current `goToStep` logic
- **Review** — on last step, saves and closes modal, transitions to existing review screen

### What stays the same

- `useFiveAreasState` hook — no changes to state logic
- Review mode / view mode — no changes
- `FiveAreasDiagram` component — no structural changes, just needs an opacity prop
- `AreaReviewCard` — no changes
- All save/submit/navigation logic in the hook

### Files to change

- **`FiveAreasPresenter.tsx`** — new two-state layout (diagram idle vs modal open), animation orchestration
- **`AreaStep.tsx` → refactor to `AreaInputModal.tsx`** — self-contained modal content: title, hint, input, buttons
- **`FiveAreasDiagram.tsx`** — accept `opacity` animated value prop for fade effect
- **`AreaStep.tsx`** — remove (functionality moves to `AreaInputModal`)

### Colour tokens

- Modal title: `Colors.sway.bright` (teal) for all areas except Reflection which uses `Colors.primary.info` (gold)
- Modal background: `Colors.sway.dark` (matches screen bg, modal feels like a natural extension)
- Input background: `Colors.chip.darkCard`
- Input border: `Colors.chip.darkCardAlt`
- Hint pill: `Colors.chip.pill`
- Buttons: existing `ThemedButton` variants (no new colours)
