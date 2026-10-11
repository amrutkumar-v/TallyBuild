import { Check, Pencil, TriangleAlert } from 'lucide-react';

import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import {
  complexityOptions,
  projectTypeOptions,
  teamLocationOptions,
} from '../../constants/labels';
import { defaultDeadline, type IntakeDraft } from '../../features/intake/intakeFlow';
import styles from './IntakeLedger.module.css';

function optionLabel(
  options: Array<{ value: string; label: string }>,
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

interface Row {
  label: string;
  value: string;
}

function confirmedRows(draft: IntakeDraft): Row[] {
  const rows: Row[] = [];
  if (draft.requirements.trim()) rows.push({ label: 'Brief', value: draft.requirements.trim() });
  if (draft.name.trim()) rows.push({ label: 'Name', value: draft.name.trim() });
  if (draft.projectType)
    rows.push({ label: 'Category', value: optionLabel(projectTypeOptions, draft.projectType) });
  if (draft.complexity)
    rows.push({ label: 'Complexity', value: optionLabel(complexityOptions, draft.complexity) });
  if (draft.teamSize.trim())
    rows.push({ label: 'Team size', value: `${draft.teamSize.trim()} people` });
  if (draft.teamLocation)
    rows.push({ label: 'Location', value: optionLabel(teamLocationOptions, draft.teamLocation) });
  if (draft.rate.trim())
    rows.push({ label: 'Day rate', value: `${draft.currency} ${draft.rate.trim()} / person-day` });
  if (draft.deadline) rows.push({ label: 'Deadline', value: draft.deadline });
  return rows;
}

export function IntakeLedger({
  draft,
  onEditStep,
  disabled = false,
}: {
  draft: IntakeDraft;
  onEditStep: (fieldId: string) => void;
  disabled?: boolean;
}): React.JSX.Element {
  const rows = confirmedRows(draft);
  const hasDeadline = Boolean(draft.deadline);

  return (
    <aside className={styles.ledger} aria-label="Requirement ledger">
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Confirmed requirements</h2>
          <Badge tone="success">{rows.length}</Badge>
        </div>
        {rows.length ? (
          <dl className={styles.rows}>
            {rows.map((row) => (
              <div key={row.label} className={styles.row}>
                <dt className={styles.rowLabel}>{row.label}</dt>
                <dd className={styles.rowValue}>{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className={styles.muted}>
            Nothing confirmed yet. Answer the assistant&rsquo;s questions to build the brief.
          </p>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Assumptions &amp; open questions</h2>
          <Badge tone="warning">
            {(hasDeadline ? 0 : 1) + draft.openQuestions.length}
          </Badge>
        </div>

        <ul className={styles.assumptionList}>
          {!hasDeadline ? (
            <li className={styles.assumption}>
              <TriangleAlert className={styles.assumptionIcon} aria-hidden="true" />
              <div>
                <p className={styles.assumptionTitle}>Reference deadline assumed</p>
                <p className={styles.assumptionText}>
                  No deadline supplied — {defaultDeadline()} (≈16 weeks) will be used.
                </p>
              </div>
            </li>
          ) : null}

          {draft.openQuestions.map((question) => (
            <li key={question} className={styles.assumption}>
              <TriangleAlert className={styles.assumptionIcon} aria-hidden="true" />
              <div>
                <p className={styles.assumptionTitle}>Open question</p>
                <p className={styles.assumptionText}>{question}</p>
              </div>
            </li>
          ))}

          {hasDeadline && draft.openQuestions.length === 0 ? (
            <li className={styles.clear}>
              <Check className={styles.clearIcon} aria-hidden="true" />
              <span>No open items recorded.</span>
            </li>
          ) : null}
        </ul>

        <div className={styles.ledgerActions}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEditStep('openQuestions')}
            disabled={disabled}
          >
            <Pencil aria-hidden="true" />
            Add open questions
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditStep('deadline')}
            disabled={disabled}
            className={cn(styles.inline)}
          >
            <Pencil aria-hidden="true" />
            Set deadline
          </Button>
        </div>
      </div>
    </aside>
  );
}
