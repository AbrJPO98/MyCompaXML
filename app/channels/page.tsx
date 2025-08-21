'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import ActividadModal from '@/components/ActividadModal'
import styles from './channels.module.css'

// Types
interface Channel {
  _id: string
  code: string
  name: string
  ident: string
  ident_type: string
  phone: string
  phone_code: string
  registro_fiscal_IVA: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

interface UserChannel {
  _id: string
  user_id: string
  channel_id: string
  is_admin: boolean
  createdAt: string
  updatedAt: string
  channel: Channel | null
}

interface Actividad {
  _id: string
  codigo: string
  nombre_personal: string
  nombre_original: string
  tipo: string
  estado: string
  channel_id: string
}

interface ActividadesResponse {
  actividades: Actividad[]
  pagination: {
    current: number
    pages: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
}

interface PhoneCode {
  name: string
  dial_code: string
  emoji: string
  code: string
}

interface FormData {
  name: string
  ident: string
  ident_type: string
  phone: string
  phone_code: string
  registro_fiscal_IVA: string
}

export default function ChannelsPage() {
  const { user: authUser } = useAuth()
  
  // Channel selector state
  const [userChannels, setUserChannels] = useState<UserChannel[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string>('')
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [channelsLoading, setChannelsLoading] = useState(true)
  
  // Existing state
  const [channel, setChannel] = useState<Channel | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    ident: '',
    ident_type: '01',
    phone: '',
    phone_code: '506',
    registro_fiscal_IVA: ''
  })
  const [loading, setLoading] = useState(false)
  const [phoneCodesList, setPhoneCodesList] = useState<PhoneCode[]>([])
  const [successMessage, setSuccessMessage] = useState('')
  
  // Actividades state
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [actividadesLoading, setActividadesLoading] = useState(false)
  const [actividadesPagination, setActividadesPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false
  })
  const [actividadesSearch, setActividadesSearch] = useState('')
  const [showActividadModal, setShowActividadModal] = useState(false)
  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(null)
  const [deleteActividadConfirm, setDeleteActividadConfirm] = useState<string | null>(null)
  const [haciendaSyncLoading, setHaciendaSyncLoading] = useState(false)

  // Load user channels
  const loadUserChannels = useCallback(async () => {
    if (!authUser?._id) return

    setChannelsLoading(true)
    try {
      const response = await fetch(`/api/user-channels?userId=${authUser._id}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setUserChannels(data.channels)
        
        // Auto-select first channel if available
        if (data.channels.length > 0) {
          const firstChannel = data.channels[0]
          setSelectedChannelId(firstChannel.channel?._id || '')
          setSelectedChannel(firstChannel.channel)
        }
      } else {
        console.error('Error loading user channels:', data.message)
      }
    } catch (error) {
      console.error('Error loading user channels:', error)
    } finally {
      setChannelsLoading(false)
    }
  }, [authUser?._id])

  // Handle channel selection
  const handleChannelSelect = (channelId: string) => {
    const userChannel = userChannels.find(uc => uc.channel?._id === channelId)
    if (userChannel?.channel) {
      setSelectedChannelId(channelId)
      setSelectedChannel(userChannel.channel)
    }
  }

  // Load channel data
  const loadChannel = useCallback(async () => {
    if (!selectedChannelId) {
      console.error('No channel ID selected')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/channels/current?channelId=${selectedChannelId}`)
      const data = await response.json()

      if (response.ok && data.channel) {
        setChannel(data.channel)
        setFormData({
          name: data.channel.name || '',
          ident: data.channel.ident || '',
          ident_type: data.channel.ident_type || '01',
          phone: data.channel.phone || '',
          phone_code: data.channel.phone_code || '506',
          registro_fiscal_IVA: data.channel.registro_fiscal_IVA || ''
        })
      } else {
        console.error('Error loading channel:', data)
      }
    } catch (error) {
      console.error('Error loading channel:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedChannelId])

  // Load actividades
  const loadActividades = useCallback(async (page: number = 1, searchTerm: string = '') => {
    if (!selectedChannelId) {
      console.error('No channel ID selected')
      return
    }

    setActividadesLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        channelId: selectedChannelId,
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/actividades?${params}`)
      const data: ActividadesResponse = await response.json()

      if (response.ok) {
        setActividades(data.actividades)
        setActividadesPagination(data.pagination)
      } else {
        console.error('Error loading actividades:', data)
      }
    } catch (error) {
      console.error('Error loading actividades:', error)
    } finally {
      setActividadesLoading(false)
    }
  }, [selectedChannelId])

  // Sync activities from Hacienda
  const syncFromHacienda = useCallback(async () => {
    if (!selectedChannelId || !selectedChannel?.ident) {
      console.error('No channel ID or ident available for Hacienda sync')
      return
    }

    console.log(`🔄 Iniciando sincronización con Hacienda para cédula: ${selectedChannel.ident}`)

    try {
      setHaciendaSyncLoading(true)
      const response = await fetch('/api/actividades/sync-hacienda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: selectedChannelId,
          identificacion: selectedChannel.ident
        })
      })

      const data = await response.json()

      if (response.ok) {
        console.log('✅ Sincronización exitosa:', data)
        // Reload actividades to show new ones
        loadActividades(1, actividadesSearch)
      } else {
        console.error('❌ Error en sincronización:', data)
        alert(`Error en sincronización: ${data.message}`)
      }
    } catch (error) {
      console.error('❌ Error en sincronización:', error)
      alert('Error de conexión durante la sincronización')
    } finally {
      setHaciendaSyncLoading(false)
    }
  }, [selectedChannelId, selectedChannel?.ident, loadActividades, actividadesSearch])

  // Load user channels on component mount
  useEffect(() => {
    if (authUser?._id) {
      loadUserChannels()
    }
  }, [authUser, loadUserChannels])

  // Load channel data when a channel is selected
  useEffect(() => {
    if (selectedChannelId) {
      loadChannel()
      loadActividades()
    }
  }, [selectedChannelId, loadChannel, loadActividades])

  // Load phone codes
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

  // Auto-sync on page load if no actividades
  useEffect(() => {
    if (selectedChannelId && actividades.length === 0 && !actividadesLoading && selectedChannel?.ident) {
      console.log('🔄 No hay actividades, iniciando sincronización automática...')
      syncFromHacienda()
    }
  }, [selectedChannelId, actividades.length, actividadesLoading, selectedChannel?.ident, syncFromHacienda])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedChannelId) {
      alert('No hay canal seleccionado')
      return
    }

    setLoading(true)
    setSuccessMessage('')

    try {
      const response = await fetch(`/api/channels/current?channelId=${selectedChannelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setChannel(data.channel)
        setSuccessMessage('Canal actualizado exitosamente')
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error updating channel:', error)
      alert('Error actualizando canal')
    } finally {
      setLoading(false)
    }
  }

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle actividades search
  const handleActividadesSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadActividades(1, actividadesSearch)
  }

  // Create new actividad
  const handleCreateActividad = () => {
    setSelectedActividad(null)
    setShowActividadModal(true)
  }

  // Edit actividad
  const handleEditActividad = (actividad: Actividad) => {
    setSelectedActividad(actividad)
    setShowActividadModal(true)
  }

  // Delete actividad
  const handleDeleteActividad = async (actividadId: string) => {
    if (!selectedChannelId) {
      console.error('No channel ID selected')
      return
    }

    try {
      const response = await fetch(`/api/actividades/${actividadId}?channelId=${selectedChannelId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadActividades(actividadesPagination.current, actividadesSearch)
        setDeleteActividadConfirm(null)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting actividad:', error)
      alert('Error eliminando actividad')
    }
  }

  // Modal close handler
  const handleActividadModalClose = (actividadCreated?: boolean) => {
    setShowActividadModal(false)
    setSelectedActividad(null)
    if (actividadCreated) {
      loadActividades(actividadesPagination.current, actividadesSearch)
    }
  }

  // Get identification type label
  const getIdentTypeLabel = (typeIdent: string) => {
    const types: { [key: string]: string } = {
      '01': 'Física',
      '02': 'Jurídica', 
      '03': 'DIMEX',
      '04': 'NITE',
      '##': 'Pasaporte'
    }
    return types[typeIdent] || typeIdent
  }

  if (channelsLoading) {
    return (
      <ProtectedRoute>
        <div className={styles.loading}>
          <p>Cargando canales...</p>
        </div>
      </ProtectedRoute>
    )
  }

  if (userChannels.length === 0) {
    return (
      <ProtectedRoute>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>Información del Canal</h1>
            <p>No tienes canales asignados</p>
          </div>
          <div className={styles.formContainer}>
            <p>Contacta al administrador para que te asigne a un canal.</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Información del Canal</h1>
          <p>Gestiona la información de tu canal y actividades económicas</p>
        </div>

        {/* Channel Selector */}
        <div className={styles.formContainer}>
          <div className={styles.channelSelector}>
            <h3>Seleccionar Canal</h3>
            <div className={styles.selectorGrid}>
              {userChannels.map((userChannel) => (
                <div 
                  key={userChannel._id}
                  className={`${styles.channelCard} ${selectedChannelId === userChannel.channel?._id ? styles.selected : ''}`}
                  onClick={() => handleChannelSelect(userChannel.channel?._id || '')}
                >
                  <div className={styles.channelCardHeader}>
                    <h4>{userChannel.channel?.name || 'Canal sin nombre'}</h4>
                    <span className={styles.channelCode}>{userChannel.channel?.code}</span>
                  </div>
                  <div className={styles.channelCardInfo}>
                    <p>Identificación: {userChannel.channel?.ident}</p>
                    <p>Rol: {userChannel.is_admin ? 'Administrador' : 'Usuario'}</p>
                    <span className={`${styles.status} ${userChannel.channel?.isActive ? styles.active : styles.inactive}`}>
                      {userChannel.channel?.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Channel Form - Only show if channel is selected */}
        {selectedChannelId && selectedChannel && (
          <div className={styles.formContainer}>
            {successMessage && (
              <div className={styles.successMessage}>
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Existing form fields remain the same */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="code">Código (Solo lectura)</label>
                  <input
                    type="text"
                    id="code"
                    value={selectedChannel.code || ''}
                    disabled
                    className={styles.readOnlyField}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Nombre del Canal</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="ident">Identificación</label>
                  <input
                    type="text"
                    id="ident"
                    name="ident"
                    value={formData.ident}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="ident_type">Tipo de Identificación</label>
                  <select
                    id="ident_type"
                    name="ident_type"
                    value={formData.ident_type}
                    onChange={handleChange}
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

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="phone_code">Código de Teléfono</label>
                  <select
                    id="phone_code"
                    name="phone_code"
                    value={formData.phone_code}
                    onChange={handleChange}
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
                  <label htmlFor="phone">Teléfono</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="registro_fiscal_IVA">Registro Fiscal IVA</label>
                <input
                  type="text"
                  id="registro_fiscal_IVA"
                  name="registro_fiscal_IVA"
                  value={formData.registro_fiscal_IVA}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" disabled={loading} className={styles.submitButton}>
                {loading ? 'Actualizando...' : 'Actualizar Canal'}
              </button>
            </form>
          </div>
        )}

        {/* Actividades section - Only show if channel is selected */}
        {selectedChannelId && (
          <div className={styles.formContainer}>
            <div className={styles.actividadesHeader}>
              <h2>Actividades Económicas</h2>
              <div className={styles.actividadesActions}>
                <button 
                  onClick={syncFromHacienda}
                  disabled={haciendaSyncLoading}
                  className={styles.syncButton}
                >
                  {haciendaSyncLoading ? 'Sincronizando...' : '🔄 Sincronizar Hacienda'}
                </button>
                <button onClick={handleCreateActividad} className={styles.addButton}>
                  ➕ Agregar Actividad
                </button>
              </div>
            </div>

            <div className={styles.searchContainer}>
              <form onSubmit={handleActividadesSearch} className={styles.searchForm}>
                <input
                  type="text"
                  placeholder="Buscar por código o nombre..."
                  value={actividadesSearch}
                  onChange={(e) => setActividadesSearch(e.target.value)}
                  className={styles.searchInput}
                />
                <button type="submit" className={styles.searchButton}>
                  🔍 Buscar
                </button>
              </form>
            </div>

            <div className={styles.actividadesContainer}>
              {actividadesLoading ? (
                <div className={styles.loading}>
                  <p>Cargando actividades...</p>
                </div>
              ) : (
                <>
                  {actividades.length > 0 ? (
                    <div className={styles.tableContainer}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Código</th>
                            <th>Nombre Personal</th>
                            <th>Nombre Original</th>
                            <th>Tipo</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {actividades.map((actividad) => (
                            <tr key={actividad._id}>
                              <td className={styles.codigoCell}>{actividad.codigo}</td>
                              <td>{actividad.nombre_personal}</td>
                              <td>{actividad.nombre_original}</td>
                              <td>{actividad.tipo}</td>
                              <td>
                                <span className={`${styles.estadoBadge} ${actividad.estado === 'A' ? styles.activo : styles.inactivo}`}>
                                  {actividad.estado === 'A' ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                              <td>
                                <div className={styles.actions}>
                                  <button
                                    onClick={() => handleEditActividad(actividad)}
                                    className={styles.editButton}
                                    title="Editar"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => setDeleteActividadConfirm(actividad._id)}
                                    className={styles.deleteButton}
                                    title="Eliminar"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <p>No hay actividades económicas registradas</p>
                      <button onClick={handleCreateActividad} className={styles.addButton}>
                        ➕ Agregar Primera Actividad
                      </button>
                    </div>
                  )}

                  {/* Pagination */}
                  {actividadesPagination.pages > 1 && (
                    <div className={styles.pagination}>
                      <button
                        onClick={() => loadActividades(actividadesPagination.current - 1, actividadesSearch)}
                        disabled={!actividadesPagination.hasPrev}
                        className={styles.pageButton}
                      >
                        Anterior
                      </button>
                      <span className={styles.pageInfo}>
                        Página {actividadesPagination.current} de {actividadesPagination.pages} 
                        ({actividadesPagination.total} actividades)
                      </span>
                      <button
                        onClick={() => loadActividades(actividadesPagination.current + 1, actividadesSearch)}
                        disabled={!actividadesPagination.hasNext}
                        className={styles.pageButton}
                      >
                        Siguiente
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Actividad Modal */}
        {showActividadModal && selectedChannelId && (
          <ActividadModal
            actividad={selectedActividad}
            channelId={selectedChannelId}
            onClose={handleActividadModalClose}
          />
        )}

        {/* Delete Actividad Confirmation Modal */}
        {deleteActividadConfirm && (
          <div className={styles.modalOverlay}>
            <div className={styles.deleteModal}>
              <h3>Confirmar Eliminación</h3>
              <p>¿Está seguro que desea eliminar esta actividad económica?</p>
              <p>Esta acción no se puede deshacer.</p>
              <div className={styles.deleteActions}>
                <button
                  onClick={() => setDeleteActividadConfirm(null)}
                  className={styles.cancelButton}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteActividad(deleteActividadConfirm)}
                  className={styles.confirmDeleteButton}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
} 