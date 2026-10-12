import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useMemo } from 'react';

import type { Estimate } from '../../../types';
import type { CurrencyCode } from '../../../estimation/currencies';
import { formatCurrency } from '../../../utils/format';

import styles from './ComparisonBarChart.module.css';

interface ComparisonBarChartProps {
  estimates: Estimate[];
  className?: string;
}

interface BarDataItem {
  name: string;
  estimated: number | null;
  actual: number | null;
  currency: string;
  id: string;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number | null; name: string; dataKey: string; payload: BarDataItem; color: string }> }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const item = payload[0];
  const data = item.payload;

  return (
    <div className={styles.tooltip} role="tooltip">
      <div className={styles.tooltipHeader}>
        <span className={styles.tooltipName}>{data.name}</span>
      </div>
      {data.estimated !== null && (
        <div className={styles.tooltipRow}>
          <span className={styles.tooltipLabel}>Estimated</span>
          <span className={styles.tooltipValue}>{formatCurrency(data.estimated, data.currency as CurrencyCode)}</span>
        </div>
      )}
      {data.actual !== null && (
        <div className={styles.tooltipRow}>
          <span className={styles.tooltipLabel}>Actual</span>
          <span className={styles.tooltipValue}>{formatCurrency(data.actual, data.currency as CurrencyCode)}</span>
        </div>
      )}
      {data.estimated === null && data.actual === null && (
        <div className={styles.tooltipRow}>
          <span className={styles.tooltipValue} style={{ color: 'var(--color-ink-muted)' }}>No cost data</span>
        </div>
      )}
    </div>
  );
}

function CustomBar(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  fill?: string;
  payload?: { value: number | null; isEstimated: boolean };
}) {
  const { x = 0, y = 0, width = 0, height = 0, radius = 0, fill = '' } = props;
  const isAnimated = typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (width <= 0 || height <= 0) {
    return null;
  }

  const clampedRadius = Math.min(radius, height / 2, width / 2);

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={clampedRadius}
      ry={clampedRadius}
      fill={fill}
      className={styles.bar}
      style={{
        transition: isAnimated ? 'filter var(--transition-fast), transform var(--transition-fast)' : 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))';
        e.currentTarget.style.transform = 'translateX(4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = 'none';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    />
  );
}

export function ComparisonBarChart({ estimates, className = '' }: ComparisonBarChartProps) {
  const data = useMemo((): BarDataItem[] => {
    return estimates
      .filter((e) => e.estimatedAmount !== null || e.actualAmount !== null)
      .map((e) => ({
        name: e.projectName.length > 30 ? `${e.projectName.slice(0, 27)}…` : e.projectName,
        estimated: e.estimatedAmount,
        actual: e.actualAmount,
        currency: e.currency,
        id: e.id,
      }))
      .sort((a, b) => {
        const aVal = a.estimated ?? a.actual ?? 0;
        const bVal = b.estimated ?? b.actual ?? 0;
        return bVal - aVal;
      });
  }, [estimates]);

  const maxValue = useMemo(() => {
    const values = data.flatMap((d) => [d.estimated, d.actual].filter((v): v is number => v !== null));
    return values.length > 0 ? Math.max(...values) : 0;
  }, [data]);

  if (data.length === 0) {
    return (
      <div className={`${styles.container} ${className}`} role="img" aria-label="No estimates with cost data to compare">
        <div className={styles.emptyState}>
          <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M18 20V10M12 20V4M6 20V16" />
            <path d="M2 20h20" />
          </svg>
          <p className={styles.emptyText}>No estimates to compare</p>
          <p className={styles.emptySubtext}>Select estimates with calculated totals</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`} role="img" aria-label={`Comparing ${data.length} estimates by total cost`}>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={Math.max(300, data.length * 70 + 100)}>
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="var(--color-border)"
              vertical={true}
              horizontal={false}
              className={styles.grid}
            />
            <XAxis
              type="number"
              domain={[0, maxValue > 0 ? maxValue * 1.2 : 100000]}
              tickFormatter={(value) => formatCurrency(value, 'INR' as CurrencyCode)}
              tick={{ fontSize: 11, fill: 'var(--color-ink-muted)', fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
              dy={-8}
              className={styles.xAxis}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={240}
              tick={{ fontSize: 12, fill: 'var(--color-ink)', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              tickMargin={12}
              className={styles.yAxis}
            />
            <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'none' }} />
            <Bar
              dataKey="estimated"
              name="Estimated"
              radius={[0, 8, 8, 0]}
              maxBarSize={28}
              stackId="a"
              shape={<CustomBar />}
            >
              {data.map((_, index) => (
                <Cell key={`est-cell-${index}`} fill="var(--color-accent)" />
              ))}
            </Bar>
            <Bar
              dataKey="actual"
              name="Actual"
              radius={[0, 8, 8, 0]}
              maxBarSize={28}
              stackId="a"
              shape={<CustomBar />}
            >
              {data.map((_, index) => (
                <Cell key={`act-cell-${index}`} fill="var(--color-success)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.legend} aria-label="Chart legend">
        <span className={styles.legendItem}>
          <span className={styles.legendColor} style={{ background: 'var(--color-accent)' }} aria-hidden="true" />
          <span className={styles.legendLabel}>Estimated</span>
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendColor} style={{ background: 'var(--color-success)' }} aria-hidden="true" />
          <span className={styles.legendLabel}>Actual</span>
        </span>
      </div>
    </div>
  );
}