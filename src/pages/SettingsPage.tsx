import { useState } from 'react';
import {
  Database,
  Download,
  Globe,
  HardDrive,
  Info,
  Palette,
  Shield,
  Coins,
} from 'lucide-react';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { SelectField } from '../components/ui/Fields';
import { useEstimates } from '../store/estimates-context';
import { CURRENCY_OPTIONS } from '../estimation';
import type { CurrencyCode } from '../estimation';

import styles from './SettingsPage.module.css';

const LOCALES = [
  { value: 'en-IN', label: 'English (India)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
];

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2025)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2025)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2025-12-31)' },
];

export default function SettingsPage() {
  const { persistenceAvailable, clearAllDrafts } = useEstimates();

  const [settings, setSettings] = useState({
    defaultCurrency: 'INR' as CurrencyCode,
    locale: 'en-IN',
    dateFormat: 'DD/MM/YYYY',
    theme: 'dark' as 'dark' | 'light' | 'system',
    autoSave: 'on' as 'on' | 'off',
    showDemoNotices: 'on' as 'on' | 'off',
  });

  const handleChange = (key: keyof typeof settings, value: string) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleClearDrafts = () => {
    if (window.confirm('This will permanently delete all local draft estimates. This action cannot be undone.')) {
      clearAllDrafts();
    }
  };

  const handleExportData = () => {
    // Placeholder for data export functionality
    alert('Data export will be implemented in a future phase.');
  };

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Workspace settings"
        description="Configure your preferences, data handling and appearance for this workspace."
      />

      <SectionCard
        title="Appearance"
        description="Customise how the workspace looks and feels."
      >
        <div className={styles.settingsGrid}>
          <div className={styles.settingItem}>
            <div className={styles.settingIcon}>
              <Palette size={18} aria-hidden="true" />
            </div>
            <div className={styles.settingContent}>
              <label className={styles.settingLabel} htmlFor="theme">Theme</label>
              <p className={styles.settingHint}>Choose the colour scheme for the workspace.</p>
              <SelectField
                id="theme"
                label="Theme"
                value={settings.theme}
                onChange={(value) => handleChange('theme', value)}
                options={[
                  { value: 'dark', label: 'Dark (default)' },
                  { value: 'light', label: 'Light' },
                  { value: 'system', label: 'System preference' },
                ]}
                disabled
              />
            </div>
            <Badge tone="neutral">Locked</Badge>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingIcon}>
              <Globe size={18} aria-hidden="true" />
            </div>
            <div className={styles.settingContent}>
              <label className={styles.settingLabel} htmlFor="locale">Language & locale</label>
              <p className={styles.settingHint}>Regional settings for numbers, dates and currency display.</p>
              <SelectField
                id="locale"
                label="Language & locale"
                value={settings.locale}
                onChange={(value) => handleChange('locale', value)}
                options={LOCALES}
              />
            </div>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingIcon}>
              <HardDrive size={18} aria-hidden="true" />
            </div>
            <div className={styles.settingContent}>
              <label className={styles.settingLabel} htmlFor="dateFormat">Date format</label>
              <p className={styles.settingHint}>Preferred date display format across the workspace.</p>
              <SelectField
                id="dateFormat"
                label="Date format"
                value={settings.dateFormat}
                onChange={(value) => handleChange('dateFormat', value)}
                options={DATE_FORMATS}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Defaults"
        description="Set default values used when creating new estimates."
      >
        <div className={styles.settingsGrid}>
          <div className={styles.settingItem}>
            <div className={styles.settingIcon}>
              <Coins size={18} aria-hidden="true" />
            </div>
            <div className={styles.settingContent}>
              <label className={styles.settingLabel} htmlFor="defaultCurrency">Default currency</label>
              <p className={styles.settingHint}>Currency pre-selected on new estimates.</p>
              <SelectField
                id="defaultCurrency"
                label="Default currency"
                value={settings.defaultCurrency}
                onChange={(value) => handleChange('defaultCurrency', value as CurrencyCode)}
                options={CURRENCY_OPTIONS}
              />
            </div>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingIcon}>
              <Shield size={18} aria-hidden="true" />
            </div>
            <div className={styles.settingContent}>
              <label className={styles.settingLabel} htmlFor="autoSave">Auto-save drafts</label>
              <p className={styles.settingHint}>Automatically save draft estimates as you work.</p>
              <SelectField
                id="autoSave"
                label="Auto-save drafts"
                value={settings.autoSave}
                onChange={(value) => handleChange('autoSave', value)}
                options={[
                  { value: 'on', label: 'Enabled' },
                  { value: 'off', label: 'Disabled' },
                ]}
              />
            </div>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingIcon}>
              <Info size={18} aria-hidden="true" />
            </div>
            <div className={styles.settingContent}>
              <label className={styles.settingLabel} htmlFor="showDemoNotices">Demo data notices</label>
              <p className={styles.settingHint}>Show banners reminding you that all data is illustrative.</p>
              <SelectField
                id="showDemoNotices"
                label="Demo data notices"
                value={settings.showDemoNotices}
                onChange={(value) => handleChange('showDemoNotices', value)}
                options={[
                  { value: 'on', label: 'Show notices' },
                  { value: 'off', label: 'Hide notices' },
                ]}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Data & storage"
        description="Manage local data and storage for this workspace."
      >
        <div className={styles.dataSection}>
          <div className={styles.dataItem}>
            <div className={styles.dataInfo}>
              <div className={styles.dataIcon}>
                <Database size={20} aria-hidden="true" />
              </div>
              <div>
                <h3 className={styles.dataTitle}>Local draft storage</h3>
                <p className={styles.dataText}>
                  Estimates are saved in your browser&rsquo;s localStorage. They are not synced to any server.
                </p>
              </div>
            </div>
            <div className={styles.dataStatus}>
              {persistenceAvailable ? (
                <Badge tone="success">Available</Badge>
              ) : (
                <Badge tone="warning">Unavailable</Badge>
              )}
            </div>
          </div>

          <div className={styles.dataItem}>
            <div className={styles.dataInfo}>
              <div className={styles.dataIcon}>
                <HardDrive size={20} aria-hidden="true" />
              </div>
              <div>
                <h3 className={styles.dataTitle}>Clear all drafts</h3>
                <p className={styles.dataText}>
                  Permanently remove all local draft estimates from this browser. This cannot be undone.
                </p>
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleClearDrafts}
              disabled={!persistenceAvailable}
            >
              Clear all drafts
            </Button>
          </div>

          <div className={styles.dataItem}>
            <div className={styles.dataInfo}>
              <div className={styles.dataIcon}>
                <Download size={20} aria-hidden="true" />
              </div>
              <div>
                <h3 className={styles.dataTitle}>Export data</h3>
                <p className={styles.dataText}>
                  Download your estimates as a JSON file for backup or migration.
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleExportData}>
              Export
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="About"
        description="Version and build information for this demo."
      >
        <div className={styles.aboutGrid}>
          <div className={styles.aboutItem}>
            <span className={styles.aboutLabel}>Version</span>
            <span className={styles.aboutValue}>0.2.0 (Phase 02)</span>
          </div>
          <div className={styles.aboutItem}>
            <span className={styles.aboutLabel}>Build</span>
            <span className={styles.aboutValue}>KLE TECH HACKFEST 2026</span>
          </div>
          <div className={styles.aboutItem}>
            <span className={styles.aboutLabel}>Domain</span>
            <span className={styles.aboutValue}>4C — AI for Cost Estimation</span>
          </div>
          <div className={styles.aboutItem}>
            <span className={styles.aboutLabel}>Stack</span>
            <span className={styles.aboutValue}>React 19 · TypeScript · Vite · FastAPI</span>
          </div>
        </div>
        <p className={styles.aboutNote}>
          This is a hackathon demo build. All figures are illustrative demo data. No live pricing,
          AI engine, database or production backend is connected.
        </p>
      </SectionCard>
    </>
  );
}