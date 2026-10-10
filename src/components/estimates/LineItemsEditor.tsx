import { Loader2, PackagePlus, PackageSearch, Plus, Trash2 } from 'lucide-react';
import type { ReactElement } from 'react';

import { getUnitLabel } from '../../estimation';
import type { MaterialProduct } from '../../estimation';
import { formatCurrency } from '../../utils/format';
import { Button } from '../ui/Button';
import { DemoNotice } from '../ui/DemoNotice';
import { EmptyState } from '../ui/EmptyState';
import { SelectField, TextField } from '../ui/Fields';
import { SectionCard } from '../ui/SectionCard';

import styles from './LineItemsEditor.module.css';

export interface MaterialLine {
  id: string;
  productId: string;
  quantity: string;
}

export interface LineFieldErrors {
  productId?: string;
  quantity?: string;
}

export type CatalogueStatus = 'loading' | 'online' | 'offline' | 'empty';

interface LineItemsEditorProps {
  status: CatalogueStatus;
  products: readonly MaterialProduct[];
  lines: ReadonlyArray<MaterialLine>;
  errors: Readonly<Record<string, LineFieldErrors>>;
  disabled: boolean;
  onAddLine: () => void;
  onRemoveLine: (lineId: string) => void;
  onChangeLine: (lineId: string, patch: Partial<MaterialLine>) => void;
  onRetryCatalogue: () => void;
}

interface LineRowProps {
  line: MaterialLine;
  products: readonly MaterialProduct[];
  error?: LineFieldErrors;
  disabled: boolean;
  onChange: (patch: Partial<MaterialLine>) => void;
  onRemove: () => void;
}

function LineRow({
  line,
  products,
  error,
  disabled,
  onChange,
  onRemove,
}: LineRowProps): ReactElement {
  const selected = products.find((product) => product.id === line.productId);
  const unit = selected ? getUnitLabel(selected.unit) : undefined;
  const options = products.map((product) => ({
    value: product.id,
    label: `${product.name} — ${formatCurrency(product.unitPrice)} / ${getUnitLabel(product.unit)}`,
  }));

  return (
    <li className={styles.line}>
      <SelectField
        id={`line-${line.id}-product`}
        label="Product"
        value={line.productId}
        onChange={(value) => onChange({ productId: value })}
        options={options}
        placeholder="Choose a product"
        required
        error={error?.productId}
        disabled={disabled}
      />
      <TextField
        id={`line-${line.id}-quantity`}
        label="Quantity"
        value={line.quantity}
        onChange={(value) => onChange({ quantity: value })}
        type="number"
        min={0}
        step="any"
        inputMode="decimal"
        placeholder="0"
        required
        error={error?.quantity}
        hint={unit ? `Unit: ${unit}` : undefined}
        disabled={disabled}
      />
      <Button
        variant="ghost"
        size="sm"
        className={styles.remove}
        iconStart={<Trash2 size={16} aria-hidden="true" />}
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${selected ? selected.name : 'material line'}`}
      >
        Remove
      </Button>
    </li>
  );
}

export function LineItemsEditor({
  status,
  products,
  lines,
  errors,
  disabled,
  onAddLine,
  onRemoveLine,
  onChangeLine,
  onRetryCatalogue,
}: LineItemsEditorProps): ReactElement {
  return (
    <SectionCard
      title="Materials & quantities"
      description="Choose building products and enter quantities to price."
    >
      {status === 'loading' ? (
        <div className={styles.busy} role="status">
          <Loader2 size={18} className={styles.spinner} aria-hidden="true" />
          <span>Loading the product catalogue…</span>
        </div>
      ) : status === 'empty' ? (
        <EmptyState
          icon={PackageSearch}
          title="The catalogue is empty"
          description="The estimation service returned no products, so nothing can be priced right now. Try again later."
        />
      ) : (
        <>
          {status === 'offline' ? (
            <DemoNotice
              action={
                <Button size="sm" variant="secondary" onClick={onRetryCatalogue}>
                  Retry
                </Button>
              }
            >
              The estimation service is offline, so the illustrative demo catalogue is showing
              and live pricing is paused. Start the backend and retry.
            </DemoNotice>
          ) : (
            <p className={styles.onlineNote}>
              Unit prices refresh from the estimation service each time you calculate.
            </p>
          )}

          {lines.length === 0 ? (
            <EmptyState
              compact
              icon={PackagePlus}
              title="No materials yet"
              description="Add the first material line to build this estimate."
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  iconStart={<Plus size={16} aria-hidden="true" />}
                  onClick={onAddLine}
                  disabled={disabled}
                >
                  Add a material
                </Button>
              }
            />
          ) : (
            <>
              <ul className={styles.lines}>
                {lines.map((line) => (
                  <LineRow
                    key={line.id}
                    line={line}
                    products={products}
                    error={errors[line.id]}
                    disabled={disabled}
                    onChange={(patch) => onChangeLine(line.id, patch)}
                    onRemove={() => onRemoveLine(line.id)}
                  />
                ))}
              </ul>
              <div className={styles.addWrap}>
                <Button
                  size="sm"
                  variant="secondary"
                  iconStart={<Plus size={16} aria-hidden="true" />}
                  onClick={onAddLine}
                  disabled={disabled}
                >
                  Add another material
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </SectionCard>
  );
}