# Figma Design System Rules — bwell

Rules for translating Figma designs into production-ready code for the bwell Expo React Native app.

## Figma MCP Integration Flow

**Follow this order for every Figma implementation task:**

1. Run `get_design_context` with the target nodeId and fileKey
2. If the response is truncated or too large, run `get_metadata` first, then re-fetch specific nodes
3. Run `get_screenshot` for a visual reference of the node being implemented
4. Only after both design context and screenshot are available, download any assets and begin implementation
5. Translate the output (React + Tailwind) into this project's conventions (Expo, NativeWind, react-native-paper)
6. Validate against the Figma screenshot for 1:1 visual parity before marking complete

## Component Organization

- IMPORTANT: Reusable UI primitives go in `components/ui/`
- Feature-specific components go in `components/<feature>/` (e.g., `components/diary/`, `components/admin/`)
- Module presenters go in `components/attempts/presenters/`
- Shared layout wrappers: `Container` (headerless screens), `ContentContainer` (screens with visible header)
- Always check for existing components before creating new ones — reuse `ThemedText`, `ThemedButton`, `StatusChip`, `EmptyState`, `IconButton`, `Collapsible`, `SelectField`, `ActionMenu`, `Chip`, `DueDateField`, `RecurrenceField`, `SearchPickerDialog`, `KeyboardAvoidingWrapper`

## Color Tokens

- IMPORTANT: Never hardcode hex values — always use `Colors` from `@/constants/Colors`
- In NativeWind className strings, use the Tailwind color tokens from `tailwind.config.js` (e.g., `bg-sway-dark`, `text-sway-lightGrey`, `bg-chip-darkCard`)

**Semantic color mapping:**

| Purpose | Token | Value |
|---------|-------|-------|
| Background | `Colors.sway.dark` / `bg-sway-dark` | `#0c1527` |
| Primary text | `Colors.sway.lightGrey` / `text-sway-lightGrey` | `#e0e9f3` |
| Secondary text | `Colors.sway.darkGrey` / `text-sway-darkGrey` | `#a6adbb` |
| Primary action (teal) | `Colors.sway.bright` / `bg-sway-bright` | `#18cdba` |
| Button background | `Colors.sway.buttonBackgroundSolid` / `bg-sway-buttonBackgroundSolid` | `rgb(43,59,91)` |
| Error/destructive | `Colors.primary.error` / `bg-error` | `#FF6D5E` |
| Success | `Colors.primary.success` | `#76AB70` |
| Warning | `Colors.primary.warning` | `#FFB300` |
| Info | `Colors.primary.info` | `#FFD15D` |
| Card background | `Colors.chip.darkCard` / `bg-chip-darkCard` | `#262E42` |
| Card alt background | `Colors.chip.darkCardAlt` / `bg-chip-darkCardAlt` | `#334368` |
| Card deep background | `Colors.chip.darkCardDeep` / `bg-chip-darkCardDeep` | `#0B1A2A` |
| Overlay | `Colors.overlay.medium` | `rgba(0,0,0,0.5)` |
| Overlay light | `Colors.overlay.light` | `rgba(0,0,0,0.32)` |
| Tint teal | `Colors.tint.teal` | `rgba(24,205,186,0.15)` |
| Tint error | `Colors.tint.error` | `rgba(255,109,94,0.15)` |
| Tint info | `Colors.tint.info` | `rgba(255,209,93,0.15)` |

**Status chip color pairs** (background + border):

| Status | Background | Border |
|--------|-----------|--------|
| Info | `chip.infoBlue` | `chip.infoBlueBorder` |
| Active/teal | `chip.teal` | `chip.tealBorder` |
| Warning/amber | `chip.amber` | `chip.amberBorder` |
| Error/red | `chip.red` | `chip.redBorder` |
| Success/green | `chip.green` | `chip.greenBorder` |
| Neutral | `chip.neutral` | `chip.neutralBorder` |

## Typography

- IMPORTANT: Use `<ThemedText type="...">` for all text — do not create custom text styles
- Font family: **Lato** (loaded in `FontsContainer`)
- Toast text uses **SpaceGrotesk** (separate from body text)

| Type | Font | Size (all platforms) | Use for |
|------|------|---------------------|---------|
| `title` | Lato-Bold | 32 (web: 36) | Page headings |
| `subtitle` | Lato-Black | 24 (web: 28) | Section headings |
| `smallTitle` | Lato-Black | 20 (web: 22) | Card/subsection headings |
| `button` | Lato-Bold | 20 (web: 22) | Button labels |
| `default` | Lato-Regular | 18 | Body text |
| `small` | Lato-Regular | 14 | Secondary/caption text |
| `smallBold` | Lato-Bold | 14 | Emphasized small text |
| `link` | Lato-Regular (uppercase) | 13 (web: 14) | Navigation links |
| `italic` | Lato-Italic | 18 | Emphasized body |
| `error` | Lato-Italic (error color) | 14 (web: 16) | Error messages |
| `profileButtonText` | Lato-Bold | 20 | Profile/settings buttons |

- IMPORTANT: Do NOT use `ThemedText`'s `onLight` prop inside Paper dialogs — dialogs are dark-themed

## Styling Approach

- Use NativeWind (`className`) for layout and styling — prefer it over `StyleSheet`
- Use `clsx` for conditional className merging
- Use `useWindowDimensions()` hook — never static `Dimensions.get()`
- The app is **dark-themed only** — no light theme variant

## Paper Theme

- Global theme: `MD3DarkTheme` with custom color overrides
- Dialog backgrounds: `Colors.chip.darkCard` (`surfaceContainerHigh`)
- When adding `TextInput` inside Paper dialogs: set `style={{ backgroundColor: Colors.chip.darkCard }}`
- Primary color: teal (`Colors.sway.bright`)
- Text on surface: `Colors.sway.lightGrey`

## Icon System

- IMPORTANT: Do NOT install new icon packages — use the existing libraries
- Primary: `@react-native-vector-icons/material-design-icons` (MaterialCommunityIcons)
- Secondary: `@react-native-vector-icons/material-icons` (MaterialIcons)
- Also available: `@react-native-vector-icons/ionicons`, `@react-native-vector-icons/ant-design`
- Cross-platform wrapper: `IconSymbol` from `@/components/ui/IconSymbol` (SF Symbols on iOS, Material Icons fallback)
- Common sizes: 14, 18, 20, 24, 40

## Layout Patterns

- Screens use `Container` (headerless) or `ContentContainer` (with header/tabs)
- Both default to `flex-1 bg-sway-dark`
- `ContentContainer` applies `px-4` by default
- Filter drawers: slide-in from right using `Animated.View` + `useWindowDimensions()`, width ~75%
- Collapsible sections: use `<Collapsible title="...">` component

## Apple Human Interface Guidelines

When translating Figma designs to code, apply these HIG principles:

- **Safe areas:** Always respect device safe areas (notch, home indicator, status bar) — use `SafeAreaView` or expo-router's built-in safe area handling. Never place interactive elements in inset zones.
- **Touch targets:** All tappable elements must be at least 44x44pt. When Figma designs show smaller hit areas, expand the touchable zone with padding while keeping the visual size.
- **Navigation:** Use platform-native patterns — tab bars for top-level sections, stack/push for drill-down, bottom sheets for contextual actions, modals for focused tasks. Avoid custom navigation paradigms unless the Figma design explicitly calls for them.
- **Gestures:** Support standard iOS gestures — swipe-back for navigation, pull-to-refresh on scrollable lists, swipe-to-delete for row actions. Implement via `react-native-gesture-handler` / Reanimated.
- **Feedback:** Every interactive element needs visible press feedback. Use haptics (`expo-haptics`) for meaningful moments (submit success, error, toggle changes) — not for every tap.
- **Modals:** Prefer half-sheet / bottom sheet presentation over full-screen modals for lightweight tasks (consistent with existing `@gorhom/bottom-sheet` usage).
- **Destructive actions:** Always require confirmation. Use `ActionMenu` with `variant: 'destructive'` or an alert dialog. Red-tint the destructive option.
- **Accessibility:** Support Dynamic Type scaling where feasible. Respect `reduceMotion` (skip decorative animations) and `reduceTransparency` settings. Ensure sufficient colour contrast (4.5:1 minimum for text).
- **Content focus:** Minimise chrome — let content breathe. Avoid heavy borders, excessive dividers, or cluttered toolbars. When in doubt, favour whitespace over decoration.
- **Platform controls:** Use native-feeling controls (switches, segmented controls, date pickers) rather than custom equivalents unless the design explicitly requires a custom treatment.

## Button Hierarchy

- Primary action: `ThemedButton` with `variant="default"` (teal bg)
- Destructive: `ThemedButton` with `variant="error"` (red bg)
- Disabled: automatically uses `bg-sway-darkGrey`
- Contextual actions: use `ActionMenu` bottom sheet for list item actions (replaced FabGroup)

## Spacing

- Use Tailwind default spacing scale via NativeWind
- Common patterns: `gap-2`, `gap-4`, `px-4`, `py-3`, `p-4`, `p-8`
- No custom spacing tokens — stick to the Tailwind defaults

## Asset Handling

- IMPORTANT: If the Figma MCP server returns a localhost source for an image or SVG, use that source directly
- IMPORTANT: DO NOT add new icon packages — use existing vector icon libraries
- Store downloaded image assets in `assets/images/`
- Lottie animations go in `assets/lotties/`
- Import with path alias: `@/assets/images/...`, `@/assets/lotties/...`

## Import Conventions

- Use path alias `@/*` for all imports (maps to project root)
- Example: `import { Colors } from '@/constants/Colors'`
- Example: `import { ThemedText } from '@/components/ThemedText'`

## Project-Specific Conventions

- State: Zustand for client/auth state, TanStack React Query for server state
- Forms: Formik + Yup validation
- API: Axios with cookie-based auth (`withCredentials: true`)
- Types: shared types from `@milobedini/shared-types` npm package
- Animations: prefer Moti / Reanimated for gesture-driven, Lottie for decorative
- Dev logging: wrap in `if (__DEV__)`
- Infinite scroll: `useInfiniteQuery` with `keepPreviousData`, flatten via `data.pages.flatMap(p => p.items)`
- Empty states: guard with `!isFetching && items.length === 0`
