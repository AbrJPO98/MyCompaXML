'use client'
import React from 'react'
import styles from './ChannelMembersModal.module.css'

interface ChannelMembersModalProps {
  isOpen: boolean
  onClose: () => void
  channelCode?: string
}

const ChannelMembersModal: React.FC<ChannelMembersModalProps> = ({
  isOpen,
  onClose,
  channelCode
}) => {
  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>👥 Miembros del Canal</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        <div className={styles.modalBody}>
          {/* Contenido del modal - por ahora está en blanco como solicitaste */}
          <div className={styles.placeholderContent}>
            <p>Este modal está listo para mostrar la información de los miembros del canal.</p>
            {channelCode && (
              <p className={styles.channelInfo}>
                <strong>Código del canal:</strong> {channelCode}
              </p>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            onClick={onClose}
            className={styles.closeButtonFooter}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChannelMembersModal
