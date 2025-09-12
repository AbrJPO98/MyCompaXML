'use client'
import React, { useState, useEffect } from 'react'
import styles from './FileLogsModal.module.css'

export interface FileLogEntry {
  id: string
  fileName: string
  summary: string
  timestamp: string
  detail: string
  type: 'rejected' | 'response' | 'success'
}

interface FileLogsModalProps {
  isOpen: boolean
  onClose: () => void
  channelId: string
}

const FileLogsModal: React.FC<FileLogsModalProps> = ({ isOpen, onClose, channelId }) => {
  const [logs, setLogs] = useState<FileLogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<FileLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDetail, setSelectedDetail] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const loadLogs = () => {
    setLoading(true)
    
    // Cargar logs del localStorage específico para el canal
    const storedLogs = localStorage.getItem(`fileLogs_${channelId}`)
    if (storedLogs) {
      try {
        const parsedLogs = JSON.parse(storedLogs)
        // Ordenar por timestamp descendente (más recientes primero)
        parsedLogs.sort((a: FileLogEntry, b: FileLogEntry) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        setLogs(parsedLogs)
        applyFilter(parsedLogs, typeFilter)
      } catch (error) {
        console.error('Error parsing file logs:', error)
        setLogs([])
        setFilteredLogs([])
      }
    } else {
      setLogs([])
      setFilteredLogs([])
    }
    
    setLoading(false)
  }

  const applyFilter = (logsToFilter: FileLogEntry[], filter: string) => {
    let filtered = logsToFilter
    
    if (filter !== 'all') {
      filtered = logsToFilter.filter(log => log.type === filter)
    }
    
    setFilteredLogs(filtered)
  }

  const handleFilterChange = (newFilter: string) => {
    setTypeFilter(newFilter)
    applyFilter(logs, newFilter)
  }

  const handleViewDetail = (log: FileLogEntry) => {
    setSelectedDetail(log.detail)
  }

  const clearLogs = () => {
    if (confirm('¿Está seguro de que desea limpiar todos los logs?')) {
      localStorage.removeItem(`fileLogs_${channelId}`)
      setLogs([])
      setFilteredLogs([])
      setSelectedDetail('')
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'rejected':
        return '❌'
      case 'response':
        return '📨'
      case 'success':
        return '✅'
      default:
        return '📄'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'rejected':
        return 'Rechazado'
      case 'response':
        return 'Respuesta'
      case 'success':
        return 'Exitoso'
      default:
        return 'Desconocido'
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadLogs()
    }
  }, [isOpen, channelId])

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>📊 Detalle de Procesamiento de Archivos</h2>
          <div className={styles.headerButtons}>
            <button onClick={clearLogs} className={styles.clearButton}>
              🗑️ Limpiar logs
            </button>
            <button onClick={onClose} className={styles.closeButton}>
              ✕
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {loading && <div className={styles.loading}>Cargando logs...</div>}

          {!loading && (
            <>
              {/* Filtros */}
              <div className={styles.filtersSection}>
                <h3>Filtrar por tipo:</h3>
                <div className={styles.filterButtons}>
                  <button
                    onClick={() => handleFilterChange('all')}
                    className={`${styles.filterButton} ${typeFilter === 'all' ? styles.active : ''}`}
                  >
                    📋 Todos ({logs.length})
                  </button>
                  <button
                    onClick={() => handleFilterChange('success')}
                    className={`${styles.filterButton} ${styles.successFilter} ${typeFilter === 'success' ? styles.active : ''}`}
                  >
                    ✅ Exitosos ({logs.filter(log => log.type === 'success').length})
                  </button>
                  <button
                    onClick={() => handleFilterChange('response')}
                    className={`${styles.filterButton} ${styles.responseFilter} ${typeFilter === 'response' ? styles.active : ''}`}
                  >
                    📨 Respuestas ({logs.filter(log => log.type === 'response').length})
                  </button>
                  <button
                    onClick={() => handleFilterChange('rejected')}
                    className={`${styles.filterButton} ${styles.rejectedFilter} ${typeFilter === 'rejected' ? styles.active : ''}`}
                  >
                    ❌ Rechazados ({logs.filter(log => log.type === 'rejected').length})
                  </button>
                </div>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Nombre</th>
                      <th>Resumen del detalle</th>
                      <th>Hora</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={styles.noData}>
                          {logs.length === 0 ? 'No hay logs de procesamiento' : 'No hay registros para el filtro seleccionado'}
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className={styles[`row-${log.type}`]}>
                          <td>
                            <span className={styles.typeCell}>
                              {getTypeIcon(log.type)} {getTypeLabel(log.type)}
                            </span>
                          </td>
                          <td className={styles.fileName}>{log.fileName}</td>
                          <td className={styles.summary}>{log.summary}</td>
                          <td className={styles.timestamp}>{formatTime(log.timestamp)}</td>
                          <td>
                            <button
                              onClick={() => handleViewDetail(log)}
                              className={styles.viewButton}
                            >
                              👁️ Ver
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className={styles.detailSection}>
                <h3>Detalle del proceso</h3>
                <textarea
                  className={styles.detailTextarea}
                  value={selectedDetail}
                  readOnly
                  placeholder="Seleccione un registro para ver el detalle completo..."
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Función utilitaria para agregar logs
export const addFileLog = (channelId: string, log: Omit<FileLogEntry, 'id' | 'timestamp'>) => {
  const existingLogs = localStorage.getItem(`fileLogs_${channelId}`)
  let logs: FileLogEntry[] = []
  
  if (existingLogs) {
    try {
      logs = JSON.parse(existingLogs)
    } catch (error) {
      console.error('Error parsing existing logs:', error)
      logs = []
    }
  }

  const newLog: FileLogEntry = {
    ...log,
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString()
  }

  logs.unshift(newLog) // Agregar al inicio
  
  // Limitar a 100 logs más recientes
  if (logs.length > 100) {
    logs = logs.slice(0, 100)
  }

  localStorage.setItem(`fileLogs_${channelId}`, JSON.stringify(logs))
}

export default FileLogsModal
