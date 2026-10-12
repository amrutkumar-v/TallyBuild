import { useEffect, useState, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { FloatingAIAssistant } from '../ui/FloatingAIAssistant';

import styles from './AppShell.module.css';

export function AppShell() {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!navOpen) return;
    const closeNav = () => setNavOpen(false);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpen(false);
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
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className={styles.shell}>
        <div className={styles.ambientOrbs} aria-hidden="true">
          <div className={styles.orb} style={{ '--orb-x': '10%', '--orb-y': '20%' } as React.CSSProperties} />
          <div className={styles.orb} style={{ '--orb-x': '85%', '--orb-y': '70%' } as React.CSSProperties} />
          <div className={styles.orb} style={{ '--orb-x': '50%', '--orb-y': '90%' } as React.CSSProperties} />
        </div>

        <Sidebar id="app-sidebar" open={navOpen} onNavigate={() => setNavOpen(false)} />
        {navOpen && (
          <div className={styles.overlay} onClick={() => setNavOpen(false)} aria-hidden="true" />
        )}

        <div className={styles.frame}>
          <TopBar navOpen={navOpen} onMenuClick={() => setNavOpen((open) => !open)} />
          <main id="main-content" className={styles.main} ref={contentRef}>
            <div className={styles.content}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  className={styles.pageWrapper}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
            <footer className={styles.footer}>
              TallyBuild AI &copy; Hackathon demo build &mdash; All figures are illustrative demo data.
              <span className={styles.aiTag}>Made with AI</span>
            </footer>
          </main>
        </div>
        <FloatingAIAssistant />
      </div>
    </>
  );
}