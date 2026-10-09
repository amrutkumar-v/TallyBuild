import styles from './App.module.css';

const CHECKPOINTS: string[] = [
  'Runnable React + TypeScript application powered by Vite',
  'Global design tokens for colour, typography, spacing, radii and shadows',
  'Strict TypeScript configuration with ESLint rules in place',
  'Project documentation: README.md for humans, AGENTS.md for agents',
];

export default function App(): React.JSX.Element {
  return (
    <main className={styles.screen}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>KLE TECH HACKFEST 2026 &middot; Domain 4C</p>
        <h1 className={styles.title}>TallyBuild AI</h1>
        <p className={styles.lead}>
          Project foundation is ready. The premium construction-tech dashboard ships with
          Phase 01.
        </p>
        <ul className={styles.list}>
          {CHECKPOINTS.map((item) => (
            <li key={item} className={styles.item}>
              {item}
            </li>
          ))}
        </ul>
        <p className={styles.note}>No estimation engine, backend or AI service is wired up yet.</p>
      </div>
    </main>
  );
}
