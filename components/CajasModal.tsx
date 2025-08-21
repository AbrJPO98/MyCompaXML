'use client'
import React, { useState, useEffect, useCallback } from 'react'
import styles from './CajasModal.module.css'

interface Caja {
  _id?: string
  numero: string
  sucursal_id: string
  numeracion_facturas: {
    [key: string]: string
  }
  createdAt?: string
  updatedAt?: string
}

interface CajasModalProps {
  sucursal: {
    _id: string
    nombre: string
    codigo: string
  }
  onClose: () => void
}

interface FormularioCaja {
  id: string
  numero: string
  numeracion_facturas: {
    [key: string]: string
  }
  isNew: boolean
  originalId?: string
  collapsed?: boolean
}

const tiposComprobantes = {
  "01": "Factura electrónica",
  "02": "Nota de débito electrónica", 
  "03": "Nota de crédito electrónica",
  "04": "Tiquete electrónico",
  "05": "Confirmación de aceptación del comprobante electrónico",
  "06": "Confirmación de aceptación parcial del comprobante electrónico",
  "07": "Confirmación de rechazo del comprobante electrónico",
  "08": "Factura electrónica de compras",
  "09": "Factura electrónica de exportación",
  "10": "Recibo Electrónico de Pago"
}

export default function CajasModal({ sucursal, onClose }: CajasModalProps) {
  const [formularios, setFormularios] = useState<FormularioCaja[]>([])
  const [loading, setLoading] = useState(false)
  const [cajasExistentes, setCajasExistentes] = useState<Caja[]>([])

  const loadCajas = useCallback(async () => {
    try {
      const response = await fetch(`/api/cajas?sucursalId=${sucursal._id}`)
      const data = await response.json()
      
      if (response.ok) {
        setCajasExistentes(data.cajas || [])
        
        // Convertir cajas existentes a formularios editables (comprimidas por defecto)
        const formulariosExistentes = (data.cajas || []).map((caja: Caja) => ({
          id: caja._id || '',
          numero: caja.numero,
          numeracion_facturas: { ...caja.numeracion_facturas },
          isNew: false,
          originalId: caja._id,
          collapsed: true // Las cajas existentes se cargan comprimidas
        }))
        
        setFormularios(formulariosExistentes)
      }
    } catch (error) {
      console.error('Error loading cajas:', error)
    }
  }, [sucursal._id])

  // Cargar cajas existentes al abrir el modal
  useEffect(() => {
    loadCajas()
  }, [sucursal._id, loadCajas])

  const crearNuevoFormulario = (): FormularioCaja => {
    return {
      id: Date.now().toString(),
      numero: '',
      numeracion_facturas: {
        "01": "0",
        "02": "0", 
        "03": "0",
        "04": "0",
        "05": "0",
        "06": "0",
        "07": "0",
        "08": "0",
        "09": "0",
        "10": "0"
      },
      isNew: true,
      collapsed: false
    }
  }

  const agregarCaja = () => {
    const nuevoFormulario = crearNuevoFormulario()
    setFormularios(prev => [...prev, nuevoFormulario])
  }

  const eliminarFormulario = (formularioId: string) => {
    setFormularios(prev => prev.filter(f => f.id !== formularioId))
  }

  const toggleCollapse = (formularioId: string) => {
    setFormularios(prev => prev.map(f => 
      f.id === formularioId ? { ...f, collapsed: !f.collapsed } : f
    ))
  }

  const actualizarFormulario = (formularioId: string, campo: string, valor: string) => {
    setFormularios(prev => prev.map(f => {
      if (f.id === formularioId) {
        if (campo === 'numero') {
          return { ...f, numero: valor }
        } else if (campo.startsWith('numeracion_')) {
          const codigo = campo.replace('numeracion_', '')
          return {
            ...f,
            numeracion_facturas: {
              ...f.numeracion_facturas,
              [codigo]: valor
            }
          }
        }
      }
      return f
    }))
  }

  const guardarCaja = async (formulario: FormularioCaja) => {
    if (!formulario.numero.trim()) {
      alert('El número de caja es requerido')
      return
    }

    console.log('🔄 Iniciando guardado de caja:', formulario)
    setLoading(true)
    try {
      const datos = {
        numero: formulario.numero,
        sucursal_id: sucursal._id,
        numeracion_facturas: formulario.numeracion_facturas
      }

      console.log('📤 Enviando datos:', datos)
      let response: Response
      
      if (formulario.isNew) {
        // Crear nueva caja
        response = await fetch('/api/cajas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(datos)
        })
      } else {
        // Actualizar caja existente
        response = await fetch(`/api/cajas/${formulario.originalId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(datos)
        })
      }

      console.log('📥 Respuesta del servidor - Status:', response.status)
      const responseData = await response.json()
      console.log('📥 Datos de respuesta:', responseData)

      if (response.ok) {
        console.log('✅ Caja guardada exitosamente')
        // Comprimir el formulario después de guardar
        setFormularios(prev => prev.map(f => 
          f.id === formulario.id ? { ...f, collapsed: true } : f
        ))
        await loadCajas() // Recargar cajas
      } else {
        console.error('❌ Error del servidor:', responseData)
        alert(`Error: ${responseData.error || 'Error guardando caja'}`)
      }
    } catch (error) {
      console.error('❌ Error de conexión completo:', error)
      alert('Error de conexión. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const eliminarCaja = async (formulario: FormularioCaja) => {
    if (formulario.isNew) {
      // Si es un formulario nuevo, solo eliminarlo del estado
      eliminarFormulario(formulario.id)
      return
    }

    if (!confirm('¿Estás seguro de que quieres eliminar esta caja?')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/cajas/${formulario.originalId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Caja eliminada exitosamente')
        await loadCajas() // Recargar cajas
      } else {
        const data = await response.json()
        alert(`Error: ${data.error || 'Error eliminando caja'}`)
      }
    } catch (error) {
      console.error('Error deleting caja:', error)
      alert('Error de conexión. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>🏪 Gestión de Cajas - {sucursal.nombre}</h2>
          <p className={styles.sucursalInfo}>Código: {sucursal.codigo}</p>
          <button
            onClick={onClose}
            className={styles.closeButton}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.addButtonContainer}>
            <button
              onClick={agregarCaja}
              className={styles.addCajaButton}
              disabled={loading}
            >
              ➕ Agregar Caja
            </button>
          </div>

          <div className={styles.formulariosContainer}>
            {formularios.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No hay cajas registradas en esta sucursal.</p>
                <p>Haz clic en &ldquo;Agregar Caja&rdquo; para crear la primera.</p>
              </div>
            ) : (
              formularios.map((formulario) => (
                <div key={formulario.id} className={styles.cajaForm}>
                  <div className={styles.cajaHeader}>
                    <div className={styles.cajaHeaderLeft}>
                      <div className={styles.numeroContainer}>
                        <label htmlFor={`numero-${formulario.id}`}>Número de Caja *</label>
                        <input
                          id={`numero-${formulario.id}`}
                          type="text"
                          value={formulario.numero}
                          onChange={(e) => actualizarFormulario(formulario.id, 'numero', e.target.value)}
                          placeholder="Ej: 001, A01, etc."
                          className={styles.numeroInput}
                        />
                      </div>
                    </div>
                    <div className={styles.cajaHeaderRight}>
                      <button
                        onClick={() => toggleCollapse(formulario.id)}
                        className={styles.collapseButton}
                        title={formulario.collapsed ? "Expandir" : "Colapsar"}
                      >
                        {formulario.collapsed ? "🔽" : "🔼"}
                      </button>
                      <div className={styles.cajaActions}>
                        <button
                          onClick={() => guardarCaja(formulario)}
                          className={styles.saveButton}
                          disabled={loading}
                        >
                          💾 Guardar
                        </button>
                        <button
                          onClick={() => eliminarCaja(formulario)}
                          className={styles.deleteButton}
                          disabled={loading}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  </div>

                  {!formulario.collapsed && (
                    <div className={styles.cajaContent}>
                      <div className={styles.numeracionContainer}>
                        <h4>📋 Numeración de Comprobantes</h4>
                        <div className={styles.numeracionGrid}>
                          {Object.entries(tiposComprobantes).map(([codigo, descripcion]) => (
                            <div key={codigo} className={styles.comprobanteItem}>
                              <label htmlFor={`numeracion-${codigo}-${formulario.id}`}>
                                <span className={styles.comprobanteCode}>{codigo}</span>
                                <span className={styles.comprobanteDesc}>{descripcion}</span>
                              </label>
                              <input
                                id={`numeracion-${codigo}-${formulario.id}`}
                                type="number"
                                min="0"
                                value={formulario.numeracion_facturas[codigo] || '0'}
                                onChange={(e) => 
                                  actualizarFormulario(formulario.id, `numeracion_${codigo}`, e.target.value)
                                }
                                className={styles.numeracionInput}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            onClick={onClose}
            className={styles.cancelButton}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}