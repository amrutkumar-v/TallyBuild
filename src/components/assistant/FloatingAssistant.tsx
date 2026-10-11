import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

import { AssistantConversation } from './AssistantConversation';
import styles from './Assistant.module.css';

/**
 * Bottom-right floating launcher for the guided estimation assistant. Lives in
 * the app shell so it is available on every page; it renders as a non-modal
 * dialog and never blocks the underlying navigation.
 */
export function FloatingAssistant(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  const close = (): void => {
    setOpen(false);
    launcherRef.current?.focus();
  };

  return (
    <>
      {!open ? (
        <button
          ref={launcherRef}
          type="button"
          className={styles.launcher}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-controls="ta-assistant-panel"
          aria-label="Open the TallyBuild estimation assistant"
          title="Estimate software costs"
        >
          <span className={styles.launcherDot} aria-hidden="true" />
          <Sparkles className={styles.launcherIcon} aria-hidden="true" />
          <span className={styles.launcherLabel}>Estimate costs</span>
        </button>
      ) : null}

      {open ? (
        <section
          id="ta-assistant-panel"
          ref={panelRef}
          className={styles.panel}
          role="dialog"
          aria-label="TallyBuild estimation assistant"
          tabIndex={-1}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              close();
            }
          }}
        >
          <AssistantConversation onClose={close} />
        </section>
      ) : null}
    </>
  );
}
