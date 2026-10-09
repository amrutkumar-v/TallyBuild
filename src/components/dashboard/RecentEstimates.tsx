import { ChevronRight, ClipboardList, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EmptyState } from '../ui/EmptyState';
import { LinkButton } from '../ui/LinkButton';
import { SectionCard } from '../ui/SectionCard';
import { EstimatesTable } from '../estimates/EstimatesTable';
import type { Estimate } from '../../types';

import styles from './RecentEstimates.module.css';

const RECENT_LIMIT = 5;

interface RecentEstimatesProps {
  estimates: Estimate[];
  emptyDescription: string;
}

export function RecentEstimates({ estimates, emptyDescription }: RecentEstimatesProps) {
  const recent = estimates.slice(0, RECENT_LIMIT);

  return (
    <SectionCard
      title="Recent estimates"
      description={`The ${RECENT_LIMIT} most recent projects in this workspace.`}
      flush
      actions={
        <Link className={styles.viewAll} to="/estimates">
          View all
          <ChevronRight size={14} aria-hidden="true" />
        </Link>
      }
    >
      {recent.length > 0 ? (
        <EstimatesTable estimates={recent} />
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No estimates yet"
          description={emptyDescription}
          action={
            <LinkButton to="/new-estimate" iconStart={<Plus size={16} aria-hidden="true" />}>
              New Estimate
            </LinkButton>
          }
        />
      )}
    </SectionCard>
  );
}
