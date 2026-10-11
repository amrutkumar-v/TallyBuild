import { NavLink } from 'react-router-dom';

import { primaryNav } from '../../constants/navigation';
import { adapterMode } from '../../services';
import { BrandMark } from '../ui/BrandMark';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import styles from './Sidebar.module.css';

export function Sidebar({
  open,
  onNavigate,
}: {
  open: boolean;
  onNavigate: () => void;
}): React.JSX.Element {
  return (
    <aside
      id="app-sidebar"
      className={cn(styles.sidebar, open && styles.open)}
      aria-label="Primary navigation"
    >
      <div className={styles.brand}>
        <BrandMark />
      </div>

      <nav className={styles.nav} aria-label="Main">
        <p className={styles.navLabel}>Workspace</p>
        <ul className={styles.list}>
          {primaryNav.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) => cn(styles.link, isActive && styles.active)}
                >
                  <Icon className={styles.icon} aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.footer}>
        <div className={styles.footerRow}>
          <span className={styles.footerLabel}>Data source</span>
          <Badge tone={adapterMode === 'api' ? 'info' : 'accent'}>
            {adapterMode === 'api' ? 'Estimation API' : 'Mock adapter'}
          </Badge>
        </div>
        <p className={styles.footerNote}>
          Demo build — estimates are illustrative and stored only in this browser.
        </p>
      </div>
    </aside>
  );
}
