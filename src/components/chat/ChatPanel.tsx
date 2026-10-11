import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, Bot, Check, Plus, Send, Sparkles, X } from 'lucide-react';

import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import type { CurrencyCode } from '../../types';
import { currencyOptions } from '../../constants/labels';
import {
  constraintPresets,
  type ChatMessage,
  type IntakeDraft,
  type IntakeField,
} from '../../features/intake/intakeFlow';
import styles from './ChatPanel.module.css';

export interface ChatPanelProps {
  messages: ChatMessage[];
  field: IntakeField | null;
  stepNumber: number;
  totalSteps: number;
  currency: CurrencyCode;
  draft: IntakeDraft;
  fieldError: string | null;
  working: boolean;
  createError: string | null;
  canGoBack: boolean;
  onAnswer: (field: IntakeField, value: string | string[]) => void;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onBack: () => void;
  onCreate: () => void;
}

export function ChatPanel({
  messages,
  field,
  stepNumber,
  totalSteps,
  currency,
  draft,
  fieldError,
  working,
  createError,
  canGoBack,
  onAnswer,
  onCurrencyChange,
  onBack,
  onCreate,
}: ChatPanelProps): React.JSX.Element {
  const endRef = useRef<HTMLDivElement>(null);
  const progress = field ? Math.round(((stepNumber - 1) / totalSteps) * 100) : 100;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length, working]);

  return (
    <section className={styles.panel} aria-label="Estimate intake chat">
      <header className={styles.header}>
        <div className={styles.identity}>
          <span className={styles.avatar} aria-hidden="true">
            <Bot />
          </span>
          <div>
            <p className={styles.name}>Intake assistant</p>
            <p className={styles.step}>
              {field ? `Question ${stepNumber} of ${totalSteps}` : 'Review your brief'}
            </p>
          </div>
        </div>
        <Badge tone="accent" title="Deterministic guided questions, not an AI model">
          Guided demo — not AI
        </Badge>
      </header>

      <div className={styles.progress} aria-hidden="true">
        <span className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.thread} role="log" aria-label="Conversation">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {working ? (
          <div className={cn(styles.message, styles.assistant)}>
            <p className={styles.bubble}>
              <span className={styles.thinking} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="visually-hidden">Assistant is working</span>
            </p>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className={styles.composerArea}>
        <Composer
          key={field?.id ?? 'review'}
          field={field}
          currency={currency}
          draft={draft}
          error={fieldError}
          working={working}
          createError={createError}
          canGoBack={canGoBack}
          onAnswer={onAnswer}
          onCurrencyChange={onCurrencyChange}
          onBack={onBack}
          onCreate={onCreate}
        />
      </div>
    </section>
  );
}

function MessageBubble({ message }: { message: ChatMessage }): React.JSX.Element {
  const isUser = message.role === 'user';
  return (
    <div className={cn(styles.message, isUser ? styles.user : styles.assistant)}>
      <span className="visually-hidden">{isUser ? 'You said: ' : 'Assistant said: '}</span>
      <p className={styles.bubble}>{message.text}</p>
    </div>
  );
}

interface ComposerProps {
  field: IntakeField | null;
  currency: CurrencyCode;
  draft: IntakeDraft;
  error: string | null;
  working: boolean;
  createError: string | null;
  canGoBack: boolean;
  onAnswer: (field: IntakeField, value: string | string[]) => void;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onBack: () => void;
  onCreate: () => void;
}

function Composer({
  field,
  currency,
  draft,
  error,
  working,
  createError,
  canGoBack,
  onAnswer,
  onCurrencyChange,
  onBack,
  onCreate,
}: ComposerProps): React.JSX.Element {
  const [text, setText] = useState('');
  const [items, setItems] = useState<string[]>(() => {
    if (field?.kind === 'constraints') return draft.constraints;
    if (field?.kind === 'open-questions') return draft.openQuestions;
    return [];
  });
  const [pending, setPending] = useState('');

  if (!field) {
    return (
      <div className={styles.review}>
        <div className={styles.reviewCopy}>
          <p className={styles.reviewTitle}>Everything required is captured.</p>
          <p className={styles.reviewText}>
            Create the estimate to open the breakdown editor, add or adjust the scope, then
            generate effort, cost and timeline.
          </p>
        </div>
        {createError ? (
          <p className={styles.error} role="alert">
            {createError}
          </p>
        ) : null}
        <div className={styles.actions}>
          {canGoBack ? (
            <Button variant="ghost" onClick={onBack} disabled={working}>
              <ArrowLeft aria-hidden="true" />
              Back
            </Button>
          ) : null}
          <Button onClick={onCreate} disabled={working}>
            <Sparkles aria-hidden="true" />
            Create estimate
          </Button>
        </div>
      </div>
    );
  }

  if (field.kind === 'choice') {
    return (
      <div className={styles.composer}>
        <div className={styles.choices} role="group" aria-label={field.prompt}>
          {(field.choices ?? []).map((choice) => (
            <button
              key={choice.value}
              type="button"
              className={styles.choice}
              onClick={() => onAnswer(field, choice.value)}
              disabled={working}
            >
              {choice.label}
            </button>
          ))}
        </div>
        <FooterActions canGoBack={canGoBack} working={working} onBack={onBack} />
      </div>
    );
  }

  if (field.kind === 'constraints' || field.kind === 'open-questions') {
    const addItem = (): void => {
      const value = pending.trim();
      if (!value) return;
      setItems((prev) => (prev.includes(value) ? prev : [...prev, value]));
      setPending('');
    };
    const togglePreset = (preset: string): void => {
      setItems((prev) =>
        prev.includes(preset) ? prev.filter((entry) => entry !== preset) : [...prev, preset],
      );
    };
    return (
      <div className={styles.composer}>
        {field.kind === 'constraints' ? (
          <div className={styles.chips} role="group" aria-label="Common constraints">
            {constraintPresets.map((preset) => {
              const selected = items.includes(preset);
              return (
                <button
                  key={preset}
                  type="button"
                  className={cn(styles.chip, selected && styles.chipActive)}
                  aria-pressed={selected}
                  onClick={() => togglePreset(preset)}
                  disabled={working}
                >
                  {selected ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
                  {preset}
                </button>
              );
            })}
          </div>
        ) : null}

        {items.length ? (
          <ul className={styles.itemList}>
            {items.map((item) => (
              <li key={item} className={styles.item}>
                <span>{item}</span>
                <button
                  type="button"
                  className={styles.itemRemove}
                  aria-label={`Remove ${item}`}
                  onClick={() => setItems((prev) => prev.filter((entry) => entry !== item))}
                  disabled={working}
                >
                  <X aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className={styles.inputRow}>
          <input
            className={styles.input}
            value={pending}
            placeholder={
              field.kind === 'constraints' ? 'Add a custom constraint…' : 'Add an open question…'
            }
            onChange={(event) => setPending(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addItem();
              }
            }}
            disabled={working}
            aria-label={field.kind === 'constraints' ? 'Add a custom constraint' : 'Add an open question'}
          />
          <Button variant="secondary" size="sm" onClick={addItem} disabled={working || !pending.trim()}>
            Add
          </Button>
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <div className={styles.actions}>
          {canGoBack ? (
            <Button variant="ghost" onClick={onBack} disabled={working}>
              <ArrowLeft aria-hidden="true" />
              Back
            </Button>
          ) : null}
          <Button
            variant="ghost"
            onClick={() => onAnswer(field, [])}
            disabled={working}
          >
            Skip
          </Button>
          <Button onClick={() => onAnswer(field, items)} disabled={working}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    const value = text.trim();
    if (!value && field.required) return;
    onAnswer(field, text);
  };

  const submitButton = (
    <Button type="submit" disabled={working || (field.required && !text.trim())}>
      <Send aria-hidden="true" />
      Send
    </Button>
  );

  return (
    <form className={styles.composer} onSubmit={submit}>
      {field.kind === 'textarea' ? (
        <textarea
          className={cn(styles.input, styles.textarea)}
          value={text}
          placeholder={field.placeholder}
          onChange={(event) => setText(event.target.value)}
          disabled={working}
          aria-label={field.prompt}
          autoFocus
        />
      ) : (
        <div className={styles.inputRow}>
          <input
            className={styles.input}
            type={field.kind === 'number' ? 'number' : field.kind === 'date' ? 'date' : 'text'}
            inputMode={field.kind === 'number' ? 'numeric' : undefined}
            value={text}
            placeholder={field.placeholder}
            onChange={(event) => setText(event.target.value)}
            disabled={working}
            aria-label={field.prompt}
            autoFocus
          />
          {field.id === 'rate' ? (
            <select
              className={styles.currency}
              value={currency}
              onChange={(event) => onCurrencyChange(event.target.value as CurrencyCode)}
              aria-label="Currency"
              disabled={working}
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

      {field.kind === 'textarea' ? (
        <div className={styles.actions}>{submitButton}</div>
      ) : (
        <div className={styles.actions}>
          {canGoBack ? (
            <Button variant="ghost" onClick={onBack} disabled={working}>
              <ArrowLeft aria-hidden="true" />
              Back
            </Button>
          ) : null}
          {submitButton}
        </div>
      )}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : field.help ? (
        <p className={styles.help}>{field.help}</p>
      ) : null}
    </form>
  );
}

function FooterActions({
  canGoBack,
  working,
  onBack,
}: {
  canGoBack: boolean;
  working: boolean;
  onBack: () => void;
}): React.JSX.Element | null {
  if (!canGoBack) return null;
  return (
    <div className={styles.actions}>
      <Button variant="ghost" size="sm" onClick={onBack} disabled={working}>
        <ArrowLeft aria-hidden="true" />
        Back
      </Button>
    </div>
  );
}
