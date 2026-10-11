import { useMemo } from 'react';
import {
  BarChart3,
  FilePlus2,
  FolderOpen,
  Layers,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react';

import { DemoNotice } from '../components/ui/DemoNotice';
import { EmptyState } from '../components/ui/EmptyState';
import { LinkButton } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { SummaryCard } from '../components/ui/SummaryCard';
import { EstimateTable } from '../components/estimates/EstimateTable';
import { useEstimates } from '../store/estimates-context';
import { activeFeatures } from '../utils/estimate';
import styles from './DashboardPage.module.css';

const HOW_IT_WORKS: Array<{ title: string; body: string }> = [
  {
    title: 'Describe the idea',
    body: 'Answer a short set of clarifying questions about the software you want built.',
  },
  {
    title: 'Shape the scope',
    body: 'Review the generated starter scope, then add, remove or re-prioritise features.',
  },
  {
    title: 'Generate the estimate',
    body: 'Run the estimate for effort, cost and an indicative timeline, with assumptions listed.',
  },
  {
    title: 'Test scenarios',
    body: 'Change scope, team size or rate and compare the what-if outcomes against the baseline.',
  },
];

export function DashboardPage(): React.JSX.Element {
  const { estimates, status, error, reload } = useEstimates();

  const summary = useMemo(() => {
    const estimated = estimates.filter((estimate) => estimate.result !== null).length;
    const features = estimates.reduce(
      (total, estimate) => total + activeFeatures(estimate).length,
      0,
    );
    const openQuestions = estimates.reduce(
      (total, estimate) => total + estimate.missingRequirements.length,
      0,
    );
    return { total: estimates.length, estimated, features, openQuestions };
  }, [estimates]);

  const recent = estimates.slice(0, 5);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Create software cost estimates, shape the scope and compare scenarios — all local to this browser in the demo build."
        actions={
          <LinkButton to="/estimates/new">
            <FilePlus2 aria-hidden="true" />
            New estimate
          </LinkButton>
        }
      />

      <DemoNotice />

      <div className={styles.summaryGrid}>
        <SummaryCard
          label="Saved estimates"
          value={summary.total}
          hint="Including demo samples"
          icon={<FolderOpen />}
        />
        <SummaryCard
          label="Estimated"
          value={summary.estimated}
          hint="Have generated numbers"
          tone="accent"
          icon={<BarChart3 />}
        />
        <SummaryCard
          label="Features in scope"
          value={summary.features}
          hint="Across active scopes"
          tone="info"
          icon={<Layers />}
        />
        <SummaryCard
          label="Open questions"
          value={summary.openQuestions}
          hint="Requirements still unclear"
          tone="warning"
          icon={<TriangleAlert />}
        />
      </div>

      {status === 'error' ? (
        <SectionCard title="Recent estimates">
          <EmptyState
            icon={<RefreshCw />}
            title="Could not load estimates"
            description={error ?? 'Something went wrong while loading the saved estimates.'}
            action={
              <LinkButton to="/estimates/new" variant="secondary">
                Start a new estimate
              </LinkButton>
            }
          />
          <div className={styles.retryRow}>
            <button type="button" className={styles.retry} onClick={() => void reload()}>
              <RefreshCw aria-hidden="true" />
              Try again
            </button>
          </div>
        </SectionCard>
      ) : status === 'loading' ? (
        <SectionCard title="Recent estimates">
          <p className={styles.loading}>Loading estimates…</p>
        </SectionCard>
      ) : recent.length === 0 ? (
        <SectionCard title="Recent estimates">
          <EmptyState
            icon={<FolderOpen />}
            title="No estimates yet"
            description="Describe a software idea and the assistant will capture the brief and build a scope you can edit."
            action={
              <LinkButton to="/estimates/new">
                <FilePlus2 aria-hidden="true" />
                Create your first estimate
              </LinkButton>
            }
          />
        </SectionCard>
      ) : (
        <SectionCard
          title="Recent estimates"
          description="Most recently updated first."
          actions={
            <LinkButton to="/estimates" variant="secondary" size="sm">
              View all
            </LinkButton>
          }
          flush
        >
          <EstimateTable estimates={recent} />
        </SectionCard>
      )}

      <SectionCard
        title="How it works"
        description="Every figure is illustrative in this build and clearly labelled."
      >
        <ol className={styles.steps}>
          {HOW_IT_WORKS.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepNumber} aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <p className={styles.stepTitle}>{step.title}</p>
                <p className={styles.stepBody}>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </SectionCard>
    </>
  );
}
