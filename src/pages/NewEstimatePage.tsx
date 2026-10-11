import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

import { ChatPanel } from '../components/chat/ChatPanel';
import { IntakeLedger } from '../components/chat/IntakeLedger';
import { DemoNotice } from '../components/ui/DemoNotice';
import { PageHeader } from '../components/ui/PageHeader';
import { errorMessage } from '../services';
import { useEstimates } from '../store/estimates-context';
import { newId } from '../utils/id';
import {
  INTAKE_STEPS,
  buildProjectInput,
  createInitialDraft,
  deriveAssumptions,
  deriveMissingRequirements,
  formatAnswer,
  starterScopeFor,
  validateField,
  type ChatMessage,
  type IntakeDraft,
  type IntakeField,
} from '../features/intake/intakeFlow';
import type { Feature } from '../types';
import styles from './NewEstimatePage.module.css';

function applyValue(draft: IntakeDraft, id: IntakeField['id'], value: string | string[]): IntakeDraft {
  switch (id) {
    case 'requirements':
      return { ...draft, requirements: String(value) };
    case 'name':
      return { ...draft, name: String(value) };
    case 'projectType':
      return { ...draft, projectType: value as IntakeDraft['projectType'] };
    case 'complexity':
      return { ...draft, complexity: value as IntakeDraft['complexity'] };
    case 'teamSize':
      return { ...draft, teamSize: String(value) };
    case 'teamLocation':
      return { ...draft, teamLocation: value as IntakeDraft['teamLocation'] };
    case 'rate':
      return { ...draft, rate: String(value) };
    case 'deadline':
      return { ...draft, deadline: String(value) };
    case 'constraints':
      return { ...draft, constraints: Array.isArray(value) ? value : [] };
    case 'openQuestions':
      return { ...draft, openQuestions: Array.isArray(value) ? value : [] };
    default:
      return draft;
  }
}

function assistantMessage(text: string): ChatMessage {
  return { id: newId('msg'), role: 'assistant', text };
}

export function NewEstimatePage(): React.JSX.Element {
  const navigate = useNavigate();
  const { createEstimate, updateEstimate } = useEstimates();

  const [draft, setDraft] = useState<IntakeDraft>(() => createInitialDraft());
  const [stepIndex, setStepIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    assistantMessage(INTAKE_STEPS[0].prompt),
  ]);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const field = stepIndex < INTAKE_STEPS.length ? INTAKE_STEPS[stepIndex] : null;
  const totalSteps = INTAKE_STEPS.length;
  const canGoBack = stepIndex > 0;

  const handleAnswer = (answeredField: IntakeField, value: string | string[]): void => {
    const next = applyValue(draft, answeredField.id, value);
    const error = validateField(answeredField, next);
    if (error) {
      setFieldError(error);
      return;
    }
    setFieldError(null);

    const nextIndex = stepIndex + 1;
    const followUp =
      nextIndex < INTAKE_STEPS.length
        ? assistantMessage(INTAKE_STEPS[nextIndex].prompt)
        : assistantMessage(
            'That is everything I need. Review the brief on the right, create the estimate, then shape the scope in the breakdown editor.',
          );

    setDraft(next);
    setStepIndex(nextIndex);
    setMessages((prev) => [
      ...prev,
      { id: newId('msg'), role: 'user', text: formatAnswer(answeredField, next) },
      followUp,
    ]);
  };

  const handleBack = (): void => {
    if (!canGoBack) return;
    const prevIndex = stepIndex - 1;
    setStepIndex(prevIndex);
    setFieldError(null);
    setMessages((prev) => [...prev, assistantMessage(INTAKE_STEPS[prevIndex].prompt)]);
  };

  const handleEditStep = (fieldId: string): void => {
    const index = INTAKE_STEPS.findIndex((step) => step.id === fieldId);
    if (index < 0) return;
    setStepIndex(index);
    setFieldError(null);
    setMessages((prev) => [...prev, assistantMessage(`Let's revisit: ${INTAKE_STEPS[index].prompt}`)]);
  };

  const handleCreate = async (): Promise<void> => {
    setCreating(true);
    setCreateError(null);
    try {
      const input = buildProjectInput(draft);
      const created = await createEstimate(input);
      const features: Feature[] = starterScopeFor(input.projectType).map((feature) => ({
        ...feature,
        id: newId('feat'),
      }));
      await updateEstimate(created.id, {
        assumptions: deriveAssumptions(draft),
        missingRequirements: deriveMissingRequirements(draft),
        features,
      });
      navigate(`/estimates/${created.id}/breakdown`);
    } catch (caught) {
      setCreateError(errorMessage(caught));
      setCreating(false);
    }
  };

  const stepNumber = useMemo(() => Math.min(stepIndex + 1, totalSteps), [stepIndex, totalSteps]);

  return (
    <>
      <PageHeader
        title="New estimate"
        description="Describe your software idea. The assistant asks a few clarifying questions, then hands off to a breakdown you can edit before generating numbers."
      />

      <DemoNotice>
        <p>
          The intake assistant is a <strong>guided demo flow</strong>, not an AI model. It records
          what you tell it and flags anything left unanswered as an open item — it never invents
          prices or specifications.
        </p>
      </DemoNotice>

      <div className={styles.layout}>
        <ChatPanel
          messages={messages}
          field={field}
          stepNumber={stepNumber}
          totalSteps={totalSteps}
          currency={draft.currency}
          draft={draft}
          fieldError={fieldError}
          working={creating}
          createError={createError}
          canGoBack={canGoBack}
          onAnswer={handleAnswer}
          onCurrencyChange={(currency) => setDraft((current) => ({ ...current, currency }))}
          onBack={handleBack}
          onCreate={() => void handleCreate()}
        />
        <div className={styles.side}>
          <div className={styles.sideHead}>
            <MessageSquare className={styles.sideIcon} aria-hidden="true" />
            <div>
              <p className={styles.sideTitle}>Requirement ledger</p>
              <p className={styles.sideText}>Confirmed values and anything still open.</p>
            </div>
          </div>
          <IntakeLedger draft={draft} onEditStep={handleEditStep} disabled={creating} />
        </div>
      </div>
    </>
  );
}
