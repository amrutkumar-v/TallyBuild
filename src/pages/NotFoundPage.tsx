import { Compass } from 'lucide-react';

import { EmptyState } from '../components/ui/EmptyState';
import { LinkButton } from '../components/ui/LinkButton';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';

export default function NotFoundPage() {
  return (
    <>
      <PageHeader
        title="Page not found"
        description="That address does not match any screen in this build."
      />
      <SectionCard>
        <EmptyState
          icon={Compass}
          title="We couldn't find that page"
          description="The link may be outdated, or the feature belongs to a later phase of the roadmap."
          action={<LinkButton to="/">Back to dashboard</LinkButton>}
        />
      </SectionCard>
    </>
  );
}
