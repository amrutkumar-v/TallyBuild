import { useState } from 'react';
import { Check, CircleAlert, RefreshCw, Save, Sparkles, TriangleAlert } from 'lucide-react';

import { Button } from '../components/ui/Button';
import { SectionCard } from '../components/ui/SectionCard';
import { FeatureEditor } from '../components/estimates/FeatureEditor';
import { NoteListEditor } from '../components/estimates/NoteListEditor';
import { ProjectInputsForm } from '../components/estimates/ProjectInputsForm';
import { errorMessage } from '../services';
import { useEstimates } from '../store/estimates-context';
import type { Estimate } from '../types';
import { useEstimateRoute } from './estimateRoute';
import styles from './BreakdownPage.module.css';

export function BreakdownPage(): React.JSX.Element {
  const { estimate } = useEstimateRoute();
  return <BreakdownWorkspace key={estimate.id} estimate={estimate} />;
}

function BreakdownWorkspace({ estimate }: { estimate: Estimate }): React.JSX.Element {
  const { updateEstimate, runEstimate } = useEstimates();

  const [features, setFeatures] = useState(estimate.features);
  const [assumptions, setAssumptions] = useState(estimate.assumptions);
  const [openQuestions, setOpenQuestions] = useState(estimate.missingRequirements);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; message: string } | null>(null);

  const scopeDirty =
    JSON.stringify(features) !== JSON.stringify(estimate.features) ||
    JSON.stringify(assumptions) !== JSON.stringify(estimate.assumptions) ||
    JSON.stringify(openQuestions) !== JSON.stringify(estimate.missingRequirements);

  const activeCount = features.filter((feature) => feature.status !== 'removed').length;
  const result = estimate.result;

  const handleSave = async (): Promise<void> => {
    const patch: Parameters<typeof updateEstimate>[1] = {};
    if (JSON.stringify(features) !== JSON.stringify(estimate.features)) patch.features = features;
    if (JSON.stringify(assumptions) !== JSON.stringify(estimate.assumptions))
      patch.assumptions = assumptions;
    if (JSON.stringify(openQuestions) !== JSON.stringify(estimate.missingRequirements))
      patch.missingRequirements = openQuestions;
    if (Object.keys(patch).length === 0) return;

    setSaving(true);
    setStatus(null);
    try {
      await updateEstimate(estimate.id, patch);
      setStatus({ tone: 'ok', message: 'Scope saved. Re-run the estimate to refresh the numbers.' });
    } catch (caught) {
      setStatus({ tone: 'error', message: errorMessage(caught) });
    } finally {
      setSaving(false);
    }
  };

  const handleRun = async (): Promise<void> => {
    setRunning(true);
    setStatus(null);
    try {
      await runEstimate(estimate.id);
      setStatus({ tone: 'ok', message: 'Estimate generated.' });
    } catch (caught) {
      setStatus({ tone: 'error', message: errorMessage(caught) });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bar} data-tone={scopeDirty ? 'warning' : result ? 'ok' : 'info'}>
        <div className={styles.barIcon} aria-hidden="true">
          {scopeDirty ? (
            <TriangleAlert />
          ) : result ? (
            <Check />
          ) : (
            <CircleAlert />
          )}
        </div>
        <div className={styles.barText}>
          <p className={styles.barTitle}>
            {scopeDirty
              ? 'Unsaved scope changes'
              : result
                ? 'Numbers are up to date'
                : 'No numbers generated yet'}
          </p>
          <p className={styles.barSub}>
            {scopeDirty
              ? 'Save your changes, then re-run to refresh effort, cost and timeline.'
              : result
                ? 'Editing the scope or inputs will mark the estimate for recalculation.'
                : `${activeCount} feature${activeCount === 1 ? '' : 's'} in scope. Run the estimate to generate numbers.`}
          </p>
        </div>
        <div className={styles.barActions}>
          <Button
            variant="secondary"
            onClick={() => void handleSave()}
            disabled={!scopeDirty || saving}
          >
            {saving ? <RefreshCw className={styles.spin} aria-hidden="true" /> : <Save aria-hidden="true" />}
            Save scope
          </Button>
          <Button onClick={() => void handleRun()} disabled={running || activeCount === 0}>
            {running ? (
              <RefreshCw className={styles.spin} aria-hidden="true" />
            ) : (
              <Sparkles aria-hidden="true" />
            )}
            {result ? 'Re-run estimate' : 'Run estimate'}
          </Button>
        </div>
      </div>

      {status ? (
        <p
          className={styles.status}
          data-tone={status.tone}
          role={status.tone === 'error' ? 'alert' : 'status'}
        >
          {status.message}
        </p>
      ) : null}

      <SectionCard
        title="Project inputs"
        description="Correct the brief, team or rate. The rate is the only source of cost — no market rates are assumed."
      >
        <ProjectInputsForm
          input={estimate.input}
          saving={saving}
          onSubmit={(next) => {
            void (async () => {
              setSaving(true);
              setStatus(null);
              try {
                await updateEstimate(estimate.id, { input: next, features: estimate.features });
                setStatus({
                  tone: 'ok',
                  message: 'Inputs saved. Re-run the estimate to refresh the numbers.',
                });
              } catch (caught) {
                setStatus({ tone: 'error', message: errorMessage(caught) });
              } finally {
                setSaving(false);
              }
            })();
          }}
        />
      </SectionCard>

      <SectionCard
        title="Scope"
        description="Add, remove or re-prioritise the deliverables this estimate covers."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void handleSave()}
            disabled={!scopeDirty || saving}
          >
            <Save aria-hidden="true" />
            Save
          </Button>
        }
      >
        <FeatureEditor
          features={features}
          featureCosts={result?.featureCosts ?? []}
          currency={estimate.input.currency}
          onChange={setFeatures}
          disabled={saving}
        />
      </SectionCard>

      <div className={styles.twoUp}>
        <SectionCard
          title="Assumptions"
          description="Recorded so the estimate is read in context."
        >
          <NoteListEditor
            items={assumptions}
            onChange={setAssumptions}
            addLabel="Add assumption"
            placeholder="Add an assumption…"
            emptyText="No assumptions recorded."
            disabled={saving}
          />
        </SectionCard>

        <SectionCard
          title="Open questions"
          description="Requirements still to confirm. These are not treated as agreed scope."
        >
          <NoteListEditor
            items={openQuestions}
            onChange={setOpenQuestions}
            addLabel="Add question"
            placeholder="Add an open question…"
            emptyText="No open questions."
            disabled={saving}
          />
        </SectionCard>
      </div>
    </div>
  );
}
