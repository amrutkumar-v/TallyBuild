import { useEffect, useRef } from 'react';
import { Bot, RefreshCw, X } from 'lucide-react';

import { useAssistantFlow } from '../../features/assistant/useAssistantFlow';
import { AssistantComposer } from './AssistantComposer';
import { MessageBubble, TypingIndicator } from './AssistantMessages';
import { AssistantResult } from './AssistantResult';
import { AssistantReview } from './AssistantReview';
import styles from './Assistant.module.css';

export function AssistantConversation({ onClose }: { onClose: () => void }): React.JSX.Element {
  const flow = useAssistantFlow();
  const { state, step } = flow;
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = threadRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [state.messages.length, state.busy]);

  const progress =
    state.stage === 'overview' || state.stage === 'inputs'
      ? Math.round((state.stepIndex / flow.totalSteps) * 100)
      : 100;

  return (
    <>
      <header className={styles.header}>
        <span className={styles.avatar} aria-hidden="true">
          <Bot />
        </span>
        <div className={styles.headerText}>
          <p className={styles.title}>TallyBuild estimation assistant</p>
          <p className={styles.subtitle}>Guided software cost estimation</p>
        </div>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close assistant">
          <X aria-hidden="true" />
        </button>
      </header>

      <div className={styles.progress} aria-hidden="true">
        <span className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.thread} role="log" aria-live="polite" aria-label="Conversation" ref={threadRef}>
        {state.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {state.busy ? <TypingIndicator /> : null}
      </div>

      <div className={styles.footer}>
        {state.stage === 'overview' || state.stage === 'inputs' ? (
          step ? (
            <AssistantComposer
              key={step.id}
              step={step}
              stepNumber={state.stepIndex + 1}
              totalSteps={flow.totalSteps}
              draft={state.draft}
              currency={state.draft.currency}
              fieldError={state.fieldError}
              busy={state.busy}
              canGoBack={state.stepIndex > 0}
              showSuggestions={flow.showSuggestions}
              suggestions={flow.suggestions}
              onAnswer={flow.answer}
              onSuggestion={flow.useSuggestion}
              onCurrencyChange={flow.setCurrency}
              onBack={flow.back}
            />
          ) : null
        ) : null}

        {state.stage === 'review' ? (
          <AssistantReview
            draft={state.draft}
            onCurrencyChange={flow.setCurrency}
            onEditStep={flow.editStep}
            onConfirm={flow.confirm}
            onBack={flow.back}
          />
        ) : null}

        {state.stage === 'result' && state.result ? (
          <AssistantResult
            estimate={state.result}
            onStartAnother={flow.reset}
            onOpenWorkspace={flow.openWorkspace}
            onClose={onClose}
          />
        ) : null}

        {state.stage === 'error' ? (
          <div className={styles.composer}>
            <p className={styles.error} role="alert">
              {state.error ?? 'Something went wrong while producing the estimate.'}
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnQuiet}`}
                onClick={flow.back}
              >
                Back to review
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={flow.retry}
              >
                <RefreshCw aria-hidden="true" />
                Try again
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
