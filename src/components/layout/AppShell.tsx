import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { FloatingAssistant } from '../assistant/FloatingAssistant';
import styles from './AppShell.module.css';

/**
 * Application frame: persistent sidebar (off-canvas on small screens), top bar
 * and the routed content region. The drawer is closed by explicit interaction
 * rather than an effect so navigation state stays simple.
 */
export function AppShell(): React.JSX.Element {
  const [navOpen, setNavOpen] = useState(false);
  const closeNav = (): void => setNavOpen(false);

  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <Sidebar open={navOpen} onNavigate={closeNav} />

      {navOpen ? (
        <button
          type="button"
          className={styles.scrim}
          aria-label="Close navigation"
          onClick={closeNav}
        />
      ) : null}

      <div className={styles.main}>
        <TopBar navOpen={navOpen} onToggleNav={() => setNavOpen((open) => !open)} />
        <main id="main-content" className={styles.content} tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      <FloatingAssistant />
    </div>
  );
}
