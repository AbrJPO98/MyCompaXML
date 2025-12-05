'use client'
import React, { useState, useEffect, useCallback } from 'react'
import styles from './ManageFileSetModal.module.css'

interface ArchivoConjuntoCategorizacionItem {
  cabys: string
  desc_fact: string
  descripPer: string
  bienoserv: string
  descripGasInv: string
  categoria: string
  actEconomica: string
  vidaUtil: string
  importado: string
}

interface Archivo {
  clave: string
  nombre: string
  xml: string
  categorizacion?: ArchivoConjuntoCategorizacionItem[]
}

interface Categorizacion {
  _id: string
  nombre: string
  fecha: string
  archivos: Archivo[]
}

interface ManageFileSetModalProps {
  isOpen: boolean
  onClose: () => void
  channelId: string
  onFilesAdded?: (files: any[]) => void
}

const ManageFileSetModal: React.FC<ManageFileSetModalProps> = ({
  isOpen,
  onClose,
  channelId,
  onFilesAdded
}) => {
  const [categorizaciones, setCategorizaciones] = useState<Categorizacion[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredCategorizaciones, setFilteredCategorizaciones] = useState<Categorizacion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCategorizacion, setSelectedCategorizacion] = useState<Categorizacion | null>(null)
  const [selectedArchivo, setSelectedArchivo] = useState<Archivo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCategorizaciones = useCallback(async () => {
    if (!channelId || !isOpen) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/conjunto-archivos?channelId=${channelId}`)
      const result = await response.json()

      if (result.success) {
        setCategorizaciones(result.data || [])
        setFilteredCategorizaciones(result.data || [])
      } else {
        setError(result.error || 'Error al cargar categorizaciones')
      }
    } catch (error) {
      console.error('Error al cargar categorizaciones:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [channelId, isOpen])

  useEffect(() => {
    if (isOpen) {
      loadCategorizaciones()
      setSearchTerm('')
      setSelectedCategorizacion(null)
      setError(null)
    }
  }, [isOpen, loadCategorizaciones])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCategorizaciones(categorizaciones)
      setShowSuggestions(false)
    } else {
      const filtered = categorizaciones.filter(cat =>
        cat.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCategorizaciones(filtered)
      setShowSuggestions(filtered.length > 0)
    }
  }, [searchTerm, categorizaciones])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setSelectedCategorizacion(null)
  }

  const handleSelectCategorizacion = (categorizacion: Categorizacion) => {
    setSelectedCategorizacion(categorizacion)
    setSearchTerm(categorizacion.nombre)
    setShowSuggestions(false)
    setSelectedArchivo(null) // Resetear archivo seleccionado al cambiar categorización
  }

  const handleInputFocus = () => {
    if (searchTerm.trim() === '' && categorizaciones.length > 0) {
      setFilteredCategorizaciones(categorizaciones)
      setShowSuggestions(true)
    } else if (filteredCategorizaciones.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleInputBlur = () => {
    // Delay para permitir que el click en las sugerencias se ejecute primero
    setTimeout(() => {
      setShowSuggestions(false)
    }, 200)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDownloadFile = (archivo: Archivo) => {
    try {
      // Decodificar de Base64
      const decodedXML = decodeURIComponent(escape(window.atob(archivo.xml)))
      
      // Crear blob con el XML
      const blob = new Blob([decodedXML], { type: 'application/xml' })
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${archivo.clave}.xml`
      
      // Simular click para descargar
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Limpiar URL
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error al descargar XML:', error)
      alert('Error al generar archivo XML')
    }
  }

  const handleViewCategorizacion = (archivo: Archivo) => {
    setSelectedArchivo(archivo)
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Ver categorizaciones realizadas</h2>
          <button 
            onClick={onClose}
            className={styles.closeButton}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Error */}
          {error && (
            <div className={styles.error}>
              <p>❌ {error}</p>
            </div>
          )}

          {/* Input autocomplete */}
          <div className={styles.autocompleteContainer}>
            <label htmlFor="categorizacionSearch">Buscar categorización:</label>
            <div className={styles.autocompleteWrapper}>
              <input
                type="text"
                id="categorizacionSearch"
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder={loading ? 'Cargando categorizaciones...' : 'Escribe para buscar...'}
                disabled={loading}
                className={styles.autocompleteInput}
                autoComplete="off"
              />
              
              {showSuggestions && filteredCategorizaciones.length > 0 && (
                <div className={styles.suggestionsList}>
                  {filteredCategorizaciones.map((categorizacion) => (
                    <div
                      key={categorizacion._id}
                      className={styles.suggestionItem}
                      onClick={() => handleSelectCategorizacion(categorizacion)}
                      onMouseDown={(e) => e.preventDefault()} // Prevenir blur antes del click
                    >
                      <div className={styles.suggestionName}>{categorizacion.nombre}</div>
                      <div className={styles.suggestionMeta}>
                        {formatDate(categorizacion.fecha)} • {categorizacion.archivos.length} archivo(s)
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showSuggestions && searchTerm.trim() !== '' && filteredCategorizaciones.length === 0 && (
                <div className={styles.suggestionsList}>
                  <div className={styles.suggestionItem}>
                    <div className={styles.suggestionName}>No se encontraron categorizaciones</div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Tablas de datos */}
          {selectedCategorizacion && (
            <div className={styles.tablesContainer}>
              {/* Primera tabla: Archivos */}
              <div className={styles.filesSection}>
                <h3>Archivos de la categorización</h3>
                
                {selectedCategorizacion.archivos.length === 0 ? (
                  <div className={styles.empty}>
                    <p>No hay archivos en esta categorización</p>
                  </div>
                ) : (
                  <div className={styles.tableContainer}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Clave</th>
                          <th>Nombre</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCategorizacion.archivos.map((archivo, index) => (
                          <tr key={index} className={selectedArchivo?.clave === archivo.clave ? styles.selectedRow : ''}>
                            <td title={archivo.clave} className={styles.truncate}>
                              {archivo.clave}
                            </td>
                            <td title={archivo.nombre} className={styles.truncate}>
                              {archivo.nombre}
                            </td>
                            <td className={styles.centered}>
                              <div className={styles.actions}>
                                <button
                                  type="button"
                                  className={styles.downloadButton}
                                  onClick={() => handleDownloadFile(archivo)}
                                  title="Descargar XML"
                                >
                                  📥 Descargar
                                </button>
                                <button
                                  type="button"
                                  className={styles.viewButton}
                                  onClick={() => handleViewCategorizacion(archivo)}
                                  title="Ver datos de categorización"
                                  disabled={!archivo.categorizacion || archivo.categorizacion.length === 0}
                                >
                                  👁️ Ver categorización
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Segunda tabla: Datos de categorización */}
              <div className={styles.categorizacionSection}>
                {selectedArchivo ? (
                  <>
                    <h3>Datos de categorización - {selectedArchivo.nombre}</h3>
                    {selectedArchivo.categorizacion && selectedArchivo.categorizacion.length > 0 ? (
                      <div className={styles.tableContainer}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>CABYS</th>
                              <th>Descripción Personalizada</th>
                              <th>Bien o Servicio</th>
                              <th>Descripción Gas/Inv</th>
                              <th>Categoría</th>
                              <th>Actividad Económica</th>
                              <th>Vida Útil</th>
                              <th>Importado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedArchivo.categorizacion.map((item, index) => (
                              <tr key={index}>
                                <td className={styles.truncate} title={item.cabys}>
                                  {item.cabys || '-'}
                                </td>
                                <td className={styles.truncate} title={item.descripPer}>
                                  {item.descripPer || '-'}
                                </td>
                                <td className={styles.truncate} title={item.bienoserv}>
                                  {item.bienoserv || '-'}
                                </td>
                                <td className={styles.truncate} title={item.descripGasInv}>
                                  {item.descripGasInv || '-'}
                                </td>
                                <td className={styles.truncate} title={item.categoria}>
                                  {item.categoria || '-'}
                                </td>
                                <td className={styles.truncate} title={item.actEconomica}>
                                  {item.actEconomica || '-'}
                                </td>
                                <td className={styles.truncate} title={item.vidaUtil}>
                                  {item.vidaUtil || '-'}
                                </td>
                                <td className={styles.truncate} title={item.importado}>
                                  {item.importado || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className={styles.empty}>
                        <p>Este archivo no tiene datos de categorización</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <h3>Datos de categorización</h3>
                    <div className={styles.empty}>
                      <p>Selecciona un archivo para ver sus datos de categorización</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.closeButtonFooter}
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ManageFileSetModal
