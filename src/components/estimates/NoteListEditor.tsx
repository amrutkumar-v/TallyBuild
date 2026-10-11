import { useState } from 'react';
import { Plus, X } from 'lucide-react';

import { Button } from '../ui/Button';
import styles from './NoteListEditor.module.css';

/** Editable list of short free-text notes (assumptions or open questions). */
export function NoteListEditor({
  items,
  onChange,
  addLabel,
  placeholder,
  emptyText,
  disabled = false,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  addLabel: string;
  placeholder: string;
  emptyText: string;
  disabled?: boolean;
}): React.JSX.Element {
  const [pending, setPending] = useState('');

  const add = (): void => {
    const value = pending.trim();
    if (!value) return;
    onChange([...items, value]);
    setPending('');
  };

  return (
    <div className={styles.editor}>
      {items.length === 0 ? (
        <p className={styles.empty}>{emptyText}</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className={styles.row}>
              <input
                className={styles.input}
                value={item}
                onChange={(event) =>
                  onChange(items.map((entry, i) => (i === index ? event.target.value : entry)))
                }
                aria-label={`${addLabel} ${index + 1}`}
                disabled={disabled}
              />
              <button
                type="button"
                className={styles.remove}
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                aria-label={`Remove item ${index + 1}`}
                disabled={disabled}
              >
                <X aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.addRow}>
        <input
          className={styles.input}
          value={pending}
          onChange={(event) => setPending(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          disabled={disabled}
        />
        <Button variant="secondary" size="sm" onClick={add} disabled={disabled || !pending.trim()}>
          <Plus aria-hidden="true" />
          {addLabel}
        </Button>
      </div>
    </div>
  );
}
