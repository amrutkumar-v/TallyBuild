import { cn } from '../../utils/cn';
import type { AssistantMessage } from '../../features/assistant/assistantFlow';
import styles from './Assistant.module.css';

export function MessageBubble({ message }: { message: AssistantMessage }): React.JSX.Element {
  const isUser = message.role === 'user';
  return (
    <div className={cn(styles.row, isUser ? styles.userRow : styles.assistantRow)}>
      <span className={styles.sender}>{isUser ? 'You' : 'TallyBuild assistant'}</span>
      <p className={cn(styles.bubble, isUser ? styles.userBubble : styles.assistantBubble)}>
        {message.text}
      </p>
    </div>
  );
}

export function TypingIndicator(): React.JSX.Element {
  return (
    <div className={cn(styles.row, styles.assistantRow)}>
      <span className={styles.sender}>TallyBuild assistant</span>
      <p className={cn(styles.bubble, styles.assistantBubble)}>
        <span className={styles.typing} aria-hidden="true">
          <span className={styles.typingDot} />
          <span className={styles.typingDot} />
          <span className={styles.typingDot} />
        </span>
        <span className="visually-hidden">Assistant is working</span>
      </p>
    </div>
  );
}
