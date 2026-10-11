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

import type { ProjectEstimateResult } from '../../../estimation';

import styles from './CostLinesBarChart.module.css';

interface CostLinesBarChartProps {
  result: ProjectEstimateResult;
  maxBars?: number;
  className?: string;
}

const CATEGORY_COLORS = {
  personnel: 'var(--color-info)',
  tooling: 'var(--color-warning)',
  infrastructure: 'var(--color-success)',
  other: 'var(--color-danger)',
} as const;

type CategoryKey = keyof typeof CATEGORY_COLORS;

interface BarDataItem {
  name: string;
  value: number;
  category: CategoryKey;
  details: string;
  color: string;
  originalIndex: number;
}

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string; payload: BarDataItem }> }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const { value, color, payload: itemPayload } = payload[0];

  return (
    <div className={styles.tooltip} style={{ borderLeftColor: color }} role="tooltip">
      <div className={styles.tooltipHeader}>
        <span className={styles.tooltipColor} style={{ background: color }} aria-hidden="true" />
        <span className={styles.tooltipName}>{itemPayload.name}</span>
      </div>
      <div className={styles.tooltipDetail}>{itemPayload.details}</div>
      <div className={styles.tooltipValue}>
        <span className={styles.tooltipAmount}>{formatCurrency(value, 'INR')}</span>
        <span className={styles.tooltipCategory}>{itemPayload.category}</span>
      </div>
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
  payload?: { value: number; color: string; category: CategoryKey };
}) {
  const { x = 0, y = 0, width = 0, height = 0, radius = 0, fill = '' } = props;
  const isAnimated = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

export function CostLinesBarChart({ result, maxBars = 15, className = '' }: CostLinesBarChartProps) {
  const data = useMemo((): BarDataItem[] => {
    const items: BarDataItem[] = [];
    let index = 0;

    result.personnel.lines.forEach((line) => {
      if (line.cost > 0) {
        items.push({
          name: line.role,
          value: line.cost,
          category: 'personnel',
          details: `${line.people} people × ${line.hours}h × ${formatCurrency(line.hourlyRate, result.currency)}`,
          color: CATEGORY_COLORS.personnel,
          originalIndex: index++,
        });
      }
    });

    result.tooling.lines.forEach((line) => {
      if (line.cost > 0) {
        items.push({
          name: line.name,
          value: line.cost,
          category: 'tooling',
          details: 'One-off cost',
          color: CATEGORY_COLORS.tooling,
          originalIndex: index++,
        });
      }
    });

    result.infrastructure.lines.forEach((line) => {
      if (line.cost > 0) {
        items.push({
          name: line.name,
          value: line.cost,
          category: 'infrastructure',
          details: `${formatCurrency(line.monthlyCost, result.currency)}/month × ${line.months} months`,
          color: CATEGORY_COLORS.infrastructure,
          originalIndex: index++,
        });
      }
    });

    result.other.lines.forEach((line) => {
      if (line.cost > 0) {
        items.push({
          name: line.description,
          value: line.cost,
          category: 'other',
          details: 'One-off cost',
          color: CATEGORY_COLORS.other,
          originalIndex: index++,
        });
      }
    });

    return items
      .sort((a, b) => b.value - a.value)
      .slice(0, maxBars);
  }, [result, maxBars]);

  if (data.length === 0) {
    return (
      <div className={`${styles.container} ${className}`} role="img" aria-label="No cost lines to display">
        <div className={styles.emptyState}>
          <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h6M9 13h4M9 17h2" />
          </svg>
          <p className={styles.emptyText}>No cost lines to display</p>
          <p className={styles.emptySubtext}>Add personnel, tooling, infrastructure or other costs</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className={`${styles.container} ${className}`} role="img" aria-label={`Top ${data.length} cost lines by amount`}>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={Math.max(300, data.length * 50 + 80)}>
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
              domain={[0, maxValue * 1.15]}
              tickFormatter={(value) => formatCurrency(value, result.currency)}
              tick={{ fontSize: 11, fill: 'var(--color-ink-muted)', fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
              dy={-8}
              className={styles.xAxis}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={220}
              tick={{ fontSize: 12, fill: 'var(--color-ink)', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              tickMargin={12}
              className={styles.yAxis}
            />
            <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'none' }} />
            <Bar
              dataKey="value"
              name="Cost"
              radius={[0, 8, 8, 0]}
              maxBarSize={36}
              shape={<CustomBar />}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={data[index].color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.legend} aria-label="Cost categories">
        {Object.entries(CATEGORY_COLORS).map(([category, color]) => {
          const hasData = data.some((d) => d.category === category);
          if (!hasData) return null;
          const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
          return (
            <span key={category} className={styles.legendItem}>
              <span className={styles.legendColor} style={{ background: color }} aria-hidden="true" />
              <span className={styles.legendLabel}>{categoryLabel}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}