'use client'
import React, { useState, useEffect } from 'react'
import styles from './NuevaFacturaModal.module.css'

interface NuevaFacturaModalProps {
  isOpen: boolean
  onClose: () => void
  channelId: string
  userId: string
}

interface InvoiceData {
  actividadEconomica: {
    _id: string
    nombre_personal: string
  } | null
  sucursal: {
    _id: string
    nombre: string
    codigo: string
  } | null
  caja: {
    _id: string
    numero: string
    numeracion_facturas: { [key: string]: string }
  } | null
}

const TIPOS_DOCUMENTO = [
  { value: '01', label: '01 - Factura electrónica' },
  { value: '02', label: '02 - Nota de débito electrónica' },
  { value: '03', label: '03 - Nota de crédito electrónica' },
  { value: '04', label: '04 - Tiquete electrónico' },
  { value: '05', label: '05 - Confirmación de aceptación del comprobante electrónico' },
  { value: '06', label: '06 - Confirmación de aceptación parcial del comprobante electrónico' },
  { value: '07', label: '07 - Confirmación de rechazo del comprobante electrónico' },
  { value: '08', label: '08 - Factura electrónica de compras' },
  { value: '09', label: '09 - Factura electrónica de exportación' },
  { value: '10', label: '10 - Recibo Electrónico de Pago' }
]

export default function NuevaFacturaModal({ isOpen, onClose, channelId, userId }: NuevaFacturaModalProps) {
  const [tipoDocumento, setTipoDocumento] = useState('01')
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(false)
  const [consecutivo, setConsecutivo] = useState('')

  useEffect(() => {
    if (isOpen && channelId && userId) {
      loadInvoiceData()
    }
  }, [isOpen, channelId, userId])

  useEffect(() => {
    calculateConsecutivo()
  }, [tipoDocumento, invoiceData])

  const loadInvoiceData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/user-channels/invoice-data?channelId=${channelId}&userId=${userId}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setInvoiceData(result.data)
        }
      } else {
        console.error('Error cargando datos de facturación')
      }
    } catch (error) {
      console.error('Error cargando datos de facturación:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateConsecutivo = () => {
    if (!invoiceData?.sucursal || !invoiceData?.caja) {
      setConsecutivo('')
      return
    }

    // Código de sucursal (padLeft a 5 dígitos)
    const codigoSucursal = invoiceData.sucursal.codigo.padStart(3, '0')

    // Número de caja (padLeft a 3 dígitos)
    const numeroCaja = invoiceData.caja.numero.padStart(5, '0')

    // Tipo de documento (padLeft a 2 dígitos)
    const tipoDoc = tipoDocumento.padStart(2, '0')

    // Número de factura del tipo de documento seleccionado (padLeft a 10 dígitos)
    const numeracionFacturas = invoiceData.caja.numeracion_facturas || {}
    const numeroFacturaRaw = parseInt(numeracionFacturas[tipoDocumento] || '0') + 1
    const numeroFactura = String(numeroFacturaRaw).padStart(10, '0')

    // Concatenar todo
    const consecutivoCalculado = `${codigoSucursal}${numeroCaja}${tipoDoc}${numeroFactura}`

    setConsecutivo(consecutivoCalculado)
  }

  const handleClose = () => {
    if (!loading) {
      setTipoDocumento('01')
      setInvoiceData(null)
      setConsecutivo('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>📄 Nueva Factura</h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Cargando datos...</p>
            </div>
          ) : (
            <>
              {/* Sección: Datos principales de la factura */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Datos principales de la factura</h3>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="tipoDocumento">
                      Tipo de documento <span className={styles.required}>*</span>
                    </label>
                    <select
                      id="tipoDocumento"
                      value={tipoDocumento}
                      onChange={(e) => setTipoDocumento(e.target.value)}
                      className={styles.selectInput}
                    >
                      {TIPOS_DOCUMENTO.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Actividad económica
                    </label>
                    <div className={styles.valueDisplay}>
                      {invoiceData?.actividadEconomica?.nombre_personal || 'No asignada'}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Sucursal
                    </label>
                    <div className={styles.valueDisplay}>
                      {invoiceData?.sucursal?.nombre || 'No asignada'}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Consecutivo
                    </label>
                    <div className={styles.valueDisplay}>
                      {consecutivo || 'Calculando...'}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={handleClose}
            className={styles.cancelButton}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.saveButton}
            disabled={loading}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}
