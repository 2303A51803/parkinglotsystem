/**
 * Minimal, dependency-free bar chart rendered as raw SVG.
 * data: [{ label, value }], color optional override.
 */
const BarChart = ({ data, color = 'var(--brand)', height = 140, formatValue = (v) => v }) => {
  if (!data || data.length === 0) {
    return <div className="empty-state">No data yet</div>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / data.length;

  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      {data.map((d, i) => {
        const barHeight = (d.value / max) * (height - 26);
        const x = i * barWidth + barWidth * 0.15;
        const w = barWidth * 0.7;
        const y = height - 20 - barHeight;
        return (
          <g key={d.label + i}>
            <rect x={x} y={y} width={w} height={Math.max(barHeight, 1)} fill={color} rx="1" />
            <text
              x={x + w / 2}
              y={height - 6}
              fontSize="3.6"
              textAnchor="middle"
              fill="var(--text-faint)"
              fontFamily="var(--font-mono)"
            >
              {d.label}
            </text>
            <text
              x={x + w / 2}
              y={Math.max(y - 3, 6)}
              fontSize="3.6"
              textAnchor="middle"
              fill="var(--text-muted)"
              fontFamily="var(--font-mono)"
            >
              {formatValue(d.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default BarChart;
