'use client'
import React, { useState, useRef, useEffect } from 'react'
import styles from './DocumentoFacturaModal.module.css'

interface DocumentoFacturaModalProps {
  isOpen: boolean
  onClose: () => void
  channelId: string
  onSuccess?: () => void
}

interface Extra {
  nombre: string
  descripcion: string
}

interface ConfiguracionData {
  color_pagina: string
  color_texto: string
  color_encabezado: string
  logo: string
  extras: Extra[]
}

const DocumentoFacturaModal: React.FC<DocumentoFacturaModalProps> = ({
  isOpen,
  onClose,
  channelId,
  onSuccess
}) => {
  const [colorPagina, setColorPagina] = useState('#ffffff')
  const [colorTexto, setColorTexto] = useState('#000000')
  const [colorEncabezado, setColorEncabezado] = useState('#3b82f6')
  const [logo, setLogo] = useState<string>('')
  const [extras, setExtras] = useState<Extra[]>([])
  
  const [nuevoExtraNombre, setNuevoExtraNombre] = useState('')
  const [nuevoExtraDescripcion, setNuevoExtraDescripcion] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState('')
  const [hasExistingConfig, setHasExistingConfig] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar configuración existente
  useEffect(() => {
    const loadConfiguracion = async () => {
      if (isOpen && channelId) {
        setLoadingData(true)
        setError('')
        
        try {
          const response = await fetch(`/api/configuracion-factura?channelId=${channelId}`)
          const data = await response.json()

          if (response.ok && data.success && data.data) {
            // Cargar datos existentes
            setHasExistingConfig(true)
            setColorPagina(data.data.color_pagina || '#ffffff')
            setColorTexto(data.data.color_texto || '#000000')
            setColorEncabezado(data.data.color_encabezado || '#3b82f6')
            setLogo(data.data.logo || '')
            setExtras(data.data.extras || [])
          } else {
            // Configuración nueva
            setHasExistingConfig(false)
            resetForm()
          }
        } catch (err) {
          console.error('Error cargando configuración:', err)
          setHasExistingConfig(false)
        } finally {
          setLoadingData(false)
        }
      }
    }

    loadConfiguracion()
  }, [isOpen, channelId])

  const resetForm = () => {
    setColorPagina('#ffffff')
    setColorTexto('#000000')
    setColorEncabezado('#3b82f6')
    setLogo('')
    setExtras([])
    setNuevoExtraNombre('')
    setNuevoExtraDescripcion('')
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('La imagen no debe superar los 2MB')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      // Convertir a base64
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogo(reader.result as string)
        setError('')
      }
      reader.onerror = () => {
        setError('Error al leer el archivo')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAgregarExtra = () => {
    if (!nuevoExtraNombre.trim()) {
      setError('El nombre del extra es requerido')
      return
    }
    if (!nuevoExtraDescripcion.trim()) {
      setError('La descripción del extra es requerida')
      return
    }

    const nuevoExtra: Extra = {
      nombre: nuevoExtraNombre.trim(),
      descripcion: nuevoExtraDescripcion.trim()
    }

    setExtras([...extras, nuevoExtra])
    setNuevoExtraNombre('')
    setNuevoExtraDescripcion('')
    setError('')
  }

  const handleEliminarExtra = (index: number) => {
    const nuevosExtras = extras.filter((_, i) => i !== index)
    setExtras(nuevosExtras)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const configuracion: ConfiguracionData = {
        color_pagina: colorPagina,
        color_texto: colorTexto,
        color_encabezado: colorEncabezado,
        logo: logo,
        extras: extras
      }

      const response = await fetch('/api/configuracion-factura', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channelId: channelId,
          ...configuracion
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar la configuración')
      }

      if (onSuccess) {
        onSuccess()
      }

      onClose()
    } catch (err: any) {
      console.error('Error al guardar configuración:', err)
      setError(err.message || 'Error al guardar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading && !loadingData) {
      resetForm()
      setError('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>📋 {hasExistingConfig ? 'Editar' : 'Configurar'} Documento de Factura</h2>
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
            <p>Cargando configuración...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.modalBody}>
            {error && (
              <div className={styles.errorMessage}>
                ⚠️ {error}
              </div>
            )}


            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="colorPagina">
                  Color de la página <span className={styles.required}>*</span>
                </label>
                <div className={styles.colorInputGroup}>
                  <input
                    type="color"
                    id="colorPagina"
                    value={colorPagina}
                    onChange={(e) => setColorPagina(e.target.value)}
                    disabled={loading}
                    className={styles.colorInput}
                  />
                  <input
                    type="text"
                    value={colorPagina}
                    onChange={(e) => setColorPagina(e.target.value)}
                    disabled={loading}
                    className={styles.colorTextInput}
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="colorTexto">
                  Color del texto <span className={styles.required}>*</span>
                </label>
                <div className={styles.colorInputGroup}>
                  <input
                    type="color"
                    id="colorTexto"
                    value={colorTexto}
                    onChange={(e) => setColorTexto(e.target.value)}
                    disabled={loading}
                    className={styles.colorInput}
                  />
                  <input
                    type="text"
                    value={colorTexto}
                    onChange={(e) => setColorTexto(e.target.value)}
                    disabled={loading}
                    className={styles.colorTextInput}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="colorEncabezado">
                  Color de encabezados <span className={styles.required}>*</span>
                </label>
                <div className={styles.colorInputGroup}>
                  <input
                    type="color"
                    id="colorEncabezado"
                    value={colorEncabezado}
                    onChange={(e) => setColorEncabezado(e.target.value)}
                    disabled={loading}
                    className={styles.colorInput}
                  />
                  <input
                    type="text"
                    value={colorEncabezado}
                    onChange={(e) => setColorEncabezado(e.target.value)}
                    disabled={loading}
                    className={styles.colorTextInput}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="logo">
                Logo <span className={styles.optional}>(opcional)</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                id="logo"
                accept="image/*"
                onChange={handleLogoChange}
                disabled={loading}
                className={styles.fileInput}
              />
              {logo && (
                <div className={styles.logoPreview}>
                  <img src={logo} alt="Logo preview" />
                  <button
                    type="button"
                    onClick={() => {
                      setLogo('')
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                    className={styles.removeLogoButton}
                    disabled={loading}
                  >
                    ✕ Eliminar logo
                  </button>
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>Extras <span className={styles.optional}>(opcional)</span></label>
              <div className={styles.extrasInputGroup}>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={nuevoExtraNombre}
                  onChange={(e) => setNuevoExtraNombre(e.target.value)}
                  disabled={loading}
                  className={styles.input}
                />
                <input
                  type="text"
                  placeholder="Descripción"
                  value={nuevoExtraDescripcion}
                  onChange={(e) => setNuevoExtraDescripcion(e.target.value)}
                  disabled={loading}
                  className={styles.input}
                />
                <button
                  type="button"
                  onClick={handleAgregarExtra}
                  disabled={loading}
                  className={styles.addExtraButton}
                >
                  + Agregar
                </button>
              </div>

              {extras.length > 0 && (
                <div className={styles.extrasTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th className={styles.actionsColumn}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extras.map((extra, index) => (
                        <tr key={index}>
                          <td>{extra.nombre}</td>
                          <td>{extra.descripcion}</td>
                          <td className={styles.actionsColumn}>
                            <button
                              type="button"
                              onClick={() => handleEliminarExtra(index)}
                              disabled={loading}
                              className={styles.deleteButton}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                {loading ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default DocumentoFacturaModal

