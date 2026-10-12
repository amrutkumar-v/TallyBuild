import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Calculator,
  CheckCircle2,
  ClipboardList,
  Layers,
  Loader2,
  RotateCcw,
  Save,
  Scale,
} from 'lucide-react';

import { getHealth, calculateEstimate } from '../api';
import { CURRENCY_OPTIONS } from '../estimation';
import type { CurrencyCode, ProjectEstimateRequest } from '../estimation';
import { CostLinesEditor } from '../components/estimates/CostLinesEditor';
import type { CostLineRow, CostLineRowErrors } from '../components/estimates/CostLinesEditor';
import { PersonnelEditor } from '../components/estimates/PersonnelEditor';
import type {
  PersonnelEditorRow,
  PersonnelEditorRowErrors,
} from '../components/estimates/PersonnelEditor';
import { EstimateResultCard } from '../components/estimates/EstimateResultCard';
import type { ResultState } from '../components/estimates/EstimateResultCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { SelectField, TextAreaField, TextField } from '../components/ui/Fields';
import {
  PROJECT_CATEGORY_OPTIONS,
  PROJECT_COMPLEXITY_OPTIONS,
  isProjectCategory,
  isProjectComplexity,
} from '../constants/labels';
import { useEstimates } from '../store/estimates-context';
import type { Estimate, NewEstimateFormErrors, NewEstimateFormValues } from '../types';

import styles from './NewEstimatePage.module.css';

type ServiceStatus = 'checking' | 'online' | 'offline';

const INITIAL_VALUES: NewEstimateFormValues = {
  projectName: '',
  scope: '',
  category: '',
  complexity: '',
  currency: 'INR',
  plannedStartDate: '',
  durationWeeks: '',
  notes: '',
};

const FIELD_ORDER: ReadonlyArray<keyof NewEstimateFormErrors> = [
  'projectName',
  'scope',
  'category',
  'complexity',
  'plannedStartDate',
  'durationWeeks',
  'notes',
];

let rowIdCounter = 0;

function nextRowId(prefix: string): string {
  rowIdCounter += 1;
  return `${prefix}-${rowIdCounter}`;
}

function emptyPersonnelRow(): PersonnelEditorRow {
  return { id: nextRowId('personnel'), role: '', people: '1', hours: '', hourlyRate: '' };
}

function emptyCostRow(prefix: string): CostLineRow {
  return { id: nextRowId(prefix), primary: '', amount: '', months: '' };
}

function isNonEmpty(value: string): boolean {
  return value.trim() !== '';
}

function parseAmount(value: string): number {
  return Number(value);
}

function validateProjectForm(values: NewEstimateFormValues): NewEstimateFormErrors {
  const errors: NewEstimateFormErrors = {};
  const projectName = values.projectName.trim();
  const scope = values.scope.trim();

  if (projectName === '') {
    errors.projectName = 'Enter a project name.';
  } else if (projectName.length < 3) {
    errors.projectName = 'Use at least 3 characters.';
  } else if (projectName.length > 80) {
    errors.projectName = 'Keep the name under 80 characters.';
  }

  if (scope === '') {
    errors.scope = 'Describe the scope in a sentence.';
  } else if (scope.length < 3) {
    errors.scope = 'Use at least 3 characters.';
  } else if (scope.length > 160) {
    errors.scope = 'Keep the scope under 160 characters.';
  }

  if (values.category === '') {
    errors.category = 'Choose a project category.';
  }

  if (values.complexity === '') {
    errors.complexity = 'Choose a complexity.';
  }

  if (values.plannedStartDate.trim() !== '') {
    const start = new Date(values.plannedStartDate);
    if (Number.isNaN(start.getTime())) {
      errors.plannedStartDate = 'Enter a valid date.';
    }
  }

  if (values.durationWeeks.trim() !== '') {
    const weeks = Number(values.durationWeeks);
    if (!Number.isFinite(weeks) || weeks < 0) {
      errors.durationWeeks = 'Enter a duration of 0 weeks or more.';
    }
  }

  if (values.notes.length > 500) {
    errors.notes = 'Keep notes under 500 characters.';
  }

  return errors;
}

function validateNumber<K extends string>(
  value: string,
  label: string,
  errors: Partial<Record<K, string | undefined>>,
  key: K,
): void {
  const trimmed = value.trim();
  if (trimmed === '') {
    errors[key] = `Enter a value for ${label}.`;
    return;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    errors[key] = `${label} must be a number that is 0 or more.`;
  }
}

function validatePersonnel(
  rows: ReadonlyArray<PersonnelEditorRow>,
): Record<string, PersonnelEditorRowErrors> {
  const result: Record<string, PersonnelEditorRowErrors> = {};
  for (const row of rows) {
    const errors: PersonnelEditorRowErrors = {};
    if (!isNonEmpty(row.role)) {
      errors.role = 'Enter a role.';
    }
    validateNumber(row.people, 'people', errors, 'people');
    validateNumber(row.hours, 'hours', errors, 'hours');
    validateNumber(row.hourlyRate, 'hourly rate', errors, 'hourlyRate');
    if (Object.keys(errors).length > 0) {
      result[row.id] = errors;
    }
  }
  return result;
}

function validateCostLines(
  rows: ReadonlyArray<CostLineRow>,
  withMonths = false,
): Record<string, CostLineRowErrors> {
  const result: Record<string, CostLineRowErrors> = {};
  for (const row of rows) {
    const errors: CostLineRowErrors = {};
    if (!isNonEmpty(row.primary)) {
      errors.primary = 'Enter a description.';
    }
    validateNumber(row.amount, 'cost', errors, 'amount');
    if (withMonths) {
      validateNumber(row.months, 'months', errors, 'months');
    }
    if (Object.keys(errors).length > 0) {
      result[row.id] = errors;
    }
  }
  return result;
}

function focusFirstProjectError(errors: NewEstimateFormErrors): void {
  const first = FIELD_ORDER.find((field) => errors[field]);
  if (first) {
    document.getElementById(first)?.focus();
  }
}

const NEXT_STEPS = [
  {
    step: '1',
    title: 'Project details',
    detail: 'Name, scope, category and complexity on this screen.',
    phase: 'Now',
    tone: 'success' as const,
  },
  {
    step: '2',
    title: 'Cost lines',
    detail: 'Personnel, tooling, infrastructure and other costs.',
    phase: 'Now',
    tone: 'success' as const,
  },
  {
    step: '3',
    title: 'Currency & timing',
    detail: 'Choose one currency and an optional planned window.',
    phase: 'Now',
    tone: 'success' as const,
  },
  {
    step: '4',
    title: 'Cost estimate',
    detail: 'The estimation service totals the draft on calculate.',
    phase: 'Now',
    tone: 'success' as const,
  },
  {
    step: '5',
    title: 'Compare & scenarios',
    detail: 'Scenario comparison and what-if analysis.',
    phase: 'Phase 03',
    tone: 'neutral' as const,
  },
];

export default function NewEstimatePage() {
  const { addEstimate, persistenceAvailable } = useEstimates();
  const [values, setValues] = useState<NewEstimateFormValues>(INITIAL_VALUES);
  const [projectErrors, setProjectErrors] = useState<NewEstimateFormErrors>({});
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>('checking');

  const [personnelRows, setPersonnelRows] = useState<ReadonlyArray<PersonnelEditorRow>>([
    emptyPersonnelRow(),
  ]);
  const [toolingRows, setToolingRows] = useState<ReadonlyArray<CostLineRow>>([]);
  const [infrastructureRows, setInfrastructureRows] = useState<ReadonlyArray<CostLineRow>>([]);
  const [otherRows, setOtherRows] = useState<ReadonlyArray<CostLineRow>>([]);

  const [personnelErrors, setPersonnelErrors] = useState<
    Record<string, PersonnelEditorRowErrors>
  >({});
  const [toolingErrors, setToolingErrors] = useState<Record<string, CostLineRowErrors>>({});
  const [infrastructureErrors, setInfrastructureErrors] = useState<
    Record<string, CostLineRowErrors>
  >({});
  const [otherErrors, setOtherErrors] = useState<Record<string, CostLineRowErrors>>({});

  const [savedDraft, setSavedDraft] = useState<Estimate | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<ResultState>({ kind: 'idle' });

  const fetchServiceStatus = useCallback(async (): Promise<ServiceStatus> => {
    const health = await getHealth();
    return health.ok && health.data.status === 'ok' ? 'online' : 'offline';
  }, []);

  const checkService = useCallback(async () => {
    setServiceStatus('checking');
    setServiceStatus(await fetchServiceStatus());
  }, [fetchServiceStatus]);

  useEffect(() => {
    let cancelled = false;
    void fetchServiceStatus().then((status) => {
      if (!cancelled) {
        setServiceStatus(status);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fetchServiceStatus]);

  const updateValues = (patch: Partial<NewEstimateFormValues>) => {
    setValues((current) => ({ ...current, ...patch }));
  };

  const clearProjectError = (field: keyof NewEstimateFormErrors) => {
    setProjectErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current,
    );
  };

  const totalRowCount =
    personnelRows.length +
    toolingRows.length +
    infrastructureRows.length +
    otherRows.length;

  const updatePersonnel = (id: string, patch: Partial<PersonnelEditorRow>) => {
    setPersonnelRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const clearPersonnelError = (id: string, field: keyof PersonnelEditorRowErrors) => {
    setPersonnelErrors((current) => {
      const rowError = current[id];
      if (!rowError?.[field]) {
        return current;
      }
      return { ...current, [id]: { ...rowError, [field]: undefined } };
    });
  };

  const updateCostRow = (
    setter: typeof setToolingRows,
    id: string,
    patch: Partial<CostLineRow>,
  ) => {
    setter((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const clearCostError = (
    setter: typeof setToolingErrors,
    id: string,
    field: keyof CostLineRowErrors,
  ) => {
    setter((current) => {
      const rowError = current[id];
      if (!rowError?.[field]) {
        return current;
      }
      return { ...current, [id]: { ...rowError, [field]: undefined } };
    });
  };

  const removePersonnel = (id: string) => {
    setPersonnelRows((current) => current.filter((row) => row.id !== id));
    setPersonnelErrors((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const makeRemoveCost = (
    setRows: typeof setToolingRows,
    setErrors: typeof setToolingErrors,
  ) => (id: string) => {
    setRows((current) => current.filter((row) => row.id !== id));
    setErrors((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const removeTooling = makeRemoveCost(setToolingRows, setToolingErrors);
  const removeInfrastructure = makeRemoveCost(setInfrastructureRows, setInfrastructureErrors);
  const removeOther = makeRemoveCost(setOtherRows, setOtherErrors);

  const buildRequest = (): ProjectEstimateRequest => ({
    projectName: values.projectName.trim(),
    currency: values.currency,
    personnel: personnelRows.map((row) => ({
      role: row.role.trim(),
      people: parseAmount(row.people),
      hours: parseAmount(row.hours),
      hourlyRate: parseAmount(row.hourlyRate),
    })),
    tooling: toolingRows.map((row) => ({
      name: row.primary.trim(),
      amount: parseAmount(row.amount),
    })),
    infrastructure: infrastructureRows.map((row) => ({
      name: row.primary.trim(),
      monthlyCost: parseAmount(row.amount),
      months: parseAmount(row.months),
    })),
    other: otherRows.map((row) => ({
      description: row.primary.trim(),
      amount: parseAmount(row.amount),
    })),
  });

  const draftInput = (estimatedAmount: number | null) => ({
    projectName: values.projectName.trim(),
    scope: values.scope.trim(),
    category: values.category as Exclude<NewEstimateFormValues['category'], ''>,
    complexity: values.complexity as Exclude<NewEstimateFormValues['complexity'], ''>,
    currency: values.currency,
    plannedStartDate: values.plannedStartDate.trim() === '' ? null : values.plannedStartDate,
    durationWeeks:
      values.durationWeeks.trim() === '' ? null : Number(values.durationWeeks),
    notes: values.notes.trim() === '' ? undefined : values.notes.trim(),
    estimatedAmount,
  });

  const handleSaveDraft = () => {
    const nextErrors = validateProjectForm(values);
    setProjectErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      focusFirstProjectError(nextErrors);
      return;
    }
    if (!isProjectCategory(values.category) || !isProjectComplexity(values.complexity)) {
      return;
    }
    const estimate = addEstimate(draftInput(null));
    setSavedDraft(estimate);
  };

  const runCalculate = async () => {
    const nextProjectErrors = validateProjectForm(values);
    const nextPersonnelErrors = validatePersonnel(personnelRows);
    const nextToolingErrors = validateCostLines(toolingRows);
    const nextInfrastructureErrors = validateCostLines(infrastructureRows, true);
    const nextOtherErrors = validateCostLines(otherRows);

    setProjectErrors(nextProjectErrors);
    setPersonnelErrors(nextPersonnelErrors);
    setToolingErrors(nextToolingErrors);
    setInfrastructureErrors(nextInfrastructureErrors);
    setOtherErrors(nextOtherErrors);

    const hasErrors =
      Object.values(nextProjectErrors).some(Boolean) ||
      Object.keys(nextPersonnelErrors).length > 0 ||
      Object.keys(nextToolingErrors).length > 0 ||
      Object.keys(nextInfrastructureErrors).length > 0 ||
      Object.keys(nextOtherErrors).length > 0;
    if (hasErrors) {
      focusFirstProjectError(nextProjectErrors);
      return;
    }
    if (serviceStatus !== 'online') {
      return;
    }
    if (!isProjectCategory(values.category) || !isProjectComplexity(values.complexity)) {
      return;
    }

    setCalculating(true);
    setSavedDraft(null);
    setResult({ kind: 'loading' });

    const response = await calculateEstimate(buildRequest());
    setCalculating(false);

    if (response.ok) {
      const estimate = addEstimate(draftInput(response.data.total));
      setSavedDraft(estimate);
      setResult({ kind: 'success', estimate, result: response.data });
      return;
    }

    if (response.error.code === 'VALIDATION_ERROR') {
      setResult({
        kind: 'validation-error',
        message: response.error.message,
      });
      return;
    }

    setResult({ kind: 'error', error: response.error });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runCalculate();
  };

  const handleReset = () => {
    setValues(INITIAL_VALUES);
    setProjectErrors({});
    setPersonnelRows([emptyPersonnelRow()]);
    setToolingRows([]);
    setInfrastructureRows([]);
    setOtherRows([]);
    setPersonnelErrors({});
    setToolingErrors({});
    setInfrastructureErrors({});
    setOtherErrors({});
    setSavedDraft(null);
    setResult({ kind: 'idle' });
    document.getElementById('projectName')?.focus();
  };

  const calculateDisabled =
    calculating || serviceStatus !== 'online' || totalRowCount === 0;

  const disabledReason = (() => {
    if (calculating) return undefined;
    if (serviceStatus === 'checking') return 'Checking the estimation service…';
    if (serviceStatus === 'offline') {
      return 'The estimation service is offline — calculation is paused. Start the backend and retry.';
    }
    if (totalRowCount === 0) {
      return 'Add at least one cost line (personnel, tooling, infrastructure or other).';
    }
    return undefined;
  })();

  return (
    <>
      <PageHeader
        eyebrow="New estimate"
        title="Create a project estimate"
        description="Describe the project, add personnel, tooling, infrastructure and other costs, then calculate a transparent total in one currency."
      />

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.sectionGroup}>
              <SectionCard
                title="Project details"
                description="Required fields are marked with an asterisk."
              >
                <div className={styles.fieldRow}>
                  <TextField
                    id="projectName"
                    label="Project name"
                    required
                    value={values.projectName}
                    onChange={(value) => {
                      updateValues({ projectName: value });
                      clearProjectError('projectName');
                    }}
                    error={projectErrors.projectName}
                    hint="A short, recognisable name for this estimate."
                    placeholder="e.g. Atlas Platform Rebuild"
                    maxLength={80}
                  />

                  <TextField
                    id="scope"
                    label="Scope"
                    required
                    value={values.scope}
                    onChange={(value) => {
                      updateValues({ scope: value });
                      clearProjectError('scope');
                    }}
                    error={projectErrors.scope}
                    hint="One sentence on what this project covers."
                    placeholder="e.g. Re-platform the billing core onto a managed runtime"
                    maxLength={160}
                  />
                </div>

                <div className={styles.fieldRow}>
                  <SelectField
                    id="category"
                    label="Category"
                    required
                    value={values.category}
                    onChange={(value) => {
                      updateValues({ category: isProjectCategory(value) ? value : '' });
                      clearProjectError('category');
                    }}
                    options={PROJECT_CATEGORY_OPTIONS}
                    error={projectErrors.category}
                    placeholder="Select a category"
                  />

                  <SelectField
                    id="complexity"
                    label="Complexity"
                    required
                    value={values.complexity}
                    onChange={(value) => {
                      updateValues({ complexity: isProjectComplexity(value) ? value : '' });
                      clearProjectError('complexity');
                    }}
                    options={PROJECT_COMPLEXITY_OPTIONS}
                    error={projectErrors.complexity}
                    placeholder="Select a complexity"
                  />
                </div>

                <div className={styles.fieldRow}>
                  <SelectField
                    id="currency"
                    label="Currency"
                    required
                    value={values.currency}
                    onChange={(value) => {
                      updateValues({ currency: value as CurrencyCode });
                    }}
                    options={CURRENCY_OPTIONS}
                    hint="One currency per estimate. Live currency conversion is not configured."
                  />

                  <TextField
                    id="plannedStartDate"
                    label="Planned start date"
                    type="date"
                    value={values.plannedStartDate}
                    onChange={(value) => {
                      updateValues({ plannedStartDate: value });
                      clearProjectError('plannedStartDate');
                    }}
                    error={projectErrors.plannedStartDate}
                    hint="Optional. Leave blank if the schedule is not set."
                  />
                </div>

                <TextField
                  id="durationWeeks"
                  label="Duration (weeks)"
                  type="number"
                  min={0}
                  step="1"
                  inputMode="numeric"
                  value={values.durationWeeks}
                  onChange={(value) => {
                    updateValues({ durationWeeks: value });
                    clearProjectError('durationWeeks');
                  }}
                  error={projectErrors.durationWeeks}
                  hint="Optional. A rough schedule length."
                  placeholder="e.g. 12"
                />

                <TextAreaField
                  id="notes"
                  label="Notes"
                  value={values.notes}
                  onChange={(value) => {
                    updateValues({ notes: value });
                    clearProjectError('notes');
                  }}
                  error={projectErrors.notes}
                  hint="Optional working notes for this estimate."
                  placeholder="Assumptions, risks or context"
                  maxLength={500}
                />
              </SectionCard>
            </div>

            <div className={styles.sectionGroup}>
              <PersonnelEditor
                rows={personnelRows}
                errors={personnelErrors}
                currency={values.currency}
                disabled={calculating}
                onAdd={() => setPersonnelRows((current) => [...current, emptyPersonnelRow()])}
                onRemove={removePersonnel}
                onChange={updatePersonnel}
                onClearError={clearPersonnelError}
              />

              <CostLinesEditor
                title="Tooling"
                description="One-off tools, licences and equipment. Cost = the amount you enter."
                icon={Layers}
                primaryLabel="Tool or licence"
                primaryPlaceholder="e.g. Design suite licence"
                amountLabel="Cost"
                currency={values.currency}
                rows={toolingRows}
                errors={toolingErrors}
                emptyTitle="No tooling costs yet"
                emptyDescription="Add tools, licences or equipment if this project needs them."
                addLabel="Add a tool"
                disabled={calculating}
                onAdd={() => setToolingRows((current) => [...current, emptyCostRow('tooling')])}
                onRemove={removeTooling}
                onChange={(id, patch) => updateCostRow(setToolingRows, id, patch)}
                onClearError={(id, field) => clearCostError(setToolingErrors, id, field)}
              />

              <CostLinesEditor
                title="Infrastructure"
                description="Recurring resources. Cost = monthly cost × months."
                icon={Layers}
                primaryLabel="Resource"
                primaryPlaceholder="e.g. Cloud hosting"
                amountLabel="Monthly cost"
                monthsLabel="Months"
                currency={values.currency}
                rows={infrastructureRows}
                errors={infrastructureErrors}
                emptyTitle="No infrastructure costs yet"
                emptyDescription="Add recurring resources such as hosting or databases."
                addLabel="Add a resource"
                disabled={calculating}
                onAdd={() =>
                  setInfrastructureRows((current) => [...current, emptyCostRow('infrastructure')])
                }
                onRemove={removeInfrastructure}
                onChange={(id, patch) => updateCostRow(setInfrastructureRows, id, patch)}
                onClearError={(id, field) => clearCostError(setInfrastructureErrors, id, field)}
              />

              <CostLinesEditor
                title="Other costs"
                description="Anything else: contingency, travel, training or third-party fees."
                icon={Layers}
                primaryLabel="Description"
                primaryPlaceholder="e.g. Contingency"
                amountLabel="Cost"
                currency={values.currency}
                rows={otherRows}
                errors={otherErrors}
                emptyTitle="No other costs yet"
                emptyDescription="Add contingency, travel or other one-off costs if needed."
                addLabel="Add a cost"
                disabled={calculating}
                onAdd={() => setOtherRows((current) => [...current, emptyCostRow('other')])}
                onRemove={removeOther}
                onChange={(id, patch) => updateCostRow(setOtherRows, id, patch)}
                onClearError={(id, field) => clearCostError(setOtherErrors, id, field)}
              />
            </div>

            {savedDraft && result.kind === 'idle' ? (
              <p className={styles.savedNote} role="status">
                <CheckCircle2 size={16} aria-hidden="true" />
                Draft &ldquo;{savedDraft.projectName}&rdquo; saved to this browser.
              </p>
            ) : null}

            <EstimateResultCard
              state={result}
              onRetry={() => {
                void runCalculate();
              }}
            />

            <div className={styles.actions}>
              <Button
                type="submit"
                disabled={calculateDisabled}
                iconStart={
                  calculating ? (
                    <Loader2 className={styles.spinner} size={16} aria-hidden="true" />
                  ) : (
                    <Calculator size={16} aria-hidden="true" />
                  )
                }
                aria-describedby={disabledReason ? 'calculate-reason' : undefined}
              >
                {calculating ? 'Calculating…' : 'Calculate estimate'}
              </Button>
              <Button
                variant="secondary"
                iconStart={<Save size={16} aria-hidden="true" />}
                onClick={handleSaveDraft}
                disabled={calculating}
              >
                Save draft estimate
              </Button>
              <Button
                variant="ghost"
                iconStart={<RotateCcw size={16} aria-hidden="true" />}
                onClick={handleReset}
                disabled={calculating}
              >
                Reset form
              </Button>
            </div>

            {disabledReason ? (
              <p className={styles.reason} id="calculate-reason" aria-live="polite">
                {disabledReason}
                {serviceStatus === 'offline' ? (
                  <>
                    {' '}
                    <Button variant="ghost" size="sm" onClick={() => void checkService()}>
                      Retry connection
                    </Button>
                  </>
                ) : null}
              </p>
            ) : null}

            <p className={styles.formNote}>
              Calculate sends your cost lines to the estimation service and saves the resulting
              draft in this browser. If the service is offline you can only save an unpriced
              draft.
            </p>
          </form>
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
                Browser storage is unavailable, so saved drafts will not persist on this
                device.
              </p>
            ) : null}
          </SectionCard>

          <SectionCard title="Why start here">
            <p className={styles.asideText}>
              <ClipboardList size={16} aria-hidden="true" />
              Capturing project details and cost lines in one place keeps every estimate
              organised and ready to total.
            </p>
            <p className={styles.asideText}>
              <Scale size={16} aria-hidden="true" />
              Scenario comparison and what-if analysis will build on these same project records.
            </p>
          </SectionCard>
        </aside>
      </div>
    </>
  );
}