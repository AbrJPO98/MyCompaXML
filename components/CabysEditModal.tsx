'use client'
import React, { useState, useEffect, useCallback } from 'react'
import styles from './CabysEditModal.module.css'

interface CabysItem {
  codigo: string
  descripOf: string
  bienoserv: string
  descripPer: string
  descripGasInv: string
  categoria: string
  actEconomica: string
  vidaUtil: string | number
  importado: string
  otras_ventas_sin_iva_con_derecho_credito_pleno?: {
    total_ventas_exentas: number
    total_ventas_exonerados: number
    total_ventas_no_sujetas: number
  }
  otras_ventas_sin_iva_sin_derecho_credito?: {
    total_ventas_exentas: number
    total_ventas_exonerados: number
    total_ventas_no_sujetas: number
  }
}

interface Actividad {
  _id: string
  codigo: string
  nombre_personal?: string
  nombre_original: string
  channel_id: string
}

interface CabysEditModalProps {
  codigo: string  // Ahora solo recibe el código
  channelId: string
  onSave: (updatedCabys: CabysItem) => void
  onClose: () => void
}

const CabysEditModal: React.FC<CabysEditModalProps> = ({ codigo, channelId, onSave, onClose }) => {
  const [formData, setFormData] = useState<CabysItem>({
    codigo: codigo,
    descripOf: '',
    bienoserv: '',
    descripPer: '',
    descripGasInv: '',
    categoria: '',
    actEconomica: '',
    vidaUtil: '',
    importado: '',
    otras_ventas_sin_iva_con_derecho_credito_pleno: {
      total_ventas_exentas: 0,
      total_ventas_exonerados: 0,
      total_ventas_no_sujetas: 0
    },
    otras_ventas_sin_iva_sin_derecho_credito: {
      total_ventas_exentas: 0,
      total_ventas_exonerados: 0,
      total_ventas_no_sujetas: 0
    }
  })

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

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

  const loadExistingCabysData = useCallback(async () => {
    try {
      // 1. Buscar en la base de datos (cabys_personales)
      const dbResponse = await fetch(`/api/cabys-personales?codigo=${codigo}&channelId=${channelId}`)
      let dbData = null

      if (dbResponse.ok) {
        const result = await dbResponse.json()
        if (result.success && result.cabys) {
          dbData = result.cabys
        }
      }

      // 2. Buscar en el archivo JSON (cabys_data.json)
      let jsonData = null
      try {
        const jsonResponse = await fetch('/cabys_data.json')
        if (jsonResponse.ok) {
          const cabysDataJson = await jsonResponse.json()
          // Buscar en la propiedad "data"
          if (cabysDataJson.data && Array.isArray(cabysDataJson.data)) {
            jsonData = cabysDataJson.data.find((item: any) => item.codigo === codigo)
          }
        }
      } catch (jsonError) {
        console.error('Error loading cabys_data.json:', jsonError)
      }

      // 3. Combinar datos: prioridad a DB, rellenar con JSON si hay datos incompletos
      if (dbData || jsonData) {
        setFormData({
          codigo: codigo,
          descripOf: dbData?.descripOf || jsonData?.descripOf || '',
          bienoserv: dbData?.bienoserv || jsonData?.bienoserv || '',
          descripPer: dbData?.descripPer || '',  // descripPer solo viene de DB (es personalizado)
          descripGasInv: dbData?.descripGasInv || jsonData?.descripGasInv || '',
          categoria: dbData?.categoria || jsonData?.categoria || '',
          actEconomica: dbData?.actEconomica || '',  // actEconomica solo viene de DB
          vidaUtil: dbData?.vidaUtil || jsonData?.vidaUtil || '',
          importado: dbData?.importado || jsonData?.importado || '',
          otras_ventas_sin_iva_con_derecho_credito_pleno: dbData?.otras_ventas_sin_iva_con_derecho_credito_pleno || {
            total_ventas_exentas: 0,
            total_ventas_exonerados: 0,
            total_ventas_no_sujetas: 0
          },
          otras_ventas_sin_iva_sin_derecho_credito: dbData?.otras_ventas_sin_iva_sin_derecho_credito || {
            total_ventas_exentas: 0,
            total_ventas_exonerados: 0,
            total_ventas_no_sujetas: 0
          }
        })
      } else {
        // Si no se encuentra en ninguno, usar valores por defecto
        console.warn(`No se encontró información para el código CABYS: ${codigo}`)
      }
    } catch (error) {
      console.error('Error loading existing CABYS data:', error)
    }
  }, [codigo, channelId])

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
      // Load existing CABYS data from database
      await loadExistingCabysData()

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
  }, [loadExistingCabysData, loadDescripGasInvOptions, loadBienoservOptions, loadCategoriaOptions, loadActividadOptions])

  useEffect(() => {
    loadInitialData()
  }, [codigo, channelId, loadInitialData])

  const handleInputChange = (field: keyof CabysItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNestedInputChange = (
    parentField: 'otras_ventas_sin_iva_con_derecho_credito_pleno' | 'otras_ventas_sin_iva_sin_derecho_credito',
    childField: 'total_ventas_exentas' | 'total_ventas_exonerados' | 'total_ventas_no_sujetas',
    value: number
  ) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField] || {
          total_ventas_exentas: 0,
          total_ventas_exonerados: 0,
          total_ventas_no_sujetas: 0
        }),
        [childField]: value
      }
    }))
  }

  const handleAddNewOption = (type: 'gastoInv' | 'tipo' | 'categoria', value: string) => {
    if (!value.trim()) return

    const trimmedValue = value.trim()

    if (type === 'gastoInv') {
      if (descripGasInvOptions.includes(trimmedValue)) {
        // Option already exists, just select it
        setFormData(prev => ({ ...prev, descripGasInv: trimmedValue }))
      } else {
        // Add new option
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Preparar los datos para enviar, asegurando que los campos anidados estén incluidos
      const dataToSend: any = {
        codigo: formData.codigo,
        descripOf: formData.descripOf,
        bienoserv: formData.bienoserv,
        descripPer: formData.descripPer,
        descripGasInv: formData.descripGasInv,
        categoria: formData.categoria,
        actEconomica: formData.actEconomica,
        vidaUtil: formData.vidaUtil,
        importado: formData.importado,
        channel_id: channelId
      }

      // Incluir los nuevos campos siempre (incluso con valores por defecto)
      if (formData.otras_ventas_sin_iva_con_derecho_credito_pleno !== undefined) {
        dataToSend.otras_ventas_sin_iva_con_derecho_credito_pleno = formData.otras_ventas_sin_iva_con_derecho_credito_pleno
      }
      if (formData.otras_ventas_sin_iva_sin_derecho_credito !== undefined) {
        dataToSend.otras_ventas_sin_iva_sin_derecho_credito = formData.otras_ventas_sin_iva_sin_derecho_credito
      }

      const response = await fetch('/api/cabys-personales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          onSave(formData)
          onClose()
        } else {
          alert('Error al guardar: ' + (data.message || 'Error desconocido'))
        }
      } else {
        alert('Error al guardar los datos')
      }
    } catch (error) {
      console.error('Error saving CABYS data:', error)
      alert('Error al guardar los datos')
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
          <h2>✏️ Editar CABYS</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Código (no editable) */}
            <div className={styles.formGroup}>
              <label htmlFor="codigo">Código:</label>
              <input
                type="text"
                id="codigo"
                value={formData.codigo}
                readOnly
                className={styles.readOnlyInput}
              />
            </div>

            {/* Descripción oficial (no editable) */}
            <div className={styles.formGroup}>
              <label htmlFor="descripOf">Descripción Oficial:</label>
              <textarea
                id="descripOf"
                value={formData.descripOf}
                readOnly
                className={`${styles.readOnlyInput} ${styles.textarea}`}
                rows={3}
              />
            </div>

            {/* Descripción personal */}
            <div className={styles.formGroup}>
              <label htmlFor="descripPer">Descripción Personal:</label>
              <input
                type="text"
                id="descripPer"
                value={formData.descripPer}
                onChange={(e) => handleInputChange('descripPer', e.target.value)}
                placeholder="Descripción personalizada (opcional)"
              />
            </div>

            {/* Gasto/Inventario */}
            <div className={styles.formGroup}>
              <label htmlFor="descripGasInv">Gasto/Inventario:</label>
              <div className={styles.selectWithButton}>
                <select
                  id="descripGasInv"
                  value={formData.descripGasInv}
                  onChange={(e) => handleInputChange('descripGasInv', e.target.value)}
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
              <label htmlFor="bienoserv">Tipo:</label>
              <div className={styles.selectWithButton}>
                <select
                  id="bienoserv"
                  value={formData.bienoserv}
                  onChange={(e) => handleInputChange('bienoserv', e.target.value)}
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
              <label htmlFor="categoria">Categoría:</label>
              <div className={styles.selectWithButton}>
                <select
                  id="categoria"
                  value={formData.categoria}
                  onChange={(e) => handleInputChange('categoria', e.target.value)}
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
              <label htmlFor="actEconomica">Actividad Económica:</label>
              <select
                id="actEconomica"
                value={formData.actEconomica}
                onChange={(e) => handleInputChange('actEconomica', e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {actividadOptions.map(actividad => (
                  <option key={actividad._id} value={actividad.codigo}>
                    {actividad.codigo} - {actividad.nombre_personal || actividad.nombre_original}
                  </option>
                ))}
              </select>
            </div>

            {/* Vida útil */}
            <div className={styles.formGroup}>
              <label htmlFor="vidaUtil">Vida Útil:</label>
              <input
                type="number"
                id="vidaUtil"
                value={formData.vidaUtil}
                onChange={(e) => handleInputChange('vidaUtil', e.target.value)}
                min="0"
                step="1"
              />
            </div>

            {/* Importado */}
            <div className={styles.formGroup}>
              <label htmlFor="importado">Importado:</label>
              <input
                type="number"
                id="importado"
                value={formData.importado}
                onChange={(e) => handleInputChange('importado', e.target.value)}
                min="0"
                step="1"
              />
            </div>

            {/* Otras ventas sin IVA con derecho crédito pleno */}
            <div className={styles.formGroup}>
              <label>💰 Otras ventas sin IVA con derecho crédito pleno</label>
              <div className={styles.nestedFields}>
                <div className={styles.formGroup}>
                  <label htmlFor="otras_ventas_con_pleno_exentas">Total ventas exentas:</label>
                  <input
                    type="number"
                    id="otras_ventas_con_pleno_exentas"
                    value={formData.otras_ventas_sin_iva_con_derecho_credito_pleno?.total_ventas_exentas || 0}
                    onChange={(e) => handleNestedInputChange('otras_ventas_sin_iva_con_derecho_credito_pleno', 'total_ventas_exentas', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="otras_ventas_con_pleno_exonerados">Total ventas exonerados:</label>
                  <input
                    type="number"
                    id="otras_ventas_con_pleno_exonerados"
                    value={formData.otras_ventas_sin_iva_con_derecho_credito_pleno?.total_ventas_exonerados || 0}
                    onChange={(e) => handleNestedInputChange('otras_ventas_sin_iva_con_derecho_credito_pleno', 'total_ventas_exonerados', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="otras_ventas_con_pleno_no_sujetas">Total ventas no sujetas:</label>
                  <input
                    type="number"
                    id="otras_ventas_con_pleno_no_sujetas"
                    value={formData.otras_ventas_sin_iva_con_derecho_credito_pleno?.total_ventas_no_sujetas || 0}
                    onChange={(e) => handleNestedInputChange('otras_ventas_sin_iva_con_derecho_credito_pleno', 'total_ventas_no_sujetas', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Otras ventas sin IVA sin derecho crédito */}
            <div className={styles.formGroup}>
              <label>💰 Otras ventas sin IVA sin derecho crédito</label>
              <div className={styles.nestedFields}>
                <div className={styles.formGroup}>
                  <label htmlFor="otras_ventas_sin_pleno_exentas">Total ventas exentas:</label>
                  <input
                    type="number"
                    id="otras_ventas_sin_pleno_exentas"
                    value={formData.otras_ventas_sin_iva_sin_derecho_credito?.total_ventas_exentas || 0}
                    onChange={(e) => handleNestedInputChange('otras_ventas_sin_iva_sin_derecho_credito', 'total_ventas_exentas', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="otras_ventas_sin_pleno_exonerados">Total ventas exonerados:</label>
                  <input
                    type="number"
                    id="otras_ventas_sin_pleno_exonerados"
                    value={formData.otras_ventas_sin_iva_sin_derecho_credito?.total_ventas_exonerados || 0}
                    onChange={(e) => handleNestedInputChange('otras_ventas_sin_iva_sin_derecho_credito', 'total_ventas_exonerados', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="otras_ventas_sin_pleno_no_sujetas">Total ventas no sujetas:</label>
                  <input
                    type="number"
                    id="otras_ventas_sin_pleno_no_sujetas"
                    value={formData.otras_ventas_sin_iva_sin_derecho_credito?.total_ventas_no_sujetas || 0}
                    onChange={(e) => handleNestedInputChange('otras_ventas_sin_iva_sin_derecho_credito', 'total_ventas_no_sujetas', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className={styles.formButtons}>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelFormButton}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CabysEditModal
