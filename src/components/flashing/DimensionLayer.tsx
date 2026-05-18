import type { DimensionAnnotation } from "@/geometry/dimensionEngine";

type DimensionLayerProps = {
  dimensions: DimensionAnnotation[];
};

function arrowHead(x: number, y: number, angle: number) {
  const size = 6;
  const a1 = angle + Math.PI * 0.82;
  const a2 = angle - Math.PI * 0.82;
  return (
    <>
      <line
        x1={x}
        y1={y}
        x2={x + Math.cos(a1) * size}
        y2={y + Math.sin(a1) * size}
        stroke="#6b7280"
        strokeWidth={1}
      />
      <line
        x1={x}
        y1={y}
        x2={x + Math.cos(a2) * size}
        y2={y + Math.sin(a2) * size}
        stroke="#6b7280"
        strokeWidth={1}
      />
    </>
  );
}

export default function DimensionLayer({ dimensions }: DimensionLayerProps) {
  return (
    <g className="dimension-layer" aria-hidden>
      {dimensions.map((dim) => {
        const angle = Math.atan2(dim.y2 - dim.y1, dim.x2 - dim.x1);
        return (
          <g key={dim.id}>
            <line x1={dim.x1} y1={dim.y1} x2={dim.x2} y2={dim.y2} stroke="#9ca3af" strokeWidth={1} />
            {arrowHead(dim.x1, dim.y1, angle + Math.PI)}
            {arrowHead(dim.x2, dim.y2, angle)}
            <text
              x={dim.labelX}
              y={dim.labelY}
              textAnchor="middle"
              fontSize={14}
              fill="#374151"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {dim.text}
            </text>
          </g>
        );
      })}
    </g>
  );
}
