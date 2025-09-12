'use client'
import React, { useState, useEffect, useCallback } from 'react'
import styles from './DiscardedBillsModal.module.css'

interface DiscardedBill {
  _id: string
  fecha: string
  clave: string
  nombre: string
  tipoDoc: string
  dia: string
  mes: string
  anno: string
  nombreEmisor: string
  cedulaEmisor: string
  nombreReceptor: string
  cedulaReceptor: string
  total: string
  impuesto: string
  xml: string
}

interface DiscardedBillsModalProps {
  isOpen: boolean
  onClose: () => void
  channelId: string
}

const DiscardedBillsModal: React.FC<DiscardedBillsModalProps> = ({
  isOpen,
  onClose,
  channelId
}) => {
  const [discardedBills, setDiscardedBills] = useState<DiscardedBill[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDiscardedBills = useCallback(async () => {
    if (!channelId || !isOpen) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/facturas-descartadas?channelId=${channelId}`)
      const result = await response.json()

      if (result.success) {
        setDiscardedBills(result.data)
      } else {
        setError(result.error || 'Error al cargar facturas descartadas')
      }
    } catch (error) {
      console.error('Error al cargar facturas descartadas:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [channelId, isOpen])

  useEffect(() => {
    if (isOpen) {
      loadDiscardedBills()
    }
  }, [isOpen, loadDiscardedBills])

  const handleDelete = async (id: string, clave: string) => {
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar la factura descartada con clave ${clave}?`
    )

    if (!confirmed) return

    try {
      const response = await fetch(`/api/facturas-descartadas/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        setDiscardedBills(prev => prev.filter(bill => bill._id !== id))
        alert('Factura descartada eliminada exitosamente')
      } else {
        alert(result.error || 'Error al eliminar factura descartada')
      }
    } catch (error) {
      console.error('Error al eliminar factura descartada:', error)
      alert('Error de conexión')
    }
  }

  const handleDownloadXML = (xml: string, clave: string) => {
    try {
      // Decodificar de Base64
      const decodedXML = decodeURIComponent(escape(window.atob(xml)))
      
      // Crear blob con el XML
      const blob = new Blob([decodedXML], { type: 'application/xml' })
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${clave}.xml`
      
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
          <h2>📋 Facturas Descartadas</h2>
          <button 
            onClick={onClose}
            className={styles.closeButton}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Cargando facturas descartadas...</p>
            </div>
          ) : error ? (
            <div className={styles.error}>
              <p>❌ {error}</p>
            </div>
          ) : discardedBills.length === 0 ? (
            <div className={styles.empty}>
              <p>No hay facturas descartadas</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Clave</th>
                    <th>Nombre</th>
                    <th>Tipo Doc</th>
                    <th>Fecha Emisión</th>
                    <th>Emisor</th>
                    <th>Cédula Emisor</th>
                    <th>Receptor</th>
                    <th>Cédula Receptor</th>
                    <th>Total</th>
                    <th>Impuesto</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {discardedBills.map((bill) => (
                    <tr key={bill._id}>
                      <td>{formatDate(bill.fecha)}</td>
                      <td title={bill.clave} className={styles.truncate}>{bill.clave}</td>
                      <td title={bill.nombre} className={styles.truncate}>{bill.nombre}</td>
                      <td>{bill.tipoDoc}</td>
                      <td>{`${bill.dia}/${bill.mes}/${bill.anno}`}</td>
                      <td title={bill.nombreEmisor} className={styles.truncate}>{bill.nombreEmisor}</td>
                      <td>{bill.cedulaEmisor}</td>
                      <td title={bill.nombreReceptor} className={styles.truncate}>{bill.nombreReceptor}</td>
                      <td>{bill.cedulaReceptor}</td>
                      <td>{bill.total}</td>
                      <td>{bill.impuesto}</td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={styles.actionButton}
                            onClick={() => handleDownloadXML(bill.xml, bill.clave)}
                            title="Descargar XML"
                          >
                            📥
                          </button>
                          <button
                            type="button"
                            className={styles.deleteButton}
                            onClick={() => handleDelete(bill._id, bill.clave)}
                            title="Eliminar"
                          >
                            🗑️
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
      </div>
    </div>
  )
}

export default DiscardedBillsModal
