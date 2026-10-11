import { ArrowUpRight, CircleAlert, RefreshCw, X } from 'lucide-react';

import { Badge } from '../ui/Badge';
import { ConfidenceBadge, SourceBadge } from '../ui/EstimateBadges';
import {
  formatCurrency,
  formatCurrencyShort,
  formatRelativeDays,
  formatWeeks,
} from '../../utils/format';
import { costSections } from '../../features/assistant/assistantFlow';
import type { Estimate } from '../../types';
import styles from './Assistant.module.css';

export interface AssistantResultProps {
  estimate: Estimate;
  onStartAnother: () => void;
  onOpenWorkspace: () => void;
  onClose: () => void;
}

export function AssistantResult({
  estimate,
  onStartAnother,
  onOpenWorkspace,
  onClose,
}: AssistantResultProps): React.JSX.Element {
  const result = estimate.result;

  if (!result) {
    return (
      <div className={styles.result}>
        <p className={styles.error} role="alert">
          The estimate was created but returned no figures. Open it in the workspace to run it
          manually.
        </p>
        <div className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={onOpenWorkspace}>
            Open in workspace
          </button>
        </div>
      </div>
    );
  }

  const currency = result.currency;
  const sections = costSections();

  return (
    <div className={styles.result}>
      <div className={styles.sourceRow}>
        <SourceBadge source={result.source} />
        <ConfidenceBadge confidence={result.confidence} />
        <Badge tone="neutral">Generated {formatRelativeDays(result.generatedAt)}</Badge>
      </div>

      <div className={styles.totalBox}>
        <p className={styles.totalLabel}>Likely total</p>
        <p className={styles.totalValue}>{formatCurrency(result.cost.likely, currency)}</p>
        <p className={styles.totalHint}>
          Range {formatCurrencyShort(result.cost.low, currency)} –{' '}
          {formatCurrencyShort(result.cost.high, currency)} · {currency}
        </p>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Effort</p>
          <p className={styles.statValue}>{result.effortDays.likely} person-days</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Duration</p>
          <p className={styles.statValue}>{formatWeeks(result.durationWeeks)}</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Team</p>
          <p className={styles.statValue}>{estimate.input.teamSize} people</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Day rate</p>
          <p className={styles.statValue}>
            {formatCurrency(result.blendedRatePerDay, currency)}
          </p>
        </div>
      </div>

      <p className={styles.blockTitle}>Cost categories</p>
      <div className={styles.sectionList}>
        {sections.map((section) => (
          <div key={section.id} className={styles.sectionRow}>
            <div>
              <p className={styles.sectionName}>{section.label}</p>
              <p className={styles.sectionDetail}>{section.detail}</p>
            </div>
            {section.status === 'modelled' ? (
              <span className={styles.featureValue}>{formatCurrency(result.cost.likely, currency)}</span>
            ) : (
              <Badge tone="warning">Pending API</Badge>
            )}
          </div>
        ))}
      </div>

      {result.featureCosts.length > 0 ? (
        <>
          <p className={styles.blockTitle}>By feature</p>
          <ul className={styles.featureList}>
            {result.featureCosts.map((cost) => (
              <li key={cost.featureId} className={styles.featureRow}>
                <span className={styles.featureName}>{cost.name}</span>
                <span className={styles.featureValue}>
                  {cost.effortDays.likely}d · {formatCurrencyShort(cost.cost.likely, currency)}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p className={styles.blockTitle}>Assumptions</p>
      <ul className={styles.assumptions}>
        {result.assumptions.map((assumption, index) => (
          <li key={`${assumption}-${index}`} className={styles.assumption}>
            <CircleAlert aria-hidden="true" />
            <span>{assumption}</span>
          </li>
        ))}
      </ul>

      <p className={styles.help}>
        {result.source === 'api'
          ? 'Provided by the estimation API.'
          : 'This demo stores estimates in your browser via the mock adapter — illustrative only.'}
      </p>

      <div className={styles.actions}>
        <button type="button" className={`${styles.btn} ${styles.btnQuiet} ${styles.btnSm}`} onClick={onClose}>
          <X aria-hidden="true" />
          Close
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnQuiet} ${styles.btnSm}`}
          onClick={onStartAnother}
        >
          <RefreshCw aria-hidden="true" />
          Start another
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
          onClick={onOpenWorkspace}
        >
          <ArrowUpRight aria-hidden="true" />
          Open in workspace
        </button>
      </div>
    </div>
  );
}
