'use client'
import React from 'react'
import styles from './ProgressBar.module.css'

interface ProgressBarProps {
  current: number
  total: number
  isVisible: boolean
  title?: string
  onCancel?: () => void
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  isVisible,
  title = "Procesando archivos...",
  onCancel
}) => {
  if (!isVisible) return null

  const percentage = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        {/* Header estilo Bootstrap */}
        <div className={styles.modalHeader}>
          <h4 className={styles.modalTitle}>
            <span className={styles.icon}>⏳</span>
            {title}
          </h4>
          {onCancel && (
            <button 
              onClick={onCancel}
              className={styles.closeButton}
              title="Cancelar procesamiento"
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>
        
        {/* Body estilo Bootstrap */}
        <div className={styles.modalBody}>
          {/* Barra de progreso Bootstrap */}
          <div className={styles.progressContainer}>
            <div className={styles.progressInfo}>
              <span className={styles.progressLabel}>Progreso</span>
              <span className={styles.progressPercentage}>{percentage}%</span>
            </div>
            <div className={styles.progressWrapper}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${percentage}%` }}
                  role="progressbar"
                  aria-valuenow={percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          </div>
          
          {/* Información detallada */}
          <div className={styles.progressDetails}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Total de archivos:</span>
              <span className={styles.detailValue}>{total}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Procesados:</span>
              <span className={styles.detailValue + ' ' + styles.success}>{current}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Restantes:</span>
              <span className={styles.detailValue + ' ' + styles.warning}>{total - current}</span>
            </div>
          </div>
          
          {/* Mensaje de estado */}
          <div className={styles.statusMessage}>
            <small className={styles.textMuted}>
              {current === total ? 
                '¡Procesamiento completado!' : 
                `Procesando archivo ${current} de ${total}...`
              }
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProgressBar
