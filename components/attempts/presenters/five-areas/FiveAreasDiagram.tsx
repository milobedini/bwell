import { Fragment, memo, useCallback, useMemo } from 'react';
import { Pressable, useWindowDimensions } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Canvas, Circle, Line, Text, useFont, vec } from '@shopify/react-native-skia';

import { AREA_KEYS, type AreaKey } from './useFiveAreasState';

// Short labels for the diagram nodes (full labels overflow the circles)
const DIAGRAM_LABELS: Record<AreaKey, string> = {
  situation: 'Situation',
  thoughts: 'Thoughts',
  emotions: 'Emotions',
  physical: 'Physical',
  behaviours: 'Behaviours',
  reflection: 'Reflection'
};

type FiveAreasDiagramProps = {
  currentStep: number;
  completedSteps: Set<AreaKey>;
  onNodePress?: (step: number) => void;
  snippets?: Partial<Record<AreaKey, string>>;
  mode: 'edit' | 'view';
};

/* ── viewbox & sizing ── */

const VB_W = 320;
const VB_H = 290;
const MAX_CANVAS_W = 420;
const CANVAS_H_PAD = 32; // horizontal padding subtracted from screen width

/* ── node layout (viewbox coordinates) ── */

const CORE_RADIUS = 32;
const REFLECT_RADIUS = 28;

const NODES: { x: number; y: number; r: number }[] = [
  { x: 160, y: 36, r: CORE_RADIUS }, // 0 — situation
  { x: 75, y: 115, r: CORE_RADIUS }, // 1 — thoughts
  { x: 245, y: 115, r: CORE_RADIUS }, // 2 — emotions
  { x: 75, y: 205, r: CORE_RADIUS }, // 3 — physical
  { x: 245, y: 205, r: CORE_RADIUS }, // 4 — behaviours
  { x: 160, y: 260, r: REFLECT_RADIUS } // 5 — reflection
];

// Centre of the four core nodes (used for vertical arrow lines)
const BUN_CENTRE_X = 160;
const BUN_CENTRE_Y = 160;

// Edges between core bun nodes (indices 1-4)
const BUN_EDGES: [number, number][] = [
  [1, 2],
  [1, 3],
  [2, 4],
  [3, 4], // square
  [1, 4],
  [2, 3] // diagonals (cross)
];

/* ── touch ── */

const HIT_RADIUS_EXTRA = 12; // extra px around node for touch target

/* ── stroke widths (viewbox) ── */

const LINE_WIDTH = 1.5;
const STROKE_DEFAULT = 2;
const STROKE_CURRENT = 3;

/* ── font sizes (viewbox, scaled at render) ── */

const FONT_BOLD_SIZE = 10;
const FONT_REGULAR_SIZE = 8;
const SNIPPET_MAX_CHARS = 8;

/* ── text offsets (viewbox, scaled at render) ── */

const LABEL_Y_OFFSET = FONT_BOLD_SIZE / 3; // vertical centering for label-only
const LABEL_Y_SNIPPET_NUDGE = -1; // shift label up when snippet is shown
const SECONDARY_TEXT_GAP = 10; // gap below label for checkmark/snippet

/* ── colours ── */

const COL_TEAL = Colors.sway.bright;
const COL_GREY = Colors.chip.dotInactive;
const COL_LIGHT = Colors.sway.lightGrey;

const getNodeFill = (state: 'locked' | 'current' | 'completed') => {
  if (state === 'current') return Colors.tint.tealBorder;
  if (state === 'completed') return Colors.tint.teal;
  return 'transparent';
};

const getNodeStroke = (state: 'locked' | 'current' | 'completed') => (state === 'locked' ? COL_GREY : COL_TEAL);

const getTextColor = (state: 'locked' | 'current' | 'completed') => {
  if (state === 'completed') return COL_TEAL;
  if (state === 'current') return COL_LIGHT;
  return COL_GREY;
};

// Clip a line so it starts/ends at circle edges instead of centers
const clipLine = (ax: number, ay: number, ar: number, bx: number, by: number, br: number) => {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return { x1: ax, y1: ay, x2: bx, y2: by };
  const ux = dx / dist;
  const uy = dy / dist;
  return {
    x1: ax + ux * ar,
    y1: ay + uy * ar,
    x2: bx - ux * br,
    y2: by - uy * br
  };
};

const FiveAreasDiagram = memo(({ currentStep, completedSteps, onNodePress, snippets, mode }: FiveAreasDiagramProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const canvasWidth = Math.min(screenWidth - CANVAS_H_PAD, MAX_CANVAS_W);
  const scale = canvasWidth / VB_W;
  const canvasHeight = VB_H * scale;

  const boldFont = useFont(require('@/assets/fonts/Lato-Bold.ttf'), FONT_BOLD_SIZE * scale);
  const regularFont = useFont(require('@/assets/fonts/Lato-Regular.ttf'), FONT_REGULAR_SIZE * scale);

  const nodeState = (index: number): 'locked' | 'current' | 'completed' => {
    if (mode === 'view') return 'completed';
    if (completedSteps.has(AREA_KEYS[index])) return 'completed';
    if (index === currentStep) return 'current';
    return 'locked';
  };

  const handlePress = useCallback(
    (e: { nativeEvent: { locationX: number; locationY: number } }) => {
      if (!onNodePress) return;
      const tx = e.nativeEvent.locationX;
      const ty = e.nativeEvent.locationY;

      for (const [i, node] of NODES.entries()) {
        const nx = node.x * scale;
        const ny = node.y * scale;
        const hitR = (node.r + HIT_RADIUS_EXTRA) * scale;
        const dx = tx - nx;
        const dy = ty - ny;
        if (dx * dx + dy * dy <= hitR * hitR) {
          onNodePress(i);
          return;
        }
      }
    },
    [onNodePress, scale]
  );

  // Pre-compute scaled node positions
  const scaled = useMemo(() => NODES.map((n) => ({ x: n.x * scale, y: n.y * scale, r: n.r * scale })), [scale]);

  // Centre of bun area (scaled)
  const bunCentre = useMemo(() => ({ x: BUN_CENTRE_X * scale, y: BUN_CENTRE_Y * scale }), [scale]);

  // Half the vertical gap between bun centre and the nearest core node row
  const arrowGap = useMemo(() => ((NODES[3].y - NODES[1].y) / 2 - CORE_RADIUS) * scale, [scale]);

  const labelWidths = useMemo(() => {
    if (!boldFont) return null;
    return Object.fromEntries(AREA_KEYS.map((key) => [key, boldFont.measureText(DIAGRAM_LABELS[key]).width]));
  }, [boldFont]);

  if (!boldFont || !labelWidths) return null;

  return (
    <Pressable onPressIn={handlePress}>
      <Canvas style={{ width: canvasWidth, height: canvasHeight }} pointerEvents="none">
        {/* ── arrow: situation → bun centre ── */}
        <Line
          p1={vec(scaled[0].x, scaled[0].y + scaled[0].r)}
          p2={vec(bunCentre.x, bunCentre.y - arrowGap)}
          color={COL_GREY}
          strokeWidth={LINE_WIDTH * scale}
          style="stroke"
        />

        {/* ── arrow: bun centre → reflection ── */}
        <Line
          p1={vec(bunCentre.x, bunCentre.y + arrowGap)}
          p2={vec(scaled[5].x, scaled[5].y - scaled[5].r)}
          color={COL_GREY}
          strokeWidth={LINE_WIDTH * scale}
          style="stroke"
        />

        {/* ── bun connection lines (clipped to circle edges) ── */}
        {BUN_EDGES.map(([a, b]) => {
          const bothDone = completedSteps.has(AREA_KEYS[a]) && completedSteps.has(AREA_KEYS[b]);
          const lineColor = mode === 'view' || bothDone ? COL_TEAL : COL_GREY;
          const cl = clipLine(scaled[a].x, scaled[a].y, scaled[a].r, scaled[b].x, scaled[b].y, scaled[b].r);
          return (
            <Line
              key={`${a}-${b}`}
              p1={vec(cl.x1, cl.y1)}
              p2={vec(cl.x2, cl.y2)}
              color={lineColor}
              strokeWidth={LINE_WIDTH * scale}
              style="stroke"
            />
          );
        })}

        {/* ── node fills ── */}
        {NODES.map((_, i) => {
          const state = nodeState(i);
          const { x, y, r } = scaled[i];
          return <Circle key={`fill-${i}`} cx={x} cy={y} r={r} color={getNodeFill(state)} />;
        })}

        {/* ── node strokes ── */}
        {NODES.map((_, i) => {
          const state = nodeState(i);
          const { x, y, r } = scaled[i];
          const strokeW = (state === 'current' ? STROKE_CURRENT : STROKE_DEFAULT) * scale;
          return (
            <Circle
              key={`stroke-${i}`}
              cx={x}
              cy={y}
              r={r}
              color={getNodeStroke(state)}
              strokeWidth={strokeW}
              style="stroke"
            />
          );
        })}

        {/* ── text labels, checkmarks, and snippets ── */}
        {NODES.map((_, i) => {
          const state = nodeState(i);
          const { x, y } = scaled[i];
          const key = AREA_KEYS[i];
          const label = DIAGRAM_LABELS[key];
          const color = getTextColor(state);

          const labelX = x - labelWidths[key] / 2;
          const hasSnippet = !!snippets?.[key];
          const labelY = hasSnippet ? y + LABEL_Y_SNIPPET_NUDGE * scale : y + LABEL_Y_OFFSET * scale;

          const snippet = snippets?.[key];
          const showSnippet = snippet && regularFont;
          const truncated =
            snippet && snippet.length > SNIPPET_MAX_CHARS ? `${snippet.slice(0, SNIPPET_MAX_CHARS)}…` : snippet;

          return (
            <Fragment key={`text-${i}`}>
              <Text x={labelX} y={labelY} text={label} font={boldFont} color={color} />
              {showSnippet && truncated && (
                <Text
                  x={x - regularFont.measureText(truncated).width / 2}
                  y={labelY + SECONDARY_TEXT_GAP * scale}
                  text={truncated}
                  font={regularFont}
                  color={color}
                />
              )}
            </Fragment>
          );
        })}
      </Canvas>
    </Pressable>
  );
});

FiveAreasDiagram.displayName = 'FiveAreasDiagram';

export default FiveAreasDiagram;
