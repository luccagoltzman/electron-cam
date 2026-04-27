import type { ReactNode } from 'react';
import styles from './Panel.module.css';

type PanelProps = {
  children: ReactNode;
  className?: string;
  title?: string;
};

export function Panel({ children, className, title }: PanelProps) {
  return (
    <section className={`${styles.root} ${className ?? ''}`.trim()}>
      {title != null && title !== '' && <h2 className={styles.heading}>{title}</h2>}
      {children}
    </section>
  );
}
