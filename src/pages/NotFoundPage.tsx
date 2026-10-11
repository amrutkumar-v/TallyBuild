import { CircleAlert } from 'lucide-react';

import { LinkButton } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';

export function NotFoundPage(): React.JSX.Element {
  return (
    <>
      <PageHeader title="Page not found" description="That route does not exist in this build." />
      <SectionCard title="Not found">
        <EmptyState
          icon={<CircleAlert />}
          title="We couldn't find that page"
          description="Check the address, or head back to the dashboard."
          action={
            <LinkButton to="/" variant="secondary">
              Back to dashboard
            </LinkButton>
          }
        />
      </SectionCard>
    </>
  );
}
