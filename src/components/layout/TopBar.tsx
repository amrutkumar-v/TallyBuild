import { Link, useLocation } from 'react-router-dom';
import { Menu, Plus, X } from 'lucide-react';

import { titleForPath } from '../../constants/navigation';
import styles from './TopBar.module.css';

export function TopBar({
  navOpen,
  onToggleNav,
}: {
  navOpen: boolean;
  onToggleNav: () => void;
}): React.JSX.Element {
  const { pathname } = useLocation();
  const title = titleForPath(pathname);
  const MenuIcon = navOpen ? X : Menu;

  return (
    <header className={styles.topbar}>
      <button
        type="button"
        className={styles.menuButton}
        aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={navOpen}
        aria-controls="app-sidebar"
        onClick={onToggleNav}
      >
        <MenuIcon className={styles.menuIcon} aria-hidden="true" />
      </button>

      <div className={styles.titleGroup}>
        <span className={styles.eyebrow}>TallyBuild AI</span>
        <span className={styles.title}>{title}</span>
      </div>

      <div className={styles.actions}>
        <span className={styles.demoTag}>Demo build</span>
        <Link to="/estimates/new" className={styles.cta}>
          <Plus className={styles.ctaIcon} aria-hidden="true" />
          <span>New estimate</span>
        </Link>
      </div>
    </header>
  );
}
