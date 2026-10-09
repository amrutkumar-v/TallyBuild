import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, CheckCircle2, ClipboardList, Scale } from 'lucide-react';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LinkButton } from '../components/ui/LinkButton';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { SelectField, TextAreaField, TextField } from '../components/ui/Fields';
import { PROJECT_TYPE_OPTIONS, isProjectType } from '../constants/labels';
import { useEstimates } from '../store/estimates-context';
import type { Estimate, NewEstimateFormErrors, NewEstimateFormValues } from '../types';

import styles from './NewEstimatePage.module.css';

const INITIAL_VALUES: NewEstimateFormValues = {
  projectName: '',
  location: '',
  projectType: '',
  notes: '',
};

const FIELD_ORDER: ReadonlyArray<keyof NewEstimateFormErrors> = [
  'projectName',
  'location',
  'projectType',
  'notes',
];

function validate(values: NewEstimateFormValues): NewEstimateFormErrors {
  const errors: NewEstimateFormErrors = {};
  const projectName = values.projectName.trim();
  const location = values.location.trim();

  if (projectName === '') {
    errors.projectName = 'Enter a project name.';
  } else if (projectName.length < 3) {
    errors.projectName = 'Use at least 3 characters.';
  } else if (projectName.length > 80) {
    errors.projectName = 'Keep the name under 80 characters.';
  }

  if (location === '') {
    errors.location = 'Enter the project location.';
  } else if (location.length < 2) {
    errors.location = 'Use at least 2 characters.';
  } else if (location.length > 80) {
    errors.location = 'Keep the location under 80 characters.';
  }

  if (values.projectType === '') {
    errors.projectType = 'Choose a project type.';
  }

  if (values.notes.length > 500) {
    errors.notes = 'Keep notes under 500 characters.';
  }

  return errors;
}

const NEXT_STEPS = [
  { step: '1', title: 'Project details', detail: 'Name, location and type on this screen.', phase: 'Now', tone: 'success' as const },
  { step: '2', title: 'Quantities & materials', detail: 'Line items and building products.', phase: 'Phase 02', tone: 'accent' as const },
  { step: '3', title: 'Cost estimate', detail: 'The estimation engine prices the draft.', phase: 'Phase 02', tone: 'accent' as const },
  { step: '4', title: 'Compare & scenarios', detail: 'Product comparison and what-if analysis.', phase: 'Phase 03', tone: 'neutral' as const },
];

export default function NewEstimatePage() {
  const { addEstimate, persistenceAvailable } = useEstimates();
  const [values, setValues] = useState<NewEstimateFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<NewEstimateFormErrors>({});
  const [created, setCreated] = useState<Estimate | null>(null);

  const updateValues = (patch: Partial<NewEstimateFormValues>) => {
    setValues((current) => ({ ...current, ...patch }));
  };

  const clearError = (field: keyof NewEstimateFormErrors) => {
    setErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current,
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);

    const firstError = FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstError) {
      document.getElementById(firstError)?.focus();
      return;
    }
    if (!isProjectType(values.projectType)) {
      return;
    }

    const estimate = addEstimate({
      projectName: values.projectName.trim(),
      location: values.location.trim(),
      projectType: values.projectType,
      notes: values.notes.trim() === '' ? undefined : values.notes.trim(),
    });
    setCreated(estimate);
  };

  const handleReset = () => {
    setValues(INITIAL_VALUES);
    setErrors({});
    setCreated(null);
    document.getElementById('projectName')?.focus();
  };

  return (
    <>
      <PageHeader
        eyebrow="New estimate"
        title="Create a project estimate"
        description="Start with the essentials. The estimation engine that prices these drafts arrives in Phase 02."
      />

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          {created ? (
            <SectionCard>
              <div className={styles.success} role="status">
                <CheckCircle2 size={40} className={styles.successIcon} aria-hidden="true" />
                <h2 className={styles.successTitle}>Draft saved to this browser</h2>
                <p className={styles.successText}>
                  &ldquo;{created.projectName}&rdquo; is stored locally as a draft. No cost has been
                  calculated yet — the estimation engine is part of Phase 02.
                </p>
                <div className={styles.successActions}>
                  <LinkButton to="/estimates">View estimates</LinkButton>
                  <Button variant="secondary" onClick={handleReset}>
                    Create another
                  </Button>
                </div>
              </div>
            </SectionCard>
          ) : (
            <SectionCard
              title="Project details"
              description="Required fields are marked with an asterisk."
            >
              <form className={styles.form} onSubmit={handleSubmit} noValidate>
                <TextField
                  id="projectName"
                  label="Project name"
                  required
                  value={values.projectName}
                  onChange={(value) => {
                    updateValues({ projectName: value });
                    clearError('projectName');
                  }}
                  error={errors.projectName}
                  hint="A short, recognisable name for this estimate."
                  placeholder="e.g. Riverside Villa Extension"
                  maxLength={80}
                />

                <TextField
                  id="location"
                  label="Location"
                  required
                  value={values.location}
                  onChange={(value) => {
                    updateValues({ location: value });
                    clearError('location');
                  }}
                  error={errors.location}
                  hint="City and state help identify the project later."
                  placeholder="e.g. Bengaluru, Karnataka"
                  maxLength={80}
                />

                <SelectField
                  id="projectType"
                  label="Project type"
                  required
                  value={values.projectType}
                  onChange={(value) => {
                    updateValues({ projectType: isProjectType(value) ? value : '' });
                    clearError('projectType');
                  }}
                  error={errors.projectType}
                  options={PROJECT_TYPE_OPTIONS}
                  placeholder="Select a project type"
                />

                <TextAreaField
                  id="notes"
                  label="Scope notes"
                  value={values.notes}
                  onChange={(value) => {
                    updateValues({ notes: value });
                    clearError('notes');
                  }}
                  error={errors.notes}
                  hint="Optional — what is being built or renovated?"
                  placeholder="Short description of the scope"
                  maxLength={500}
                />

                <div className={styles.actions}>
                  <Button type="submit" iconStart={<ArrowRight size={16} aria-hidden="true" />}>
                    Save draft estimate
                  </Button>
                  <Button variant="ghost" onClick={handleReset}>
                    Reset form
                  </Button>
                </div>

                <p className={styles.formNote}>
                  Saving stores a draft in your browser only. No cost calculation runs until the
                  Phase 02 estimation engine arrives.
                </p>
              </form>
            </SectionCard>
          )}
        </div>

        <aside className={styles.aside}>
          <SectionCard title="What happens next">
            <ol className={styles.steps}>
              {NEXT_STEPS.map((item) => (
                <li key={item.step} className={styles.step}>
                  <span className={styles.stepNumber} aria-hidden="true">
                    {item.step}
                  </span>
                  <div className={styles.stepBody}>
                    <p className={styles.stepTitle}>{item.title}</p>
                    <p className={styles.stepDetail}>{item.detail}</p>
                  </div>
                  <Badge tone={item.tone}>{item.phase}</Badge>
                </li>
              ))}
            </ol>
            {!persistenceAvailable ? (
              <p className={styles.storageWarning} role="alert">
                Browser storage is unavailable, so this draft will not be saved on this device.
              </p>
            ) : null}
          </SectionCard>

          <SectionCard title="Why start here">
            <p className={styles.asideText}>
              <ClipboardList size={16} aria-hidden="true" />
              Capturing project details now keeps every estimate organised and ready for the
              estimation engine.
            </p>
            <p className={styles.asideText}>
              <Scale size={16} aria-hidden="true" />
              Comparison and what-if analysis will build on these same project records.
            </p>
          </SectionCard>
        </aside>
      </div>
    </>
  );
}
