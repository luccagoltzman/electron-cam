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
  const remaining =
    MAX_STRIKES_BEFORE_DISQUALIFICATION - strikeCount;

  return (
    <>
      {openWarning != null && (
        <div
          className={styles.scrim}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="proctoring-title"
        >
          <div className={styles.card}>
            <h2 id="proctoring-title" className={styles.title}>
              Alerta de possível pesca
            </h2>
            <p className={styles.body}>
              O sistema detectou que você ficou mais de {INATTENTION_THRESHOLD_SECONDS} segundos
              sem olhar diretamente para a tela. Isso pode indicar tentativa de pesca (consultar
              material ou outra pessoa fora do alcance da prova).
            </p>
            {openWarning === 2 && (
              <p className={styles.body}>Este é o segundo alerta do mesmo comportamento.</p>
            )}
            <p className={styles.strong}>
              {remaining === 1
                ? 'Se o sistema detectar mais 1 vez o mesmo comportamento, você será desclassificado.'
                : `Se o sistema detectar por mais ${remaining} vezes o mesmo comportamento, você será desclassificado.`}
            </p>
            <button type="button" className={styles.btn} onClick={onAcknowledgeWarning}>
              Estou ciente
            </button>
          </div>
        </div>
      )}

      {disqualified && (
        <div
          className={styles.scrim}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="dq-title"
        >
          <div className={`${styles.card} ${styles.dqCard}`}>
            <h2 id="dq-title" className={styles.dqTitle}>
              Desclassificação
            </h2>
            <p className={styles.body}>
              O sistema registrou possíveis indícios de pesca o número máximo de vezes permitido.
              Sua sessão de prova ou atividade foi encerrada com desclassificação.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
