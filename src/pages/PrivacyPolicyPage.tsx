import { Link } from 'react-router-dom';

import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';

import styles from './PrivacyPolicyPage.module.css';

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description="How we collect, use, and protect your information."
      />

      <div className={styles.container}>
        <SectionCard>
          <p className={styles.meta}>
            Effective date: January 15, 2025
          </p>

          <h2 className={styles.sectionTitle}>Information We Collect</h2>
          <p className={styles.body}>
            TallyBuild AI is a client-side application that runs in your browser. We do not operate a backend
            database for user data, and we do not collect personally identifiable information.
          </p>
          <ul className={styles.list}>
            <li>Estimation data you enter (project details, cost lines, team parameters) stays in your browser's localStorage.</li>
            <li>No account creation, authentication, or user tracking is implemented.</li>
            <li>No analytics, telemetry, or third-party scripts are loaded.</li>
          </ul>

          <h2 className={styles.sectionTitle}>Local Storage</h2>
          <p className={styles.body}>
            Your draft estimates and preferences are stored locally using the browser's <code>localStorage</code> API.
            This data never leaves your device. You can clear it at any time from the Settings page or your browser's
            developer tools.
          </p>

          <h2 className={styles.sectionTitle}>Estimation Service</h2>
          <p className={styles.body}>
            When you calculate an estimate, the cost lines you provide are sent to a local estimation API
            (FastAPI service) running on your machine or network. The request contains only the numerical
            parameters you entered. No identifiers are attached.
          </p>

          <h2 className={styles.sectionTitle}>No Third-Party Sharing</h2>
          <p className={styles.body}>
            We do not sell, rent, or share any data with third parties. There are no advertising networks,
            social media trackers, or analytics providers integrated.
          </p>

          <h2 className={styles.sectionTitle}>Security</h2>
          <p className={styles.body}>
            All data remains on your device. The estimation API communicates over localhost or your local network.
            Use HTTPS in production deployments.
          </p>

          <h2 className={styles.sectionTitle}>Changes to This Policy</h2>
          <p className={styles.body}>
            Updates will be posted on this page with a revised effective date. Continued use constitutes acceptance.
          </p>

          <h2 className={styles.sectionTitle}>Contact</h2>
          <p className={styles.body}>
            For questions about this policy, open an issue on the project repository.
          </p>
        </SectionCard>

        <div className={styles.footer}>
          <Link to="/" className={styles.backLink}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
}