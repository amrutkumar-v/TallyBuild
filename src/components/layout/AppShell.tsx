import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

import styles from './AppShell.module.css';

export function AppShell() {
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!navOpen) {
      return;
    }
    const closeNav = () => setNavOpen(false);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNavOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', closeNav);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', closeNav);
      document.body.style.overflow = previousOverflow;
    };
  }, [navOpen]);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className={styles.shell}>
        <Sidebar id="app-sidebar" open={navOpen} onNavigate={() => setNavOpen(false)} />
        {navOpen ? (
          <div className={styles.overlay} onClick={() => setNavOpen(false)} aria-hidden="true" />
        ) : null}
        <div className={styles.frame}>
          <TopBar navOpen={navOpen} onMenuClick={() => setNavOpen((open) => !open)} />
          <main id="main-content" className={styles.main}>
            <div className={styles.content}>
              <Outlet />
            </div>
            <footer className={styles.footer}>
              TallyBuild AI · Hackathon demo build · All figures are illustrative demo data.
            </footer>
          </main>
        </div>
      </div>
    </>
  );
}
