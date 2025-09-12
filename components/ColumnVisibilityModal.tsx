'use client'
import React, { useState, useEffect } from 'react'
import styles from './ColumnVisibilityModal.module.css'
import { ColumnDefinition } from './BillsTable'

interface ColumnVisibilityModalProps {
  isOpen: boolean
  onClose: () => void
  columns: ColumnDefinition[]
  onApply: (updatedColumns: ColumnDefinition[]) => void
}

const ColumnVisibilityModal: React.FC<ColumnVisibilityModalProps> = ({
  isOpen,
  onClose,
  columns,
  onApply
}) => {
  const [localColumns, setLocalColumns] = useState<ColumnDefinition[]>([])

  useEffect(() => {
    if (isOpen) {
      setLocalColumns([...columns])
    }
  }, [isOpen, columns])

  const handleToggleColumn = (systemName: string) => {
    setLocalColumns(prev => 
      prev.map(col => 
        col.systemName === systemName 
          ? { ...col, visible: !col.visible }
          : col
      )
    )
  }

  const handleSelectAll = () => {
    setLocalColumns(prev => prev.map(col => ({ ...col, visible: true })))
  }

  const handleDeselectAll = () => {
    setLocalColumns(prev => prev.map(col => ({ ...col, visible: false })))
  }

  const handleApply = () => {
    onApply(localColumns)
    onClose()
  }

  const handleCancel = () => {
    setLocalColumns([...columns]) // Reset to original state
    onClose()
  }

  const visibleCount = localColumns.filter(col => col.visible).length
  const totalCount = localColumns.length

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={handleCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>🔧 Configurar Columnas</h2>
          <button 
            className={styles.closeButton}
            onClick={handleCancel}
          >
            ×
          </button>
        </div>
        
        <div className={styles.modalBody}>
          {/* Información del filtro */}
          <div className={styles.filterInfo}>
            <span className={styles.filterCount}>
              {visibleCount} de {totalCount} columnas visibles
            </span>
          </div>

          {/* Botones de selección */}
          <div className={styles.selectionButtons}>
            <button 
              onClick={handleSelectAll}
              className={styles.selectButton}
            >
              Mostrar todas
            </button>
            <button 
              onClick={handleDeselectAll}
              className={styles.selectButton}
            >
              Ocultar todas
            </button>
          </div>

          {/* Lista de columnas */}
          <div className={styles.columnsList}>
            {localColumns.map(column => (
              <label key={column.systemName} className={styles.columnItem}>
                <input
                  type="checkbox"
                  checked={column.visible}
                  onChange={() => handleToggleColumn(column.systemName)}
                  className={styles.checkbox}
                />
                <span className={styles.columnText}>{column.header}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            onClick={handleCancel}
            className={styles.cancelButton}
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            className={styles.confirmButton}
          >
            Aplicar cambios
          </button>
        </div>
      </div>
    </div>
  )
}

export default ColumnVisibilityModal
