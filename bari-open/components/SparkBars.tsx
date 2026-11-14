type Point = { date: string; value: number };

export function SparkBars({ series, maxBars = 30 }: { series: Point[]; maxBars?: number }) {
  const slice = series.slice(-maxBars);
  const max = Math.max(...slice.map((p) => p.value), 1);

  return (
    <div className="chart" role="img" aria-label="Grafico dei flussi giornalieri">
      <div className="chart-bars">
        {slice.map((p) => (
          <span
            key={p.date}
            title={`${p.date}: ${p.value}`}
            style={{ height: `${Math.max(4, (p.value / max) * 100)}%` }}
          />
        ))}
      </div>
    </div>
  );
}
