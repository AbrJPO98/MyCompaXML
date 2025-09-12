'use client'
import React, { useState, useEffect } from 'react'
import styles from './ColumnValueFilterModal.module.css'

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
  filteredData: any[]
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
  filteredData,
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

    const existingFilter = currentFilters.find(filter => filter.systemName === systemName)
    
    // Lógica corregida:
    // - Si es la última columna filtrada: mostrar todos los valores de esa columna (seleccionados y deseleccionados del filtro)
    // - Si NO es la última columna filtrada: mostrar solo los valores que están actualmente visibles
    let dataToUse
    let valuesToShow: FilterValue[] = []

    if (isLastFiltered && existingFilter) {
      // Es la última columna filtrada: reconstruir completamente la lista de valores
      // pero manteniendo el estado de selección del filtro existente
      dataToUse = data // Usar TODOS los datos originales para mostrar todos los valores posibles
      
      const uniqueValues = new Set<string>()
      let hasEmptyValues = false
      
      // Recorrer TODOS los datos para obtener todos los valores únicos
      dataToUse.forEach(row => {
        const value = row[systemName]
        const stringValue = value !== null && value !== undefined ? String(value).trim() : ''
        
        if (stringValue === '') {
          hasEmptyValues = true
        } else {
          uniqueValues.add(String(value))
        }
      })

      // Crear la lista completa de valores
      valuesToShow = Array.from(uniqueValues)
        .sort()
        .map(value => {
          // Buscar si este valor estaba en el filtro existente
          const existingValue = existingFilter.values.find(v => v.value === value)
          return {
            value,
            checked: existingValue ? existingValue.checked : false
          }
        })
      
      // Agregar opción "Vacíos" si hay valores vacíos
      if (hasEmptyValues) {
        const existingEmptyValue = existingFilter.values.find(v => v.value === '__EMPTY__')
        valuesToShow.unshift({
          value: '__EMPTY__',
          checked: existingEmptyValue ? existingEmptyValue.checked : false
        })
      }
    } else {
      // NO es la última columna filtrada: mostrar solo valores visibles
      dataToUse = filteredData.length > 0 ? filteredData : data
      
      const uniqueValues = new Set<string>()
      let hasEmptyValues = false
      
      dataToUse.forEach(row => {
        const value = row[systemName]
        const stringValue = value !== null && value !== undefined ? String(value).trim() : ''
        
        if (stringValue === '') {
          hasEmptyValues = true
        } else {
          uniqueValues.add(String(value))
        }
      })

      valuesToShow = Array.from(uniqueValues)
        .sort()
        .map(value => ({
          value,
          checked: true // Por defecto todos los valores visibles están seleccionados
        }))
      
      // Agregar opción "Vacíos" si hay valores vacíos
      if (hasEmptyValues) {
        valuesToShow.unshift({
          value: '__EMPTY__',
          checked: true
        })
      }
    }

    setFilterValues(valuesToShow)
  }, [isOpen, data, filteredData, systemName, currentFilters, isLastFiltered])

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
    
    // Verificar si todas las casillas están seleccionadas
    const allSelected = filterValues.length > 0 && filterValues.every(item => item.checked)
    
    if (allSelected) {
      if (isLastFiltered) {
        // Si es la última columna filtrada y todas están seleccionadas, eliminar el filtro
        onRemoveFilter(systemName)
      }
      // Si no es la última columna filtrada y todas están seleccionadas, no agregar filtro
      // (simplemente no llamamos onApplyFilter)
    } else {
      // Si no todas están seleccionadas, aplicar el filtro normalmente
      onApplyFilter(systemName, selectedValues)
    }
    
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

  const filteredValues = filterValues.filter(item => {
    const displayValue = item.value === '__EMPTY__' ? 'Vacíos' : item.value
    return displayValue.toLowerCase().includes(searchTerm.toLowerCase())
  })

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
                <span className={item.value === '__EMPTY__' ? styles.emptyValueText : styles.valueText}>
                  {item.value === '__EMPTY__' ? '(Vacíos)' : item.value}
                </span>
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