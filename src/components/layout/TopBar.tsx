import { Menu, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { getPageTitle } from '../../constants/navigation';

import styles from './TopBar.module.css';

interface TopBarProps {
  navOpen: boolean;
  onMenuClick: () => void;
}

export function TopBar({ navOpen, onMenuClick }: TopBarProps) {
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <header className={styles.topbar}>
      <button
        type="button"
        className={styles.menuButton}
        aria-expanded={navOpen}
        aria-controls="app-sidebar"
        aria-label={navOpen ? 'Close navigation menu' : 'Open navigation menu'}
        onClick={onMenuClick}
      >
        {navOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
      </button>

      <div className={styles.titleBlock}>
        <p className={styles.title}>{title}</p>
        <p className={styles.context}>
          <span className={styles.dot} aria-hidden="true" />
          KLE Hackfest demo workspace
        </p>
      </div>

      <div className={styles.profile}>
        <span className={styles.avatar} aria-hidden="true">
          DU
        </span>
        <span className={styles.profileText}>
          <span className={styles.profileName}>Demo User</span>
          <span className={styles.profileRole}>Estimator</span>
        </span>
      </div>
    </header>
  );
}
