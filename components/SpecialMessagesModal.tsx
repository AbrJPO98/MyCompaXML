'use client'
import React, { useState, useEffect } from 'react'
import styles from './SpecialMessagesModal.module.css'

interface SpecialMessage {
  _id: string
  clave: string
  xml: string
  path: string
  nombreEmisor?: string
  tipoIdentificacionEmisor?: string
  numeroCedulaEmisor?: string
  nombreReceptor?: string
  tipoIdentificacionReceptor?: string
  numeroCedulaReceptor?: string
  mensaje?: string
  impuesto?: string
  total?: string
  detalleMensaje?: string
}

interface SpecialMessagesModalProps {
  isOpen: boolean
  onClose: () => void
  channelId: string
}

const SpecialMessagesModal: React.FC<SpecialMessagesModalProps> = ({ isOpen, onClose, channelId }) => {
  const [messages, setMessages] = useState<SpecialMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<string>('')

  // Función para extraer valores de nodos XML
  const extractTagValue = (xmlDoc: Document, tagName: string): string => {
    const elements = xmlDoc.getElementsByTagName(tagName)
    return elements.length > 0 ? elements[0].textContent || '' : ''
  }

  // Función para decodificar XML de Base64
  const fromBase64 = (base64String: string): string => {
    try {
      return decodeURIComponent(escape(window.atob(base64String)))
    } catch (error) {
      console.error('Error decodificando Base64:', error)
      return ''
    }
  }

  // Función para procesar XML y extraer datos
  const processXmlData = (xmlContent: string): Partial<SpecialMessage> => {
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlContent, 'application/xml')
      
      return {
        nombreEmisor: extractTagValue(xmlDoc, 'NombreEmisor'),
        tipoIdentificacionEmisor: extractTagValue(xmlDoc, 'TipoIdentificacionEmisor'),
        numeroCedulaEmisor: extractTagValue(xmlDoc, 'NumeroCedulaEmisor'),
        nombreReceptor: extractTagValue(xmlDoc, 'NombreReceptor'),
        tipoIdentificacionReceptor: extractTagValue(xmlDoc, 'TipoIdentificacionReceptor'),
        numeroCedulaReceptor: extractTagValue(xmlDoc, 'NumeroCedulaReceptor'),
        mensaje: extractTagValue(xmlDoc, 'Mensaje'),
        impuesto: extractTagValue(xmlDoc, 'MontoTotalImpuesto'),
        total: extractTagValue(xmlDoc, 'TotalFactura'),
        detalleMensaje: extractTagValue(xmlDoc, 'DetalleMensaje')
      }
    } catch (error) {
      console.error('Error procesando XML:', error)
      return {}
    }
  }

  const loadMessages = async () => {
    setLoading(true)
    setError(null)

    try {
      // Obtener documentos de respuesta (esRespuesta = true)
      const response = await fetch(`/api/facturas?channelId=${channelId}&esRespuesta=true`)
      const result = await response.json()

      if (result.success) {
        const messagesData = result.data || []
        
        // Procesar cada mensaje para extraer datos del XML
        const processedMessages = messagesData.map((msg: any) => {
          const xmlContent = fromBase64(msg.xml)
          const xmlData = processXmlData(xmlContent)
          
          return {
            ...msg,
            ...xmlData
          }
        })

        setMessages(processedMessages)
      } else {
        throw new Error(result.error || 'Error al cargar mensajes')
      }
    } catch (error) {
      console.error('Error cargando mensajes especiales:', error)
      setError('Error al cargar los mensajes especiales')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (messageId: string, clave: string) => {
    if (!confirm(`¿Está seguro de que desea eliminar el mensaje con clave ${clave}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/facturas/${messageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessages(messages.filter(msg => msg._id !== messageId))
        alert('Mensaje eliminado exitosamente')
      } else {
        throw new Error('Error al eliminar mensaje')
      }
    } catch (error) {
      console.error('Error eliminando mensaje:', error)
      alert('Error al eliminar el mensaje')
    }
  }

  const handleDownload = (message: SpecialMessage) => {
    try {
      const xmlContent = fromBase64(message.xml)
      const blob = new Blob([xmlContent], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${message.clave}.xml`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error descargando archivo:', error)
      alert('Error al descargar el archivo')
    }
  }

  const handleShowDetail = (message: SpecialMessage) => {
    setSelectedDetail(message.detalleMensaje || 'No hay detalle disponible')
  }

  useEffect(() => {
    if (isOpen) {
      loadMessages()
    }
  }, [isOpen, channelId, loadMessages])

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>📨 Mensajes Especiales</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {loading && <div className={styles.loading}>Cargando mensajes...</div>}
          {error && <div className={styles.error}>{error}</div>}

          {!loading && !error && (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Eliminar</th>
                    <th>Clave</th>
                    <th>Nombre Emisor</th>
                    <th>Tipo Cédula Emisor</th>
                    <th>Número Cédula Emisor</th>
                    <th>Nombre Receptor</th>
                    <th>Tipo Cédula Receptor</th>
                    <th>Número Cédula Receptor</th>
                    <th>Mensaje</th>
                    <th>Impuesto</th>
                    <th>Total</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.length === 0 ? (
                    <tr>
                      <td colSpan={12} className={styles.noData}>
                        No hay mensajes especiales
                      </td>
                    </tr>
                  ) : (
                    messages.map((message) => (
                      <tr key={message._id}>
                        <td>
                          <button
                            onClick={() => handleDelete(message._id, message.clave)}
                            className={styles.deleteButton}
                          >
                            🗑️
                          </button>
                        </td>
                        <td>{message.clave}</td>
                        <td>{message.nombreEmisor || '-'}</td>
                        <td>{message.tipoIdentificacionEmisor || '-'}</td>
                        <td>{message.numeroCedulaEmisor || '-'}</td>
                        <td>{message.nombreReceptor || '-'}</td>
                        <td>{message.tipoIdentificacionReceptor || '-'}</td>
                        <td>{message.numeroCedulaReceptor || '-'}</td>
                        <td>{message.mensaje || '-'}</td>
                        <td>{message.impuesto || '-'}</td>
                        <td>{message.total || '-'}</td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button
                              onClick={() => handleDownload(message)}
                              className={styles.downloadButton}
                            >
                              📥
                            </button>
                            <button
                              onClick={() => handleShowDetail(message)}
                              className={styles.detailButton}
                            >
                              📄
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className={styles.detailSection}>
            <h3>Detalle del Mensaje</h3>
            <textarea
              className={styles.detailTextarea}
              value={selectedDetail}
              readOnly
              placeholder="Seleccione un mensaje para ver el detalle..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SpecialMessagesModal
