import { useState } from 'react';
import { NavLink, Outlet, useParams } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';
import { LinkButton } from '../components/ui/Button';
import { FolderOpen, RefreshCw, Sparkles } from 'lucide-react';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfidenceBadge, SourceBadge, StageBadge } from '../components/ui/EstimateBadges';
import { PageHeader } from '../components/ui/PageHeader';
import { estimateTabs } from '../constants/navigation';
import { projectTypeLabels } from '../constants/labels';
import { errorMessage } from '../services';
import { useEstimates } from '../store/estimates-context';
import { effectiveStage } from '../utils/estimate';
import { cn } from '../utils/cn';
import styles from './EstimateLayout.module.css';

export function EstimateLayout(): React.JSX.Element {
  const { estimateId = '' } = useParams();
  return <EstimateWorkspace key={estimateId} estimateId={estimateId} />;
}

function EstimateWorkspace({ estimateId }: { estimateId: string }): React.JSX.Element {
  const { getEstimate, status, runEstimate } = useEstimates();
  const estimate = getEstimate(estimateId);

  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  if (!estimate) {
    return (
      <EmptyState
        icon={<FolderOpen />}
        title={status === 'loading' ? 'Loading estimate…' : 'Estimate not found'}
        description={
          status === 'loading'
            ? 'Fetching this estimate from local storage.'
            : 'It may have been deleted, or the link is incorrect.'
        }
        action={
          <LinkButton to="/estimates" variant="secondary">
            Back to saved estimates
          </LinkButton>
        }
      />
    );
  }

  const handleRun = async (): Promise<void> => {
    setRunning(true);
    setRunError(null);
    try {
      await runEstimate(estimate.id);
    } catch (caught) {
      setRunError(errorMessage(caught));
    } finally {
      setRunning(false);
    }
  };

  const result = estimate.result;

  return (
    <div className={styles.workspace}>
      <PageHeader
        title={estimate.input.projectName || 'Untitled estimate'}
        description={estimate.input.requirements.slice(0, 180) + (estimate.input.requirements.length > 180 ? '…' : '')}
        crumbs={[{ label: 'Saved estimates', to: '/estimates' }, { label: 'Workspace' }]}
        meta={
          <div className={styles.meta}>
            <Badge tone="neutral">{projectTypeLabels[estimate.input.projectType]}</Badge>
            <StageBadge stage={effectiveStage(estimate)} />
            {result ? <SourceBadge source={result.source} /> : null}
            {result ? <ConfidenceBadge confidence={result.confidence} /> : null}
          </div>
        }
        actions={
          <div className={styles.actions}>
            <Button onClick={() => void handleRun()} disabled={running}>
              {running ? (
                <RefreshCw className={styles.spin} aria-hidden="true" />
              ) : (
                <Sparkles aria-hidden="true" />
              )}
              {result ? 'Re-run estimate' : 'Run estimate'}
            </Button>
          </div>
        }
      />

      {runError ? (
        <p className={styles.runError} role="alert">
          {runError}
        </p>
      ) : null}

      <nav className={styles.tabs} aria-label="Estimate sections">
        {estimateTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) => cn(styles.tab, isActive && styles.tabActive)}
            >
              <Icon className={styles.tabIcon} aria-hidden="true" />
              <span>{tab.label}</span>
              {tab.to === 'results' && !result ? (
                <span className={styles.dot} aria-label="Not yet generated" />
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      <Outlet context={{ estimate }} />
    </div>
  );
}
