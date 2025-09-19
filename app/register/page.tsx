'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './register.module.css'

interface PhoneCode {
  name: string
  dial_code: string
  emoji: string
  code: string
}

interface RegisterForm {
  first_name: string
  last_name: string
  type_ident: string
  ident: string
  email: string
  phone_code: string
  phone: string
  password: string
  confirmPassword: string
}

export default function RegisterPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState<RegisterForm>({
    first_name: '',
    last_name: '',
    type_ident: '',
    ident: '',
    email: '',
    phone_code: '+506', // Costa Rica por defecto
    phone: '',
    password: '',
    confirmPassword: ''
  })

  const [phoneCodes, setPhoneCodes] = useState<PhoneCode[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')

  // Opciones para tipo de identificación
  const identTypes = [
    { value: '01', label: 'Física' },
    { value: '02', label: 'Jurídica' },
    { value: '03', label: 'DIMEX' },
    { value: '04', label: 'NITE' },
    { value: '##', label: 'Pasaporte' }
  ]

  // Cargar códigos de teléfono
  useEffect(() => {
    const loadPhoneCodes = async () => {
      try {
        const response = await fetch('/phone_codes.json')
        const codes = await response.json()
        setPhoneCodes(codes)
      } catch (error) {
        console.error('Error loading phone codes:', error)
      }
    }
    
    loadPhoneCodes()
  }, [])

  // Manejar cambios en los inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validar campos requeridos
    if (!formData.first_name.trim()) newErrors.first_name = 'El primer nombre es requerido'
    if (!formData.last_name.trim()) newErrors.last_name = 'Los apellidos son requeridos'
    if (!formData.type_ident) newErrors.type_ident = 'El tipo de identificación es requerido'
    if (!formData.ident.trim()) newErrors.ident = 'La identificación es requerida'
    if (!formData.email.trim()) newErrors.email = 'El email es requerido'
    if (!formData.phone.trim()) newErrors.phone = 'El teléfono es requerido'
    if (!formData.password) newErrors.password = 'La contraseña es requerida'
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirmar contraseña es requerido'

    // Validar email
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Por favor ingresa un email válido'
    }

    // Validar contraseña
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    // Validar que las contraseñas coincidan
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    // Validar longitud de campos
    if (formData.first_name.length > 50) {
      newErrors.first_name = 'El nombre no puede exceder 50 caracteres'
    }
    if (formData.last_name.length > 100) {
      newErrors.last_name = 'Los apellidos no pueden exceder 100 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setSuccessMessage('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          type_ident: formData.type_ident,
          ident: formData.ident.trim(),
          email: formData.email.trim().toLowerCase(),
          phone_code: formData.phone_code.replace('+', ''), // Remover el símbolo +
          phone: formData.phone.trim(),
          password: formData.password,
          isActive: false // Importante: establecer como false
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccessMessage('¡Registro exitoso! Tu cuenta ha sido creada y está pendiente de activación.')
        // Limpiar formulario
        setFormData({
          first_name: '',
          last_name: '',
          type_ident: '',
          ident: '',
          email: '',
          phone_code: '+506',
          phone: '',
          password: '',
          confirmPassword: ''
        })
        // Redirigir a login después de 3 segundos
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        if (result.errors && typeof result.errors === 'object') {
          setErrors(result.errors)
        } else {
          setErrors({ general: result.error || 'Error al registrar usuario' })
        }
      }
    } catch (error) {
      console.error('Error registrando usuario:', error)
      setErrors({ general: 'Error de conexión. Por favor intenta de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.formContainer}>
          <div className={styles.header}>
            <h1 className={styles.title}>Crear Cuenta Nueva</h1>
            <p className={styles.subtitle}>
              Completa el formulario para crear tu cuenta en MyCompaXML
            </p>
          </div>

          {successMessage && (
            <div className={styles.successMessage}>
              {successMessage}
              <br />
              <small>Serás redirigido al login en unos segundos...</small>
            </div>
          )}

          {errors.general && (
            <div className={styles.errorMessage}>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="first_name" className={styles.label}>
                  Primer Nombre *
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className={`${styles.input} ${errors.first_name ? styles.inputError : ''}`}
                  maxLength={50}
                  required
                />
                {errors.first_name && <span className={styles.fieldError}>{errors.first_name}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="last_name" className={styles.label}>
                  Apellidos *
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className={`${styles.input} ${errors.last_name ? styles.inputError : ''}`}
                  maxLength={100}
                  required
                />
                {errors.last_name && <span className={styles.fieldError}>{errors.last_name}</span>}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="type_ident" className={styles.label}>
                  Tipo de Identificación *
                </label>
                <select
                  id="type_ident"
                  name="type_ident"
                  value={formData.type_ident}
                  onChange={handleInputChange}
                  className={`${styles.select} ${errors.type_ident ? styles.inputError : ''}`}
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  {identTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.type_ident && <span className={styles.fieldError}>{errors.type_ident}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="ident" className={styles.label}>
                  Número de Identificación *
                </label>
                <input
                  type="text"
                  id="ident"
                  name="ident"
                  value={formData.ident}
                  onChange={handleInputChange}
                  className={`${styles.input} ${errors.ident ? styles.inputError : ''}`}
                  required
                />
                {errors.ident && <span className={styles.fieldError}>{errors.ident}</span>}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                required
              />
              {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="phone_code" className={styles.label}>
                  Código de País *
                </label>
                <select
                  id="phone_code"
                  name="phone_code"
                  value={formData.phone_code}
                  onChange={handleInputChange}
                  className={styles.select}
                  required
                >
                  {phoneCodes.map(code => (
                    <option key={code.code} value={code.dial_code}>
                      {code.emoji} {code.dial_code} ({code.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>
                  Teléfono *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                  required
                />
                {errors.phone && <span className={styles.fieldError}>{errors.phone}</span>}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>
                  Contraseña *
                </label>
                <div className={styles.passwordContainer}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '🙈'}
                  </button>
                </div>
                {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>
                  Confirmar Contraseña *
                </label>
                <div className={styles.passwordContainer}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? '👁️' : '🙈'}
                  </button>
                </div>
                {errors.confirmPassword && <span className={styles.fieldError}>{errors.confirmPassword}</span>}
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => router.push('/')}
                className={styles.backButton}
                disabled={loading}
              >
                ← Volver al inicio
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? 'Registrando...' : 'Crear Cuenta'}
              </button>
            </div>
          </form>

          <div className={styles.loginLink}>
            <p>
              ¿Ya tienes cuenta?{' '}
              <button 
                className={styles.linkButton}
                onClick={() => router.push('/login')}
              >
                Inicia sesión aquí
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}