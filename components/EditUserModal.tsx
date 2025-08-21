'use client'
import React, { useState, useEffect } from 'react'
import styles from './EditUserModal.module.css'

interface PhoneCode {
  name: string
  dial_code: string
  emoji: string
  code: string
}

interface User {
  _id: string
  ident: string
  type_ident: string
  first_name: string
  last_name: string
  email: string
  phone: string
  phone_code: string
}

interface EditUserModalProps {
  user: User
  onClose: (userUpdated?: boolean) => void
}

export default function EditUserModal({ user, onClose }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    ident: user.ident || '',
    type_ident: user.type_ident || '01',
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    phone: user.phone || '',
    phone_code: user.phone_code || '506'
  })
  
  const [phoneCodesList, setPhoneCodesList] = useState<PhoneCode[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Cargar códigos de teléfono
  useEffect(() => {
    const loadPhoneCodes = async () => {
      try {
        const response = await fetch('/phone_codes.json')
        const data = await response.json()
        setPhoneCodesList(data)
      } catch (error) {
        console.error('Error loading phone codes:', error)
      }
    }
    loadPhoneCodes()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'El nombre es requerido'
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Los apellidos son requeridos'
    }

    if (!formData.ident.trim()) {
      newErrors.ident = 'La identificación es requerida'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Formato de email inválido'
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido'
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
      const response = await fetch(`/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          ...formData
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Actualizar localStorage con los nuevos datos del usuario
        localStorage.setItem('user', JSON.stringify(data.user))
        
        onClose(true) // Indicar que el usuario fue actualizado
      } else {
        // Manejar errores del servidor
        if (data.errors) {
          setErrors(data.errors)
        } else {
          alert(`Error: ${data.message || 'Error actualizando usuario'}`)
        }
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Error de conexión. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Editar Información Personal</h3>
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
              <label htmlFor="first_name">Primer Nombre *</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={errors.first_name ? styles.inputError : ''}
                disabled={loading}
                required
              />
              {errors.first_name && <span className={styles.error}>{errors.first_name}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="last_name">Apellidos *</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={errors.last_name ? styles.inputError : ''}
                disabled={loading}
                required
              />
              {errors.last_name && <span className={styles.error}>{errors.last_name}</span>}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="ident">Identificación *</label>
              <input
                type="text"
                id="ident"
                name="ident"
                value={formData.ident}
                onChange={handleChange}
                className={errors.ident ? styles.inputError : ''}
                disabled={loading}
                required
              />
              {errors.ident && <span className={styles.error}>{errors.ident}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="type_ident">Tipo de Identificación *</label>
              <select
                id="type_ident"
                name="type_ident"
                value={formData.type_ident}
                onChange={handleChange}
                disabled={loading}
                required
              >
                <option value="01">Física</option>
                <option value="02">Jurídica</option>
                <option value="03">DIMEX</option>
                <option value="04">NITE</option>
                <option value="##">Pasaporte</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? styles.inputError : ''}
              disabled={loading}
              required
            />
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="phone_code">Código de Teléfono *</label>
              <select
                id="phone_code"
                name="phone_code"
                value={formData.phone_code}
                onChange={handleChange}
                disabled={loading}
                required
              >
                {phoneCodesList.map((country) => (
                  <option key={country.code} value={country.dial_code.replace('+', '')}>
                    {country.emoji} {country.dial_code} - {country.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone">Teléfono *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={errors.phone ? styles.inputError : ''}
                disabled={loading}
                required
              />
              {errors.phone && <span className={styles.error}>{errors.phone}</span>}
            </div>
          </div>

          <div className={styles.modalActions}>
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
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 