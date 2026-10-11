import { Plus, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import type { CurrencyCode } from '../../estimation';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { TextField } from '../ui/Fields';
import { SectionCard } from '../ui/SectionCard';

import styles from './CostLinesEditor.module.css';

export interface CostLineRow {
  id: string;
  primary: string;
  amount: string;
  months: string;
}

export interface CostLineRowErrors {
  primary?: string;
  amount?: string;
  months?: string;
}

interface CostLinesEditorProps {
  title: string;
  description: string;
  icon: LucideIcon;
  primaryLabel: string;
  primaryPlaceholder: string;
  amountLabel: string;
  monthsLabel?: string;
  currency: CurrencyCode;
  rows: ReadonlyArray<CostLineRow>;
  errors: Readonly<Record<string, CostLineRowErrors>>;
  emptyTitle: string;
  emptyDescription: string;
  addLabel: string;
  disabled: boolean;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, patch: Partial<CostLineRow>) => void;
  onClearError: (id: string, field: keyof CostLineRowErrors) => void;
}

export function CostLinesEditor({
  title,
  description,
  icon: Icon,
  primaryLabel,
  primaryPlaceholder,
  amountLabel,
  monthsLabel,
  currency,
  rows,
  errors,
  emptyTitle,
  emptyDescription,
  addLabel,
  disabled,
  onAdd,
  onRemove,
  onChange,
  onClearError,
}: CostLinesEditorProps): ReactElement {
  const withMonths = monthsLabel !== undefined;

  return (
    <SectionCard title={title} description={description}>
      {rows.length === 0 ? (
        <EmptyState
          compact
          icon={Icon}
          title={emptyTitle}
          description={emptyDescription}
          action={
            <Button
              size="sm"
              variant="secondary"
              iconStart={<Plus size={16} aria-hidden="true" />}
              onClick={onAdd}
              disabled={disabled}
            >
              {addLabel}
            </Button>
          }
        />
      ) : (
        <>
          <ul className={withMonths ? styles.rowsWithMonths : styles.rows}>
            {rows.map((row) => {
              const rowError = errors[row.id];
              return (
                <li
                  key={row.id}
                  className={withMonths ? styles.rowWithMonths : styles.row}
                >
                  <TextField
                    id={`cost-${row.id}-primary`}
                    label={primaryLabel}
                    value={row.primary}
                    onChange={(value) => {
                      onChange(row.id, { primary: value });
                      onClearError(row.id, 'primary');
                    }}
                    placeholder={primaryPlaceholder}
                    required
                    error={rowError?.primary}
                    disabled={disabled}
                  />
                  <TextField
                    id={`cost-${row.id}-amount`}
                    label={`${amountLabel} (${currency})`}
                    value={row.amount}
                    onChange={(value) => {
                      onChange(row.id, { amount: value });
                      onClearError(row.id, 'amount');
                    }}
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    placeholder="0"
                    required
                    error={rowError?.amount}
                    disabled={disabled}
                  />
                  {withMonths ? (
                    <TextField
                      id={`cost-${row.id}-months`}
                      label={monthsLabel ?? 'Months'}
                      value={row.months}
                      onChange={(value) => {
                        onChange(row.id, { months: value });
                        onClearError(row.id, 'months');
                      }}
                      type="number"
                      min={0}
                      step="any"
                      inputMode="decimal"
                      placeholder="0"
                      required
                      error={rowError?.months}
                      disabled={disabled}
                    />
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={styles.remove}
                    iconStart={<Trash2 size={16} aria-hidden="true" />}
                    onClick={() => onRemove(row.id)}
                    disabled={disabled}
                    aria-label={`Remove ${title.toLowerCase()} line`}
                  />
                </li>
              );
            })}
          </ul>
          <div className={styles.addWrap}>
            <Button
              size="sm"
              variant="secondary"
              iconStart={<Plus size={16} aria-hidden="true" />}
              onClick={onAdd}
              disabled={disabled}
            >
              {addLabel}
            </Button>
          </div>
        </>
      )}
    </SectionCard>
  );
}
