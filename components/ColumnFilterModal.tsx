'use client'
import React, { useState, useEffect } from 'react'
import { ColumnDefinition } from './BillsTable'
import styles from './ColumnFilterModal.module.css'

interface ColumnFilterModalProps {
  columns: ColumnDefinition[]
  onApply: (columns: ColumnDefinition[]) => void
  onClose: () => void
}

const ColumnFilterModal: React.FC<ColumnFilterModalProps> = ({ columns, onApply, onClose }) => {
  const [localColumns, setLocalColumns] = useState<ColumnDefinition[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showOnlyVisible, setShowOnlyVisible] = useState(false)

  useEffect(() => {
    setLocalColumns([...columns])
  }, [columns])

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
    const filteredColumns = getFilteredColumns()
    const allVisible = filteredColumns.every(col => col.visible)
    
    setLocalColumns(prev => 
      prev.map(col => {
        const isInFiltered = filteredColumns.some(fc => fc.systemName === col.systemName)
        return isInFiltered 
          ? { ...col, visible: !allVisible }
          : col
      })
    )
  }

  const handleApply = () => {
    onApply(localColumns)
    onClose()
  }

  const handleReset = () => {
    const resetColumns = columns.map(col => ({ ...col, visible: true }))
    setLocalColumns(resetColumns)
  }

  const getFilteredColumns = () => {
    let filtered = localColumns

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(col =>
        col.header.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.systemName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por visibilidad
    if (showOnlyVisible) {
      filtered = filtered.filter(col => col.visible)
    }

    return filtered
  }

  const filteredColumns = getFilteredColumns()
  const visibleCount = localColumns.filter(col => col.visible).length
  const totalCount = localColumns.length

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>🔍 Filtrar Columnas</h2>
          <button 
            onClick={onClose}
            className={styles.closeButton}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Estadísticas */}
          <div className={styles.stats}>
            <span className={styles.statItem}>
              <strong>{visibleCount}</strong> de <strong>{totalCount}</strong> columnas visibles
            </span>
            <span className={styles.statItem}>
              Mostrando <strong>{filteredColumns.length}</strong> columnas
            </span>
          </div>

          {/* Controles de filtrado */}
          <div className={styles.controls}>
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Buscar columnas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            
            <div className={styles.filterOptions}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={showOnlyVisible}
                  onChange={(e) => setShowOnlyVisible(e.target.checked)}
                />
                Mostrar solo visibles
              </label>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className={styles.quickActions}>
            <button
              onClick={handleSelectAll}
              className={styles.actionButton}
            >
              {filteredColumns.every(col => col.visible) ? '❌ Deseleccionar Todo' : '✅ Seleccionar Todo'}
            </button>
            <button
              onClick={handleReset}
              className={styles.actionButton}
            >
              🔄 Mostrar Todas
            </button>
          </div>

          {/* Lista de columnas */}
          <div className={styles.columnsList}>
            {filteredColumns.length === 0 ? (
              <div className={styles.noResults}>
                <span>🔍</span>
                <p>No se encontraron columnas que coincidan con la búsqueda</p>
              </div>
            ) : (
              filteredColumns.map((column) => (
                <div 
                  key={column.systemName} 
                  className={`${styles.columnItem} ${column.visible ? styles.visible : styles.hidden}`}
                >
                  <label className={styles.columnLabel}>
                    <input
                      type="checkbox"
                      checked={column.visible}
                      onChange={() => handleToggleColumn(column.systemName)}
                      className={styles.columnCheckbox}
                    />
                    <div className={styles.columnInfo}>
                      <span className={styles.columnHeader}>{column.header}</span>
                      <span className={styles.columnSystemName}>{column.systemName}</span>
                    </div>
                    <div className={styles.columnStatus}>
                      {column.visible ? (
                        <span className={styles.visibleBadge}>👁️ Visible</span>
                      ) : (
                        <span className={styles.hiddenBadge}>🙈 Oculta</span>
                      )}
                    </div>
                  </label>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            onClick={onClose}
            className={styles.cancelButton}
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            className={styles.confirmButton}
          >
            ✅ Confirmar ({visibleCount} columnas)
          </button>
        </div>
      </div>
    </div>
  )
}

export default ColumnFilterModal
