'use client'
import React, { useState, useEffect, useCallback } from 'react'
import styles from './ImportDocModal.module.css'

interface Actividad {
  _id: string
  codigo: string
  nombre_personal: string
  nombre_original: string
}

interface Channel {
  _id: string
  name: string
  ident: string
  ident_type: string
}

interface DetalleItem {
  id: string
  detalleMercancia: string
  tipoMercancia: 'Bien' | 'Servicio'
  precioUnitario: number
  cantidad: number
  monto: number
  impuesto: number
  montoTotal: number
}

interface ImportDocModalProps {
  isOpen: boolean
  onClose: () => void
  channelId: string
}

const ImportDocModal: React.FC<ImportDocModalProps> = ({ isOpen, onClose, channelId }) => {
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [channel, setChannel] = useState<Channel | null>(null)
  const [loading, setLoading] = useState(false)
  const [channelLoading, setChannelLoading] = useState(true)
  
  // Estados del formulario principal
  const [actividadEconomica, setActividadEconomica] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [nombreImportador, setNombreImportador] = useState('')
  const [idImportador, setIdImportador] = useState('')
  const [paisImportacion, setPaisImportacion] = useState('')
  const [tipoMoneda, setTipoMoneda] = useState('CRC')
  const [tipoCambio, setTipoCambio] = useState('1')
  const [nuevaMoneda, setNuevaMoneda] = useState('')
  const [mostrarInputNuevaMoneda, setMostrarInputNuevaMoneda] = useState(false)
  
  // Estados del formulario de detalle
  const [detalleMercancia, setDetalleMercancia] = useState('')
  const [tipoMercancia, setTipoMercancia] = useState<'Bien' | 'Servicio'>('Bien')
  const [precioUnitario, setPrecioUnitario] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [impuesto, setImpuesto] = useState('')
  
  // Lista de detalles
  const [detalles, setDetalles] = useState<DetalleItem[]>([])

  const loadActividades = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/actividades?channelId=${channelId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.actividades) {
          setActividades(data.actividades)
        }
      }
    } catch (error) {
      console.error('Error loading actividades:', error)
    } finally {
      setLoading(false)
    }
  }, [channelId])

  const loadChannel = useCallback(async () => {
    setChannelLoading(true)
    try {
      const response = await fetch(`/api/channels/current?channelId=${channelId}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Channel data loaded:', data)
        setChannel(data.channel)
      } else {
        console.error('Error loading channel:', response.status)
        setChannel(null)
      }
    } catch (error) {
      console.error('Error loading channel:', error)
      setChannel(null)
    } finally {
      setChannelLoading(false)
    }
  }, [channelId])

  useEffect(() => {
    if (isOpen && channelId) {
      loadActividades()
      loadChannel()
    }
  }, [isOpen, channelId, loadActividades, loadChannel])

  // Calcular monto (precio unitario * cantidad)
  const calcularMonto = () => {
    const precio = parseFloat(precioUnitario) || 0
    const cant = cantidad || 0
    return precio * cant
  }

  // Calcular monto total (monto + impuesto)
  const calcularMontoTotal = () => {
    const monto = calcularMonto()
    const imp = parseFloat(impuesto) || 0
    return monto + imp
  }

  // Validar entrada numérica con decimales
  const handleNumericInput = (value: string, setter: (val: string) => void) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setter(value)
    }
  }

  // Manejar cambio en tipo de moneda
  const handleTipoMonedaChange = (value: string) => {
    setTipoMoneda(value)
    
    if (value === 'CRC') {
      setTipoCambio('1')
      setMostrarInputNuevaMoneda(false)
    } else if (value === 'Otros') {
      setMostrarInputNuevaMoneda(true)
    } else {
      setMostrarInputNuevaMoneda(false)
    }
  }

  // Agregar nueva moneda
  const handleAgregarNuevaMoneda = () => {
    if (!nuevaMoneda.trim()) {
      alert('Debe ingresar un código de moneda')
      return
    }
    
    // Aquí podrías agregar la nueva moneda a una lista de monedas personalizadas
    // Por ahora, simplemente la establecemos como seleccionada
    setTipoMoneda(nuevaMoneda.trim().toUpperCase())
    setMostrarInputNuevaMoneda(false)
    setNuevaMoneda('')
  }

  // Añadir detalle a la lista
  const handleAñadirDetalle = () => {
    if (!detalleMercancia.trim()) {
      alert('El detalle de la mercancía es requerido')
      return
    }
    
    if (!precioUnitario || parseFloat(precioUnitario) <= 0) {
      alert('El precio unitario debe ser mayor a 0')
      return
    }
    
    if (cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0')
      return
    }

    const nuevoDetalle: DetalleItem = {
      id: Date.now().toString(),
      detalleMercancia: detalleMercancia.trim(),
      tipoMercancia,
      precioUnitario: parseFloat(precioUnitario),
      cantidad,
      monto: calcularMonto(),
      impuesto: parseFloat(impuesto) || 0,
      montoTotal: calcularMontoTotal()
    }

    setDetalles(prev => [...prev, nuevoDetalle])

    // Limpiar formulario de detalle
    setDetalleMercancia('')
    setPrecioUnitario('')
    setCantidad(1)
    setImpuesto('')
  }

  // Eliminar detalle de la lista
  const handleEliminarDetalle = (id: string) => {
    setDetalles(prev => prev.filter(item => item.id !== id))
  }

  // Generar clave para documento de importación
  const generateClave = (): string => {
    const fechaSeleccionada = new Date(fecha)
    
    let clave = "000"
    
    // Día (2 dígitos)
    const dia = fechaSeleccionada.getDate().toString().padStart(2, '0')
    clave += dia
    
    // Mes (2 dígitos)
    const mes = (fechaSeleccionada.getMonth() + 1).toString().padStart(2, '0')
    clave += mes
    
    // Año (2 últimos dígitos)
    const año = fechaSeleccionada.getFullYear().toString().slice(-2)
    clave += año
    
    // ID del importador paddeado a 12 dígitos
    let idPadded = idImportador
    while (idPadded.length < 12) {
      idPadded = "0" + idPadded
    }
    clave += idPadded
    
    // Cadena fija para documentos de importación
    clave += "00000000560000000000100"
    
    // Hora actual (2 dígitos)
    const ahora = new Date()
    const hora = ahora.getHours().toString().padStart(2, '0')
    clave += hora
    
    // Minuto actual (2 dígitos)
    const minuto = ahora.getMinutes().toString().padStart(2, '0')
    clave += minuto
    
    // Segundo actual (2 dígitos)
    const segundo = ahora.getSeconds().toString().padStart(2, '0')
    clave += segundo
    
    return clave
  }

  // Generar fecha y hora actual en formato ISO con zona horaria Costa Rica
  const generateFechaEmision = (): string => {
    const now = new Date()
    // Formatear como yyyy-mm-ddThh:mm:ss-06:00
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const seconds = now.getSeconds().toString().padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-06:00`
  }

  // Generar XML del documento de importación
  const generateXML = (): string => {
    const selectedActividad = actividades.find(act => act._id === actividadEconomica)
    const clave = generateClave()
    const fechaEmision = generateFechaEmision()
    
    // Generar detalles XML
    const detallesXML = detalles.map(detalle => `
<LineaDetalle>
<Detalle>${detalle.detalleMercancia}</Detalle>
<Tipo>${detalle.tipoMercancia}</Tipo>
<PrecioUnitario>${detalle.precioUnitario}</PrecioUnitario>
<Cantidad>${detalle.cantidad}</Cantidad>
<Monto>${detalle.monto}</Monto>
<Impuesto>${detalle.impuesto}</Impuesto>
<MontoTotal>${detalle.montoTotal}</MontoTotal>
</LineaDetalle>`).join('')

    return `<MyCompaXMLDOCIMP>
<Clave>${clave}</Clave>
<FechaEmision>${fechaEmision}</FechaEmision>
<CodigoActividad>${selectedActividad?.codigo || ''}</CodigoActividad>
<Emisor>
<Nombre>${nombreImportador}</Nombre>
<NumeroIdentificacion>${idImportador}</NumeroIdentificacion>
<Pais>${paisImportacion}</Pais>
</Emisor>
<Receptor>
<Nombre>${channel?.name || ''}</Nombre>
<Identificacion>
<Tipo>${channel?.ident_type || '01'}</Tipo>
<Numero>${channel?.ident || ''}</Numero>
</Identificacion>
</Receptor>
<MonedaDocumento>
<CodigoMoneda>${tipoMoneda}</CodigoMoneda>
<TipoCambio>${tipoCambio}</TipoCambio>
</MonedaDocumento>
<DetalleImportacion>${detallesXML}
</DetalleImportacion>
</MyCompaXMLDOCIMP>`
  }

  // Manejar envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar datos del canal
    if (!channel) {
      alert('Error: No se han cargado los datos del canal')
      return
    }
    if (!channel.ident) {
      alert('Error: El canal no tiene número de identificación registrado')
      return
    }
    if (!channel.name) {
      alert('Error: El canal no tiene nombre registrado')
      return
    }
    
    if (!actividadEconomica) {
      alert('La actividad económica es requerida')
      return
    }
    
    if (!nombreImportador.trim()) {
      alert('El nombre del importador es requerido')
      return
    }
    
    if (!idImportador.trim()) {
      alert('El ID del importador es requerido')
      return
    }
    
    if (!paisImportacion.trim()) {
      alert('El país de importación es requerido')
      return
    }
    
    if (detalles.length === 0) {
      alert('Debe agregar al menos un detalle de mercancía')
      return
    }

    try {
      // Generar y descargar XML
      const xmlContent = generateXML()
      
      // Crear un Blob con el contenido XML
      const blob = new Blob([xmlContent], { type: 'application/xml' })
      
      // Crear URL del blob
      const url = window.URL.createObjectURL(blob)
      
      // Crear elemento de descarga
      const link = document.createElement('a')
      link.href = url
      link.download = `documento_importacion_${new Date().toISOString().split('T')[0]}.xml`
      
      // Simular click para descargar
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Limpiar URL
      window.URL.revokeObjectURL(url)
      
      alert('Documento de importación creado y descargado exitosamente')
      onClose()
    } catch (error) {
      console.error('Error generando XML:', error)
      alert('Error al generar el archivo XML')
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>📄 Crear Documento de Importación</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <form id="importForm" onSubmit={handleSubmit} className={styles.form}>
            {/* Formulario Principal */}
            <div className={styles.section}>
              <h3>Información General</h3>
              
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.formGroupFullWidth}`}>
                <label htmlFor="actividad">Actividad Económica:</label>
                <select
                  id="actividad"
                  value={actividadEconomica}
                  onChange={(e) => setActividadEconomica(e.target.value)}
                  className={styles.select}
                  disabled={loading || channelLoading}
                >
                  <option value="">Seleccione una actividad...</option>
                  {actividades.map((actividad) => (
                    <option key={actividad._id} value={actividad._id}>
                      {actividad.codigo} - {actividad.nombre_personal || actividad.nombre_original}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="fecha">Fecha:</label>
                <input
                  type="date"
                  id="fecha"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="nombreImportador">Nombre Importador:</label>
                <input
                  type="text"
                  id="nombreImportador"
                  value={nombreImportador}
                  onChange={(e) => setNombreImportador(e.target.value)}
                  className={styles.input}
                  placeholder="Ingrese el nombre del importador"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="idImportador">ID del Importador:</label>
                <input
                  type="text"
                  id="idImportador"
                  value={idImportador}
                  onChange={(e) => setIdImportador(e.target.value)}
                  className={styles.input}
                  placeholder="Ingrese el ID del importador"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="paisImportacion">País Importación:</label>
                <input
                  type="text"
                  id="paisImportacion"
                  value={paisImportacion}
                  onChange={(e) => setPaisImportacion(e.target.value)}
                  className={styles.input}
                  placeholder="Ingrese el país de importación"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="tipoMoneda">Tipo de Moneda:</label>
                {!mostrarInputNuevaMoneda ? (
                  <select
                    id="tipoMoneda"
                    value={tipoMoneda}
                    onChange={(e) => handleTipoMonedaChange(e.target.value)}
                    className={styles.select}
                  >
                    <option value="CRC">CRC</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="JPY">JPY</option>
                    <option value="Otros">Otros</option>
                  </select>
                ) : (
                  <div className={styles.nuevaMonedaContainer}>
                    <input
                      type="text"
                      value={nuevaMoneda}
                      onChange={(e) => setNuevaMoneda(e.target.value)}
                      className={styles.input}
                      placeholder="Ingrese código de moneda (ej: GBP, CAD)"
                      maxLength={3}
                    />
                    <button
                      type="button"
                      onClick={handleAgregarNuevaMoneda}
                      className={styles.confirmButton}
                    >
                      ✓
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="tipoCambio">Tipo de Cambio:</label>
                <input
                  type="text"
                  id="tipoCambio"
                  value={tipoCambio}
                  onChange={(e) => handleNumericInput(e.target.value, setTipoCambio)}
                  className={styles.input}
                  placeholder="1.00"
                  disabled={tipoMoneda === 'CRC'}
                />
                </div>
              </div>
            </div>

            {/* Formulario de Detalle */}
            <div className={styles.section}>
              <h3>Detalle de Mercancías</h3>
              
              <div className={styles.detalleForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="detalleMercancia">Detalle de la Mercancía:</label>
                  <input
                    type="text"
                    id="detalleMercancia"
                    value={detalleMercancia}
                    onChange={(e) => setDetalleMercancia(e.target.value)}
                    className={styles.input}
                    placeholder="Descripción de la mercancía"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tipo de la Mercancía:</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="tipoMercancia"
                        value="Bien"
                        checked={tipoMercancia === 'Bien'}
                        onChange={(e) => setTipoMercancia(e.target.value as 'Bien' | 'Servicio')}
                      />
                      Bien
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="tipoMercancia"
                        value="Servicio"
                        checked={tipoMercancia === 'Servicio'}
                        onChange={(e) => setTipoMercancia(e.target.value as 'Bien' | 'Servicio')}
                      />
                      Servicio
                    </label>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="precioUnitario">Precio Unitario:</label>
                    <input
                      type="text"
                      id="precioUnitario"
                      value={precioUnitario}
                      onChange={(e) => handleNumericInput(e.target.value, setPrecioUnitario)}
                      className={styles.input}
                      placeholder="0.00"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="cantidad">Cantidad:</label>
                    <input
                      type="number"
                      id="cantidad"
                      value={cantidad}
                      onChange={(e) => setCantidad(parseInt(e.target.value) || 0)}
                      className={styles.input}
                      min="1"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Monto:</label>
                    <div className={styles.calculatedValue}>
                      {calcularMonto().toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="impuesto">Impuesto:</label>
                    <input
                      type="text"
                      id="impuesto"
                      value={impuesto}
                      onChange={(e) => handleNumericInput(e.target.value, setImpuesto)}
                      className={styles.input}
                      placeholder="0.00"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Monto Total:</label>
                    <div className={styles.calculatedValue}>
                      {calcularMontoTotal().toFixed(2)}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAñadirDetalle}
                  className={styles.addButton}
                >
                  ➕ Añadir a la lista
                </button>
              </div>
            </div>

            {/* Tabla de Detalles */}
            {detalles.length > 0 && (
              <div className={styles.section}>
                <h3>Lista de Mercancías</h3>
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Detalle</th>
                        <th>Tipo</th>
                        <th>Precio Unit.</th>
                        <th>Cantidad</th>
                        <th>Monto</th>
                        <th>Impuesto</th>
                        <th>Total</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalles.map((detalle) => (
                        <tr key={detalle.id}>
                          <td>{detalle.detalleMercancia}</td>
                          <td>{detalle.tipoMercancia}</td>
                          <td>{detalle.precioUnitario.toFixed(2)}</td>
                          <td>{detalle.cantidad}</td>
                          <td>{detalle.monto.toFixed(2)}</td>
                          <td>{detalle.impuesto.toFixed(2)}</td>
                          <td>{detalle.montoTotal.toFixed(2)}</td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleEliminarDetalle(detalle.id)}
                              className={styles.deleteButton}
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </form>
        </div>

        <div className={styles.footer}>
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancelar
            </button>
            <button 
              type="submit" 
              form="importForm" 
              className={styles.submitButton}
              disabled={loading || channelLoading}
            >
              {loading ? 'Generando...' : '📥 Generar y Descargar XML'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImportDocModal
