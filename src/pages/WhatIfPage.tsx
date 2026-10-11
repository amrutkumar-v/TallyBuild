import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Brain,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Coins,
  Scale,
  SlidersHorizontal,
  Users,
} from 'lucide-react';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { WhatIfScenarioChart } from '../components/ui/charts';
import { useEstimates } from '../store/estimates-context';
import { formatCurrency } from '../utils/format';
import type { Estimate } from '../types';

import styles from './WhatIfPage.module.css';

const SCENARIO_TYPES = [
  {
    id: 'team',
    icon: Users,
    title: 'Team size',
    description: 'Adjust the number of people or hours to see how effort changes affect the total.',
    color: '#60A5FA',
    bgColor: 'rgba(96, 165, 250, 0.15)',
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  {
    id: 'rates',
    icon: Coins,
    title: 'Rate changes',
    description: 'Stress-test the budget against hourly rate or monthly infrastructure cost shifts.',
    color: '#F5B942',
    bgColor: 'rgba(245, 185, 66, 0.15)',
    borderColor: 'rgba(245, 185, 66, 0.3)',
  },
  {
    id: 'duration',
    icon: Scale,
    title: 'Duration',
    description: 'Change the number of months for infrastructure or the project length.',
    color: '#34D399',
    bgColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  {
    id: 'contingency',
    icon: Coins,
    title: 'Contingency',
    description: 'Add or remove contingency buffers to see the impact on the final estimate.',
    color: '#F87171',
    bgColor: 'rgba(248, 113, 113, 0.15)',
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
];

const FLOW_STEPS = [
  { label: 'Baseline estimate', note: 'Your calculated project total', icon: Calculator },
  { label: 'Apply scenarios', note: 'Adjust team, rates, duration', icon: SlidersHorizontal },
  { label: 'Compare outcomes', note: 'Side-by-side scenario totals', icon: ArrowUpRight },
];

function ScenarioCard({
  scenario,
  isActive,
  onClick,
}: {
  scenario: typeof SCENARIO_TYPES[0];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.scenarioCard} ${isActive ? styles.scenarioActive : ''}`}
      onClick={onClick}
      style={{
        borderColor: isActive ? scenario.borderColor : undefined,
        background: isActive ? scenario.bgColor : undefined,
      } as React.CSSProperties}
    >
      <div
        className={styles.scenarioIcon}
        style={{ background: scenario.bgColor, borderColor: scenario.borderColor, color: scenario.color } as React.CSSProperties}
      >
        <scenario.icon size={20} aria-hidden="true" />
      </div>
      <h3 className={styles.scenarioTitle}>{scenario.title}</h3>
      <p className={styles.scenarioText}>{scenario.description}</p>
      {isActive && (
        <span className={styles.activeBadge}>Active</span>
      )}
    </button>
  );
}

function FlowStep({
  step,
  isActive,
  isLast,
}: {
  step: typeof FLOW_STEPS[0];
  isActive: boolean;
  isLast: boolean;
}) {
  return (
    <div className={styles.flowItem}>
      <div
        className={`${styles.flowNode} ${isActive ? styles.flowActive : ''}`}
        style={{ background: isActive ? 'rgba(245, 185, 66, 0.15)' : undefined, borderColor: isActive ? 'rgba(245, 185, 66, 0.3)' : undefined } as React.CSSProperties}
      >
        <step.icon size={18} className={styles.flowIcon} aria-hidden="true" style={{ color: isActive ? '#F5B942' : undefined } as React.CSSProperties} />
        <div>
          <span className={styles.flowLabel}>{step.label}</span>
          <span className={styles.flowNote}>{step.note}</span>
        </div>
      </div>
      {!isLast && (
        <ArrowRight size={18} className={styles.flowArrow} aria-hidden="true" />
      )}
    </div>
  );
}

function ScenarioBuilder({
  estimate,
  onRunScenario,
}: {
  estimate: Estimate | null;
  onRunScenario: (type: string) => void;
}) {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  if (!estimate) {
    return (
      <div className={styles.emptyBuilder}>
        <Brain size={48} className={styles.emptyIcon} aria-hidden="true" />
        <p className={styles.emptyTitle}>Select an estimate to begin</p>
        <p className={styles.emptyText}>
          Choose an estimate from your workspace, then pick a scenario type to explore.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.builder}>
      <div className={styles.builderHeader}>
        <h3 className={styles.builderTitle}>What-if builder</h3>
        <p className={styles.builderSubtitle}>
          Baseline: <strong>{estimate.projectName}</strong> — {formatCurrency(estimate.estimatedAmount ?? 0, estimate.currency)}
        </p>
      </div>

      <div className={styles.scenarioGrid}>
        {SCENARIO_TYPES.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            isActive={activeScenario === scenario.id}
            onClick={() => setActiveScenario(activeScenario === scenario.id ? null : scenario.id)}
          />
        ))}
      </div>

      {activeScenario && (
        <div className={styles.scenarioConfig}>
          <h4 className={styles.configTitle}>
            Configure <span style={{ color: SCENARIO_TYPES.find(s => s.id === activeScenario)?.color }}>{SCENARIO_TYPES.find(s => s.id === activeScenario)?.title}</span>
          </h4>
          <p className={styles.configText}>
            Scenario configuration controls will be implemented in Phase 03. For now, select a scenario
            type to see the planned adjustment categories.
          </p>
          <Button
            variant="primary"
            iconStart={<Calculator size={16} aria-hidden="true" />}
            onClick={() => onRunScenario(activeScenario)}
            disabled
          >
            Run scenario
          </Button>
        </div>
      )}

      <div className={styles.flowSection}>
        <h4 className={styles.flowTitle}>Planned flow</h4>
        <div className={styles.flow}>
          {FLOW_STEPS.map((step, index) => (
            <FlowStep
              key={step.label}
              step={step}
              isActive={index <= 1}
              isLast={index === FLOW_STEPS.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ScenarioResults({
  estimate,
}: {
  estimate: Estimate | null;
}) {
  if (!estimate) {
    return (
      <div className={styles.emptyResults}>
        <Scale size={48} className={styles.emptyIcon} aria-hidden="true" />
        <p className={styles.emptyTitle}>No scenario results yet</p>
        <p className={styles.emptyText}>
          Run a scenario from the builder to see the comparison here.
        </p>
      </div>
    );
  }

  // Prepare scenario data for the chart - this will show actual data when Phase 03 is implemented
  const scenarios = [
    { id: 'team', label: 'Team size', total: null as number | null, color: '#60A5FA' },
    { id: 'rates', label: 'Rate changes', total: null as number | null, color: '#F5B942' },
    { id: 'duration', label: 'Duration', total: null as number | null, color: '#34D399' },
    { id: 'contingency', label: 'Contingency', total: null as number | null, color: '#F87171' },
  ];

  return (
    <div className={styles.results}>
      <h3 className={styles.resultsTitle}>Scenario outcomes</h3>
      <WhatIfScenarioChart baselineEstimate={estimate} scenarios={scenarios} />
      <p className={styles.resultsNote}>
        Scenario calculation and comparison will be implemented in Phase 03. This area will show
        baseline vs. scenario totals with detailed breakdowns.
      </p>
      <div className={styles.resultsPreview}>
        <div className={styles.previewCard}>
          <span className={styles.previewLabel}>Baseline</span>
          <span className={styles.previewValue}>
            {formatCurrency(estimate.estimatedAmount ?? 0, estimate.currency)}
          </span>
        </div>
        <ArrowRight size={20} className={styles.previewArrow} aria-hidden="true" />
        <div className={styles.previewCard} style={{ opacity: 0.5 } as React.CSSProperties}>
          <span className={styles.previewLabel}>Scenario</span>
          <span className={styles.previewValue}>—</span>
        </div>
      </div>
    </div>
  );
}

export default function WhatIfPage() {
  const { estimates } = useEstimates();
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);

  const handleRunScenario = (_type: string) => {
    // Placeholder for Phase 03 implementation
  };

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="What-if Analysis"
        description="Explore how team, rate and duration changes ripple through a project cost estimate."
        actions={
          <Badge tone="accent">Phase 03 preview</Badge>
        }
      />

      <SectionCard
        title="Choose a baseline estimate"
        description="Select an estimate from your workspace to use as the starting point for scenario analysis."
      >
        {estimates.length === 0 ? (
          <div className={styles.emptyState}>
            <Calculator size={48} className={styles.emptyIcon} aria-hidden="true" />
            <p className={styles.emptyTitle}>No estimates available</p>
            <p className={styles.emptyText}>
              Create and calculate estimates on the <strong>New Estimate</strong> page to enable what-if analysis.
            </p>
            <Button
              variant="secondary"
              iconStart={<ChevronLeft size={16} aria-hidden="true" />}
              onClick={() => window.location.href = '/new-estimate'}
            >
              Create an estimate
            </Button>
          </div>
        ) : (
          <div className={styles.estimateSelector}>
            {estimates.map((estimate) => (
              <button
                key={estimate.id}
                type="button"
                className={`${styles.estimateOption} ${selectedEstimate?.id === estimate.id ? styles.estimateSelected : ''}`}
                onClick={() => setSelectedEstimate(selectedEstimate?.id === estimate.id ? null : estimate)}
              >
                <div className={styles.estimateInfo}>
                  <p className={styles.estimateName}>{estimate.projectName}</p>
                  <p className={styles.estimateMeta}>
                    {estimate.currency} · {estimate.category.replace('-', ' ')} · {estimate.complexity}
                    {estimate.estimatedAmount !== null && (
                      <> · {formatCurrency(estimate.estimatedAmount, estimate.currency)}</>
                    )}
                  </p>
                </div>
                {selectedEstimate?.id === estimate.id && (
                  <ChevronRight size={18} className={styles.estimateChevron} aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="What-if builder"
        description={selectedEstimate
          ? `Building scenarios for <strong>${selectedEstimate.projectName}</strong>. Pick a scenario type to explore.`
          : 'Select a baseline estimate above to configure scenarios.'}
      >
        <ScenarioBuilder
          estimate={selectedEstimate}
          onRunScenario={handleRunScenario}
        />
      </SectionCard>

      <SectionCard
        title="Results"
        description={selectedEstimate
          ? `Scenario outcomes for <strong>${selectedEstimate.projectName}</strong>.`
          : 'Run a scenario to see the comparison results.'}
      >
        <ScenarioResults estimate={selectedEstimate} />
      </SectionCard>

      <SectionCard
        title="Honest status"
        description="What-if analysis tooling is planned for Phase 03."
      >
        <p className={styles.note}>
          <Brain size={16} aria-hidden="true" />
          The what-if builder UI structure is in place, but scenario calculations, parameter inputs,
          and result persistence will be implemented in Phase 03. No numbers are fabricated.
        </p>
      </SectionCard>
    </>
  );
}