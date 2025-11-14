'use client'
import React, { useState, useEffect, useCallback } from 'react'
import CabysSelectionModal from './CabysSelectionModal'
import CabysEditModal from './CabysEditModal'
import { generateCategorizacion, generateSlug } from '@/lib/categorization'
import styles from './DescripcionPersonalizadaFormModal.module.css'

// Types
interface DescripcionPersonalizada {
  _id?: string
  codigo: string
  desc_pers: string
  desc_fact: string
  descripGasInv: string
  bienoserv: string
  categoria: string
  vidaUtil: string
  importado: string
  act_eco: string
  channel_id: string
}

interface Actividad {
  _id: string
  codigo: string
  nombre_personal?: string
  nombre_original: string
  channel_id: string
}

interface DescripcionPersonalizadaFormModalProps {
  descripcion?: DescripcionPersonalizada | null
  channelId: string
  onClose: (saved?: boolean) => void
  onShowProgress?: (show: boolean, current: number, total: number, title: string) => void
}

const DescripcionPersonalizadaFormModal: React.FC<DescripcionPersonalizadaFormModalProps> = ({ 
  descripcion, 
  channelId, 
  onClose,
  onShowProgress
}) => {
  const isEditing = !!descripcion

  // Form states
  const [formData, setFormData] = useState({
    codigo: '',
    desc_fact: '',
    desc_pers: '',
    descripGasInv: '',
    bienoserv: '',
    categoria: '',
    act_eco: '',
    vidaUtil: '',
    importado: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Options for select inputs
  const [descripGasInvOptions, setDescripGasInvOptions] = useState<string[]>([])
  const [bienoservOptions, setBienoservOptions] = useState<string[]>([])
  const [categoriaOptions, setCategoriaOptions] = useState<string[]>([])
  const [actividadOptions, setActividadOptions] = useState<Actividad[]>([])

  // States for adding new options
  const [showNewGastoInv, setShowNewGastoInv] = useState(false)
  const [newGastoInv, setNewGastoInv] = useState('')
  const [showNewTipo, setShowNewTipo] = useState(false)
  const [newTipo, setNewTipo] = useState('')
  const [showNewCategoria, setShowNewCategoria] = useState(false)
  const [newCategoria, setNewCategoria] = useState('')
  
  // CABYS selection states
  const [showCabysModal, setShowCabysModal] = useState(false)
  const [showCabysEditModal, setShowCabysEditModal] = useState(false)
  const [selectedCabysCodigo, setSelectedCabysCodigo] = useState<string | null>(null)
  const [selectedCabysInfo, setSelectedCabysInfo] = useState<string>('')

  // Initialize form data for editing
  useEffect(() => {
    if (descripcion) {
      setFormData({
        codigo: descripcion.codigo || '',
        desc_fact: descripcion.desc_fact || '',
        desc_pers: descripcion.desc_pers || '',
        descripGasInv: descripcion.descripGasInv || '',
        bienoserv: descripcion.bienoserv || '',
        categoria: descripcion.categoria || '',
        act_eco: descripcion.act_eco || '',
        vidaUtil: descripcion.vidaUtil || '',
        importado: descripcion.importado || ''
      })
      setSelectedCabysInfo(descripcion.codigo || '')
    }
  }, [descripcion])

  const loadDescripGasInvOptions = useCallback(async () => {
    try {
      const response = await fetch(`/api/cabys-options?type=descripGasInv&channelId=${channelId}`)
      if (response.ok) {
        const data = await response.json()
        setDescripGasInvOptions(data.options || [])
      }
    } catch (error) {
      console.error('Error loading descripGasInv options:', error)
    }
  }, [channelId])

  const loadBienoservOptions = useCallback(async () => {
    try {
      const response = await fetch(`/api/cabys-options?type=bienoserv&channelId=${channelId}`)
      if (response.ok) {
        const data = await response.json()
        setBienoservOptions(data.options || [])
      }
    } catch (error) {
      console.error('Error loading bienoserv options:', error)
    }
  }, [channelId])

  const loadCategoriaOptions = useCallback(async () => {
    try {
      const response = await fetch(`/api/cabys-options?type=categoria&channelId=${channelId}`)
      if (response.ok) {
        const data = await response.json()
        setCategoriaOptions(data.options || [])
      }
    } catch (error) {
      console.error('Error loading categoria options:', error)
    }
  }, [channelId])

  const loadActividadOptions = useCallback(async () => {
    try {
      const response = await fetch(`/api/actividades?channelId=${channelId}`)
      if (response.ok) {
        const data = await response.json()
        setActividadOptions(data.actividades || [])
      }
    } catch (error) {
      console.error('Error loading actividad options:', error)
    }
  }, [channelId])

  const loadInitialData = useCallback(async () => {
    setLoadingData(true)
    try {
      // Load options for select inputs
      await Promise.all([
        loadDescripGasInvOptions(),
        loadBienoservOptions(),
        loadCategoriaOptions(),
        loadActividadOptions()
      ])
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoadingData(false)
    }
  }, [loadDescripGasInvOptions, loadBienoservOptions, loadCategoriaOptions, loadActividadOptions])

  useEffect(() => {
    loadInitialData()
  }, [channelId, loadInitialData])

  const handleCabysSelect = async (cabysItem: any) => {
    setFormData(prev => ({
      ...prev,
      codigo: cabysItem.codigo
    }))
    setSelectedCabysInfo(`${cabysItem.codigo} - ${cabysItem.descripOf || cabysItem.descripPer || 'Sin descripción'}`)
    
    // Clear CABYS error if it exists
    if (errors.codigo) {
      setErrors(prev => ({
        ...prev,
        codigo: ''
      }))
    }

    // Intentar cargar datos existentes para este código CABYS
    try {
      const response = await fetch(`/api/cabys-personales?codigo=${cabysItem.codigo}&channelId=${channelId}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.cabys) {
          // Poblar campos con datos de CABYS personales si existen
          setFormData(prev => ({
            ...prev,
            descripGasInv: result.cabys.descripGasInv || prev.descripGasInv,
            bienoserv: result.cabys.bienoserv || prev.bienoserv,
            categoria: result.cabys.categoria || prev.categoria,
            act_eco: result.cabys.actEconomica || prev.act_eco,
            vidaUtil: result.cabys.vidaUtil || prev.vidaUtil,
            importado: result.cabys.importado || prev.importado
          }))
        }
      }
    } catch (error) {
      console.error('Error loading existing CABYS data:', error)
    }
  }

  const handleCabysEdit = (codigo: string) => {
    setSelectedCabysCodigo(codigo)
    setShowCabysModal(false)
    setShowCabysEditModal(true)
  }

  const handleCabysEditSave = (updatedCabys: any) => {
    setFormData(prev => ({
      ...prev,
      codigo: updatedCabys.codigo
    }))
    setSelectedCabysInfo(`${updatedCabys.codigo} - ${updatedCabys.descripPer || updatedCabys.descripOf || 'Sin descripción'}`)
    
    // Clear CABYS error if it exists
    if (errors.codigo) {
      setErrors(prev => ({
        ...prev,
        codigo: ''
      }))
    }

    // Reload options in case they were updated
    loadInitialData()
  }

  const handleCabysEditClose = () => {
    setShowCabysEditModal(false)
    setSelectedCabysCodigo(null)
    setShowCabysModal(true)
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

  const handleAddNewOption = (type: 'gastoInv' | 'tipo' | 'categoria', value: string) => {
    if (!value.trim()) return

    const trimmedValue = value.trim()

    if (type === 'gastoInv') {
      if (descripGasInvOptions.includes(trimmedValue)) {
        setFormData(prev => ({ ...prev, descripGasInv: trimmedValue }))
      } else {
        setDescripGasInvOptions(prev => [...prev, trimmedValue].sort())
        setFormData(prev => ({ ...prev, descripGasInv: trimmedValue }))
      }
      setShowNewGastoInv(false)
      setNewGastoInv('')
    } else if (type === 'tipo') {
      if (bienoservOptions.includes(trimmedValue)) {
        setFormData(prev => ({ ...prev, bienoserv: trimmedValue }))
      } else {
        setBienoservOptions(prev => [...prev, trimmedValue].sort())
        setFormData(prev => ({ ...prev, bienoserv: trimmedValue }))
      }
      setShowNewTipo(false)
      setNewTipo('')
    } else if (type === 'categoria') {
      if (categoriaOptions.includes(trimmedValue)) {
        setFormData(prev => ({ ...prev, categoria: trimmedValue }))
      } else {
        setCategoriaOptions(prev => [...prev, trimmedValue].sort())
        setFormData(prev => ({ ...prev, categoria: trimmedValue }))
      }
      setShowNewCategoria(false)
      setNewCategoria('')
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.codigo.trim()) {
      newErrors.codigo = 'El código CABYS es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const fromBase64 = (str: string): string => {
    try {
      return decodeURIComponent(escape(window.atob(str)))
    } catch {
      return atob(str) // Fallback
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/descripciones-personalizadas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          channel_id: channelId
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Buscar y recategorizar facturas después de guardar
        try {
          const codigo = formData.codigo
          const desc_fact_slug = generateSlug(formData.desc_fact || '')
          
          if (codigo && desc_fact_slug) {
            // Buscar facturas con este código CABYS y desc_fact en la categorización
            const facturasResponse = await fetch(`/api/facturas?channelId=${channelId}`)
            if (facturasResponse.ok) {
              const facturasData = await facturasResponse.json()
              const facturas = Array.isArray(facturasData.data) ? facturasData.data : Array.isArray(facturasData.facturas) ? facturasData.facturas : []

              // Filtrar facturas que contengan el código CABYS y desc_fact en su categorización
              const facturasConDescripcion = facturas.filter((factura: any) => {
                if (!factura.categorizacion) return false
                
                // Si categorizacion es un array
                if (Array.isArray(factura.categorizacion)) {
                  return factura.categorizacion.some((cat: any) => 
                    cat.cabys === codigo && cat.desc_fact === desc_fact_slug
                  )
                }
                
                // Si categorizacion es un string (compatibilidad con datos antiguos)
                try {
                  const categorizacionParsed = typeof factura.categorizacion === 'string' 
                    ? JSON.parse(factura.categorizacion) 
                    : factura.categorizacion
                  if (Array.isArray(categorizacionParsed)) {
                    return categorizacionParsed.some((cat: any) => 
                      cat.cabys === codigo && cat.desc_fact === desc_fact_slug
                    )
                  }
                } catch (e) {
                  return false
                }
                
                return false
              })

              if (facturasConDescripcion.length > 0) {
                // Mostrar barra de progreso
                if (onShowProgress) {
                  onShowProgress(true, 0, facturasConDescripcion.length, 'Recategorizando facturas...')
                }

                let processed = 0
                let errors = 0

                // Recategorizar cada factura
                for (let i = 0; i < facturasConDescripcion.length; i++) {
                  const factura = facturasConDescripcion[i]
                  
                  try {
                    // Decodificar XML
                    const xmlString = factura.xml ? fromBase64(factura.xml) : ''
                    
                    if (!xmlString) {
                      console.warn(`⚠️ Factura ${factura.clave} no tiene XML válido`)
                      processed++
                      if (onShowProgress) {
                        onShowProgress(true, processed, facturasConDescripcion.length, 'Recategorizando facturas...')
                      }
                      continue
                    }

                    // Actualizar progreso
                    if (onShowProgress) {
                      onShowProgress(true, processed, facturasConDescripcion.length, `Recategorizando facturas... (${processed + 1}/${facturasConDescripcion.length})`)
                    }

                    // Generar categorización
                    const categorizacion = await generateCategorizacion(xmlString, channelId)

                    // Actualizar en la base de datos
                    if (categorizacion && Array.isArray(categorizacion) && categorizacion.length > 0) {
                      const updateResponse = await fetch('/api/facturas/categorizar', {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          clave: factura.clave,
                          channelId: channelId,
                          categorizacion: categorizacion
                        })
                      })

                      if (!updateResponse.ok) {
                        console.error(`❌ Error actualizando categorización para: ${factura.clave}`)
                        errors++
                      }
                    }

                    processed++
                    
                    // Actualizar progreso
                    if (onShowProgress) {
                      onShowProgress(true, processed, facturasConDescripcion.length, 'Recategorizando facturas...')
                    }
                  } catch (error) {
                    console.error(`❌ Error procesando factura ${factura.clave}:`, error)
                    errors++
                    processed++
                    
                    // Actualizar progreso incluso si hay error
                    if (onShowProgress) {
                      onShowProgress(true, processed, facturasConDescripcion.length, 'Recategorizando facturas...')
                    }
                  }
                }

                // Ocultar barra de progreso
                if (onShowProgress) {
                  onShowProgress(false, 0, 0, '')
                }

                // Mostrar resultado
                if (facturasConDescripcion.length > 0) {
                  const message = errors > 0
                    ? `Se recategorizaron ${processed} facturas, ${errors} con errores.`
                    : `Se recategorizaron ${processed} facturas exitosamente.`
                  console.log(message)
                }
              }
            }
          }
        } catch (error) {
          console.error('Error al recategorizar facturas:', error)
          // Ocultar barra de progreso en caso de error
          if (onShowProgress) {
            onShowProgress(false, 0, 0, '')
          }
        }

        onClose(true)
      } else {
        alert(`Error: ${data.error || 'Error procesando la descripción personalizada'}`)
      }
    } catch (error) {
      console.error('Error saving descripción personalizada:', error)
      alert('Error de conexión. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Cargando datos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{isEditing ? '✏️ Editar Descripción Personalizada' : '➕ Nueva Descripción Personalizada'}</h2>
          <button 
            onClick={() => onClose()}
            className={styles.closeButton}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Código CABYS */}
            <div className={styles.formGroup}>
              <label htmlFor="codigo">Código CABYS *</label>
              <div className={styles.cabysSelector}>
                <button
                  type="button"
                  onClick={() => setShowCabysModal(true)}
                  className={`${styles.cabysButton} ${errors.codigo ? styles.inputError : ''}`}
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
                      setFormData(prev => ({ ...prev, codigo: '' }))
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
              {errors.codigo && <span className={styles.error}>{errors.codigo}</span>}
            </div>

            {/* Descripción de la factura */}
            <div className={styles.formGroup}>
              <label htmlFor="desc_fact">Descripción de la factura</label>
              <input
                type="text"
                id="desc_fact"
                name="desc_fact"
                value={formData.desc_fact}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="Descripción para la factura"
              />
            </div>

            {/* Descripción personalizada */}
            <div className={styles.formGroup}>
              <label htmlFor="desc_pers">Descripción personalizada</label>
              <input
                type="text"
                id="desc_pers"
                name="desc_pers"
                value={formData.desc_pers}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="Descripción personalizada"
              />
            </div>

            {/* Gasto/Inventario */}
            <div className={styles.formGroup}>
              <label htmlFor="descripGasInv">Gasto/Inventario</label>
              <div className={styles.selectWithButton}>
                <select
                  id="descripGasInv"
                  name="descripGasInv"
                  value={formData.descripGasInv}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="">Seleccionar...</option>
                  {descripGasInvOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewGastoInv(!showNewGastoInv)}
                  className={styles.addButton}
                  title="Agregar nueva opción"
                  disabled={loading}
                >
                  +
                </button>
              </div>
              {showNewGastoInv && (
                <div className={styles.newOptionForm}>
                  <input
                    type="text"
                    value={newGastoInv}
                    onChange={(e) => setNewGastoInv(e.target.value)}
                    placeholder="Nueva opción de Gasto/Inventario"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddNewOption('gastoInv', newGastoInv)
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddNewOption('gastoInv', newGastoInv)}
                    className={styles.confirmButton}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewGastoInv(false)}
                    className={styles.cancelButton}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Tipo */}
            <div className={styles.formGroup}>
              <label htmlFor="bienoserv">Tipo</label>
              <div className={styles.selectWithButton}>
                <select
                  id="bienoserv"
                  name="bienoserv"
                  value={formData.bienoserv}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="">Seleccionar...</option>
                  {bienoservOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewTipo(!showNewTipo)}
                  className={styles.addButton}
                  title="Agregar nueva opción"
                  disabled={loading}
                >
                  +
                </button>
              </div>
              {showNewTipo && (
                <div className={styles.newOptionForm}>
                  <input
                    type="text"
                    value={newTipo}
                    onChange={(e) => setNewTipo(e.target.value)}
                    placeholder="Nueva opción de Tipo"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddNewOption('tipo', newTipo)
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddNewOption('tipo', newTipo)}
                    className={styles.confirmButton}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewTipo(false)}
                    className={styles.cancelButton}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Categoría */}
            <div className={styles.formGroup}>
              <label htmlFor="categoria">Categoría</label>
              <div className={styles.selectWithButton}>
                <select
                  id="categoria"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="">Seleccionar...</option>
                  {categoriaOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCategoria(!showNewCategoria)}
                  className={styles.addButton}
                  title="Agregar nueva opción"
                  disabled={loading}
                >
                  +
                </button>
              </div>
              {showNewCategoria && (
                <div className={styles.newOptionForm}>
                  <input
                    type="text"
                    value={newCategoria}
                    onChange={(e) => setNewCategoria(e.target.value)}
                    placeholder="Nueva opción de Categoría"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddNewOption('categoria', newCategoria)
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddNewOption('categoria', newCategoria)}
                    className={styles.confirmButton}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCategoria(false)}
                    className={styles.cancelButton}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Actividad económica */}
            <div className={styles.formGroup}>
              <label htmlFor="act_eco">Actividad Económica</label>
              <select
                id="act_eco"
                name="act_eco"
                value={formData.act_eco}
                onChange={handleInputChange}
                disabled={loading}
              >
                <option value="">Seleccionar...</option>
                {actividadOptions.map(actividad => (
                  <option key={actividad._id} value={actividad.codigo}>
                    {actividad.codigo} - {actividad.nombre_personal || actividad.nombre_original}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formRow}>
              {/* Vida útil */}
              <div className={styles.formGroup}>
                <label htmlFor="vidaUtil">Vida Útil</label>
                <input
                  type="number"
                  id="vidaUtil"
                  name="vidaUtil"
                  value={formData.vidaUtil}
                  onChange={handleInputChange}
                  disabled={loading}
                  min="0"
                  step="1"
                  placeholder="0"
                />
              </div>

              {/* Importado */}
              <div className={styles.formGroup}>
                <label htmlFor="importado">Importado</label>
                <input
                  type="number"
                  id="importado"
                  name="importado"
                  value={formData.importado}
                  onChange={handleInputChange}
                  disabled={loading}
                  min="0"
                  step="1"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className={styles.formButtons}>
              <button
                type="button"
                onClick={() => onClose()}
                className={styles.cancelFormButton}
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
                    Guardando...
                  </>
                ) : (
                  isEditing ? 'Guardar' : 'Guardar'
                )}
              </button>
            </div>
          </form>
        </div>
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
      {showCabysEditModal && selectedCabysCodigo && (
        <CabysEditModal
          codigo={selectedCabysCodigo}
          channelId={channelId}
          onSave={handleCabysEditSave}
          onClose={handleCabysEditClose}
        />
      )}
    </div>
  )
}

export default DescripcionPersonalizadaFormModal

