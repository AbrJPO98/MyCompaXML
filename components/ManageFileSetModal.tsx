'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { addFileLog } from './FileLogsModal'
import styles from './ManageFileSetModal.module.css'

interface FileSetItem {
  _id: string
  nombre: string
  fecha: string
  archivos: Array<{
    clave: string
    nombre: string
    xml: string
  }>
}

interface FileFromSet {
  clave: string
  nombre: string
  xml: string
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
  const [fileSets, setFileSets] = useState<FileSetItem[]>([])
  const [selectedFiles, setSelectedFiles] = useState<FileFromSet[]>([])
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFileSets = useCallback(async () => {
    if (!channelId || !isOpen) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/conjunto-archivos?channelId=${channelId}`)
      const result = await response.json()

      if (result.success) {
        setFileSets(result.data || [])
      } else {
        setError(result.error || 'Error al cargar conjuntos de archivos')
      }
    } catch (error) {
      console.error('Error al cargar conjuntos de archivos:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [channelId, isOpen])

  useEffect(() => {
    if (isOpen) {
      loadFileSets()
      setSelectedFiles([])
      setSelectedSetId(null)
      setError(null)
    }
  }, [isOpen, loadFileSets])

  const handleViewFiles = (fileSet: FileSetItem) => {
    setSelectedFiles(fileSet.archivos)
    setSelectedSetId(fileSet._id)
  }

  const handleAddFiles = async (fileSet: FileSetItem) => {
    setProcessing(true)
    setError(null)

    try {
      const rows: any[] = []
      const payload: any[] = []
      const claves: string[] = []

      // Primer paso: extraer todas las claves y verificar archivos descartados
      for (const archivo of fileSet.archivos) {
        claves.push(archivo.clave)
      }

      // Verificar si alguna clave está descartada
      let clavesDescartadas: string[] = []
      if (claves.length > 0) {
        try {
          const checkResponse = await fetch('/api/facturas-descartadas/check', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              claves: claves,
              channelId: channelId
            })
          })

          const checkResult = await checkResponse.json()
          if (checkResult.success) {
            clavesDescartadas = checkResult.data.clavesDescartadas || []
          }
        } catch (error) {
          console.error('Error verificando facturas descartadas:', error)
        }
      }

      // Segundo paso: procesar solo los archivos permitidos
      for (const archivo of fileSet.archivos) {
        try {
          // Verificar si la clave está descartada
          if (clavesDescartadas.includes(archivo.clave)) {
            addFileLog(channelId, {
              fileName: archivo.nombre,
              summary: 'Factura previamente descartada desde conjunto',
              detail: `La factura "${archivo.nombre}" con clave "${archivo.clave}" del conjunto de archivos fue previamente descartada y no puede ser procesada.`,
              type: 'rejected'
            })
            console.warn(`Factura con clave ${archivo.clave} está descartada, se omite`)
            continue
          }

          // Decodificar XML de Base64
          const decodedXML = decodeURIComponent(escape(window.atob(archivo.xml)))
          
          // Parsear XML para validar
          const parser = new DOMParser()
          const xmlDoc = parser.parseFromString(decodedXML, 'application/xml')
          
          // Verificar si hay errores de parseo
          const parserError = xmlDoc.getElementsByTagName('parsererror')[0]
          if (parserError) {
            addFileLog(channelId, {
              fileName: archivo.nombre,
              summary: 'XML inválido desde conjunto',
              detail: `El archivo "${archivo.nombre}" del conjunto contiene un XML inválido o malformado que no puede ser procesado. Error de parseo: ${parserError.textContent || 'Error de estructura XML'}.`,
              type: 'rejected'
            })
            console.error('XML inválido:', archivo.nombre)
            continue
          }

          // Detectar si es un archivo especial (MensajeHacienda, MensajeReceptor o MyCompaXMLDOCIMP)
          const rootElement = xmlDoc.documentElement
          const rootNodeName = rootElement.nodeName
          const isSpecialMessage = rootNodeName === 'MensajeHacienda' || rootNodeName === 'MensajeReceptor'
          const isImportDocument = rootNodeName === 'MyCompaXMLDOCIMP'
          const isMyCompaXMLDoc = rootNodeName === 'MyCompaXMLDOC'

          let fechaEmision = null
          let emision = null

          if (isImportDocument) {
            // Para documentos de importación MyCompaXMLDOCIMP, extraer FechaEmision del XML
            fechaEmision = extractTagValue(xmlDoc, 'FechaEmision')
            emision = fechaEmision ? emisionFromFecha(fechaEmision) : null // Generar emision para consistencia

            // Preparar para mostrar en tabla (documentos de importación)
            rows.push({
              _id: `temp_${Date.now()}_${Math.random()}`,
              clave: archivo.clave,
              claveCon: archivo.clave,
              path: archivo.nombre,
              fechaEmisionCon: fechaEmision, // Agregar fecha de emisión para ordenamiento
              emision, // Agregar campo emision para consistencia
              tipoDocumento: 'importacion', // Marcador para identificar tipo
              xmlContent: decodedXML // XML decodificado para procesamiento en BillsTable
            })
            
            // Log de éxito para documento de importación desde conjunto
            addFileLog(channelId, {
              fileName: archivo.nombre,
              summary: 'Documento de importación procesado desde conjunto',
              detail: `El documento de importación "${archivo.nombre}" con clave "${archivo.clave}" ha sido procesado exitosamente desde el conjunto de archivos y será agregado a la tabla.`,
              type: 'success'
            })
          } else if (isMyCompaXMLDoc) {
            // Para documentos MyCompaXMLDOC, extraer FechaEmision del XML
            fechaEmision = extractTagValue(xmlDoc, 'FechaEmision')
            emision = fechaEmision ? emisionFromFecha(fechaEmision) : null // Generar emision para consistencia

            // Preparar para mostrar en tabla (documentos MyCompaXMLDOC)
            rows.push({
              _id: `temp_${Date.now()}_${Math.random()}`,
              clave: archivo.clave,
              claveCon: archivo.clave,
              path: archivo.nombre,
              fechaEmisionCon: fechaEmision, // Agregar fecha de emisión para ordenamiento
              emision, // Agregar campo emision para consistencia
              tipoDocumento: 'mycompaxmldoc', // Marcador para identificar tipo
              xmlContent: decodedXML // XML decodificado para procesamiento en BillsTable
            })
            
            // Log de éxito para documento MyCompaXMLDOC desde conjunto
            addFileLog(channelId, {
              fileName: archivo.nombre,
              summary: 'Documento MyCompaXMLDOC procesado desde conjunto',
              detail: `El documento MyCompaXMLDOC "${archivo.nombre}" con clave "${archivo.clave}" ha sido procesado exitosamente desde el conjunto de archivos y será agregado a la tabla.`,
              type: 'success'
            })
          } else if (!isSpecialMessage) {
            // Para facturas normales, extraer FechaEmision
            fechaEmision = extractTagValue(xmlDoc, 'FechaEmision')
            if (!fechaEmision) {
              addFileLog(channelId, {
                fileName: archivo.nombre,
                summary: 'No se encontró FechaEmision desde conjunto',
                detail: `La factura "${archivo.nombre}" del conjunto de archivos no contiene el campo "FechaEmision" requerido para determinar la fecha de emisión.`,
                type: 'rejected'
              })
              console.warn('No se encontró FechaEmision en factura normal:', archivo.nombre)
              continue
            }
            emision = emisionFromFecha(fechaEmision)
          }

          // Preparar objeto para base de datos
          const facturaObject: any = {
            clave: archivo.clave,
            xml: archivo.xml, // Mantener en Base64 para BD
            path: archivo.nombre,
            channel_id: channelId,
            esRespuesta: isSpecialMessage // true para documentos de respuesta, false para facturas normales e importación
          }

          // Solo agregar emision si no es mensaje especial (pero sí para documentos de importación)
          if (!isSpecialMessage && emision) {
            facturaObject.emision = emision
          }

          // Agregar marcador para documentos de importación
          if (isImportDocument) {
            facturaObject.tipoDocumento = 'importacion'
          }

          // Agregar marcador para documentos MyCompaXMLDOC
          if (isMyCompaXMLDoc) {
            facturaObject.tipoDocumento = 'mycompaxmldoc'
          }

          payload.push(facturaObject)

          // Los mensajes especiales no se agregan a la tabla principal, se guardan solo en BD
          // Los documentos de importación y facturas normales sí se agregan a la tabla
          if (!isSpecialMessage && !isImportDocument) {
            // Preparar para mostrar en tabla (solo facturas normales)
            rows.push({
              _id: `temp_${Date.now()}_${Math.random()}`,
              clave: archivo.clave,
              claveCon: archivo.clave,
              fechaEmisionCon: fechaEmision,
              emision,
              path: archivo.nombre,
              xmlContent: decodedXML // XML decodificado para procesamiento en BillsTable
            })
            
            // No agregar log de éxito aquí - se agregará después de verificar duplicados
          } else if (isSpecialMessage) {
            console.log(`Mensaje especial procesado: ${archivo.nombre} (${rootNodeName})`)
            
            // No agregar log de éxito aquí - se agregará después de verificar duplicados
          }
        } catch (error) {
          addFileLog(channelId, {
            fileName: archivo.nombre,
            summary: 'Error interno de procesamiento desde conjunto',
            detail: `Error inesperado al procesar el archivo "${archivo.nombre}" del conjunto de archivos: ${error instanceof Error ? error.message : 'Error desconocido'}. Verifique que el archivo no esté corrupto.`,
            type: 'rejected'
          })
          console.error('Error procesando archivo:', archivo.nombre, error)
        }
      }

      if (payload.length === 0) {
        setError('No se pudieron procesar los archivos del conjunto (pueden estar descartados o ser inválidos)')
        return
      }

      // Insertar en base de datos usando la misma API
      try {
        const response = await fetch('/api/facturas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          throw new Error('Error en el servidor')
        }

        const result = await response.json()
        console.log('Facturas subidas desde conjunto:', result)

        // Manejar duplicados igual que en BillsToolbar
        const duplicateClaves = new Set()
        if (result.clavesDuplicadas) {
          result.clavesDuplicadas.forEach((clave: string) => duplicateClaves.add(clave))
        }

        // Agregar logs para archivos duplicados desde conjunto de archivos
        if (result.clavesDuplicadas && result.clavesDuplicadas.length > 0) {
          result.clavesDuplicadas.forEach((clave: string) => {
            // Buscar el archivo duplicado en las filas normales
            const duplicateRow = rows.find(row => row.clave === clave)
            if (duplicateRow) {
              addFileLog(channelId, {
                fileName: duplicateRow.path,
                summary: 'Archivo duplicado desde conjunto',
                detail: `La factura "${duplicateRow.path}" con clave "${clave}" del conjunto de archivos ya existe en la base de datos con el mismo valor de esRespuesta. El archivo duplicado fue ignorado.`,
                type: 'rejected'
              })
            } else {
              // Buscar en el payload completo (puede ser un mensaje especial)
              const duplicateSpecial = payload.find(item => item.clave === clave)
              if (duplicateSpecial && duplicateSpecial.esRespuesta) {
                addFileLog(channelId, {
                  fileName: duplicateSpecial.path,
                  summary: 'Documento de respuesta duplicado desde conjunto',
                  detail: `El documento de respuesta "${duplicateSpecial.path}" con clave "${clave}" del conjunto de archivos ya existe en la base de datos con el mismo valor de esRespuesta. El archivo duplicado fue ignorado.`,
                  type: 'rejected'
                })
              }
            }
          })
        }

        // Filtrar solo las filas que no son duplicados
        const nonDuplicateRows = rows.filter(row => !duplicateClaves.has(row.clave))

        // Agregar logs de éxito para facturas normales no duplicadas
        nonDuplicateRows.forEach(row => {
          const isImportDoc = row.tipoDocumento === 'importacion'
          addFileLog(channelId, {
            fileName: row.path,
            summary: isImportDoc ? 'Documento de importación procesado desde conjunto' : 'Factura procesada desde conjunto de archivos',
            detail: isImportDoc 
              ? `El documento de importación "${row.path}" con clave "${row.clave}" ha sido procesado exitosamente desde el conjunto de archivos y agregado a la tabla.`
              : `La factura "${row.path}" con clave "${row.clave}" ha sido procesada exitosamente desde el conjunto de archivos y agregada a la tabla.`,
            type: 'success'
          })
        })

        // Agregar logs de éxito para mensajes especiales no duplicados
        payload.forEach(item => {
          if (item.esRespuesta && !duplicateClaves.has(item.clave)) {
            addFileLog(channelId, {
              fileName: item.path,
              summary: `Documento de respuesta procesado desde conjunto`,
              detail: `El documento de respuesta "${item.path}" con clave "${item.clave}" ha sido procesado exitosamente desde el conjunto de archivos y guardado en la base de datos.`,
              type: 'response'
            })
          }
        })

        // Llamar a la función de agregar archivos del componente padre
        if (onFilesAdded && nonDuplicateRows.length > 0) {
          onFilesAdded(nonDuplicateRows)
        }

        const insertedCount = result.insertadas || 0
        const duplicateCount = result.duplicados || 0
        
        // Contar mensajes especiales vs facturas normales
        const specialMessagesCount = payload.length - rows.length
        const normalBillsCount = rows.length
        
        let message = ''
        if (normalBillsCount > 0) {
          const insertedNormal = Math.min(insertedCount, normalBillsCount)
          message += `${insertedNormal} facturas agregadas a la tabla`
        }
        
        if (specialMessagesCount > 0) {
          if (message) message += ', '
          message += `${specialMessagesCount} mensajes especiales guardados`
        }
        
        if (duplicateCount > 0) {
          message += `. ${duplicateCount} duplicados fueron ignorados`
        }
        
        alert(message || 'Archivos procesados exitosamente')

        onClose()
      } catch (error) {
        console.error('Error subiendo facturas:', error)
        setError('Error al subir las facturas al servidor')
      }

    } catch (error) {
      console.error('Error al agregar archivos:', error)
      setError('Error al procesar los archivos')
    } finally {
      setProcessing(false)
    }
  }

  const handleDownloadFile = (file: FileFromSet) => {
    try {
      // Decodificar de Base64
      const decodedXML = decodeURIComponent(escape(window.atob(file.xml)))
      
      // Crear blob con el XML
      const blob = new Blob([decodedXML], { type: 'application/xml' })
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${file.clave}.xml`
      
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

  // Función para extraer valor de un tag XML
  const extractTagValue = (doc: Document, tagName: string): string => {
    const elements = Array.from(doc.getElementsByTagName('*')) as Element[]
    for (const el of elements) {
      if (el.tagName === tagName || el.tagName.endsWith(':' + tagName)) {
        if (el.textContent) return el.textContent.trim()
      }
    }
    return ''
  }

  // Función para convertir fecha a formato emision
  const emisionFromFecha = (fechaIso: string): string => {
    const match = fechaIso.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
    if (!match) return ''
    
    const year = match[1].slice(-2)
    const month = match[2]
    const day = match[3]
    const hour = match[4]
    const minute = match[5]
    const second = match[6]
    
    return `${year}${month}${day}${hour}${minute}${second}`
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

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>📂 Agregar Conjunto de Archivos</h2>
          <button 
            onClick={onClose}
            className={styles.closeButton}
            disabled={processing}
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

          <div className={styles.tablesContainer}>
            {/* Tabla de conjuntos */}
            <div className={styles.setsSection}>
              <h3>Conjuntos de Archivos Disponibles</h3>
              
              {loading ? (
                <div className={styles.loading}>
                  <div className={styles.spinner}></div>
                  <p>Cargando conjuntos...</p>
                </div>
              ) : fileSets.length === 0 ? (
                <div className={styles.empty}>
                  <p>No hay conjuntos de archivos disponibles</p>
                </div>
              ) : (
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Fecha</th>
                        <th>Archivos</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fileSets.map((fileSet) => (
                        <tr key={fileSet._id} className={selectedSetId === fileSet._id ? styles.selectedRow : ''}>
                          <td title={fileSet.nombre} className={styles.truncate}>
                            {fileSet.nombre}
                          </td>
                          <td>{formatDate(fileSet.fecha)}</td>
                          <td className={styles.centered}>{fileSet.archivos.length}</td>
                          <td>
                            <div className={styles.actions}>
                              <button
                                type="button"
                                className={styles.viewButton}
                                onClick={() => handleViewFiles(fileSet)}
                                disabled={processing}
                              >
                                👁️ Ver
                              </button>
                              <button
                                type="button"
                                className={styles.addButton}
                                onClick={() => handleAddFiles(fileSet)}
                                disabled={processing}
                              >
                                {processing ? '⏳' : '➕'} Agregar
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

            {/* Tabla de archivos del conjunto seleccionado */}
            <div className={styles.filesSection}>
              <h3>Archivos del Conjunto Seleccionado</h3>
              
              {selectedFiles.length === 0 ? (
                <div className={styles.empty}>
                  <p>Selecciona un conjunto para ver sus archivos</p>
                </div>
              ) : (
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Clave</th>
                        <th>Nombre</th>
                        <th>Descargar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFiles.map((file, index) => (
                        <tr key={index}>
                          <td title={file.clave} className={styles.truncate}>
                            {file.clave}
                          </td>
                          <td title={file.nombre} className={styles.truncate}>
                            {file.nombre}
                          </td>
                          <td className={styles.centered}>
                            <button
                              type="button"
                              className={styles.downloadButton}
                              onClick={() => handleDownloadFile(file)}
                              title="Descargar XML"
                            >
                              📥
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.closeButtonFooter}
            onClick={onClose}
            disabled={processing}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ManageFileSetModal
