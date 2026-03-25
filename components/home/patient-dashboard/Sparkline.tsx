import { memo, useMemo } from 'react';
import { Colors } from '@/constants/Colors';
import { Canvas, PaintStyle, Path, Skia, StrokeCap, StrokeJoin } from '@shopify/react-native-skia';

type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
};

const PADDING = 2;

const Sparkline = memo(({ data, width = 48, height = 22, color = Colors.primary.success }: SparklineProps) => {
  const { path, paint } = useMemo(() => {
    if (data.length < 2) return { path: null, paint: null };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const drawWidth = width - PADDING * 2;
    const drawHeight = height - PADDING * 2;

    const p = Skia.Path.Make();
    for (const [i, val] of data.entries()) {
      const x = PADDING + (i / (data.length - 1)) * drawWidth;
      const y = PADDING + ((val - min) / range) * drawHeight;
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }

    const pt = Skia.Paint();
    pt.setColor(Skia.Color(color));
    pt.setStrokeWidth(2);
    pt.setStyle(PaintStyle.Stroke);
    pt.setStrokeCap(StrokeCap.Round);
    pt.setStrokeJoin(StrokeJoin.Round);
    pt.setAntiAlias(true);

    return { path: p, paint: pt };
  }, [data, color, width, height]);

  if (!path || !paint) return null;

  return (
    <Canvas style={{ width, height }}>
      <Path path={path} paint={paint} />
    </Canvas>
  );
});

Sparkline.displayName = 'Sparkline';

export default Sparkline;
