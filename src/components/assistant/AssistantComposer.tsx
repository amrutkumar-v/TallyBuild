import { useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { ArrowLeft, Send } from 'lucide-react';

import { currencyOptions } from '../../constants/labels';
import type { CurrencyCode } from '../../types';
import type {
  AssistantDraft,
  AssistantFieldId,
  AssistantStep,
} from '../../features/assistant/assistantFlow';
import styles from './Assistant.module.css';

function draftValue(draft: AssistantDraft, id: AssistantFieldId): string {
  switch (id) {
    case 'requirements':
      return draft.requirements;
    case 'name':
      return draft.name;
    case 'teamSize':
      return draft.teamSize;
    case 'rate':
      return draft.rate;
    case 'deadline':
      return draft.deadline;
    default:
      return '';
  }
}

export interface Suggestion {
  label: string;
  brief: string;
}

export interface AssistantComposerProps {
  step: AssistantStep;
  stepNumber: number;
  totalSteps: number;
  draft: AssistantDraft;
  currency: CurrencyCode;
  fieldError: string | null;
  busy: boolean;
  canGoBack: boolean;
  showSuggestions: boolean;
  suggestions: Suggestion[];
  onAnswer: (value: string) => void;
  onSuggestion: (index: number) => void;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onBack: () => void;
}

export function AssistantComposer({
  step,
  stepNumber,
  totalSteps,
  draft,
  currency,
  fieldError,
  busy,
  canGoBack,
  showSuggestions,
  suggestions,
  onAnswer,
  onSuggestion,
  onCurrencyChange,
  onBack,
}: AssistantComposerProps): React.JSX.Element {
  const [text, setText] = useState(() => draftValue(draft, step.id));

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    if (busy) return;
    if (step.required && !text.trim()) return;
    onAnswer(text);
  };

  const onTextKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (busy) return;
      if (step.required && !text.trim()) return;
      onAnswer(text);
    }
  };

  return (
    <div className={styles.composer}>
      <div className={styles.stepMeta}>
        <span>
          Step {stepNumber} of {totalSteps} · guided questions, not an AI model
        </span>
      </div>

      {step.kind === 'choice' ? (
        <>
          <div className={styles.choices} role="group" aria-label={step.prompt}>
            {(step.choices ?? []).map((choice) => (
              <button
                key={choice.value}
                type="button"
                className={styles.choice}
                onClick={() => onAnswer(choice.value)}
                disabled={busy}
              >
                {choice.label}
              </button>
            ))}
          </div>
          {canGoBack ? (
            <div className={styles.actions}>
              <button type="button" className={`${styles.btn} ${styles.btnQuiet}`} onClick={onBack} disabled={busy}>
                <ArrowLeft aria-hidden="true" />
                Back
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <form className={styles.form} onSubmit={submit}>
          {showSuggestions ? (
            <div className={styles.suggestions} role="group" aria-label="Suggested prompts">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.label}
                  type="button"
                  className={styles.suggestion}
                  onClick={() => onSuggestion(index)}
                  disabled={busy}
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          ) : null}

          {step.kind === 'textarea' ? (
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={text}
              placeholder={step.placeholder}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={onTextKeyDown}
              disabled={busy}
              aria-label={step.prompt}
              aria-describedby={fieldError ? 'assistant-field-error' : undefined}
            />
          ) : (
            <div className={styles.inputRow}>
              <input
                className={styles.input}
                type={step.kind === 'number' ? 'number' : step.kind === 'date' ? 'date' : 'text'}
                inputMode={step.kind === 'number' ? 'numeric' : undefined}
                value={text}
                placeholder={step.placeholder}
                onChange={(event) => setText(event.target.value)}
                disabled={busy}
                aria-label={step.prompt}
                aria-describedby={fieldError ? 'assistant-field-error' : undefined}
              />
              {step.id === 'rate' ? (
                <select
                  className={styles.select}
                  value={currency}
                  onChange={(event) => onCurrencyChange(event.target.value as CurrencyCode)}
                  aria-label="Currency"
                  disabled={busy}
                >
                  {currencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          )}

          <div className={styles.actions}>
            {canGoBack ? (
              <button
                type="button"
                className={`${styles.btn} ${styles.btnQuiet}`}
                onClick={onBack}
                disabled={busy}
              >
                <ArrowLeft aria-hidden="true" />
                Back
              </button>
            ) : null}
            {!step.required ? (
              <button
                type="button"
                className={`${styles.btn} ${styles.btnQuiet}`}
                onClick={() => onAnswer('')}
                disabled={busy}
              >
                Skip
              </button>
            ) : null}
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={busy || (step.required && !text.trim())}
            >
              <Send aria-hidden="true" />
              Send
            </button>
          </div>
        </form>
      )}

      {fieldError ? (
        <p className={styles.error} id="assistant-field-error" role="alert">
          {fieldError}
        </p>
      ) : step.help ? (
        <p className={styles.help}>{step.help}</p>
      ) : null}
    </div>
  );
}
