import { Plus } from 'lucide-react';

import { Button } from '../components/ui/Button';
import { DemoNotice } from '../components/ui/DemoNotice';
import { LinkButton } from '../components/ui/LinkButton';
import { PageHeader } from '../components/ui/PageHeader';
import { HowItHelps } from '../components/dashboard/HowItHelps';
import { RecentEstimates } from '../components/dashboard/RecentEstimates';
import { SummaryGrid } from '../components/dashboard/SummaryGrid';
import { useEstimates } from '../store/estimates-context';

export default function DashboardPage() {
  const { estimates, sampleDataVisible, toggleSampleData } = useEstimates();

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Welcome to TallyBuild AI"
        description="Create project cost estimates, then compare scenarios and test what-if changes — all in one workspace."
        actions={
          <LinkButton to="/new-estimate" iconStart={<Plus size={16} aria-hidden="true" />}>
            New Estimate
          </LinkButton>
        }
      />

      <DemoNotice
        action={
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={sampleDataVisible}
            onClick={toggleSampleData}
          >
            {sampleDataVisible ? 'Hide sample data' : 'Show sample data'}
          </Button>
        }
      >
        Every figure on this dashboard is illustrative demo data from the hackathon build — not
        real customer, market or supplier data.
      </DemoNotice>

      <SummaryGrid estimates={estimates} />

      <RecentEstimates
        estimates={estimates}
        emptyDescription={
          sampleDataVisible
            ? 'Create your first estimate to see it listed here.'
            : 'Sample data is hidden. Turn it back on above, or create your first estimate.'
        }
      />

      <HowItHelps />
    </>
  );
}
