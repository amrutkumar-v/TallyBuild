import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useMemo } from 'react';

import type { Estimate } from '../../../types';
import { formatCurrency } from '../../../utils/format';

import styles from './WhatIfScenarioChart.module.css';

interface WhatIfScenarioChartProps {
  baselineEstimate: Estimate | null;
  scenarios: Array<{
    id: string;
    label: string;
    total: number | null;
    color: string;
  }>;
  className?: string;
}

interface ChartDataPoint {
  name: string;
  baseline: number;
  [key: string]: string | number;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string; dataKey: string; color: string; payload: ChartDataPoint }> }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const item = payload[0];
  const data = item.payload;

  return (
    <div className={styles.tooltip} style={{ borderLeftColor: item.color }} role="tooltip">
      <div className={styles.tooltipHeader}>{item.name}</div>
      {Object.entries(data).map(([key, value]) => {
        if (key === 'name') return null;
        const label = key === 'baseline' ? 'Baseline' : key;
        return (
          <div key={key} className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>{label}</span>
            <span className={styles.tooltipValue}>{formatCurrency(value as number, 'INR')}</span>
          </div>
        );
      })}
    </div>
  );
}

export function WhatIfScenarioChart({
  baselineEstimate,
  scenarios,
  className = '',
}: WhatIfScenarioChartProps) {
  const hasData = baselineEstimate?.estimatedAmount !== null && scenarios.some((s) => s.total !== null);

  const data = useMemo((): ChartDataPoint[] => {
    if (!baselineEstimate || baselineEstimate.estimatedAmount === null) {
      return [];
    }

    const baseline = baselineEstimate.estimatedAmount;

    const points: ChartDataPoint[] = [
      { name: 'Baseline', baseline },
      ...scenarios
        .filter((s) => s.total !== null)
        .map((s) => ({
          name: s.label,
          baseline,
          [s.id]: s.total!,
        })),
    ];

    return points;
  }, [baselineEstimate, scenarios]);

  if (!hasData || data.length <= 1) {
    return (
      <div className={`${styles.container} ${className}`} role="img" aria-label="No scenario data to display">
        <div className={styles.emptyState}>
          <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <p className={styles.emptyText}>No scenario data yet</p>
          <p className={styles.emptySubtext}>
            {baselineEstimate ? 'Run a scenario to see the comparison' : 'Select a baseline estimate first'}
          </p>
        </div>
      </div>
    );
  }

  const scenarioKeys = scenarios.filter((s) => s.total !== null).map((s) => s.id);

  const maxValue = Math.max(
    baselineEstimate?.estimatedAmount ?? 0,
    ...scenarios.filter((s) => s.total !== null).map((s) => s.total!)
  );

  return (
    <div className={`${styles.container} ${className}`} role="img" aria-label={`Comparing baseline with ${scenarioKeys.length} scenario${scenarioKeys.length !== 1 ? 's' : ''}`}>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <defs>
              {scenarioKeys.map((key) => {
                const scenario = scenarios.find((s) => s.id === key);
                return (
                  <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={scenario?.color || 'var(--color-accent)'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={scenario?.color || 'var(--color-accent)'} stopOpacity={0} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="var(--color-border)"
              vertical={false}
              horizontal={true}
              className={styles.grid}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: 'var(--color-ink)', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              tickMargin={12}
              className={styles.xAxis}
            />
            <YAxis
              type="number"
              domain={[0, maxValue * 1.15]}
              tickFormatter={(value) => formatCurrency(value, 'INR')}
              tick={{ fontSize: 11, fill: 'var(--color-ink-muted)', fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
              dy={-8}
              className={styles.yAxis}
            />
            <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'none' }} />
            {scenarioKeys.map((key) => {
              const scenario = scenarios.find((s) => s.id === key);
              return (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={scenario?.color || 'var(--color-accent)'}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#gradient-${key})`}
                  isAnimationActive={!window.matchMedia('(prefers-reduced-motion: reduce)').matches}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              );
            })}
            <Line
              type="monotone"
              dataKey="baseline"
              stroke="var(--color-ink-muted)"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              isAnimationActive={!window.matchMedia('(prefers-reduced-motion: reduce)').matches}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.legend} aria-label="Scenario legend">
        <span className={styles.legendItem}>
          <span className={styles.legendColor} style={{ background: 'var(--color-ink-muted)' }} aria-hidden="true" />
          <span className={styles.legendLabel}>Baseline (dashed)</span>
        </span>
        {scenarioKeys.map((key) => {
          const scenario = scenarios.find((s) => s.id === key);
          return (
            <span key={key} className={styles.legendItem}>
              <span className={styles.legendColor} style={{ background: scenario?.color }} aria-hidden="true" />
              <span className={styles.legendLabel}>{scenario?.label}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}