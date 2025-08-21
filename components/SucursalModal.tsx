'use client'
import React, { useState, useEffect } from 'react'
import styles from './SucursalModal.module.css'

// Types
interface Sucursal {
  _id?: string
  codigo: string
  nombre: string
  provincia: string
  canton: string
  distrito: string
  direccion: string
  activity_id: string
}

interface Provincia {
  id: string
  nombre: string
}

interface Canton {
  id: string
  nombre: string
}

interface Distrito {
  id: string
  nombre: string
}

interface SucursalModalProps {
  sucursal?: Sucursal | null
  activityId: string
  onClose: (sucursalSaved?: boolean, nuevaSucursal?: Sucursal) => void
}

const SucursalModal: React.FC<SucursalModalProps> = ({ sucursal, activityId, onClose }) => {
  const isEditing = !!sucursal

  // Form states
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    provincia: '',
    canton: '',
    distrito: '',
    direccion: ''
  })

  // Location data states
  const [provincias, setProvincias] = useState<Provincia[]>([])
  const [cantones, setCantones] = useState<Canton[]>([])
  const [distritos, setDistritos] = useState<Distrito[]>([])
  
  // Loading states
  const [loading, setLoading] = useState(false)
  const [loadingCantones, setLoadingCantones] = useState(false)
  const [loadingDistritos, setLoadingDistritos] = useState(false)
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form data for editing
  useEffect(() => {
    if (sucursal) {
      setFormData({
        codigo: sucursal.codigo || '',
        nombre: sucursal.nombre || '',
        provincia: sucursal.provincia || '',
        canton: sucursal.canton || '',
        distrito: sucursal.distrito || '',
        direccion: sucursal.direccion || ''
      })
      
      // Load cantones and distritos for editing mode
      if (sucursal.provincia) {
        loadCantones(sucursal.provincia).then(() => {
          if (sucursal.canton) {
            loadDistritos(sucursal.provincia, sucursal.canton)
          }
        })
      }
    }
  }, [sucursal])

  // Load provincias on component mount
  useEffect(() => {
    loadProvincias()
  }, [])

  // Load cantones when provincia changes
  useEffect(() => {
    if (formData.provincia) {
      loadCantones(formData.provincia)
    }
    // Note: Reset logic is now handled in handleInputChange
  }, [formData.provincia])

  // Load distritos when canton changes  
  useEffect(() => {
    if (formData.provincia && formData.canton) {
      loadDistritos(formData.provincia, formData.canton)
    }
    // Note: Reset logic is now handled in handleInputChange
  }, [formData.provincia, formData.canton])

  const loadProvincias = async () => {
    try {
      const response = await fetch('/api/ubicaciones')
      const data = await response.json()
      if (response.ok) {
        setProvincias(data.provincias || [])
      } else {
        console.error('Error loading provincias:', data.error)
      }
    } catch (error) {
      console.error('Error loading provincias:', error)
    }
  }

  const loadCantones = async (provinciaId: string) => {
    setLoadingCantones(true)
    try {
      const response = await fetch(`/api/ubicaciones?provincia=${provinciaId}`)
      const data = await response.json()
      if (response.ok) {
        setCantones(data.cantones || [])
      } else {
        console.error('Error loading cantones:', data.error)
        setCantones([])
      }
    } catch (error) {
      console.error('Error loading cantones:', error)
      setCantones([])
    } finally {
      setLoadingCantones(false)
    }
  }

  const loadDistritos = async (provinciaId: string, cantonId: string) => {
    setLoadingDistritos(true)
    try {
      const response = await fetch(`/api/ubicaciones?provincia=${provinciaId}&canton=${cantonId}`)
      const data = await response.json()
      if (response.ok) {
        setDistritos(data.distritos || [])
      } else {
        console.error('Error loading distritos:', data.error)
        setDistritos([])
      }
    } catch (error) {
      console.error('Error loading distritos:', error)
      setDistritos([])
    } finally {
      setLoadingDistritos(false)
    }
  }

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // Special handling for codigo to ensure only 3 digits
    if (name === 'codigo') {
      const numericValue = value.replace(/\D/g, '').slice(0, 3)
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }))
    } 
    // Special handling for provincia change
    else if (name === 'provincia') {
      setFormData(prev => ({
        ...prev,
        provincia: value,
        canton: '', // Reset cantón
        distrito: '' // Reset distrito
      }))
      // Clear cantones and distritos lists
      setCantones([])
      setDistritos([])
    }
    // Special handling for canton change
    else if (name === 'canton') {
      setFormData(prev => ({
        ...prev,
        canton: value,
        distrito: '' // Reset distrito
      }))
      // Clear distritos list
      setDistritos([])
    }
    // Default handling for other fields
    else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.codigo.trim()) {
      newErrors.codigo = 'El código es requerido'
    } else if (!/^\d{3}$/.test(formData.codigo)) {
      newErrors.codigo = 'El código debe ser exactamente 3 dígitos'
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }

    if (!formData.provincia) {
      newErrors.provincia = 'La provincia es requerida'
    }

    if (!formData.canton) {
      newErrors.canton = 'El cantón es requerido'
    }

    if (!formData.distrito) {
      newErrors.distrito = 'El distrito es requerido'
    }

    if (!formData.direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const url = isEditing ? `/api/sucursales/${sucursal!._id}` : '/api/sucursales'
      const method = isEditing ? 'PUT' : 'POST'
      
      const body = isEditing 
        ? formData 
        : { ...formData, activity_id: activityId }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        // Si es una nueva sucursal, pasar los datos de la sucursal creada
        if (!isEditing && data.sucursal) {
          onClose(true, data.sucursal)
        } else {
          onClose(true)
        }
      } else {
        alert(`Error: ${data.error || 'Error procesando la sucursal'}`)
      }
    } catch (error) {
      console.error('Error saving sucursal:', error)
      alert('Error de conexión. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{isEditing ? 'Editar Sucursal' : 'Nueva Sucursal'}</h2>
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
              <label htmlFor="codigo">Código *</label>
              <input
                type="text"
                id="codigo"
                name="codigo"
                value={formData.codigo}
                onChange={handleInputChange}
                className={errors.codigo ? styles.inputError : ''}
                disabled={loading}
                placeholder="000"
                maxLength={3}
              />
              {errors.codigo && <span className={styles.error}>{errors.codigo}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="nombre">Nombre *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className={errors.nombre ? styles.inputError : ''}
                disabled={loading}
                placeholder="Nombre de la sucursal"
              />
              {errors.nombre && <span className={styles.error}>{errors.nombre}</span>}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="provincia">Provincia *</label>
              <select
                id="provincia"
                name="provincia"
                value={formData.provincia}
                onChange={handleInputChange}
                className={errors.provincia ? styles.inputError : ''}
                disabled={loading}
              >
                <option value="">Seleccione provincia</option>
                {provincias.map((provincia) => (
                  <option key={provincia.id} value={provincia.id}>
                    {provincia.nombre}
                  </option>
                ))}
              </select>
              {errors.provincia && <span className={styles.error}>{errors.provincia}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="canton">Cantón *</label>
              <select
                id="canton"
                name="canton"
                value={formData.canton}
                onChange={handleInputChange}
                className={errors.canton ? styles.inputError : ''}
                disabled={loading || loadingCantones || !formData.provincia}
              >
                <option value="">
                  {!formData.provincia 
                    ? 'Seleccione provincia primero' 
                    : loadingCantones 
                      ? 'Cargando cantones...' 
                      : 'Seleccione cantón'
                  }
                </option>
                {cantones.map((canton) => (
                  <option key={canton.id} value={canton.id}>
                    {canton.nombre}
                  </option>
                ))}
              </select>
              {errors.canton && <span className={styles.error}>{errors.canton}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="distrito">Distrito *</label>
              <select
                id="distrito"
                name="distrito"
                value={formData.distrito}
                onChange={handleInputChange}
                className={errors.distrito ? styles.inputError : ''}
                disabled={loading || loadingDistritos || !formData.provincia || !formData.canton}
              >
                <option value="">
                  {!formData.provincia 
                    ? 'Seleccione provincia primero'
                    : !formData.canton 
                      ? 'Seleccione cantón primero'
                      : loadingDistritos 
                        ? 'Cargando distritos...' 
                        : 'Seleccione distrito'
                  }
                </option>
                {distritos.map((distrito) => (
                  <option key={distrito.id} value={distrito.id}>
                    {distrito.nombre}
                  </option>
                ))}
              </select>
              {errors.distrito && <span className={styles.error}>{errors.distrito}</span>}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="direccion">Dirección *</label>
            <input
              type="text"
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
              className={errors.direccion ? styles.inputError : ''}
              disabled={loading}
              placeholder="Dirección exacta de la sucursal"
            />
            {errors.direccion && <span className={styles.error}>{errors.direccion}</span>}
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
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Sucursal')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SucursalModal