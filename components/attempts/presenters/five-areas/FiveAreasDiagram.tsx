import { Fragment, memo, useCallback, useMemo } from 'react';
import { Pressable, useWindowDimensions } from 'react-native';
import { Canvas, Circle, Line, Text, useFont, vec } from '@shopify/react-native-skia';

import { AREA_KEYS, AREA_LABELS, type AreaKey } from './useFiveAreasState';

type FiveAreasDiagramProps = {
  currentStep: number;
  completedSteps: Set<AreaKey>;
  onNodePress?: (step: number) => void;
  snippets?: Partial<Record<AreaKey, string>>;
  mode: 'edit' | 'view';
};

/* ── layout constants (300×240 viewbox) ── */

const NODES: { x: number; y: number; r: number }[] = [
  { x: 150, y: 28, r: 24 }, // 0 — situation
  { x: 80, y: 90, r: 24 }, // 1 — thoughts
  { x: 220, y: 90, r: 24 }, // 2 — emotions
  { x: 80, y: 170, r: 24 }, // 3 — physical
  { x: 220, y: 170, r: 24 }, // 4 — behaviours
  { x: 150, y: 215, r: 18 } // 5 — reflection
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

const COL_TEAL = '#18cdba';
const COL_GREY = '#3A496B';
const COL_LIGHT = '#e0e9f3';

const getNodeFill = (state: 'locked' | 'current' | 'completed') => {
  if (state === 'current') return 'rgba(24,205,186,0.3)';
  if (state === 'completed') return 'rgba(24,205,186,0.15)';
  return 'transparent';
};

const getNodeStroke = (state: 'locked' | 'current' | 'completed') => (state === 'locked' ? COL_GREY : COL_TEAL);

const getTextColor = (state: 'locked' | 'current' | 'completed') => {
  if (state === 'completed') return COL_TEAL;
  if (state === 'current') return COL_LIGHT;
  return COL_GREY;
};

const FiveAreasDiagram = memo(({ currentStep, completedSteps, onNodePress, snippets, mode }: FiveAreasDiagramProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const canvasWidth = Math.min(screenWidth - 32, 400);
  const scale = canvasWidth / 300;
  const canvasHeight = 240 * scale;

  const boldFont = useFont(require('@/assets/fonts/Lato-Bold.ttf'), 9 * scale);
  const regularFont = useFont(require('@/assets/fonts/Lato-Regular.ttf'), 7 * scale);

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

  // Centre of bun area (average of nodes 1-4)
  const bunCentre = useMemo(() => ({ x: 150 * scale, y: 130 * scale }), [scale]);

  if (!boldFont) return null;

  return (
    <Pressable onPress={handlePress}>
      <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
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

        {/* ── bun connection lines ── */}
        {BUN_EDGES.map(([a, b]) => {
          const bothDone = completedSteps.has(AREA_KEYS[a]) && completedSteps.has(AREA_KEYS[b]);
          const lineColor = mode === 'view' || bothDone ? COL_TEAL : COL_GREY;
          return (
            <Line
              key={`${a}-${b}`}
              p1={vec(scaled[a].x, scaled[a].y)}
              p2={vec(scaled[b].x, scaled[b].y)}
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
          const label = AREA_LABELS[key];
          const color = getTextColor(state);

          const labelWidth = boldFont.measureText(label).width;
          const labelX = x - labelWidth / 2;
          const labelY = y + (9 * scale) / 3;

          const isCompleted = state === 'completed';
          const snippet = snippets?.[key];
          const showSnippet = snippet && regularFont;
          const showCheck = isCompleted && !snippet;
          const truncated = snippet && snippet.length > 12 ? `${snippet.slice(0, 12)}…` : snippet;

          return (
            <Fragment key={`text-${i}`}>
              <Text x={labelX} y={labelY} text={label} font={boldFont} color={color} />
              {showCheck && (
                <Text
                  x={x - boldFont.measureText('✓').width / 2}
                  y={labelY + 9 * scale}
                  text="✓"
                  font={boldFont}
                  color={COL_TEAL}
                />
              )}
              {showSnippet && truncated && (
                <Text
                  x={x - regularFont.measureText(truncated).width / 2}
                  y={labelY + 8 * scale}
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
