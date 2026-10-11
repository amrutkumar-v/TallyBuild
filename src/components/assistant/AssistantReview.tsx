import { ArrowLeft, Sparkles } from 'lucide-react';

import { Badge } from '../ui/Badge';
import { currencyOptions } from '../../constants/labels';
import type { CurrencyCode } from '../../types';
import {
  ASSISTANT_STEPS,
  costSections,
  formatAssistantAnswer,
} from '../../features/assistant/assistantFlow';
import type {
  AssistantDraft,
  AssistantFieldId,
} from '../../features/assistant/assistantFlow';
import styles from './Assistant.module.css';

const FIELD_LABELS: Record<AssistantFieldId, string> = {
  requirements: 'Brief',
  name: 'Project name',
  projectType: 'Category',
  teamSize: 'Team size',
  teamLocation: 'Team location',
  complexity: 'Complexity',
  rate: 'Day rate',
  deadline: 'Deadline',
};

export interface AssistantReviewProps {
  draft: AssistantDraft;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onEditStep: (fieldId: AssistantFieldId) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export function AssistantReview({
  draft,
  onCurrencyChange,
  onEditStep,
  onConfirm,
  onBack,
}: AssistantReviewProps): React.JSX.Element {
  const sections = costSections();

  return (
    <div className={styles.review}>
      <p className={styles.blockTitle}>Review your inputs</p>

      <ul className={styles.reviewList}>
        {ASSISTANT_STEPS.map((step) => (
          <li key={step.id} className={styles.reviewRow}>
            <span className={styles.reviewLabel}>{FIELD_LABELS[step.id]}</span>
            <span className={styles.reviewValue}>{formatAssistantAnswer(step, draft)}</span>
            <button
              type="button"
              className={styles.edit}
              onClick={() => onEditStep(step.id)}
            >
              Edit
            </button>
          </li>
        ))}
        <li className={styles.reviewRow}>
          <span className={styles.reviewLabel}>Currency</span>
          <select
            className={styles.select}
            value={draft.currency}
            onChange={(event) => onCurrencyChange(event.target.value as CurrencyCode)}
            aria-label="Currency for this estimate"
          >
            {currencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </li>
      </ul>

      <p className={styles.blockTitle}>Cost sections in this estimate</p>
      <div className={styles.sectionList}>
        {sections.map((section) => (
          <div key={section.id} className={styles.sectionRow}>
            <div>
              <p className={styles.sectionName}>{section.label}</p>
              <p className={styles.sectionDetail}>{section.detail}</p>
            </div>
            <Badge tone={section.status === 'modelled' ? 'success' : 'warning'}>
              {section.status === 'modelled' ? 'Included' : 'Not modelled yet'}
            </Badge>
          </div>
        ))}
      </div>

      <p className={styles.help}>
        All required inputs are valid. Nothing is calculated until you confirm.
      </p>

      <div className={`${styles.actions} ${styles.actionsSpread}`}>
        <button type="button" className={`${styles.btn} ${styles.btnQuiet}`} onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          Back
        </button>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={onConfirm}>
          <Sparkles aria-hidden="true" />
          Calculate estimate
        </button>
      </div>

      <p className={styles.help}>
        Calculated by the app's estimation service — the same deterministic logic used across
        TallyBuild.
      </p>
    </div>
  );
}
