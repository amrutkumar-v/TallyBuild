import { useState } from 'react';
import type { FormEvent } from 'react';
import { RefreshCw, SlidersHorizontal, Sparkles, TrendingUp, X } from 'lucide-react';

import { Button } from '../components/ui/Button';
import { DemoNotice } from '../components/ui/DemoNotice';
import { EmptyState } from '../components/ui/EmptyState';
import { NumberField, TextField } from '../components/ui/Fields';
import { SectionCard } from '../components/ui/SectionCard';
import { DeadlineFitBadge, SourceBadge } from '../components/ui/EstimateBadges';
import { errorMessage } from '../services';
import { useEstimates } from '../store/estimates-context';
import {
  formatCurrency,
  formatRelativeDays,
  formatSignedPercent,
  formatWeeks,
} from '../utils/format';
import { useEstimateRoute } from './estimateRoute';
import type { Estimate, ScenarioInput } from '../types';
import styles from './WhatIfPage.module.css';

export function WhatIfPage(): React.JSX.Element {
  const { estimate } = useEstimateRoute();
  return <WhatIfWorkspace key={estimate.id} estimate={estimate} />;
}

function WhatIfWorkspace({ estimate }: { estimate: Estimate }): React.JSX.Element {
  const { runEstimate, runScenario, removeScenario } = useEstimates();
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const result = estimate.result;

  const [label, setLabel] = useState('');
  const [scopeDelta, setScopeDelta] = useState('-20');
  const [teamSize, setTeamSize] = useState(String(estimate.input.teamSize));
  const [rate, setRate] = useState(String(estimate.input.blendedRatePerDay));
  const [targetWeeks, setTargetWeeks] = useState('');

  if (!result) {
    return (
      <SectionCard title="What-if scenarios">
        <EmptyState
          icon={<SlidersHorizontal />}
          title="Run the baseline first"
          description="Scenarios compare against the baseline estimate, so run it before testing changes."
        />
        <div className={styles.centerAction}>
          <Button
            onClick={() => {
              setBusy(true);
              setError(null);
              void runEstimate(estimate.id)
                .catch((caught: unknown) => setError(errorMessage(caught)))
                .finally(() => setBusy(false));
            }}
            disabled={busy}
          >
            {busy ? (
              <RefreshCw className={styles.spin} aria-hidden="true" />
            ) : (
              <Sparkles aria-hidden="true" />
            )}
            Run baseline estimate
          </Button>
        </div>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </SectionCard>
    );
  }

  const currency = result.currency;

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    const input: ScenarioInput = {
      label: label.trim() || 'Scenario',
      scopeDeltaPercent: Number(scopeDelta) || 0,
      teamSize: Math.max(1, Math.round(Number(teamSize) || 1)),
      blendedRatePerDay: Math.max(1, Number(rate) || estimate.input.blendedRatePerDay),
      targetWeeks: targetWeeks.trim() ? Math.max(1, Math.round(Number(targetWeeks))) : null,
    };
    setBusy(true);
    setError(null);
    void runScenario(estimate.id, input)
      .then(() => setLabel(''))
      .catch((caught: unknown) => setError(errorMessage(caught)))
      .finally(() => setBusy(false));
  };

  const handleRemove = (scenarioId: string): void => {
    setRemovingId(scenarioId);
    void removeScenario(estimate.id, scenarioId)
      .catch((caught: unknown) => setError(errorMessage(caught)))
      .finally(() => setRemovingId(null));
  };

  return (
    <div className={styles.page}>
      <SectionCard
        title="Baseline"
        description="Every scenario is compared against this estimate."
      >
        <div className={styles.baseline}>
          <BaselineStat label="Likely cost" value={formatCurrency(result.cost.likely, currency)} />
          <BaselineStat label="Effort" value={`${result.effortDays.likely} person-days`} />
          <BaselineStat label="Duration" value={formatWeeks(result.durationWeeks)} />
        </div>
      </SectionCard>

      <SectionCard
        title="New scenario"
        description="Adjust delivered scope, team size, rate or a target deadline."
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          <TextField
            label="Scenario label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="e.g. Cut must-have scope by 20%"
          />
          <div className={styles.grid}>
            <NumberField
              label="Scope change (%)"
              value={scopeDelta}
              min={-90}
              max={200}
              onChange={(event) => setScopeDelta(event.target.value)}
              hint="Negative trims scope, positive adds scope."
            />
            <NumberField
              label="Team size"
              value={teamSize}
              min={1}
              max={100}
              onChange={(event) => setTeamSize(event.target.value)}
            />
            <NumberField
              label="Blended rate / person-day"
              value={rate}
              min={1}
              onChange={(event) => setRate(event.target.value)}
            />
            <NumberField
              label="Target (weeks)"
              value={targetWeeks}
              min={1}
              placeholder="Optional"
              onChange={(event) => setTargetWeeks(event.target.value)}
              hint="Optional. Adds a deadline feasibility check."
            />
          </div>
          <div className={styles.formActions}>
            <Button type="submit" disabled={busy}>
              {busy ? (
                <RefreshCw className={styles.spin} aria-hidden="true" />
              ) : (
                <TrendingUp aria-hidden="true" />
              )}
              Evaluate scenario
            </Button>
          </div>
        </form>
      </SectionCard>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <SectionCard
        title="Scenarios"
        description={
          estimate.scenarios.length
            ? `${estimate.scenarios.length} scenario${estimate.scenarios.length === 1 ? '' : 's'} evaluated`
            : 'No scenarios evaluated yet.'
        }
      >
        {estimate.scenarios.length === 0 ? (
          <p className={styles.muted}>
            Use the form above to compare an alternative against the baseline.
          </p>
        ) : (
          <ul className={styles.scenarioList}>
            {estimate.scenarios.map((scenario) => (
              <li key={scenario.id} className={styles.scenario}>
                <div className={styles.scenarioHead}>
                  <div className={styles.scenarioTitleGroup}>
                    <p className={styles.scenarioTitle}>{scenario.input.label}</p>
                    <p className={styles.scenarioMeta}>
                      Scope {formatSignedPercent(scenario.input.scopeDeltaPercent)} · team{' '}
                      {scenario.input.teamSize} · {formatCurrency(scenario.input.blendedRatePerDay, currency)}/day ·{' '}
                      {formatRelativeDays(scenario.createdAt)}
                    </p>
                  </div>
                  <div className={styles.scenarioBadges}>
                    {scenario.deadlineFit ? (
                      <DeadlineFitBadge fit={scenario.deadlineFit} />
                    ) : null}
                    <SourceBadge source={scenario.source} />
                    <button
                      type="button"
                      className={styles.remove}
                      onClick={() => handleRemove(scenario.id)}
                      disabled={removingId === scenario.id}
                      aria-label={`Remove scenario ${scenario.input.label}`}
                    >
                      <X aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className={styles.deltas}>
                  <Delta label="Cost" value={scenario.deltas.costPercent} />
                  <Delta label="Effort" value={scenario.deltas.effortPercent} />
                  <Delta label="Duration" value={scenario.deltas.durationPercent} />
                </div>

                <div className={styles.scenarioFacts}>
                  <span>{formatCurrency(scenario.cost.likely, currency)} likely</span>
                  <span>{scenario.effortDays.likely} person-days</span>
                  <span>{formatWeeks(scenario.durationWeeks)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <DemoNotice>
        <p>
          Scenario maths is produced by the mock adapter using the same assumptions as the baseline
          — illustrative only.
        </p>
      </DemoNotice>
    </div>
  );
}

function BaselineStat({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className={styles.baselineStat}>
      <span className={styles.baselineLabel}>{label}</span>
      <span className={styles.baselineValue}>{value}</span>
    </div>
  );
}

function Delta({ label, value }: { label: string; value: number }): React.JSX.Element {
  const tone = value > 0.05 ? 'up' : value < -0.05 ? 'down' : 'flat';
  return (
    <div className={styles.delta} data-tone={tone}>
      <span className={styles.deltaLabel}>{label}</span>
      <span className={styles.deltaValue}>{formatSignedPercent(value, 1)}</span>
    </div>
  );
}
