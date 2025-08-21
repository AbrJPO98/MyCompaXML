'use client'
import React, { useState, useEffect, useCallback } from 'react'
import CabysSelectionModal from './CabysSelectionModal'
import CabysEditModal from './CabysEditModal'
import styles from './InventarioModal.module.css'

// Types
interface Inventario {
  _id?: string
  cabys: string
  descripcion: string
  tipo: string
  precio: number
  cantidad: number
  channel_id: string
}

interface InventarioModalProps {
  inventario?: Inventario | null
  channelId: string
  onClose: (inventarioSaved?: boolean) => void
}

const InventarioModal: React.FC<InventarioModalProps> = ({ inventario, channelId, onClose }) => {
  const isEditing = !!inventario

  // Form states
  const [formData, setFormData] = useState({
    cabys: '',
    descripcion: '',
    tipo: '',
    precio: '',
    cantidad: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tiposLoading, setTiposLoading] = useState(true)
  const [tiposDisponibles, setTiposDisponibles] = useState<string[]>([])
  const [showCabysModal, setShowCabysModal] = useState(false)
  const [showCabysEditModal, setShowCabysEditModal] = useState(false)
  const [selectedCabysForEdit, setSelectedCabysForEdit] = useState<any>(null)
  const [selectedCabysInfo, setSelectedCabysInfo] = useState<string>('')

  // Initialize form data for editing
  useEffect(() => {
    if (inventario) {
      setFormData({
        cabys: inventario.cabys || '',
        descripcion: inventario.descripcion || '',
        tipo: inventario.tipo || '',
        precio: inventario.precio?.toString() || '',
        cantidad: inventario.cantidad?.toString() || ''
      })
      setSelectedCabysInfo(inventario.cabys || '')
    }
  }, [inventario])

  const loadTiposDisponibles = useCallback(async () => {
    setTiposLoading(true)
    try {
      const response = await fetch(`/api/cabys-tipos?channelId=${channelId}`)
      
      if (response.ok) {
        const data = await response.json()
        setTiposDisponibles(data.tipos || [])
        console.log('Tipos cargados:', data.estadisticas)
      } else {
        console.error('Error loading tipos:', response.status)
        // Fallback a tipos básicos si falla la API
        setTiposDisponibles([
          'Producto',
          'Servicio', 
          'Materia Prima',
          'Insumo',
          'Herramienta',
          'Equipo',
          'Otro'
        ])
      }
    } catch (error) {
      console.error('Error loading tipos:', error)
      // Fallback a tipos básicos si falla la API
      setTiposDisponibles([
        'Producto',
        'Servicio',
        'Materia Prima', 
        'Insumo',
        'Herramienta',
        'Equipo',
        'Otro'
      ])
    } finally {
      setTiposLoading(false)
    }
  }, [channelId])

  // Load available tipos when modal opens
  useEffect(() => {
    loadTiposDisponibles()
  }, [channelId, loadTiposDisponibles])

  const handleCabysSelect = (cabysItem: any) => {
    setFormData(prev => ({
      ...prev,
      cabys: cabysItem.codigo,
      descripcion: cabysItem.descripOf || cabysItem.descripPer || '',
      tipo: cabysItem.bienoserv || prev.tipo
    }))
    setSelectedCabysInfo(`${cabysItem.codigo} - ${cabysItem.descripOf || cabysItem.descripPer || 'Sin descripción'}`)
    
    // Clear CABYS error if it exists
    if (errors.cabys) {
      setErrors(prev => ({
        ...prev,
        cabys: ''
      }))
    }
  }

  const handleCabysEdit = (cabysItem: any) => {
    setSelectedCabysForEdit(cabysItem)
    setShowCabysModal(false)
    setShowCabysEditModal(true)
  }

  const handleCabysEditSave = (updatedCabys: any) => {
    // Update form data with edited CABYS
    setFormData(prev => ({
      ...prev,
      cabys: updatedCabys.codigo,
      descripcion: updatedCabys.descripPer || updatedCabys.descripOf || '',
      tipo: updatedCabys.bienoserv || prev.tipo
    }))
    setSelectedCabysInfo(`${updatedCabys.codigo} - ${updatedCabys.descripPer || updatedCabys.descripOf || 'Sin descripción'}`)
    
    // Clear CABYS error if it exists
    if (errors.cabys) {
      setErrors(prev => ({
        ...prev,
        cabys: ''
      }))
    }

    // Reload tipos disponibles in case they were updated
    loadTiposDisponibles()
  }

  const handleCabysEditClose = () => {
    setShowCabysEditModal(false)
    setSelectedCabysForEdit(null)
    setShowCabysModal(true) // Return to selection modal
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validar campos requeridos
    if (!formData.cabys.trim()) {
      newErrors.cabys = 'El código CABYS es requerido'
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida'
    }

    if (!formData.tipo.trim()) {
      newErrors.tipo = 'El tipo es requerido'
    }

    if (!formData.precio.trim()) {
      newErrors.precio = 'El precio es requerido'
    } else {
      const precio = parseFloat(formData.precio)
      if (isNaN(precio) || precio < 0) {
        newErrors.precio = 'El precio debe ser un número válido mayor o igual a 0'
      }
    }

    if (!formData.cantidad.trim()) {
      newErrors.cantidad = 'La cantidad es requerida'
    } else {
      const cantidad = parseInt(formData.cantidad)
      if (isNaN(cantidad) || cantidad < 0) {
        newErrors.cantidad = 'La cantidad debe ser un número entero válido mayor o igual a 0'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const url = isEditing ? `/api/inventario/${inventario!._id}` : '/api/inventario'
      const method = isEditing ? 'PUT' : 'POST'
      
      const body = isEditing 
        ? formData 
        : { ...formData, channel_id: channelId }

      // Convertir precio y cantidad a números
      const bodyWithNumbers = {
        ...body,
        precio: parseFloat(formData.precio),
        cantidad: parseInt(formData.cantidad)
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyWithNumbers)
      })

      const data = await response.json()

      if (response.ok) {
        onClose(true)
      } else {
        alert(`Error: ${data.error || 'Error procesando el artículo'}`)
      }
    } catch (error) {
      console.error('Error saving inventario:', error)
      alert('Error de conexión. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{isEditing ? 'Editar Artículo' : 'Nuevo Artículo'}</h2>
          <button 
            onClick={() => onClose()}
            className={styles.closeButton}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="cabys">Código CABYS *</label>
              <div className={styles.cabysSelector}>
                <button
                  type="button"
                  onClick={() => setShowCabysModal(true)}
                  className={`${styles.cabysButton} ${errors.cabys ? styles.inputError : ''}`}
                  disabled={loading}
                >
                  {selectedCabysInfo ? (
                    <span className={styles.cabysSelected}>
                      📋 {selectedCabysInfo.length > 50 ? selectedCabysInfo.substring(0, 50) + '...' : selectedCabysInfo}
                    </span>
                  ) : (
                    <span className={styles.cabysPlaceholder}>
                      🔍 Seleccionar código CABYS
                    </span>
                  )}
                </button>
                {selectedCabysInfo && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, cabys: '' }))
                      setSelectedCabysInfo('')
                    }}
                    className={styles.clearButton}
                    disabled={loading}
                    title="Limpiar selección"
                  >
                    ×
                  </button>
                )}
              </div>
              {errors.cabys && <span className={styles.error}>{errors.cabys}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="tipo">Tipo *</label>
              <select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
                className={errors.tipo ? styles.inputError : ''}
                disabled={loading || tiposLoading}
              >
                <option value="">
                  {tiposLoading ? 'Cargando tipos...' : 'Seleccionar tipo'}
                </option>
                {tiposDisponibles.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
              {errors.tipo && <span className={styles.error}>{errors.tipo}</span>}
              {tiposLoading && (
                <small className={styles.loadingText}>
                  Cargando tipos desde CABYS...
                </small>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="descripcion">Descripción *</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              className={errors.descripcion ? styles.inputError : ''}
              disabled={loading}
              placeholder="Descripción detallada del artículo"
              rows={3}
            />
            {errors.descripcion && <span className={styles.error}>{errors.descripcion}</span>}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="precio">Precio (₡) *</label>
              <input
                type="number"
                id="precio"
                name="precio"
                value={formData.precio}
                onChange={handleInputChange}
                className={errors.precio ? styles.inputError : ''}
                disabled={loading}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              {errors.precio && <span className={styles.error}>{errors.precio}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="cantidad">Cantidad *</label>
              <input
                type="number"
                id="cantidad"
                name="cantidad"
                value={formData.cantidad}
                onChange={handleInputChange}
                className={errors.cantidad ? styles.inputError : ''}
                disabled={loading}
                placeholder="0"
                min="0"
                step="1"
              />
              {errors.cantidad && <span className={styles.error}>{errors.cantidad}</span>}
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => onClose()}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  {isEditing ? 'Actualizando...' : 'Guardando...'}
                </>
              ) : (
                isEditing ? 'Actualizar Artículo' : 'Guardar Artículo'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de selección de CABYS */}
      {showCabysModal && (
        <CabysSelectionModal
          channelId={channelId}
          onSelect={handleCabysSelect}
          onEdit={handleCabysEdit}
          onClose={() => setShowCabysModal(false)}
        />
      )}

      {/* Modal de edición de CABYS */}
      {showCabysEditModal && selectedCabysForEdit && (
        <CabysEditModal
          cabysItem={selectedCabysForEdit}
          channelId={channelId}
          onSave={handleCabysEditSave}
          onClose={handleCabysEditClose}
        />
      )}
    </div>
  )
}

export default InventarioModal