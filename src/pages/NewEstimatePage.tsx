import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Calculator,
  CheckCircle2,
  ClipboardList,
  Loader2,
  RotateCcw,
  Save,
  Scale,
} from 'lucide-react';

import { getHealth, getProducts, calculateEstimate } from '../api';
import { LineItemsEditor } from '../components/estimates/LineItemsEditor';
import type {
  CatalogueStatus,
  LineFieldErrors,
  MaterialLine,
} from '../components/estimates/LineItemsEditor';
import { EstimateResultCard } from '../components/estimates/EstimateResultCard';
import type { ResultState } from '../components/estimates/EstimateResultCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { SelectField, TextAreaField, TextField } from '../components/ui/Fields';
import { PROJECT_TYPE_OPTIONS, isProjectType } from '../constants/labels';
import { SAMPLE_PRODUCTS } from '../estimation';
import type { EstimateRequest, EstimateValidationError, MaterialProduct } from '../estimation';
import { useEstimates } from '../store/estimates-context';
import type { Estimate, NewEstimateFormErrors, NewEstimateFormValues } from '../types';

import styles from './NewEstimatePage.module.css';

const INITIAL_VALUES: NewEstimateFormValues = {
  projectName: '',
  location: '',
  projectType: '',
  notes: '',
};

interface CatalogueSnapshot {
  status: CatalogueStatus;
  products: readonly MaterialProduct[];
}

const FIELD_ORDER: ReadonlyArray<keyof NewEstimateFormErrors> = [
  'projectName',
  'location',
  'projectType',
  'notes',
];

let lineIdCounter = 0;

function nextLineId(): string {
  lineIdCounter += 1;
  return `line-${lineIdCounter}`;
}

function initialLine(): MaterialLine {
  return { id: nextLineId(), productId: '', quantity: '' };
}

function validateProjectForm(values: NewEstimateFormValues): NewEstimateFormErrors {
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

function validateLines(
  lines: ReadonlyArray<MaterialLine>,
): Record<string, LineFieldErrors> {
  const errors: Record<string, LineFieldErrors> = {};
  for (const line of lines) {
    const lineError: LineFieldErrors = {};
    if (line.productId === '') {
      lineError.productId = 'Choose a product.';
    }
    const quantity = line.quantity.trim();
    if (quantity === '') {
      lineError.quantity = 'Enter a quantity.';
    } else {
      const numeric = Number(quantity);
      if (!Number.isFinite(numeric)) {
        lineError.quantity = 'Enter a valid number.';
      } else if (numeric < 0) {
        lineError.quantity = "Quantity can't be negative.";
      }
    }
    if (lineError.productId !== undefined || lineError.quantity !== undefined) {
      errors[line.id] = lineError;
    }
  }
  return errors;
}

function isUsableLine(
  line: MaterialLine,
  products: readonly MaterialProduct[],
): boolean {
  const numeric = Number(line.quantity);
  return (
    products.some((product) => product.id === line.productId) &&
    line.quantity.trim() !== '' &&
    Number.isFinite(numeric) &&
    numeric >= 0
  );
}

function focusFirstProjectError(errors: NewEstimateFormErrors): boolean {
  const first = FIELD_ORDER.find((field) => errors[field]);
  if (first) {
    document.getElementById(first)?.focus();
    return true;
  }
  return false;
}

function focusFirstLineError(lineErrors: Record<string, LineFieldErrors>): boolean {
  for (const [id, error] of Object.entries(lineErrors)) {
    const field = error.quantity !== undefined ? 'quantity' : 'productId';
    const element = document.getElementById(`line-${id}-${field}`);
    if (element) {
      element.focus();
      return true;
    }
  }
  return false;
}

function resolveLineIndex(
  detail: EstimateValidationError,
  eligibleLines: ReadonlyArray<MaterialLine>,
): MaterialLine | undefined {
  if (
    typeof detail.lineIndex === 'number' &&
    detail.lineIndex >= 0 &&
    detail.lineIndex < eligibleLines.length
  ) {
    return eligibleLines[detail.lineIndex];
  }
  if (detail.productId) {
    return eligibleLines.find((line) => line.productId === detail.productId);
  }
  return undefined;
}

function mapServerLineErrors(
  details: readonly EstimateValidationError[],
  eligibleLines: ReadonlyArray<MaterialLine>,
): { lineErrors: Record<string, LineFieldErrors>; globalMessages: string[] } {
  const lineErrors: Record<string, LineFieldErrors> = {};
  const globalMessages: string[] = [];

  for (const detail of details) {
    const row = resolveLineIndex(detail, eligibleLines);
    if (!row) {
      globalMessages.push(detail.message);
      continue;
    }
    const current = lineErrors[row.id] ?? {};
    if (detail.code === 'MISSING_PRODUCT') {
      current.productId = detail.message;
    } else if (
      detail.code === 'INVALID_QUANTITY' ||
      detail.code === 'INVALID_UNIT' ||
      detail.code === 'INCOMPATIBLE_UNIT' ||
      detail.code === 'UNIT_CONVERSION_UNSUPPORTED'
    ) {
      current.quantity = detail.message;
    } else {
      globalMessages.push(detail.message);
      continue;
    }
    lineErrors[row.id] = current;
  }

  return { lineErrors, globalMessages };
}

function calculateDisabledReason(
  status: CatalogueStatus,
  completeLineCount: number,
  calculating: boolean,
): string | undefined {
  if (calculating) {
    return undefined;
  }
  if (status === 'loading') {
    return 'Loading the product catalogue…';
  }
  if (status === 'offline') {
    return 'The estimation service is offline — live pricing is paused. Start the backend and retry.';
  }
  if (status === 'empty') {
    return 'The catalogue is empty, so nothing can be priced right now.';
  }
  if (completeLineCount === 0) {
    return 'Add at least one material with a product and quantity.';
  }
  return undefined;
}

const NEXT_STEPS = [
  {
    step: '1',
    title: 'Project details',
    detail: 'Name, location and type on this screen.',
    phase: 'Now',
    tone: 'success' as const,
  },
  {
    step: '2',
    title: 'Quantities & materials',
    detail: 'Line items priced from the live service catalogue.',
    phase: 'Now',
    tone: 'success' as const,
  },
  {
    step: '3',
    title: 'Cost estimate',
    detail: 'The estimation engine prices the draft on submit.',
    phase: 'Now',
    tone: 'success' as const,
  },
  {
    step: '4',
    title: 'Compare & scenarios',
    detail: 'Product comparison and what-if analysis.',
    phase: 'Phase 03',
    tone: 'neutral' as const,
  },
];

export default function NewEstimatePage() {
  const { addEstimate, persistenceAvailable } = useEstimates();
  const [values, setValues] = useState<NewEstimateFormValues>(INITIAL_VALUES);
  const [projectErrors, setProjectErrors] = useState<NewEstimateFormErrors>({});
  const [catalogueStatus, setCatalogueStatus] = useState<CatalogueStatus>('loading');
  const [products, setProducts] = useState<readonly MaterialProduct[]>([]);
  const [lines, setLines] = useState<ReadonlyArray<MaterialLine>>([initialLine()]);
  const [lineErrors, setLineErrors] = useState<Record<string, LineFieldErrors>>({});
  const [savedDraft, setSavedDraft] = useState<Estimate | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<ResultState>({ kind: 'idle' });

  const fetchCatalogue = useCallback(async (): Promise<CatalogueSnapshot> => {
    const health = await getHealth();
    if (!health.ok || health.data.status !== 'ok') {
      return { status: 'offline', products: SAMPLE_PRODUCTS };
    }

    const list = await getProducts();
    if (!list.ok) {
      return { status: 'offline', products: SAMPLE_PRODUCTS };
    }

    if (list.data.products.length === 0) {
      return { status: 'empty', products: [] };
    }

    return { status: 'online', products: list.data.products };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchCatalogue().then((snapshot) => {
      if (cancelled) {
        return;
      }
      setCatalogueStatus(snapshot.status);
      setProducts(snapshot.products);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchCatalogue]);

  const retryCatalogue = () => {
    setCatalogueStatus('loading');
    setProducts([]);
    void fetchCatalogue().then((snapshot) => {
      setCatalogueStatus(snapshot.status);
      setProducts(snapshot.products);
    });
  };

  const updateValues = (patch: Partial<NewEstimateFormValues>) => {
    setValues((current) => ({ ...current, ...patch }));
  };

  const clearProjectError = (field: keyof NewEstimateFormErrors) => {
    setProjectErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current,
    );
  };

  const clearLineError = (lineId: string, field: keyof LineFieldErrors) => {
    setLineErrors((current) => {
      const line = current[lineId];
      if (!line || line[field] === undefined) {
        return current;
      }
      const next = { ...current, [lineId]: { ...line, [field]: undefined } };
      if (next[lineId].productId === undefined && next[lineId].quantity === undefined) {
        delete next[lineId];
      }
      return next;
    });
  };

  const clearLineQuantityError = (lineId: string) => clearLineError(lineId, 'quantity');
  const clearLineProductError = (lineId: string) => clearLineError(lineId, 'productId');

  const addLine = () => {
    setLines((current) => [...current, initialLine()]);
  };

  const removeLine = (lineId: string) => {
    setLines((current) => current.filter((line) => line.id !== lineId));
    setLineErrors((current) => {
      if (!current[lineId]) {
        return current;
      }
      const next = { ...current };
      delete next[lineId];
      return next;
    });
  };

  const changeLine = (lineId: string, patch: Partial<MaterialLine>) => {
    setLines((current) =>
      current.map((line) => (line.id === lineId ? { ...line, ...patch } : line)),
    );
  };

  const handleSaveDraft = () => {
    const nextErrors = validateProjectForm(values);
    setProjectErrors(nextErrors);
    if (focusFirstProjectError(nextErrors)) {
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
    setSavedDraft(estimate);
  };

  const runCalculate = async () => {
    const nextProjectErrors = validateProjectForm(values);
    const nextLineErrors = validateLines(lines);
    setProjectErrors(nextProjectErrors);
    setLineErrors(nextLineErrors);

    if (focusFirstProjectError(nextProjectErrors)) {
      return;
    }
    if (focusFirstLineError(nextLineErrors)) {
      return;
    }
    if (catalogueStatus !== 'online') {
      return;
    }
    if (!isProjectType(values.projectType)) {
      return;
    }

    const eligibleLines = lines.filter((line) => isUsableLine(line, products));
    if (eligibleLines.length === 0) {
      return;
    }

    const request: EstimateRequest = {
      projectName: values.projectName.trim(),
      lines: eligibleLines.map((line) => {
        const product = products.find((candidate) => candidate.id === line.productId);
        return {
          productId: line.productId,
          quantity: Number(line.quantity),
          unit: product?.unit,
        };
      }),
    };

    setCalculating(true);
    setSavedDraft(null);
    setResult({ kind: 'loading' });

    const response = await calculateEstimate(request);
    setCalculating(false);

    if (response.ok) {
      const estimate = addEstimate({
        projectName: values.projectName.trim(),
        location: values.location.trim(),
        projectType: values.projectType,
        notes: values.notes.trim() === '' ? undefined : values.notes.trim(),
        estimatedAmount: response.data.total,
      });
      setSavedDraft(estimate);
      setResult({ kind: 'success', estimate, result: response.data });
      return;
    }

    if (response.error.code === 'VALIDATION_ERROR' && response.error.details) {
      const { lineErrors: serverLineErrors, globalMessages } = mapServerLineErrors(
        response.error.details,
        eligibleLines,
      );
      setLineErrors(serverLineErrors);
      const summary = [
        ...globalMessages,
        Object.keys(serverLineErrors).length > 0 ? 'Some material lines were rejected.' : '',
      ]
        .filter(Boolean)
        .join(' ');
      setResult({
        kind: 'validation-error',
        message: summary || response.error.message,
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
    setLines([initialLine()]);
    setLineErrors({});
    setSavedDraft(null);
    setResult({ kind: 'idle' });
    document.getElementById('projectName')?.focus();
  };

  const completeLineCount = lines.filter((line) => isUsableLine(line, products)).length;
  const calculateDisabled = calculating || catalogueStatus !== 'online' || completeLineCount === 0;
  const disabledReason = calculateDisabledReason(
    catalogueStatus,
    completeLineCount,
    calculating,
  );

  return (
    <>
      <PageHeader
        eyebrow="New estimate"
        title="Create a project estimate"
        description="Add the project details, pick building materials and let the estimation service price the draft."
      />

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <SectionCard
              title="Project details"
              description="Required fields are marked with an asterisk."
            >
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
                  clearProjectError('location');
                }}
                error={projectErrors.location}
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
                  clearProjectError('projectType');
                }}
                error={projectErrors.projectType}
                options={PROJECT_TYPE_OPTIONS}
                placeholder="Select a project type"
              />

              <TextAreaField
                id="notes"
                label="Scope notes"
                value={values.notes}
                onChange={(value) => {
                  updateValues({ notes: value });
                  clearProjectError('notes');
                }}
                error={projectErrors.notes}
                hint="Optional — what is being built or renovated?"
                placeholder="Short description of the scope"
                maxLength={500}
              />
            </SectionCard>

            <LineItemsEditor
              status={catalogueStatus}
              products={products}
              lines={lines}
              errors={lineErrors}
              disabled={calculating}
              onAddLine={addLine}
              onRemoveLine={removeLine}
              onChangeLine={(lineId, patch) => {
                changeLine(lineId, patch);
                if (patch.productId !== undefined) {
                  clearLineProductError(lineId);
                }
                if (patch.quantity !== undefined) {
                  clearLineQuantityError(lineId);
                }
              }}
              onRetryCatalogue={retryCatalogue}
            />

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
                    <Loader2 size={16} className={styles.spinner} aria-hidden="true" />
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
              </p>
            ) : null}

            <p className={styles.formNote}>
              Calculate sends your material lines to the estimation service and saves the
              resulting draft in this browser. If the service is offline you can only save an
              unpriced draft.
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
              Capturing project details and quantities in one place keeps every estimate
              organised and ready to price.
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