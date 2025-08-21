'use client'
import React, { useState, useEffect } from 'react'
import styles from './ActividadModal.module.css'

// Types
interface Actividad {
  _id: string
  codigo: string
  nombre_personal: string
  nombre_original: string
  tipo: string
  estado: string
  channel_id?: string
}

interface ActividadModalProps {
  actividad?: Actividad | null
  channelId: string
  onClose: (actividadCreated?: boolean) => void
}

const ActividadModal: React.FC<ActividadModalProps> = ({ actividad, channelId, onClose }) => {
  const isEditing = !!actividad
  
  // Form states
  const [formData, setFormData] = useState({
    codigo: '',
    nombre_personal: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form data for editing
  useEffect(() => {
    if (actividad) {
      setFormData({
        codigo: actividad.codigo || '',
        nombre_personal: actividad.nombre_personal || ''
      })
    }
  }, [actividad])

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.codigo.trim()) {
      newErrors.codigo = 'El código es requerido'
    }

    if (!formData.nombre_personal.trim()) {
      newErrors.nombre_personal = 'El nombre personal es requerido'
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
      const submitData = {
        ...formData,
        channel_id: channelId
      }

      const url = isEditing 
        ? `/api/actividades/${actividad._id}?channelId=${channelId}`
        : '/api/actividades'
      
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      })

      const result = await response.json()

      if (response.ok) {
        onClose(true) // Indicate that an activity was created/updated
      } else {
        // Handle server errors
        if (result.error) {
          if (result.error.includes('código')) {
            setErrors({ codigo: result.error })
          } else {
            alert(`Error: ${result.error}`)
          }
        }
      }
    } catch (error) {
      console.error('Error saving activity:', error)
      alert('Error al guardar la actividad')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{isEditing ? 'Editar Actividad' : 'Nueva Actividad Económica'}</h2>
          <button 
            onClick={() => onClose()}
            className={styles.closeButton}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
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
              placeholder="Ej: 001"
              maxLength={20}
            />
            {errors.codigo && <span className={styles.error}>{errors.codigo}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="nombre_personal">Nombre Personal *</label>
            <input
              type="text"
              id="nombre_personal"
              name="nombre_personal"
              value={formData.nombre_personal}
              onChange={handleInputChange}
              className={errors.nombre_personal ? styles.inputError : ''}
              disabled={loading}
              placeholder="Ej: Consultoría empresarial"
              maxLength={200}
            />
            {errors.nombre_personal && <span className={styles.error}>{errors.nombre_personal}</span>}
          </div>

          {/* Información sobre campos automáticos */}
          <div className={styles.infoBox}>
            <h4>Campos automáticos:</h4>
            <p><strong>Nombre Original:</strong> &ldquo;Actividad personalizada&rdquo;</p>
            <p><strong>Tipo:</strong> &ldquo;S&rdquo;</p>
            <p><strong>Estado:</strong> &ldquo;A&rdquo;</p>
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
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Actividad')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ActividadModal 