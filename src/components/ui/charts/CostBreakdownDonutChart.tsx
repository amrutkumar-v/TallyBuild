import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useMemo } from 'react';

import type { ProjectEstimateResult } from '../../../estimation';

import styles from './CostBreakdownDonutChart.module.css';

interface CostBreakdownDonutChartProps {
  result: ProjectEstimateResult;
  className?: string;
}

const CATEGORY_CONFIG = {
  personnel: {
    label: 'Personnel',
    color: 'var(--color-accent)',
  },
  tooling: {
    label: 'Tooling',
    color: 'var(--color-info)',
  },
  infrastructure: {
    label: 'Infrastructure',
    color: 'var(--color-success)',
  },
  other: {
    label: 'Other',
    color: 'var(--color-warning)',
  },
} as const;

type CategoryKey = keyof typeof CATEGORY_CONFIG;

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string; payload: { category: CategoryKey; value: number; total: number } }> }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const { value, color, payload: itemPayload } = payload[0];
  const config = CATEGORY_CONFIG[itemPayload.category];
  const percentage = itemPayload.total > 0 ? ((itemPayload.value / itemPayload.total) * 100) : 0;

  return (
    <div className={styles.tooltip} style={{ borderColor: color }} role="tooltip">
      <div className={styles.tooltipHeader}>
        <span className={styles.tooltipColor} style={{ background: color }} aria-hidden="true" />
        <span className={styles.tooltipLabel}>{config.label}</span>
      </div>
      <div className={styles.tooltipBody}>
        <span className={styles.tooltipValue}>{formatCurrency(value, 'INR')}</span>
        <span className={styles.tooltipPercent}>({percentage.toFixed(1)}%)</span>
      </div>
    </div>
  );
}

export function CostBreakdownDonutChart({ result, className = '' }: CostBreakdownDonutChartProps) {
  const data = useMemo(() => {
    const sections: Array<{ category: CategoryKey; value: number; label: string; color: string; total: number }> = [];

    if (result.personnelCost > 0) {
      sections.push({
        category: 'personnel',
        value: result.personnelCost,
        label: CATEGORY_CONFIG.personnel.label,
        color: CATEGORY_CONFIG.personnel.color,
        total: result.total,
      });
    }
    if (result.toolingCost > 0) {
      sections.push({
        category: 'tooling',
        value: result.toolingCost,
        label: CATEGORY_CONFIG.tooling.label,
        color: CATEGORY_CONFIG.tooling.color,
        total: result.total,
      });
    }
    if (result.infrastructureCost > 0) {
      sections.push({
        category: 'infrastructure',
        value: result.infrastructureCost,
        label: CATEGORY_CONFIG.infrastructure.label,
        color: CATEGORY_CONFIG.infrastructure.color,
        total: result.total,
      });
    }
    if (result.otherCost > 0) {
      sections.push({
        category: 'other',
        value: result.otherCost,
        label: CATEGORY_CONFIG.other.label,
        color: CATEGORY_CONFIG.other.color,
        total: result.total,
      });
    }

    return sections;
  }, [result]);

  const total = result.total;

  if (data.length === 0 || total === 0) {
    return (
      <div className={`${styles.container} ${className}`} role="img" aria-label="No cost data available">
        <div className={styles.emptyState}>
          <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <p className={styles.emptyText}>No cost breakdown available</p>
          <p className={styles.emptySubtext}>Add cost lines to see the breakdown</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`} role="img" aria-label={`Cost breakdown: ${data.map(d => `${d.label} ${formatCurrency(d.value, result.currency)}`).join(', ')}`}>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <defs>
              <filter id="donut-shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.3" />
              </filter>
            </defs>
            <Tooltip
              content={<CustomTooltip />}
              wrapperStyle={{ pointerEvents: 'none' }}
            />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={90}
              outerRadius={120}
              startAngle={90}
              endAngle={450}
              strokeWidth={0}
              isAnimationActive={typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry) => (
                <Cell key={`cell-${entry.category}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
          <div className={styles.centerContent} aria-hidden="true">
            <p className={styles.totalLabel}>Estimated total</p>
            <p className={styles.totalValue}>{formatCurrency(total, result.currency)}</p>
            <p className={styles.totalMeta}>{result.lineCount} {result.lineCount === 1 ? 'cost line' : 'cost lines'}</p>
          </div>
        </ResponsiveContainer>
      </div>

      <LegendWrapper data={data} currency={result.currency} />
    </div>
  );
}

function LegendWrapper({ data, currency }: { data: Array<{ category: CategoryKey; value: number; label: string; color: string }>; currency: string }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className={styles.legendWrapper} aria-label="Cost breakdown legend">
      {data.map((entry) => (
        <div key={entry.category} className={styles.legendItem}>
          <span className={styles.legendColor} style={{ background: entry.color }} aria-hidden="true" />
          <span className={styles.legendLabel}>{entry.label}</span>
          <span className={styles.legendValue}>{formatCurrency(entry.value, currency)}</span>
          <span className={styles.legendPercent}>
            {total > 0 ? `${((entry.value / total) * 100).toFixed(1)}%` : '0%'}
          </span>
        </div>
      ))}
    </div>
  );
}