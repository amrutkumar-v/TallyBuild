import { useState } from 'react';
import { Plus, X } from 'lucide-react';

import { Button } from '../ui/Button';
import {
  featureComplexityOptions,
  featureStatusLabels,
  scopePriorityOptions,
} from '../../constants/labels';
import { formatCurrency, formatDays } from '../../utils/format';
import { newId } from '../../utils/id';
import type {
  CurrencyCode,
  Feature,
  FeatureCost,
  FeatureComplexity,
  FeatureStatus,
  ScopePriority,
} from '../../types';
import styles from './FeatureEditor.module.css';

const statusOptions = (Object.keys(featureStatusLabels) as FeatureStatus[]).map((value) => ({
  value,
  label: featureStatusLabels[value],
}));

const selectOptionsClass = styles.select;

export function FeatureEditor({
  features,
  featureCosts = [],
  currency = 'INR',
  onChange,
  disabled = false,
}: {
  features: Feature[];
  featureCosts?: FeatureCost[];
  currency?: CurrencyCode;
  onChange: (features: Feature[]) => void;
  disabled?: boolean;
}): React.JSX.Element {
  const [newName, setNewName] = useState('');

  const patch = (id: string, changes: Partial<Feature>): void => {
    onChange(features.map((feature) => (feature.id === id ? { ...feature, ...changes } : feature)));
  };

  const remove = (id: string): void => {
    onChange(features.filter((feature) => feature.id !== id));
  };

  const add = (): void => {
    const name = newName.trim();
    if (!name) return;
    const feature: Feature = {
      id: newId('feat'),
      name,
      description: '',
      priority: 'should',
      complexity: 'moderate',
      status: 'proposed',
    };
    onChange([...features, feature]);
    setNewName('');
  };

  const costFor = (id: string): FeatureCost | undefined =>
    featureCosts.find((cost) => cost.featureId === id);

  return (
    <div className={styles.editor}>
      {features.length === 0 ? (
        <p className={styles.empty}>
          No features yet. Add the deliverables you expect this estimate to cover.
        </p>
      ) : (
        <ul className={styles.list}>
          {features.map((feature, index) => {
            const cost = costFor(feature.id);
            const excluded = feature.status === 'removed';
            return (
              <li key={feature.id} className={excluded ? styles.rowExcluded : styles.row}>
                <div className={styles.rowHead}>
                  <span className={styles.index} aria-hidden="true">
                    {index + 1}
                  </span>
                  <input
                    className={styles.nameInput}
                    value={feature.name}
                    onChange={(event) => patch(feature.id, { name: event.target.value })}
                    placeholder="Feature name"
                    aria-label={`Feature ${index + 1} name`}
                    disabled={disabled}
                  />
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={() => remove(feature.id)}
                    aria-label={`Remove ${feature.name || `feature ${index + 1}`}`}
                    disabled={disabled}
                  >
                    <X aria-hidden="true" />
                  </button>
                </div>

                <textarea
                  className={styles.desc}
                  value={feature.description}
                  onChange={(event) => patch(feature.id, { description: event.target.value })}
                  placeholder="What does this involve?"
                  aria-label={`Feature ${index + 1} description`}
                  rows={2}
                  disabled={disabled}
                />

                <div className={styles.controls}>
                  <label className={styles.control}>
                    <span className={styles.controlLabel}>Priority</span>
                    <select
                      className={selectOptionsClass}
                      value={feature.priority}
                      onChange={(event) =>
                        patch(feature.id, { priority: event.target.value as ScopePriority })
                      }
                      disabled={disabled}
                    >
                      {scopePriorityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.control}>
                    <span className={styles.controlLabel}>Complexity</span>
                    <select
                      className={selectOptionsClass}
                      value={feature.complexity}
                      onChange={(event) =>
                        patch(feature.id, {
                          complexity: event.target.value as FeatureComplexity,
                        })
                      }
                      disabled={disabled}
                    >
                      {featureComplexityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.control}>
                    <span className={styles.controlLabel}>Status</span>
                    <select
                      className={selectOptionsClass}
                      value={feature.status}
                      onChange={(event) =>
                        patch(feature.id, { status: event.target.value as FeatureStatus })
                      }
                      disabled={disabled}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {cost && !excluded ? (
                  <p className={styles.costLine}>
                    Last run: {formatDays(cost.effortDays)} ·{' '}
                    {formatCurrency(cost.cost.likely, currency)} likely
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <div className={styles.addRow}>
        <input
          className={styles.addInput}
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add();
            }
          }}
          placeholder="Add a feature, e.g. “Bulk CSV import”"
          aria-label="New feature name"
          disabled={disabled}
        />
        <Button variant="secondary" onClick={add} disabled={disabled || !newName.trim()}>
          <Plus aria-hidden="true" />
          Add feature
        </Button>
      </div>
    </div>
  );
}
