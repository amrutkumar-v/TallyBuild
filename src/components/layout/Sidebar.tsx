import { BrandMark } from '../ui/BrandMark';
import { NAV_ITEMS } from '../../constants/navigation';
import { cn } from '../../utils/cn';
import { NavLink } from 'react-router-dom';

import styles from './Sidebar.module.css';

interface SidebarProps {
  id: string;
  open: boolean;
  onNavigate: () => void;
}

export function Sidebar({ id, open, onNavigate }: SidebarProps) {
  return (
    <aside id={id} className={cn(styles.sidebar, open && styles.sidebarOpen)}>
      <div className={styles.brand}>
        <BrandMark />
        <span className={styles.brandText}>
          <span className={styles.brandName}>
            TallyBuild <span className={styles.brandAccent}>AI</span>
          </span>
          <span className={styles.brandTag}>Cost intelligence</span>
        </span>
      </div>

      <nav className={styles.nav} aria-label="Primary">
        <p className={styles.navLabel}>Workspace</p>
        <ul className={styles.navList}>
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) => cn(styles.link, isActive && styles.linkActive)}
                onClick={onNavigate}
              >
                <item.icon size={18} className={styles.linkIcon} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.footer}>
        <span className={styles.footerBadge}>Phase 01 · Demo build</span>
        <p className={styles.footerNote}>
          No live pricing, AI engine, database or backend is connected yet.
        </p>
      </div>
    </aside>
  );
}
