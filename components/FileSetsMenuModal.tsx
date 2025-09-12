'use client'
import React from 'react'
import styles from './FileSetsMenuModal.module.css'

interface FileSetsMenuModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateFileSet: () => void
  onManageFileSet: () => void
}

const FileSetsMenuModal: React.FC<FileSetsMenuModalProps> = ({
  isOpen,
  onClose,
  onCreateFileSet,
  onManageFileSet
}) => {
  if (!isOpen) return null

  const handleCreateClick = () => {
    onClose()
    onCreateFileSet()
  }

  const handleManageClick = () => {
    onClose()
    onManageFileSet()
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Conjuntos de archivos</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <p>Seleccione una opción:</p>
          
          <div className={styles.optionsContainer}>
            <button
              className={styles.optionButton}
              onClick={handleCreateClick}
            >
              <span className={styles.optionIcon}>➕</span>
              <div className={styles.optionContent}>
                <h3>Crear conjunto de archivos</h3>
                <p>Crear un nuevo conjunto con las facturas existentes</p>
              </div>
            </button>
            
            <button
              className={styles.optionButton}
              onClick={handleManageClick}
            >
              <span className={styles.optionIcon}>📂</span>
              <div className={styles.optionContent}>
                <h3>Agregar conjunto de archivos</h3>
                <p>Gestionar y agregar archivos desde conjuntos existentes</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FileSetsMenuModal
