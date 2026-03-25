import { memo } from 'react';
import { Colors } from '@/constants/Colors';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';

type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
};

const Sparkline = memo(({ data, width = 48, height = 22, color = Colors.primary.success }: SparklineProps) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;

  const path = Skia.Path.Make();
  data.forEach((val, i) => {
    const x = padding + (i / (data.length - 1)) * drawWidth;
    const y = padding + ((val - min) / range) * drawHeight;
    if (i === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  });

  const paint = Skia.Paint();
  paint.setColor(Skia.Color(color));
  paint.setStrokeWidth(2);
  paint.setStyle(1); // Stroke
  paint.setStrokeCap(1); // Round
  paint.setStrokeJoin(1); // Round
  paint.setAntiAlias(true);

  return (
    <Canvas style={{ width, height }}>
      <Path path={path} paint={paint} />
    </Canvas>
  );
});

Sparkline.displayName = 'Sparkline';

export default Sparkline;
