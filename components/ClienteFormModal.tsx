'use client'
import React, { useState, useEffect } from 'react'
import styles from './ClienteFormModal.module.css'

interface Cliente {
  _id?: string
  ident: string
  type_ident: string
  ident_extranjero?: string
  name: string
  email?: string
  name_commercial?: string
  country_code?: string
  phone?: string
  province?: string
  canton?: string
  district?: string
  address?: string
  address_extranjero?: string
  act_ecos?: string[]  // Array de códigos de actividades económicas
}

interface ClienteFormModalProps {
  isOpen: boolean
  onClose: () => void
  cliente?: Cliente | null
  onSave?: () => void
  channelId?: string
}

interface PhoneCode {
  name: string
  dial_code: string
  emoji: string
  code: string
}

interface Ubicaciones {
  provincias: {
    [key: string]: {
      nombre: string
      cantones: {
        [key: string]: {
          nombre: string
          distritos: {
            [key: string]: string
          }
        }
      }
    }
  }
}

interface ActividadEconomica {
  name: number
  description: string
}

const ClienteFormModal: React.FC<ClienteFormModalProps> = ({ 
  isOpen, 
  onClose, 
  cliente, 
  onSave,
  channelId
}) => {
  const [formData, setFormData] = useState<Cliente>({
    ident: '',
    type_ident: '01',
    ident_extranjero: '',
    name: '',
    email: '',
    name_commercial: '',
    country_code: '+506',
    phone: '',
    province: '',
    canton: '',
    district: '',
    address: '',
    address_extranjero: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneCodes, setPhoneCodes] = useState<PhoneCode[]>([])
  const [ubicaciones, setUbicaciones] = useState<Ubicaciones | null>(null)
  const [availableCantones, setAvailableCantones] = useState<{[key: string]: {nombre: string, distritos: {[key: string]: string}}}>({})
  const [availableDistritos, setAvailableDistritos] = useState<{[key: string]: string}>({})
  
  // Estados para actividades económicas
  const [actividadesEconomicas, setActividadesEconomicas] = useState<ActividadEconomica[]>([])
  const [selectedActividades, setSelectedActividades] = useState<ActividadEconomica[]>([])
  const [actividadSearchTerm, setActividadSearchTerm] = useState('')
  const [filteredActividades, setFilteredActividades] = useState<ActividadEconomica[]>([])
  const [showActividadDropdown, setShowActividadDropdown] = useState(false)

  // Cargar datos de ubicaciones, códigos de teléfono y actividades económicas
  useEffect(() => {
    const loadData = async () => {
      try {
        const [phoneCodesRes, ubicacionesRes, actividadesRes] = await Promise.all([
          fetch('/phone_codes.json'),
          fetch('/CR_ubicaciones.json'),
          fetch('/actividades_economicas_CR.json')
        ])

        if (phoneCodesRes.ok) {
          const phoneCodesData = await phoneCodesRes.json()
          setPhoneCodes(phoneCodesData)
        }

        if (ubicacionesRes.ok) {
          const ubicacionesData = await ubicacionesRes.json()
          setUbicaciones(ubicacionesData)
        }

        if (actividadesRes.ok) {
          const actividadesData = await actividadesRes.json()
          setActividadesEconomicas(actividadesData)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadData()
  }, [])

  // Cargar datos del cliente para edición
  useEffect(() => {
    if (cliente) {
      setFormData({
        ...cliente,
        ident_extranjero: cliente.ident_extranjero || '',
        email: cliente.email || '',
        name_commercial: cliente.name_commercial || '',
        country_code: cliente.country_code || '+506',
        phone: cliente.phone || '',
        province: cliente.province || '',
        canton: cliente.canton || '',
        district: cliente.district || '',
        address: cliente.address || '',
        address_extranjero: cliente.address_extranjero || '',
        act_ecos: cliente.act_ecos || []
      })
      
      // Cargar actividades económicas seleccionadas
      if (cliente.act_ecos && cliente.act_ecos.length > 0 && actividadesEconomicas.length > 0) {
        const selectedActs = actividadesEconomicas.filter(act => 
          cliente.act_ecos!.includes(act.name.toString())
        )
        setSelectedActividades(selectedActs)
      } else {
        setSelectedActividades([])
      }
    } else {
      setFormData({
        ident: '',
        type_ident: '01',
        ident_extranjero: '',
        name: '',
        email: '',
        name_commercial: '',
        country_code: '+506',
        phone: '',
        province: '',
        canton: '',
        district: '',
        address: '',
        address_extranjero: '',
        act_ecos: []
      })
      setSelectedActividades([])
    }
  }, [cliente, actividadesEconomicas])

  // Actualizar cantones cuando cambia la provincia
  useEffect(() => {
    if (ubicaciones && formData.province) {
      const provincia = ubicaciones.provincias[formData.province]
      if (provincia) {
        setAvailableCantones(provincia.cantones)
        // Limpiar cantón y distrito si la provincia cambió
        if (formData.canton && !provincia.cantones[formData.canton]) {
          setFormData(prev => ({ ...prev, canton: '', district: '' }))
        }
      } else {
        setAvailableCantones({})
      }
    } else {
      setAvailableCantones({})
    }
  }, [formData.province, ubicaciones])

  // Actualizar distritos cuando cambia el cantón
  useEffect(() => {
    if (ubicaciones && formData.province && formData.canton) {
      const canton = ubicaciones.provincias[formData.province]?.cantones[formData.canton]
      if (canton) {
        setAvailableDistritos(canton.distritos)
        // Limpiar distrito si el cantón cambió
        if (formData.district && !canton.distritos[formData.district]) {
          setFormData(prev => ({ ...prev, district: '' }))
        }
      } else {
        setAvailableDistritos({})
      }
    } else {
      setAvailableDistritos({})
    }
  }, [formData.province, formData.canton, ubicaciones])

  // Filtrar actividades económicas basado en el término de búsqueda
  useEffect(() => {
    if (actividadSearchTerm.trim() === '') {
      setFilteredActividades([])
      setShowActividadDropdown(false)
      return
    }

    const searchLower = actividadSearchTerm.toLowerCase()
    const filtered = actividadesEconomicas.filter(act => {
      // Filtrar las que ya están seleccionadas
      const isAlreadySelected = selectedActividades.some(selected => selected.name === act.name)
      if (isAlreadySelected) return false

      // Buscar en name o description
      const nameMatch = act.name.toString().includes(searchLower)
      const descMatch = act.description.toLowerCase().includes(searchLower)
      return nameMatch || descMatch
    }).slice(0, 10) // Limitar a 10 resultados

    setFilteredActividades(filtered)
    setShowActividadDropdown(filtered.length > 0)
  }, [actividadSearchTerm, actividadesEconomicas, selectedActividades])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Funciones para manejar actividades económicas
  const handleActividadSelect = (actividad: ActividadEconomica) => {
    setSelectedActividades(prev => [...prev, actividad])
    setActividadSearchTerm('')
    setShowActividadDropdown(false)
  }

  const handleActividadRemove = (actividadName: number) => {
    setSelectedActividades(prev => prev.filter(act => act.name !== actividadName))
  }

  const handleActividadSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActividadSearchTerm(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validaciones básicas
      if (!formData.ident.trim()) {
        throw new Error('La identificación es requerida')
      }
      if (!formData.name.trim()) {
        throw new Error('El nombre es requerido')
      }

      const url = cliente ? `/api/clientes?id=${cliente._id}` : '/api/clientes'
      const method = cliente ? 'PUT' : 'POST'

      // Preparar datos para enviar, incluyendo las actividades económicas
      const dataToSend: any = {
        ...formData,
        act_ecos: selectedActividades.map(act => act.name.toString())
      }

      // Si es un nuevo cliente (no edición) y hay channelId, agregar channel_id
      if (!cliente && channelId) {
        dataToSend.channel_id = channelId
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert(cliente ? 'Cliente actualizado exitosamente' : 'Cliente creado exitosamente')
        onSave?.()
        onClose()
      } else {
        setError(data.message || 'Error al guardar cliente')
      }
    } catch (error: any) {
      console.error('Error saving cliente:', error)
      setError(error.message || 'Error de conexión al guardar cliente')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{cliente ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {error && (
            <div className={styles.error}>
              ❌ {error}
            </div>
          )}

          <form id="cliente-form" onSubmit={handleSubmit} className={styles.form}>
            {/* Identificación */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="type_ident">Tipo de Identificación *</label>
                <select
                  id="type_ident"
                  name="type_ident"
                  value={formData.type_ident}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                >
                  <option value="01">01 - Física</option>
                  <option value="02">02 - Jurídica</option>
                  <option value="03">03 - DIMEX</option>
                  <option value="04">04 - NITE</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="ident">Identificación *</label>
                <input
                  type="text"
                  id="ident"
                  name="ident"
                  value={formData.ident}
                  onChange={handleInputChange}
                  placeholder="Número de identificación"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles.formRowFull}>
              <div className={styles.formGroup}>
                <label htmlFor="ident_extranjero">Identificación Extranjera</label>
                <input
                  type="text"
                  id="ident_extranjero"
                  name="ident_extranjero"
                  value={formData.ident_extranjero}
                  onChange={handleInputChange}
                  placeholder="Identificación extranjera (opcional)"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Nombres */}
            <div className={styles.formRowFull}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Nombre Completo *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nombre completo del cliente"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles.formRowFull}>
              <div className={styles.formGroup}>
                <label htmlFor="name_commercial">Nombre Comercial</label>
                <input
                  type="text"
                  id="name_commercial"
                  name="name_commercial"
                  value={formData.name_commercial}
                  onChange={handleInputChange}
                  placeholder="Nombre comercial (opcional)"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Contacto */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="email">Correo Electrónico</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="correo@ejemplo.com"
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone">Teléfono</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Número de teléfono"
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles.formRowFull}>
              <div className={styles.formGroup}>
                <label htmlFor="country_code">Código de País</label>
                <select
                  id="country_code"
                  name="country_code"
                  value={formData.country_code}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  {phoneCodes.map((country) => (
                    <option key={country.code} value={country.dial_code}>
                      {country.emoji} {country.dial_code} - {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ubicación */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="province">Provincia</label>
                <select
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="">Seleccionar provincia</option>
                  {ubicaciones && Object.entries(ubicaciones.provincias).map(([key, provincia]) => (
                    <option key={key} value={key}>
                      {provincia.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="canton">Cantón</label>
                <select
                  id="canton"
                  name="canton"
                  value={formData.canton}
                  onChange={handleInputChange}
                  disabled={!formData.province || loading}
                >
                  <option value="">Seleccionar cantón</option>
                  {Object.entries(availableCantones).map(([key, canton]) => (
                    <option key={key} value={key}>
                      {canton.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formRowFull}>
              <div className={styles.formGroup}>
                <label htmlFor="district">Distrito</label>
                <select
                  id="district"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  disabled={!formData.canton || loading}
                >
                  <option value="">Seleccionar distrito</option>
                  {Object.entries(availableDistritos).map(([key, distrito]) => (
                    <option key={key} value={key}>
                      {distrito}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Direcciones */}
            <div className={styles.formRowFull}>
              <div className={styles.formGroup}>
                <label htmlFor="address">Dirección Nacional</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Dirección completa en Costa Rica"
                  rows={3}
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles.formRowFull}>
              <div className={styles.formGroup}>
                <label htmlFor="address_extranjero">Dirección Extranjera</label>
                <textarea
                  id="address_extranjero"
                  name="address_extranjero"
                  value={formData.address_extranjero}
                  onChange={handleInputChange}
                  placeholder="Dirección en el extranjero (opcional)"
                  rows={3}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Actividades Económicas */}
            <div className={styles.formRowFull}>
              <div className={styles.formGroup}>
                <label htmlFor="actividad_search">Actividades Económicas</label>
                <div className={styles.autocompleteContainer}>
                  <input
                    type="text"
                    id="actividad_search"
                    value={actividadSearchTerm}
                    onChange={handleActividadSearchChange}
                    placeholder="Buscar por código o descripción..."
                    disabled={loading}
                    className={styles.autocompleteInput}
                    autoComplete="off"
                  />
                  
                  {/* Dropdown de resultados */}
                  {showActividadDropdown && filteredActividades.length > 0 && (
                    <div className={styles.autocompleteDropdown}>
                      {filteredActividades.map((actividad) => (
                        <div
                          key={actividad.name}
                          className={styles.autocompleteItem}
                          onClick={() => handleActividadSelect(actividad)}
                        >
                          <span className={styles.actividadCode}>{actividad.name}</span>
                          <span className={styles.actividadDescription}>{actividad.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lista de actividades seleccionadas */}
                {selectedActividades.length > 0 && (
                  <div className={styles.selectedActividadesList}>
                    {selectedActividades.map((actividad) => (
                      <div key={actividad.name} className={styles.selectedActividadItem}>
                        <span className={styles.selectedActividadCode}>{actividad.name}</span>
                        <span className={styles.selectedActividadDescription}>{actividad.description}</span>
                        <button
                          type="button"
                          onClick={() => handleActividadRemove(actividad.name)}
                          className={styles.removeActividadButton}
                          disabled={loading}
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={onClose}
            className={styles.cancelButton}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="cliente-form"
            className={styles.saveButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className={styles.spinner}></div>
                Guardando...
              </>
            ) : (
              cliente ? 'Actualizar Cliente' : 'Crear Cliente'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClienteFormModal
