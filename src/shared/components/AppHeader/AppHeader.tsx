import type { ReactNode } from 'react';
import styles from './AppHeader.module.css';

type AppHeaderProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function AppHeader({ title, description, children }: AppHeaderProps) {
  return (
    <header className={styles.root}>
      <h1 className={styles.title}>{title}</h1>
      {description != null && description !== '' && (
        <p className={styles.description}>{description}</p>
      )}
      {children != null && <div className={styles.extra}>{children}</div>}
    </header>
  );
}
