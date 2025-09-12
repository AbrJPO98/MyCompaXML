'use client'
import React, { useState, useEffect, useCallback } from 'react'
import styles from './ExportDocModal.module.css'

interface Actividad {
  _id: string
  codigo: string
  nombre_personal: string
  nombre_original: string
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
  const [loading, setLoading] = useState(false)
  
  // Estados del formulario principal
  const [actividadEconomica, setActividadEconomica] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [nombreImportador, setNombreImportador] = useState('')
  const [idImportador, setIdImportador] = useState('')
  const [paisImportacion, setPaisImportacion] = useState('')
  
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

  useEffect(() => {
    if (isOpen && channelId) {
      loadActividades()
    }
  }, [isOpen, channelId, loadActividades])

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

  // Manejar envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
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

    // Aquí procesarías el documento de importación
    console.log('Datos del documento de importación:', {
      actividadEconomica,
      fecha,
      nombreImportador,
      idImportador,
      paisImportacion,
      detalles
    })

    alert('Documento de importación creado exitosamente')
    onClose()
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

        <div className={styles.content}>
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Formulario Principal */}
            <div className={styles.section}>
              <h3>Información General</h3>
              
              <div className={styles.formGroup}>
                <label htmlFor="actividad">Actividad Económica:</label>
                <select
                  id="actividad"
                  value={actividadEconomica}
                  onChange={(e) => setActividadEconomica(e.target.value)}
                  className={styles.select}
                  disabled={loading}
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
                      ${calcularMonto().toFixed(2)}
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
                      ${calcularMontoTotal().toFixed(2)}
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
                          <td>${detalle.precioUnitario.toFixed(2)}</td>
                          <td>{detalle.cantidad}</td>
                          <td>${detalle.monto.toFixed(2)}</td>
                          <td>${detalle.impuesto.toFixed(2)}</td>
                          <td>${detalle.montoTotal.toFixed(2)}</td>
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

            {/* Botones de acción */}
            <div className={styles.actions}>
              <button type="button" onClick={onClose} className={styles.cancelButton}>
                Cancelar
              </button>
              <button type="submit" className={styles.submitButton}>
                Crear Documento
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ImportDocModal
