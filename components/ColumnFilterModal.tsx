'use client'
import React, { useState, useEffect } from 'react'
import styles from './ColumnFilterModal.module.css'

export interface FilterValue {
  value: string
  checked: boolean
}

export interface ColumnFilter {
  columnName: string
  systemName: string
  values: FilterValue[]
  isLastFiltered: boolean
}

interface ColumnFilterModalProps {
  isOpen: boolean
  onClose: () => void
  columnName: string
  systemName: string
  data: any[]
  currentFilters: ColumnFilter[]
  onApplyFilter: (systemName: string, selectedValues: string[]) => void
  onRemoveFilter: (systemName: string) => void
  onRemoveAllFilters: () => void
  isLastFiltered: boolean
}

const ColumnValueFilterModal: React.FC<ColumnFilterModalProps> = ({
  isOpen,
  onClose,
  columnName,
  systemName,
  data,
  currentFilters,
  onApplyFilter,
  onRemoveFilter,
  onRemoveAllFilters,
  isLastFiltered
}) => {
  const [filterValues, setFilterValues] = useState<FilterValue[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!isOpen || !data.length) return

    // Obtener todos los valores únicos de la columna
    const uniqueValues = new Set<string>()
    
    data.forEach(row => {
      const value = row[systemName]
      if (value !== null && value !== undefined && value !== '') {
        uniqueValues.add(String(value))
      }
    })

    // Obtener el filtro actual para esta columna si existe
    const existingFilter = currentFilters.find(filter => filter.systemName === systemName)
    
    // Crear array de FilterValue
    const values: FilterValue[] = Array.from(uniqueValues)
      .sort()
      .map(value => {
        // Si hay un filtro existente, usar sus valores checked
        if (existingFilter) {
          const existingValue = existingFilter.values.find(v => v.value === value)
          return {
            value,
            checked: existingValue ? existingValue.checked : true
          }
        }
        // Si no hay filtro existente, todos están marcados por defecto
        return {
          value,
          checked: true
        }
      })

    setFilterValues(values)
  }, [isOpen, data, systemName, currentFilters])

  const handleCheckboxChange = (value: string, checked: boolean) => {
    setFilterValues(prev => 
      prev.map(item => 
        item.value === value ? { ...item, checked } : item
      )
    )
  }

  const handleSelectAll = () => {
    setFilterValues(prev => prev.map(item => ({ ...item, checked: true })))
  }

  const handleDeselectAll = () => {
    setFilterValues(prev => prev.map(item => ({ ...item, checked: false })))
  }

  const handleApplyFilter = () => {
    const selectedValues = filterValues
      .filter(item => item.checked)
      .map(item => item.value)
    
    onApplyFilter(systemName, selectedValues)
    onClose()
  }

  const handleRemoveFilter = () => {
    onRemoveFilter(systemName)
    onClose()
  }

  const handleRemoveAllFilters = () => {
    onRemoveAllFilters()
    onClose()
  }

  const filteredValues = filterValues.filter(item =>
    item.value.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const checkedCount = filterValues.filter(item => item.checked).length
  const totalCount = filterValues.length

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Filtrar: {columnName}</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        <div className={styles.modalBody}>
          {/* Información del filtro */}
          <div className={styles.filterInfo}>
            <span className={styles.filterCount}>
              {checkedCount} de {totalCount} elementos seleccionados
            </span>
            {isLastFiltered && (
              <span className={styles.lastFilteredBadge}>
                Último filtro aplicado
              </span>
            )}
          </div>

          {/* Barra de búsqueda */}
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Buscar valores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Botones de selección */}
          <div className={styles.selectionButtons}>
            <button 
              onClick={handleSelectAll}
              className={styles.selectButton}
            >
              Seleccionar todo
            </button>
            <button 
              onClick={handleDeselectAll}
              className={styles.selectButton}
            >
              Deseleccionar todo
            </button>
          </div>

          {/* Lista de valores */}
          <div className={styles.valuesList}>
            {filteredValues.map(item => (
              <label key={item.value} className={styles.valueItem}>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => handleCheckboxChange(item.value, e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.valueText}>{item.value}</span>
              </label>
            ))}
          </div>

          {filteredValues.length === 0 && searchTerm && (
            <div className={styles.noResults}>
              No se encontraron valores que coincidan con &quot;{searchTerm}&quot;
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.footerLeft}>
            {/* Botón para eliminar filtro actual (solo si existe y es el último) */}
            {isLastFiltered && (
              <button
                onClick={handleRemoveFilter}
                className={styles.removeFilterButton}
              >
                Eliminar filtro
              </button>
            )}
            
            {/* Botón para eliminar todos los filtros (solo si hay filtros) */}
            {currentFilters.length > 0 && (
              <button
                onClick={handleRemoveAllFilters}
                className={styles.removeAllButton}
              >
                Eliminar todos los filtros
              </button>
            )}
          </div>

          <div className={styles.footerRight}>
            <button
              onClick={onClose}
              className={styles.cancelButton}
            >
              Cancelar
            </button>
            <button
              onClick={handleApplyFilter}
              className={styles.confirmButton}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ColumnValueFilterModal