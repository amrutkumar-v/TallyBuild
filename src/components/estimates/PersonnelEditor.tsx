import { Plus, Trash2, Users } from 'lucide-react';
import type { ReactElement } from 'react';

import type { CurrencyCode } from '../../estimation';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { TextField } from '../ui/Fields';
import { SectionCard } from '../ui/SectionCard';

import styles from './PersonnelEditor.module.css';

export interface PersonnelEditorRow {
  id: string;
  role: string;
  people: string;
  hours: string;
  hourlyRate: string;
}

export interface PersonnelEditorRowErrors {
  role?: string;
  people?: string;
  hours?: string;
  hourlyRate?: string;
}

interface PersonnelEditorProps {
  rows: ReadonlyArray<PersonnelEditorRow>;
  errors: Readonly<Record<string, PersonnelEditorRowErrors>>;
  currency: CurrencyCode;
  disabled: boolean;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, patch: Partial<PersonnelEditorRow>) => void;
  onClearError: (id: string, field: keyof PersonnelEditorRowErrors) => void;
}

interface PersonnelRowProps {
  row: PersonnelEditorRow;
  error?: PersonnelEditorRowErrors;
  currency: CurrencyCode;
  disabled: boolean;
  onChange: (patch: Partial<PersonnelEditorRow>) => void;
  onRemove: () => void;
}

function PersonnelRow({
  row,
  error,
  currency,
  disabled,
  onChange,
  onRemove,
}: PersonnelRowProps): ReactElement {
  return (
    <li className={styles.row}>
      <TextField
        id={`personnel-${row.id}-role`}
        label="Role"
        value={row.role}
        onChange={(value) => onChange({ role: value })}
        placeholder="e.g. Senior engineer"
        required
        error={error?.role}
        disabled={disabled}
      />
      <TextField
        id={`personnel-${row.id}-people`}
        label="People"
        value={row.people}
        onChange={(value) => onChange({ people: value })}
        type="number"
        min={0}
        step="any"
        inputMode="decimal"
        placeholder="0"
        required
        error={error?.people}
        disabled={disabled}
      />
      <TextField
        id={`personnel-${row.id}-hours`}
        label="Hours"
        value={row.hours}
        onChange={(value) => onChange({ hours: value })}
        type="number"
        min={0}
        step="any"
        inputMode="decimal"
        placeholder="0"
        required
        error={error?.hours}
        disabled={disabled}
      />
      <TextField
        id={`personnel-${row.id}-hourlyRate`}
        label={`Hourly rate (${currency})`}
        value={row.hourlyRate}
        onChange={(value) => onChange({ hourlyRate: value })}
        type="number"
        min={0}
        step="any"
        inputMode="decimal"
        placeholder="0"
        required
        error={error?.hourlyRate}
        disabled={disabled}
      />
      <Button
        variant="ghost"
        size="sm"
        className={styles.remove}
        iconStart={<Trash2 size={16} aria-hidden="true" />}
        onClick={onRemove}
        disabled={disabled}
        aria-label="Remove personnel line"
      />
    </li>
  );
}

export function PersonnelEditor({
  rows,
  errors,
  currency,
  disabled,
  onAdd,
  onRemove,
  onChange,
  onClearError,
}: PersonnelEditorProps): ReactElement {
  return (
    <SectionCard
      title="Personnel"
      description="Add each team line. Personnel cost = people × hours × hourly rate."
    >
      {rows.length === 0 ? (
        <EmptyState
          compact
          icon={Users}
          title="No team lines yet"
          description="Add the first role to build the personnel cost."
          action={
            <Button
              size="sm"
              variant="secondary"
              iconStart={<Plus size={16} aria-hidden="true" />}
              onClick={onAdd}
              disabled={disabled}
            >
              Add a role
            </Button>
          }
        />
      ) : (
        <>
          <ul className={styles.rows}>
            {rows.map((row) => (
              <PersonnelRow
                key={row.id}
                row={row}
                error={errors[row.id]}
                currency={currency}
                disabled={disabled}
                onChange={(patch) => {
                  onChange(row.id, patch);
                  for (const field of Object.keys(patch) as Array<keyof PersonnelEditorRowErrors>) {
                    onClearError(row.id, field);
                  }
                }}
                onRemove={() => onRemove(row.id)}
              />
            ))}
          </ul>
          <div className={styles.addWrap}>
            <Button
              size="sm"
              variant="secondary"
              iconStart={<Plus size={16} aria-hidden="true" />}
              onClick={onAdd}
              disabled={disabled}
            >
              Add a role
            </Button>
          </div>
        </>
      )}
    </SectionCard>
  );
}
