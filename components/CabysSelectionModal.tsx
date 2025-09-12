'use client'
import React, { useState, useEffect, useCallback } from 'react'
import styles from './CabysSelectionModal.module.css'

interface CabysItem {
  codigo: string
  descripOf: string
  bienoserv: string
  descripPer: string
  descripGasInv: string
  categoria: string
  actEconomica: string
  vidaUtil: string | number
  importado: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface CabysSelectionModalProps {
  channelId: string
  onSelect: (cabys: CabysItem) => void
  onClose: () => void
  onEdit?: (cabys: CabysItem) => void
}

const CabysSelectionModal: React.FC<CabysSelectionModalProps> = ({ channelId, onSelect, onClose, onEdit }) => {
  const [mode, setMode] = useState<'personales' | 'completo'>('personales')
  const [data, setData] = useState<CabysItem[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search)
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        channelId,
        mode,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchDebounced
      })

      const response = await fetch(`/api/cabys-selection?${params}`)
      
      if (response.ok) {
        const result = await response.json()
        setData(result.data || [])
        setPagination(result.pagination || pagination)
      } else {
        console.error('Error loading CABYS data:', response.status)
        setData([])
      }
    } catch (error) {
      console.error('Error loading CABYS data:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [channelId, mode, pagination, searchDebounced])

  // Load data when parameters change
  useEffect(() => {
    loadData()
  }, [mode, pagination.page, pagination.limit, searchDebounced, channelId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset page when mode or search changes
  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }))
    }
  }, [mode, searchDebounced, pagination.page])

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
  }

  const handleModeChange = (newMode: 'personales' | 'completo') => {
    setMode(newMode)
    setSearch('')
    setSearchDebounced('')
  }

  const handleSelect = (item: CabysItem) => {
    onSelect(item)
    onClose()
  }

  const handleEdit = (item: CabysItem) => {
    if (onEdit) {
      onEdit(item)
    }
  }

  const truncateText = (text: string, maxLength: number = 30) => {
    if (!text || text === '-') return text
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>📋 Seleccionar Código CABYS</h2>
          <button 
            onClick={onClose}
            className={styles.closeButton}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Controls */}
          <div className={styles.controls}>
            <div className={styles.modeToggle}>
              <button
                onClick={() => handleModeChange('personales')}
                className={`${styles.modeButton} ${mode === 'personales' ? styles.active : ''}`}
                disabled={loading}
              >
                📁 CABYS Utilizados
              </button>
              <button
                onClick={() => handleModeChange('completo')}
                className={`${styles.modeButton} ${mode === 'completo' ? styles.active : ''}`}
                disabled={loading}
              >
                📚 Catálogo Completo
              </button>
            </div>

            <div className={styles.searchAndLimit}>
              <input
                type="text"
                placeholder="Buscar por código, descripción o categoría..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
                disabled={loading}
              />
              
              <select
                value={pagination.limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className={styles.limitSelect}
                disabled={loading}
              >
                <option value={10}>10 por página</option>
                <option value={25}>25 por página</option>
                <option value={50}>50 por página</option>
                <option value={100}>100 por página</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className={styles.tableContainer}>
            {loading ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Cargando datos...</p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descripción Oficial</th>
                    <th>Bien/Servicio</th>
                    <th>Desc. Personal</th>
                    <th>Gasto/Inv.</th>
                    <th>Categoría</th>
                    <th>Act. Económica</th>
                    <th>Vida Útil</th>
                    <th>Importado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={10} className={styles.noData}>
                        {search ? 'No se encontraron resultados' : 'No hay datos disponibles'}
                      </td>
                    </tr>
                  ) : (
                    data.map((item, index) => (
                      <tr key={`${item.codigo}-${index}`}>
                        <td className={styles.codigo}>{item.codigo}</td>
                        <td 
                          className={styles.descripcion}
                          title={item.descripOf}
                        >
                          {truncateText(item.descripOf)}
                        </td>
                        <td 
                          className={styles.bienoserv}
                          title={item.bienoserv}
                        >
                          {truncateText(item.bienoserv, 20)}
                        </td>
                        <td 
                          className={styles.descripcionPer}
                          title={item.descripPer !== '-' ? item.descripPer : ''}
                        >
                          {truncateText(item.descripPer, 20)}
                        </td>
                        <td 
                          className={styles.gastoInv}
                          title={item.descripGasInv !== '-' ? item.descripGasInv : ''}
                        >
                          {truncateText(item.descripGasInv, 15)}
                        </td>
                        <td 
                          className={styles.categoria}
                          title={item.categoria}
                        >
                          {truncateText(item.categoria, 15)}
                        </td>
                        <td 
                          className={styles.actEconomica}
                          title={item.actEconomica !== '-' ? item.actEconomica : ''}
                        >
                          {truncateText(item.actEconomica, 15)}
                        </td>
                        <td className={styles.vidaUtil}>{item.vidaUtil}</td>
                        <td className={styles.importado}>{item.importado}</td>
                        <td className={styles.action}>
                          <div className={styles.actionButtons}>
                            <button
                              onClick={() => handleSelect(item)}
                              className={styles.selectButton}
                              title="Seleccionar este CABYS"
                            >
                              ✓
                            </button>
                            {onEdit && (
                              <button
                                onClick={() => handleEdit(item)}
                                className={styles.editButton}
                                title="Editar este CABYS"
                              >
                                ✏️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && data.length > 0 && (
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} resultados
              </div>
              
              <div className={styles.paginationControls}>
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className={styles.pageButton}
                >
                  ← Anterior
                </button>
                
                <span className={styles.pageInfo}>
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className={styles.pageButton}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CabysSelectionModal