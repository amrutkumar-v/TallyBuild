import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import styles from './PageHeader.module.css';

export interface Crumb {
  label: string;
  to?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  crumbs,
  meta,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  crumbs?: Crumb[];
  meta?: ReactNode;
}): React.JSX.Element {
  return (
    <header className={styles.header}>
      <div className={styles.copy}>
        {crumbs && crumbs.length > 0 ? (
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            {crumbs.map((crumb, index) => (
              <span key={crumb.label}>
                {index > 0 ? <span aria-hidden="true"> / </span> : null}
                {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span>{crumb.label}</span>}
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className={styles.title}>{title}</h1>
        {description ? <p className={styles.description}>{description}</p> : null}
        {meta ? <div className={styles.meta}>{meta}</div> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}
