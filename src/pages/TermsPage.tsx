import { Link } from 'react-router-dom';

import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';

import styles from './TermsPage.module.css';

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms of Use"
        description="Terms and conditions for using TallyBuild AI."
      />

      <div className={styles.container}>
        <SectionCard>
          <p className={styles.meta}>
            Effective date: January 15, 2025
          </p>

          <h2 className={styles.sectionTitle}>Acceptance of Terms</h2>
          <p className={styles.body}>
            By accessing and using TallyBuild AI, you agree to these terms. If you do not agree,
            do not use the application.
          </p>

          <h2 className={styles.sectionTitle}>Nature of Service</h2>
          <p className={styles.body}>
            TallyBuild AI is a software cost estimation tool provided as-is for demonstration and evaluation purposes.
            It produces illustrative estimates based on the parameters you provide. The results are not quotes,
            guarantees, or professional advice.
          </p>

          <h2 className={styles.sectionTitle}>No Warranty</h2>
          <p className={styles.body}>
            The application is provided "as is" without warranty of any kind, express or implied, including but not
            limited to warranties of merchantability, fitness for a particular purpose, and non-infringement.
            We do not warrant that the service will be uninterrupted, error-free, or free of harmful components.
          </p>

          <h2 className={styles.sectionTitle}>Limitation of Liability</h2>
          <p className={styles.body}>
            In no event shall the authors or copyright holders be liable for any claim, damages, or other liability,
            whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the
            software or the use or other dealings in the software. This includes any indirect, incidental, special,
            consequential, or punitive damages.
          </p>

          <h2 className={styles.sectionTitle}>User Responsibilities</h2>
          <ul className={styles.list}>
            <li>You are responsible for verifying any estimates before making financial decisions.</li>
            <li>You must not use the service for illegal activities or to generate misleading proposals.</li>
            <li>You acknowledge that all data you enter remains on your device and is your responsibility.</li>
          </ul>

          <h2 className={styles.sectionTitle}>Intellectual Property</h2>
          <p className={styles.body}>
            TallyBuild AI and its original content, features, and functionality are owned by the project authors
            and are protected by copyright laws. The source code is available under the repository's license.
          </p>

          <h2 className={styles.sectionTitle}>Modifications</h2>
          <p className={styles.body}>
            We may modify or discontinue the service at any time without notice. We are not liable for any
            modification, suspension, or discontinuance.
          </p>

          <h2 className={styles.sectionTitle}>Governing Law</h2>
          <p className={styles.body}>
            These terms shall be governed by the laws of the jurisdiction where the project is maintained,
            without regard to conflict of law principles.
          </p>

          <h2 className={styles.sectionTitle}>Changes to Terms</h2>
          <p className={styles.body}>
            We may update these terms at any time. Continued use after changes constitutes acceptance.
            Check this page periodically for updates.
          </p>

          <h2 className={styles.sectionTitle}>Contact</h2>
          <p className={styles.body}>
            For questions about these terms, open an issue on the project repository.
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