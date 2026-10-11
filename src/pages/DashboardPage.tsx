import { useMemo, useEffect, useState, useRef } from 'react';
import { Plus, TrendingUp, Activity, BarChart3, ArrowUpRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';

import { Button } from '../components/ui/Button';
import { DemoNotice } from '../components/ui/DemoNotice';
import { LinkButton } from '../components/ui/LinkButton';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { SummaryGrid } from '../components/dashboard/SummaryGrid';
import { RecentEstimates } from '../components/dashboard/RecentEstimates';
import { HowItHelps } from '../components/dashboard/HowItHelps';
import { useEstimates } from '../store/estimates-context';
import { formatCurrencyShort } from '../utils/format';
import { cn } from '../utils/cn';

import styles from './DashboardPage.module.css';

const CHART_COLORS = [
  '#D9AD55',
  '#3B82F6',
  '#2DD4BF',
  '#F43F5E',
  '#F59E0B',
  '#A855F7',
];

function CostDistributionChart({ estimates }: { estimates: ReadonlyArray<{ category: string; estimatedAmount: number | null }> }) {
  const [isVisible, setIsVisible] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (chartRef.current) observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  const data = useMemo(() => {
    const totals: Record<string, number> = {};
    let total = 0;
    for (const est of estimates) {
      if (est.estimatedAmount != null && est.estimatedAmount > 0) {
        totals[est.category] = (totals[est.category] ?? 0) + est.estimatedAmount;
        total += est.estimatedAmount;
      }
    }
    if (total === 0) return null;
    const categories = Object.entries(totals).map(([name, value], index) => ({
      name: name.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      value,
      percentage: ((value / total) * 100).toFixed(1),
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
    return { categories, total };
  }, [estimates]);

  if (!data) {
    return (
      <div className={styles.emptyChart} role="img" aria-label="No cost data available">
        <div className={styles.chartIcon} aria-hidden="true">
          <BarChart3 aria-hidden="true" />
        </div>
        <p className={styles.emptyChartText}>No estimates with totals yet</p>
        <p className={styles.emptyChartHint}>Create estimates to see cost distribution</p>
      </div>
    );
  }

  const { categories, total } = data;

  const tooltipFormatter = (value: unknown): string => {
    const num = typeof value === 'number' ? value : Array.isArray(value) ? value[0] : 0;
    return formatCurrencyShort(num);
  };

  return (
    <div ref={chartRef} className={styles.chartWrapper}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>Cost distribution by category</h3>
        <p className={styles.chartTotal}>
          Total: <strong>{formatCurrencyShort(total)}</strong>
        </p>
      </div>
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={isVisible ? 320 : 0}>
          <BarChart
            data={categories}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis type="number" tick={{ fill: 'var(--color-ink-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: 'var(--color-ink-secondary)', fontSize: 12, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--color-ink)',
                boxShadow: 'var(--shadow-lg)',
              }}
              formatter={tooltipFormatter}
              labelFormatter={(label) => label}
            />
            <Legend
              wrapperStyle={{ paddingTop: 10 }}
              formatter={(value) => value}
            />
            <Bar
              dataKey="value"
              radius={[0, 8, 8, 0]}
              maxBarSize={40}
              layout="vertical"
              isAnimationActive={isVisible}
            >
              {categories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.chartLegend} role="list" aria-label="Category breakdown">
        {categories.map((entry, index) => (
          <div key={index} className={styles.legendItem} style={{ animationDelay: `${index * 80}ms` }}>
            <span className={styles.legendColor} style={{ backgroundColor: entry.color }} aria-hidden="true" />
            <span className={styles.legendLabel}>{entry.name}</span>
            <span className={styles.legendValue}>{formatCurrencyShort(entry.value)}</span>
            <span className={styles.legendPercent}>({entry.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendValue,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down';
  trendValue?: string;
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon}>
        <Icon size={20} aria-hidden="true" />
      </div>
      <div className={styles.statContent}>
        <p className={styles.statLabel}>{label}</p>
        <div className={styles.statValueRow}>
          <p className={styles.statValue}>{value}</p>
          {trend && trendValue && (
            <span className={cn(styles.statTrend, trend === 'up' ? styles.trendUp : styles.trendDown)}>
              <ArrowUpRight size={12} aria-hidden="true" />
              {trendValue}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { estimates, sampleDataVisible, toggleSampleData } = useEstimates();

  const valuedEstimates = estimates.filter((e) => e.estimatedAmount != null && e.estimatedAmount > 0);
  const totalValue = valuedEstimates.reduce((sum, e) => sum + (e.estimatedAmount ?? 0), 0);
  const avgValue = valuedEstimates.length ? totalValue / valuedEstimates.length : 0;
  const totalProjects = estimates.length;
  const draftCount = estimates.filter((e) => e.status === 'draft').length;

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Welcome to TallyBuild AI"
        description="Create project cost estimates, compare scenarios, and test what-if changes &mdash; all in one workspace."
        actions={
          <LinkButton to="/new-estimate" iconStart={<Plus size={16} aria-hidden="true" />}>
            New Estimate
          </LinkButton>
        }
      />

      <DemoNotice
        action={
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={sampleDataVisible}
            onClick={toggleSampleData}
          >
            {sampleDataVisible ? 'Hide sample data' : 'Show sample data'}
          </Button>
        }
      >
        Every figure on this dashboard is illustrative demo data from the hackathon build &mdash; not
        real customer, market or supplier data.
      </DemoNotice>

      <div className={styles.statsGrid}>
        <StatCard
          label="Total Projects"
          value={String(totalProjects)}
          icon={BarChart3}
          trend="up"
          trendValue="+12%"
        />
        <StatCard
          label="Total Estimated Value"
          value={formatCurrencyShort(totalValue)}
          icon={TrendingUp}
          trend="up"
          trendValue="+8%"
        />
        <StatCard
          label="Avg Estimate"
          value={formatCurrencyShort(avgValue)}
          icon={Activity}
          trend="down"
          trendValue="-3%"
        />
        <StatCard
          label="Draft Estimates"
          value={String(draftCount)}
          icon={BarChart3}
        />
      </div>

      <SummaryGrid estimates={estimates} />

      <SectionCard title="Cost distribution">
        <CostDistributionChart estimates={estimates} />
      </SectionCard>

      <RecentEstimates
        estimates={estimates}
        emptyDescription={
          sampleDataVisible
            ? 'Create your first estimate to see it listed here.'
            : 'Sample data is hidden. Turn it back on above, or create your first estimate.'
        }
      />

      <HowItHelps />
    </>
  );
}