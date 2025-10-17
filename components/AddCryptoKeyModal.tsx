'use client'
import React, { useState, useRef, useEffect } from 'react'
import styles from './AddCryptoKeyModal.module.css'

interface AddCryptoKeyModalProps {
  isOpen: boolean
  onClose: () => void
  channelId: string
  onSuccess?: () => void
}

interface CryptoKeyData {
  email: string
  password: string
  pin: string
  status: 'prod' | 'sand'
  file_name: string
}

const AddCryptoKeyModal: React.FC<AddCryptoKeyModalProps> = ({
  isOpen,
  onClose,
  channelId,
  onSuccess
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [status, setStatus] = useState<'prod' | 'sand'>('prod')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [existingFileName, setExistingFileName] = useState<string | null>(null)
  const [loadingData, setLoadingData] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar datos existentes cuando se abre el modal
  useEffect(() => {
    const loadCryptoKeyData = async () => {
      if (isOpen && channelId) {
        setLoadingData(true)
        setError('')
        
        try {
          const response = await fetch(`/api/channel/crypto-key?channelId=${channelId}`)
          const data = await response.json()

          if (response.ok && data.success) {
            if (data.hasCryptoKey && data.data) {
              // Modo edición: cargar datos existentes
              setIsEditMode(true)
              setEmail(data.data.email)
              setPassword(data.data.password)
              setPin(data.data.pin)
              setStatus(data.data.status)
              setExistingFileName(data.data.file_name)
            } else {
              // Modo creación: limpiar formulario
              setIsEditMode(false)
              setEmail('')
              setPassword('')
              setPin('')
              setStatus('prod')
              setExistingFileName(null)
            }
          }
        } catch (err) {
          console.error('Error cargando datos de crypto_key:', err)
          // No mostrar error al usuario, simplemente usar modo creación
          setIsEditMode(false)
        } finally {
          setLoadingData(false)
        }
      }
    }

    loadCryptoKeyData()
  }, [isOpen, channelId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validar que sea un archivo .p12
      if (!selectedFile.name.endsWith('.p12')) {
        setError('Solo se permiten archivos con extensión .p12')
        setFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const validateForm = () => {
    if (!email.trim()) {
      setError('El correo electrónico es requerido')
      return false
    }
    if (!password.trim()) {
      setError('La contraseña es requerida')
      return false
    }
    if (!pin.trim()) {
      setError('El PIN es requerido')
      return false
    }
    // En modo creación, el archivo es obligatorio
    // En modo edición, el archivo es opcional (solo si se quiere cambiar)
    if (!isEditMode && !file) {
      setError('Debe seleccionar un archivo .p12')
      return false
    }
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('El correo electrónico no es válido')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Crear FormData para enviar el archivo
      const formData = new FormData()
      formData.append('channelId', channelId)
      formData.append('email', email.trim())
      formData.append('password', password.trim())
      formData.append('pin', pin.trim())
      formData.append('status', status)
      
      // Solo agregar el archivo si se seleccionó uno nuevo
      if (file) {
        formData.append('cryptoFile', file)
      } else if (isEditMode && existingFileName) {
        // En modo edición sin archivo nuevo, indicar que se mantiene el actual
        formData.append('keepExistingFile', 'true')
      }

      const response = await fetch('/api/channel/crypto-key', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar la firma')
      }

      // Resetear formulario
      setEmail('')
      setPassword('')
      setPin('')
      setStatus('prod')
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Notificar éxito
      if (onSuccess) {
        onSuccess()
      }

      // Cerrar modal
      onClose()
    } catch (err: any) {
      console.error('Error al guardar la firma:', err)
      setError(err.message || 'Error al guardar la firma')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading && !loadingData) {
      // Resetear formulario
      setEmail('')
      setPassword('')
      setPin('')
      setStatus('prod')
      setFile(null)
      setError('')
      setIsEditMode(false)
      setExistingFileName(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>✍️ {isEditMode ? 'Editar' : 'Añadir'} Firma Digital</h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            disabled={loading || loadingData}
          >
            ×
          </button>
        </div>

        {loadingData ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Cargando datos...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.modalBody}>
            {error && (
              <div className={styles.errorMessage}>
                ⚠️ {error}
              </div>
            )}

          <div className={styles.formGroup}>
            <label htmlFor="email">
              Correo electrónico <span className={styles.required}>*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              disabled={loading}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">
              Contraseña <span className={styles.required}>*</span>
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese su contraseña"
              disabled={loading}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="pin">
              PIN <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="pin"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Ingrese su PIN"
              disabled={loading}
              className={styles.input}
              maxLength={8}
            />
          </div>

          <div className={styles.formGroup}>
            <label>
              Estado <span className={styles.required}>*</span>
            </label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="status"
                  value="prod"
                  checked={status === 'prod'}
                  onChange={(e) => setStatus(e.target.value as 'prod' | 'sand')}
                  disabled={loading}
                />
                <span>Producción</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="status"
                  value="sand"
                  checked={status === 'sand'}
                  onChange={(e) => setStatus(e.target.value as 'prod' | 'sand')}
                  disabled={loading}
                />
                <span>Sandbox</span>
              </label>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="cryptoFile">
              Llave criptográfica (.p12) {!isEditMode && <span className={styles.required}>*</span>}
              {isEditMode && <span className={styles.optional}>(opcional)</span>}
            </label>
            {isEditMode && existingFileName && !file && (
              <div className={styles.currentFileInfo}>
                📄 Archivo actual: <strong>{existingFileName}</strong>
                <br />
                <small>Seleccione un nuevo archivo solo si desea reemplazarlo</small>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              id="cryptoFile"
              accept=".p12"
              onChange={handleFileChange}
              disabled={loading}
              className={styles.fileInput}
            />
            {file && (
              <div className={styles.fileInfo}>
                📄 Nuevo archivo: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className={styles.cancelButton}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? 'Guardando...' : (isEditMode ? 'Actualizar Firma' : 'Guardar Firma')}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}

export default AddCryptoKeyModal

