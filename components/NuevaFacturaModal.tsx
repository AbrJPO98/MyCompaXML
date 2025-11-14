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
    provincia?: string
    canton?: string
    distrito?: string
    direccion?: string
  } | null
  caja: {
    _id: string
    numero: string
    numeracion_facturas: { [key: string]: string }
  } | null
  channel: {
    _id: string
    name: string
    ident_type: string
    ident: string
    commercial_name: string
    phone_code: string
    phone: string
    email: string
    registro_fiscal_IVA: string
  } | null
}

interface UbicacionesData {
  provincias: {
    [key: string]: {
      nombre: string
      cantones: {
        [key: string]: {
          nombre: string
          distritos: {
            [key: string]: string
          }
        }
      }
    }
  }
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

const TIPOS_IDENTIFICACION: { [key: string]: string } = {
  '01': 'Física',
  '02': 'Jurídica',
  '03': 'DIMEX',
  '04': 'NITE',
  '##': 'Extranjero'
}

export default function NuevaFacturaModal({ isOpen, onClose, channelId, userId }: NuevaFacturaModalProps) {
  const [tipoDocumento, setTipoDocumento] = useState('01')
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(false)
  const [consecutivo, setConsecutivo] = useState('')
  const [ubicaciones, setUbicaciones] = useState<UbicacionesData | null>(null)
  const [ubicacionTexto, setUbicacionTexto] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadUbicaciones()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && channelId && userId) {
      loadInvoiceData()
    }
  }, [isOpen, channelId, userId])

  useEffect(() => {
    calculateConsecutivo()
    buildUbicacion()
  }, [tipoDocumento, invoiceData, ubicaciones])

  const loadUbicaciones = async () => {
    try {
      const response = await fetch('/CR_ubicaciones.json')
      if (response.ok) {
        const data = await response.json()
        setUbicaciones(data)
      }
    } catch (error) {
      console.error('Error cargando ubicaciones:', error)
    }
  }

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

  const buildUbicacion = () => {
    if (!invoiceData?.sucursal || !ubicaciones) {
      setUbicacionTexto('')
      return
    }

    const { provincia, canton, distrito, direccion } = invoiceData.sucursal

    if (!provincia || !canton || !distrito) {
      setUbicacionTexto(direccion || '')
      return
    }

    try {
      // Obtener nombre de provincia
      const provinciaData = ubicaciones.provincias[provincia]
      const nombreProvincia = provinciaData?.nombre || provincia

      // Obtener nombre de cantón
      const cantonData = provinciaData?.cantones[canton]
      const nombreCanton = cantonData?.nombre || canton

      // Obtener nombre de distrito
      const nombreDistrito = cantonData?.distritos[distrito] || distrito

      // Construir ubicación completa
      const partes = [nombreDistrito, nombreCanton, nombreProvincia, direccion].filter(Boolean)
      setUbicacionTexto(partes.join(', '))
    } catch (error) {
      console.error('Error construyendo ubicación:', error)
      setUbicacionTexto(direccion || '')
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
      setUbicacionTexto('')
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

              {/* Sección: Información del emisor */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Información del emisor</h3>
                
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Nombre del emisor
                    </label>
                    <div className={styles.valueDisplay}>
                      {invoiceData?.channel?.name || 'No disponible'}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Tipo de identificación
                    </label>
                    <div className={styles.valueDisplay}>
                      {invoiceData?.channel?.ident_type 
                        ? `${invoiceData.channel.ident_type} - ${TIPOS_IDENTIFICACION[invoiceData.channel.ident_type] || invoiceData.channel.ident_type}`
                        : 'No disponible'}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Número de identificación
                    </label>
                    <div className={styles.valueDisplay}>
                      {invoiceData?.channel?.ident || 'No disponible'}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Nombre comercial
                    </label>
                    <div className={styles.valueDisplay}>
                      {invoiceData?.channel?.commercial_name || 'No disponible'}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Código de teléfono
                    </label>
                    <div className={styles.valueDisplay}>
                      {invoiceData?.channel?.phone_code || 'No disponible'}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Número de teléfono
                    </label>
                    <div className={styles.valueDisplay}>
                      {invoiceData?.channel?.phone || 'No disponible'}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Email
                    </label>
                    <div className={styles.valueDisplay}>
                      {invoiceData?.channel?.email || 'No disponible'}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Registro fiscal 8707
                    </label>
                    <div className={styles.valueDisplay}>
                      {invoiceData?.channel?.registro_fiscal_IVA || 'No disponible'}
                    </div>
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.label}>
                      Ubicación
                    </label>
                    <div className={styles.valueDisplay}>
                      {ubicacionTexto || 'No disponible'}
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
