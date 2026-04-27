import styles from './MetricRow.module.css';

type MetricRowProps = {
  label: string;
  value: string;
};

export function MetricRow({ label, value }: MetricRowProps) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <code className={styles.value}>{value}</code>
    </div>
  );
}
