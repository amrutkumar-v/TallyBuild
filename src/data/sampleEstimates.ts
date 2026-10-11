import type { Feature, ProjectInput } from '../types';

/**
 * Illustrative DEMO estimates shipped with the app.
 *
 * These are NOT real customer projects, and the numbers attached to them are
 * produced by the local mock adapter (`src/services/mockAdapter.ts`), never by
 * an AI engine. Every UI surface that renders sample data labels it as such.
 */
export interface SampleEstimateSpec {
  id: string;
  createdAt: string;
  updatedAt: string;
  input: ProjectInput;
  features: Feature[];
  assumptions: string[];
  missingRequirements: string[];
}

export const sampleEstimateSpecs: SampleEstimateSpec[] = [
  {
    id: 'sample-fieldserve',
    createdAt: '2026-09-28T09:15:00.000Z',
    updatedAt: '2026-10-05T11:40:00.000Z',
    input: {
      projectName: 'FieldServe technician mobile app',
      requirements:
        'Field technicians need an Android and iOS app to receive job assignments, capture site photos and signatures, log parts used, work offline in low-connectivity areas and sync when back online. Dispatchers need a web console to assign jobs and track technician status. Payments and invoicing are out of scope for the first release.',
      projectType: 'mobile-app',
      complexity: 'medium',
      targetDeadline: '2027-03-31',
      teamSize: 4,
      teamLocation: 'india',
      blendedRatePerDay: 9000,
      currency: 'INR',
      constraints: ['Offline-first sync', 'App store review before launch', 'Two-platform launch'],
    },
    features: [
      {
        id: 'fs-1',
        name: 'Technician job queue',
        description: 'Assigned jobs list with status, address and one-tap navigation.',
        priority: 'must',
        complexity: 'moderate',
        status: 'accepted',
      },
      {
        id: 'fs-2',
        name: 'Offline data capture with sync',
        description: 'Store job updates, photos and signatures locally; sync on reconnect with conflict resolution.',
        priority: 'must',
        complexity: 'epic',
        status: 'accepted',
      },
      {
        id: 'fs-3',
        name: 'Dispatcher web console',
        description: 'Create, assign and reassign jobs; live technician status board.',
        priority: 'must',
        complexity: 'complex',
        status: 'accepted',
      },
      {
        id: 'fs-4',
        name: 'Parts and materials logging',
        description: 'Technicians record parts used per job, feeding later invoicing.',
        priority: 'should',
        complexity: 'moderate',
        status: 'accepted',
      },
      {
        id: 'fs-5',
        name: 'Customer SMS notifications',
        description: 'Notify customers when a technician is en route or work is complete.',
        priority: 'could',
        complexity: 'moderate',
        status: 'proposed',
      },
    ],
    assumptions: [
      'Both platforms share one codebase; separate native builds are not required.',
      'Existing identity provider can be reused for technician sign-in.',
    ],
    missingRequirements: [
      'Retention policy for site photos and signatures.',
      'Offline conflict resolution rules agreed with dispatch.',
    ],
  },
  {
    id: 'sample-retailops',
    createdAt: '2026-10-01T14:05:00.000Z',
    updatedAt: '2026-10-08T08:20:00.000Z',
    input: {
      projectName: 'RetailOps store dashboard',
      requirements:
        'A back-office web dashboard for regional managers to see daily sales by store, stock-out alerts, staff rota adherence and promotion performance. Data arrives nightly from the existing ERP. Managers want CSV export and email digests. No POS integration in this phase.',
      projectType: 'web-app',
      complexity: 'low',
      targetDeadline: '2026-12-18',
      teamSize: 3,
      teamLocation: 'india',
      blendedRatePerDay: 8000,
      currency: 'INR',
      constraints: ['Read-only ERP feed', 'SSO required'],
    },
    features: [
      {
        id: 'ro-1',
        name: 'Sales overview dashboard',
        description: 'Daily, weekly and monthly sales charts with store drill-down.',
        priority: 'must',
        complexity: 'moderate',
        status: 'accepted',
      },
      {
        id: 'ro-2',
        name: 'Nightly ERP ingestion',
        description: 'Scheduled import of sales and stock files with validation and error reporting.',
        priority: 'must',
        complexity: 'complex',
        status: 'accepted',
      },
      {
        id: 'ro-3',
        name: 'Stock-out alert list',
        description: 'Prioritised list of SKUs below threshold per store.',
        priority: 'should',
        complexity: 'moderate',
        status: 'accepted',
      },
      {
        id: 'ro-4',
        name: 'CSV export',
        description: 'Export any view to CSV for offline analysis.',
        priority: 'should',
        complexity: 'trivial',
        status: 'accepted',
      },
      {
        id: 'ro-5',
        name: 'Weekly email digest',
        description: 'Automated summary email per regional manager.',
        priority: 'could',
        complexity: 'moderate',
        status: 'proposed',
      },
    ],
    assumptions: ['ERP provides a stable nightly flat-file drop.', 'Existing SSO supports SAML.'],
    missingRequirements: ['Data refresh cadence during store trading hours.'],
  },
  {
    id: 'sample-medisync',
    createdAt: '2026-10-06T10:00:00.000Z',
    updatedAt: '2026-10-09T16:45:00.000Z',
    input: {
      projectName: 'MediSync appointment API platform',
      requirements:
        'A backend platform exposing REST APIs for clinic appointment booking, rescheduling and cancellation, with provider calendar sync, audit logging and strict PII handling. Consumed by an existing patient app and a new kiosk. Must pass an external security review and support rate limiting per consumer.',
      projectType: 'backend-api',
      complexity: 'high',
      targetDeadline: '2027-05-14',
      teamSize: 6,
      teamLocation: 'distributed',
      blendedRatePerDay: 120,
      currency: 'USD',
      constraints: ['External security review', 'PII data residency', 'Zero-downtime deploys'],
    },
    features: [
      {
        id: 'ms-1',
        name: 'Appointment booking APIs',
        description: 'Create, reschedule and cancel appointments with idempotency guarantees.',
        priority: 'must',
        complexity: 'complex',
        status: 'accepted',
      },
      {
        id: 'ms-2',
        name: 'Provider calendar sync',
        description: 'Two-way sync with external provider calendars and conflict handling.',
        priority: 'must',
        complexity: 'epic',
        status: 'accepted',
      },
      {
        id: 'ms-3',
        name: 'Audit logging and PII controls',
        description: 'Immutable audit trail, field-level encryption and retention rules.',
        priority: 'must',
        complexity: 'complex',
        status: 'accepted',
      },
      {
        id: 'ms-4',
        name: 'Consumer rate limiting',
        description: 'Per-consumer quotas, throttling and usage reporting.',
        priority: 'should',
        complexity: 'moderate',
        status: 'accepted',
      },
      {
        id: 'ms-5',
        name: 'Kiosk integration sandbox',
        description: 'Sandbox environment and test doubles for the kiosk team.',
        priority: 'should',
        complexity: 'moderate',
        status: 'proposed',
      },
      {
        id: 'ms-6',
        name: 'Analytics event stream',
        description: 'Stream booking events for downstream analytics.',
        priority: 'could',
        complexity: 'moderate',
        status: 'proposed',
      },
    ],
    assumptions: [
      'Provider calendars expose a stable API with webhook support.',
      'Security review slots are booked at least four weeks ahead.',
    ],
    missingRequirements: [
      'Retention window for audit records per jurisdiction.',
      'Expected peak bookings per minute for capacity planning.',
    ],
  },
];
