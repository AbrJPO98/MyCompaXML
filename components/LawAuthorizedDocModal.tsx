'use client'
import React, { useState, useEffect, useContext, useCallback } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import styles from './LawAuthorizedDocModal.module.css'

interface Actividad {
  _id: string
  codigo: string
  nombre_personal: string
  descripcion: string
}

interface LawAuthorizedDocModalProps {
  channelId: string
  onClose: () => void
}

interface FormData {
  actividadEconomica: string
  fecha: string
  nombreInstitucion: string
  tipoIdentificacion: string
  numeroIdentificacion: string
  monto: string
  impuesto: string
  ley: string
  articulo: string
  inciso: string
}

interface Channel {
  _id: string
  name: string
  ident: string
  ident_type: string
}

const LawAuthorizedDocModal: React.FC<LawAuthorizedDocModalProps> = ({ channelId, onClose }) => {
  const { user } = useAuth()
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [channel, setChannel] = useState<Channel | null>(null)
  const [loading, setLoading] = useState(false)
  const [actividadesLoading, setActividadesLoading] = useState(true)
  const [channelLoading, setChannelLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState<FormData>({
    actividadEconomica: '',
    fecha: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
    nombreInstitucion: '',
    tipoIdentificacion: '01',
    numeroIdentificacion: '',
    monto: '',
    impuesto: '',
    ley: '',
    articulo: '',
    inciso: ''
  })

  // Tipos de identificación (mismo que en channels)
  const tiposIdentificacion = [
    { value: '01', label: 'Cédula física' },
    { value: '02', label: 'Cédula jurídica' },
    { value: '03', label: 'DIMEX' },
    { value: '04', label: 'NITE' },
    { value: '##', label: 'Pasaporte' }
  ]

  const loadActividades = useCallback(async () => {
    setActividadesLoading(true)
    try {
      const response = await fetch(`/api/actividades?channelId=${channelId}`)
      
      if (response.ok) {
        const data = await response.json()
        setActividades(data.actividades || [])
      } else {
        console.error('Error loading actividades:', response.status)
        setActividades([])
      }
    } catch (error) {
      console.error('Error loading actividades:', error)
      setActividades([])
    } finally {
      setActividadesLoading(false)
    }
  }, [channelId])

  const loadChannel = useCallback(async () => {
    setChannelLoading(true)
    try {
      const response = await fetch(`/api/channels/current?channelId=${channelId}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Channel data loaded:', data)
        setChannel(data.channel)
      } else {
        console.error('Error loading channel:', response.status)
        setChannel(null)
      }
    } catch (error) {
      console.error('Error loading channel:', error)
      setChannel(null)
    } finally {
      setChannelLoading(false)
    }
  }, [channelId])

  // Load actividades and channel data when modal opens
  useEffect(() => {
    loadActividades()
    loadChannel()
  }, [channelId, loadActividades, loadChannel])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validar datos del canal
    if (!channel) {
      alert('Error: No se han cargado los datos del canal')
      return false
    }
    if (!channel.ident) {
      alert('Error: El canal no tiene número de identificación registrado')
      return false
    }
    if (!channel.name) {
      alert('Error: El canal no tiene nombre registrado')
      return false
    }

    if (!formData.actividadEconomica) {
      newErrors.actividadEconomica = 'La actividad económica es requerida'
    }
    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida'
    }
    if (!formData.nombreInstitucion.trim()) {
      newErrors.nombreInstitucion = 'El nombre de la institución es requerido'
    }
    if (!formData.numeroIdentificacion.trim()) {
      newErrors.numeroIdentificacion = 'El número de identificación es requerido'
    }
    if (!formData.monto.trim()) {
      newErrors.monto = 'El monto es requerido'
    } else if (isNaN(Number(formData.monto)) || Number(formData.monto) <= 0) {
      newErrors.monto = 'El monto debe ser un número positivo'
    }
    if (!formData.impuesto.trim()) {
      newErrors.impuesto = 'El impuesto es requerido'
    } else if (isNaN(Number(formData.impuesto)) || Number(formData.impuesto) < 0) {
      newErrors.impuesto = 'El impuesto debe ser un número válido'
    }
    if (!formData.ley.trim()) {
      newErrors.ley = 'La ley es requerida'
    }
    if (!formData.articulo.trim()) {
      newErrors.articulo = 'El artículo es requerido'
    }
    if (!formData.inciso.trim()) {
      newErrors.inciso = 'El inciso es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const generateClave = (): string => {
    // Obtener fecha actual o la fecha del formulario
    const fechaSeleccionada = new Date(formData.fecha)
    
    let clave = "000"
    
    // Día (2 dígitos)
    const dia = fechaSeleccionada.getDate().toString().padStart(2, '0')
    clave += dia
    
    // Mes (2 dígitos)
    const mes = (fechaSeleccionada.getMonth() + 1).toString().padStart(2, '0')
    clave += mes
    
    // Año (2 últimos dígitos)
    const año = fechaSeleccionada.getFullYear().toString().slice(-2)
    clave += año
    
    // Cédula del emisor (institución) paddeada a 12 dígitos
    let cedula = formData.numeroIdentificacion
    while (cedula.length < 12) {
      cedula = "0" + cedula
    }
    clave += cedula
    
    // Cadena fija
    clave += "00000000550000000000100"
    
    // Hora actual (2 dígitos)
    const ahora = new Date()
    const hora = ahora.getHours().toString().padStart(2, '0')
    clave += hora
    
    // Minuto actual (2 dígitos)
    const minuto = ahora.getMinutes().toString().padStart(2, '0')
    clave += minuto
    
    // Segundo actual (2 dígitos)
    const segundo = ahora.getSeconds().toString().padStart(2, '0')
    clave += segundo
    
    return clave
  }

  const generateXML = (): string => {
    const selectedActividad = actividades.find(act => act._id === formData.actividadEconomica)
    
    // Generar clave
    const clave = generateClave()
    
    return `<MyCompaXMLDOC>
<CodigoActividad>${selectedActividad?.codigo || ''}</CodigoActividad>
<Clave>${clave}</Clave>
<Emisor>
<Nombre>${formData.nombreInstitucion}</Nombre>
<Identificacion>
<Tipo>${formData.tipoIdentificacion}</Tipo>
<Numero>${formData.numeroIdentificacion}</Numero>
</Identificacion>
</Emisor>
<Receptor>
<Nombre>${channel?.name || ''}</Nombre>
<Identificacion>
<Tipo>${channel?.ident_type || '01'}</Tipo>
<Numero>${channel?.ident || ''}</Numero>
</Identificacion>
</Receptor>
<Monto>${formData.monto}</Monto>
<Impuesto>${formData.impuesto}</Impuesto>
<Ley>${formData.ley}</Ley>
<Articulo>${formData.articulo}</Articulo>
<Inciso>${formData.inciso}</Inciso>
</MyCompaXMLDOC>`
  }

  const handleDownload = () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const xmlContent = generateXML()
      
      // Crear un Blob con el contenido XML
      const blob = new Blob([xmlContent], { type: 'application/xml' })
      
      // Crear URL del blob
      const url = window.URL.createObjectURL(blob)
      
      // Crear elemento de descarga
      const link = document.createElement('a')
      link.href = url
      link.download = `documento_autorizado_${new Date().toISOString().split('T')[0]}.xml`
      
      // Simular click para descargar
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Limpiar URL
      window.URL.revokeObjectURL(url)
      
      // Cerrar modal
      onClose()
    } catch (error) {
      console.error('Error generating XML:', error)
      alert('Error al generar el archivo XML')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>📜 Crear Documento Autorizado por la Ley</h2>
          <button 
            onClick={onClose}
            className={styles.closeButton}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Información del Receptor (Canal Conectado) */}
          <div className={styles.userInfo}>
            <h3>📋 Información del Receptor (Canal)</h3>
            <div className={styles.userDetails}>
              <div className={styles.userField}>
                <span className={styles.userLabel}>Nombre:</span>
                <span className={styles.userValue}>
                  {channelLoading ? 'Cargando...' : (channel?.name || 'No disponible')}
                </span>
              </div>
              <div className={styles.userField}>
                <span className={styles.userLabel}>Tipo de Identificación:</span>
                <span className={styles.userValue}>
                  {channelLoading ? 'Cargando...' : 
                   (tiposIdentificacion.find(tipo => tipo.value === channel?.ident_type)?.label || 'Cédula física')}
                </span>
              </div>
              <div className={styles.userField}>
                <span className={styles.userLabel}>Número de Identificación:</span>
                <span className={styles.userValue}>
                  {channelLoading ? 'Cargando...' : (channel?.ident || 'No disponible')}
                </span>
              </div>
            </div>
          </div>

          <form className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="actividadEconomica">Actividad Económica *</label>
                <select
                  id="actividadEconomica"
                  name="actividadEconomica"
                  value={formData.actividadEconomica}
                  onChange={handleInputChange}
                  className={errors.actividadEconomica ? styles.inputError : ''}
                  disabled={loading || actividadesLoading || channelLoading}
                >
                  <option value="">
                    {actividadesLoading ? 'Cargando actividades...' : 'Seleccione una actividad'}
                  </option>
                  {actividades.map((actividad) => (
                    <option key={actividad._id} value={actividad._id}>
                      {actividad.codigo} - {actividad.nombre_personal}
                    </option>
                  ))}
                </select>
                {errors.actividadEconomica && <span className={styles.error}>{errors.actividadEconomica}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="fecha">Fecha *</label>
                <input
                  type="date"
                  id="fecha"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleInputChange}
                  className={errors.fecha ? styles.inputError : ''}
                  disabled={loading}
                />
                {errors.fecha && <span className={styles.error}>{errors.fecha}</span>}
              </div>
            </div>

            <div className={styles.formRowFull}>
              <div className={styles.formGroup}>
                <label htmlFor="nombreInstitucion">Nombre de la Institución *</label>
                <input
                  type="text"
                  id="nombreInstitucion"
                  name="nombreInstitucion"
                  value={formData.nombreInstitucion}
                  onChange={handleInputChange}
                  className={errors.nombreInstitucion ? styles.inputError : ''}
                  disabled={loading}
                  placeholder="Ej: CCSS"
                />
                {errors.nombreInstitucion && <span className={styles.error}>{errors.nombreInstitucion}</span>}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="tipoIdentificacion">Tipo de Identificación *</label>
                <select
                  id="tipoIdentificacion"
                  name="tipoIdentificacion"
                  value={formData.tipoIdentificacion}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  {tiposIdentificacion.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="numeroIdentificacion">Número de Identificación *</label>
                <input
                  type="text"
                  id="numeroIdentificacion"
                  name="numeroIdentificacion"
                  value={formData.numeroIdentificacion}
                  onChange={handleInputChange}
                  className={errors.numeroIdentificacion ? styles.inputError : ''}
                  disabled={loading}
                />
                {errors.numeroIdentificacion && <span className={styles.error}>{errors.numeroIdentificacion}</span>}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="monto">Monto *</label>
                <input
                  type="number"
                  id="monto"
                  name="monto"
                  value={formData.monto}
                  onChange={handleInputChange}
                  className={errors.monto ? styles.inputError : ''}
                  disabled={loading}
                  placeholder="Ej: 10000"
                  min="0"
                  step="0.01"
                />
                {errors.monto && <span className={styles.error}>{errors.monto}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="impuesto">Impuesto *</label>
                <input
                  type="number"
                  id="impuesto"
                  name="impuesto"
                  value={formData.impuesto}
                  onChange={handleInputChange}
                  className={errors.impuesto ? styles.inputError : ''}
                  disabled={loading}
                  placeholder="Ej: 50"
                  min="0"
                  step="0.01"
                />
                {errors.impuesto && <span className={styles.error}>{errors.impuesto}</span>}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="ley">Ley *</label>
                <input
                  type="text"
                  id="ley"
                  name="ley"
                  value={formData.ley}
                  onChange={handleInputChange}
                  className={errors.ley ? styles.inputError : ''}
                  disabled={loading}
                  placeholder="Ej: 1"
                />
                {errors.ley && <span className={styles.error}>{errors.ley}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="articulo">Artículo *</label>
                <input
                  type="text"
                  id="articulo"
                  name="articulo"
                  value={formData.articulo}
                  onChange={handleInputChange}
                  className={errors.articulo ? styles.inputError : ''}
                  disabled={loading}
                  placeholder="Ej: 2"
                />
                {errors.articulo && <span className={styles.error}>{errors.articulo}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="inciso">Inciso *</label>
                <input
                  type="text"
                  id="inciso"
                  name="inciso"
                  value={formData.inciso}
                  onChange={handleInputChange}
                  className={errors.inciso ? styles.inputError : ''}
                  disabled={loading}
                  placeholder="Ej: 3"
                />
                {errors.inciso && <span className={styles.error}>{errors.inciso}</span>}
              </div>
            </div>
          </form>
        </div>

        <div className={styles.modalFooter}>
          <button
            onClick={onClose}
            className={styles.cancelButton}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleDownload}
            className={styles.downloadButton}
            disabled={loading || actividadesLoading || channelLoading}
          >
            {loading ? (
              <>
                <div className={styles.spinner}></div>
                Generando...
              </>
            ) : (
              '📥 Generar y Descargar XML'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LawAuthorizedDocModal
