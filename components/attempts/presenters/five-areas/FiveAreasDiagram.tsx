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

/* ── layout constants (320×280 viewbox) ── */

const VB_W = 320;
const VB_H = 280;

const NODES: { x: number; y: number; r: number }[] = [
  { x: 160, y: 34, r: 32 }, // 0 — situation
  { x: 75, y: 110, r: 32 }, // 1 — thoughts
  { x: 245, y: 110, r: 32 }, // 2 — emotions
  { x: 75, y: 200, r: 32 }, // 3 — physical
  { x: 245, y: 200, r: 32 }, // 4 — behaviours
  { x: 160, y: 255, r: 24 } // 5 — reflection
];

// Edges between core bun nodes (indices 1-4)
const BUN_EDGES: [number, number][] = [
  [1, 2],
  [1, 3],
  [2, 4],
  [3, 4], // square
  [1, 4],
  [2, 3] // diagonals (cross)
];

/* ── colours ── */

const COL_TEAL = Colors.sway.bright;
const COL_GREY = Colors.chip.dotInactive;
const COL_LIGHT = Colors.sway.lightGrey;

const getNodeFill = (state: 'locked' | 'current' | 'completed') => {
  if (state === 'current') return Colors.tint.tealBorder; // rgba(24,205,186,0.3)
  if (state === 'completed') return Colors.tint.teal; // rgba(24,205,186,0.15)
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
  const canvasWidth = Math.min(screenWidth - 32, 420);
  const scale = canvasWidth / VB_W;
  const canvasHeight = VB_H * scale;

  const boldFont = useFont(require('@/assets/fonts/Lato-Bold.ttf'), 10 * scale);
  const regularFont = useFont(require('@/assets/fonts/Lato-Regular.ttf'), 8 * scale);

  const nodeState = useCallback(
    (index: number): 'locked' | 'current' | 'completed' => {
      if (mode === 'view') return 'completed';
      if (completedSteps.has(AREA_KEYS[index])) return 'completed';
      if (index === currentStep) return 'current';
      return 'locked';
    },
    [mode, completedSteps, currentStep]
  );

  const handlePress = useCallback(
    (e: { nativeEvent: { locationX: number; locationY: number } }) => {
      if (!onNodePress) return;
      const tx = e.nativeEvent.locationX;
      const ty = e.nativeEvent.locationY;

      for (const [i, node] of NODES.entries()) {
        const nx = node.x * scale;
        const ny = node.y * scale;
        const hitR = (node.r + 12) * scale;
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

  // Centre of bun area (average of core nodes 1-4)
  const bunCentre = useMemo(() => ({ x: 160 * scale, y: 155 * scale }), [scale]);

  if (!boldFont) return null;

  return (
    <Pressable onPressIn={handlePress}>
      <Canvas style={{ width: canvasWidth, height: canvasHeight }} pointerEvents="none">
        {/* ── arrow: situation → bun centre ── */}
        <Line
          p1={vec(scaled[0].x, scaled[0].y + scaled[0].r)}
          p2={vec(bunCentre.x, bunCentre.y - 30 * scale)}
          color={COL_GREY}
          strokeWidth={1.5 * scale}
          style="stroke"
        />

        {/* ── arrow: bun centre → reflection ── */}
        <Line
          p1={vec(bunCentre.x, bunCentre.y + 30 * scale)}
          p2={vec(scaled[5].x, scaled[5].y - scaled[5].r)}
          color={COL_GREY}
          strokeWidth={1.5 * scale}
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
              strokeWidth={1.5 * scale}
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

        {/* ── node strokes (drawn on top of fills) ── */}
        {NODES.map((_, i) => {
          const state = nodeState(i);
          const { x, y, r } = scaled[i];
          const strokeW = state === 'current' ? 3 * scale : 2 * scale;
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

          const labelWidth = boldFont.measureText(label).width;
          const labelX = x - labelWidth / 2;
          const hasSnippet = !!snippets?.[key];
          const labelY = hasSnippet ? y - 1 * scale : y + (10 * scale) / 3;

          const isCompleted = state === 'completed';
          const snippet = snippets?.[key];
          const showSnippet = snippet && regularFont;
          const showCheck = isCompleted && !snippet;
          const truncated = snippet && snippet.length > 8 ? `${snippet.slice(0, 8)}…` : snippet;

          return (
            <Fragment key={`text-${i}`}>
              <Text x={labelX} y={labelY} text={label} font={boldFont} color={color} />
              {showCheck && (
                <Text
                  x={x - boldFont.measureText('✓').width / 2}
                  y={labelY + 10 * scale}
                  text="✓"
                  font={boldFont}
                  color={COL_TEAL}
                />
              )}
              {showSnippet && truncated && (
                <Text
                  x={x - regularFont.measureText(truncated).width / 2}
                  y={labelY + 10 * scale}
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
