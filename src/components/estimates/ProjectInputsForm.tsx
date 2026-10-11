import { useState } from 'react';
import type { FormEvent } from 'react';
import { Save } from 'lucide-react';

import { Button } from '../ui/Button';
import { NumberField, SelectField, TextAreaField, TextField } from '../ui/Fields';
import { NoteListEditor } from './NoteListEditor';
import {
  complexityOptions,
  currencyOptions,
  projectTypeOptions,
  teamLocationOptions,
} from '../../constants/labels';
import type { Complexity, CurrencyCode, ProjectInput, ProjectType, TeamLocation } from '../../types';
import styles from './ProjectInputsForm.module.css';

export function ProjectInputsForm({
  input,
  saving,
  onSubmit,
}: {
  input: ProjectInput;
  saving: boolean;
  onSubmit: (next: ProjectInput) => void;
}): React.JSX.Element {
  const [form, setForm] = useState<ProjectInput>(input);
  const dirty = JSON.stringify(form) !== JSON.stringify(input);

  const update = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]): void => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const invalid =
    form.projectName.trim() === '' ||
    form.requirements.trim() === '' ||
    form.teamSize < 1 ||
    form.blendedRatePerDay <= 0;

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    if (invalid) return;
    onSubmit({
      ...form,
      projectName: form.projectName.trim(),
      requirements: form.requirements.trim(),
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <TextField
          label="Project name"
          value={form.projectName}
          onChange={(event) => update('projectName', event.target.value)}
          required
        />
        <SelectField<ProjectType>
          label="Category"
          value={form.projectType}
          onChange={(event) => update('projectType', event.target.value as ProjectType)}
          options={projectTypeOptions}
        />
      </div>

      <TextAreaField
        label="Brief"
        value={form.requirements}
        onChange={(event) => update('requirements', event.target.value)}
        rows={4}
        required
      />

      <div className={styles.grid}>
        <SelectField<Complexity>
          label="Complexity"
          value={form.complexity}
          onChange={(event) => update('complexity', event.target.value as Complexity)}
          options={complexityOptions}
        />
        <SelectField<TeamLocation>
          label="Team location"
          value={form.teamLocation}
          onChange={(event) => update('teamLocation', event.target.value as TeamLocation)}
          options={teamLocationOptions}
        />
        <NumberField
          label="Team size"
          value={form.teamSize}
          min={1}
          max={100}
          onChange={(event) => update('teamSize', Number(event.target.value))}
        />
        <NumberField
          label="Blended rate / person-day"
          value={form.blendedRatePerDay}
          min={1}
          onChange={(event) => update('blendedRatePerDay', Number(event.target.value))}
        />
        <SelectField<CurrencyCode>
          label="Currency"
          value={form.currency}
          onChange={(event) => update('currency', event.target.value as CurrencyCode)}
          options={currencyOptions}
        />
        <TextField
          label="Target deadline"
          type="date"
          value={form.targetDeadline}
          onChange={(event) => update('targetDeadline', event.target.value)}
        />
      </div>

      <div className={styles.notes}>
        <p className={styles.notesLabel}>Constraints</p>
        <NoteListEditor
          items={form.constraints}
          onChange={(constraints) => update('constraints', constraints)}
          addLabel="Add"
          placeholder="Add a constraint…"
          emptyText="No constraints recorded."
        />
      </div>

      <div className={styles.footer}>
        <span className={styles.status}>
          {dirty ? 'Unsaved input changes — re-run after saving.' : 'Inputs saved.'}
        </span>
        <Button type="submit" disabled={saving || invalid || !dirty}>
          <Save aria-hidden="true" />
          Save inputs
        </Button>
      </div>
    </form>
  );
}
