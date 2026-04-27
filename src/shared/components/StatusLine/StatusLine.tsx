import styles from './StatusLine.module.css';

type StatusLineProps = {
  text: string;
  tone?: 'default' | 'error';
};

export function StatusLine({ text, tone = 'default' }: StatusLineProps) {
  return <p className={tone === 'error' ? styles.error : styles.muted}>{text}</p>;
}
