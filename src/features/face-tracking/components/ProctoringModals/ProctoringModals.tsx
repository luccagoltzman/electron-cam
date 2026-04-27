import type { ProctoringWarning } from '../../hooks/useInattentionStrikes';
import {
  INATTENTION_THRESHOLD_SECONDS,
  MAX_STRIKES_BEFORE_DISQUALIFICATION,
} from '../../config/proctoring';
import styles from './ProctoringModals.module.css';

type ProctoringModalsProps = {
  openWarning: ProctoringWarning | null;
  onAcknowledgeWarning: () => void;
  disqualified: boolean;
  strikeCount: number;
};

export function ProctoringModals({
  openWarning,
  onAcknowledgeWarning,
  disqualified,
  strikeCount,
}: ProctoringModalsProps) {
  return (
    <>
      {openWarning != null && (
        <div className={styles.scrim} role="alertdialog" aria-modal="true" aria-labelledby="proctoring-title">
          <div className={styles.card}>
            <h2 id="proctoring-title" className={styles.title}>
              Atenção
            </h2>
            {openWarning === 1 && (
              <p className={styles.body}>
                O sistema detectou que a posição da sua cabeça permaneceu fora do limite permitido
                (virada de forma acentuada em relação ao ecrã) por mais de{' '}
                {INATTENTION_THRESHOLD_SECONDS} segundos.
              </p>
            )}
            {openWarning === 2 && (
              <p className={styles.body}>
                Foi identificado o mesmo padrão novamente. Este é o segundo aviso.
              </p>
            )}
            <p className={styles.strong}>
              {MAX_STRIKES_BEFORE_DISQUALIFICATION - strikeCount === 1
                ? 'Se o sistema detectar mais 1 vez o mesmo comportamento, você será desclassificado.'
                : `Se o sistema detectar por mais ${
                    MAX_STRIKES_BEFORE_DISQUALIFICATION - strikeCount
                  } vezes o mesmo comportamento, você será desclassificado.`}
            </p>
            <button type="button" className={styles.btn} onClick={onAcknowledgeWarning}>
              Estou ciente
            </button>
          </div>
        </div>
      )}

      {disqualified && (
        <div className={styles.scrim} role="alertdialog" aria-modal="true" aria-labelledby="dq-title">
          <div className={`${styles.card} ${styles.dqCard}`}>
            <h2 id="dq-title" className={styles.dqTitle}>
              Desclassificação
            </h2>
            <p className={styles.body}>
              A candidatura seguiu a conduta indevida o número máximo de vezes permitido. Sua sessão
              de prova ou atividade foi encerrada com desclassificação.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
