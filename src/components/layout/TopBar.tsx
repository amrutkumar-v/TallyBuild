import { Menu, X, Sun, Moon, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

import { getPageTitle } from '../../constants/navigation';
import { cn } from '../../utils/cn';

import styles from './TopBar.module.css';

interface TopBarProps {
  navOpen: boolean;
  onMenuClick: () => void;
}

function getInitialTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('tallybuild-theme') as 'dark' | 'light' | null;
  return saved ?? 'dark';
}

export function TopBar({ navOpen, onMenuClick }: TopBarProps) {
  const location = useLocation();
  const title = getPageTitle(location.pathname);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tallybuild-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <header className={cn(styles.topbar, scrolled && styles.scrolled)} role="banner">
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

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        </button>

        <div className={styles.profile}>
          <span className={styles.avatar} aria-hidden="true">
            <Sparkles size={14} aria-hidden="true" />
          </span>
          <span className={styles.profileText}>
            <span className={styles.profileName}>Demo User</span>
            <span className={styles.profileRole}>Estimator</span>
          </span>
        </div>
      </div>
    </header>
  );
}