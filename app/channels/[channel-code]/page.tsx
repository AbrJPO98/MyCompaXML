'use client'
import React, { useState, useEffect, useCallback } from 'react'

// Forzar renderizado dinámico para evitar errores de build
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import ActividadModal from '@/components/ActividadModal'
import SucursalModal from '@/components/SucursalModal'
import CajasModal from '@/components/CajasModal'
import styles from './channels.module.css'

interface Channel {
  _id: string
  code: string
  name: string
  ident: string
  ident_type: string
  phone: string
  phone_code: string
  registro_fiscal_IVA: string
  email?: string
  commercial_name?: string
  isActive: boolean
}

interface Actividad {
  _id: string
  codigo: string
  nombre_personal: string
  nombre_original: string
  tipo: string
  estado: string
  channel_id?: string
}

interface Sucursal {
  _id: string
  codigo: string
  nombre: string
  provincia: string
  canton: string
  distrito: string
  direccion: string
  activity_id: string
  createdAt: string
  updatedAt: string
  provinciaNombre?: string
  cantonNombre?: string
  distritoNombre?: string
}

interface UserChannelAccess {
  hasAccess: boolean
  isAdmin: boolean
  permisos: string[]
  channel: Channel | null
}

export default function ChannelManagementPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isAuthenticated, isLoading } = useAuth()
  
  // Estados del canal y acceso
  const [channelAccess, setChannelAccess] = useState<UserChannelAccess | null>(null)
  const [channelLoading, setChannelLoading] = useState(true)
  const [accessError, setAccessError] = useState<string | null>(null)
  
  // Estados del formulario del canal
  const [formData, setFormData] = useState({
    name: '',
    ident: '',
    ident_type: '01',
    phone: '',
    phone_code: '506',
    registro_fiscal_IVA: '',
    email: '',
    commercial_name: ''
  })
  const [formLoading, setFormLoading] = useState(false)

  // Estados de actividades
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [actividadesLoading, setActividadesLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [haciendaSyncLoading, setHaciendaSyncLoading] = useState(false)
  
  // Estados del modal
  const [showModal, setShowModal] = useState(false)
  const [editingActividad, setEditingActividad] = useState<Actividad | null>(null)

  // Estados de sucursales
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [sucursalesLoading, setSucursalesLoading] = useState(false)
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<Actividad | null>(null)
  const [showSucursalModal, setShowSucursalModal] = useState(false)
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null)

  // Estados de cajas
  const [showCajasModal, setShowCajasModal] = useState(false)
  const [selectedSucursal, setSelectedSucursal] = useState<Sucursal | null>(null)

  const validateChannelAccess = useCallback(async (encodedChannelCode: string) => {
    if (!user?._id) return

    setChannelLoading(true)
    setAccessError(null)

    try {
      console.log('Encoded channel code from URL:', encodedChannelCode)
      
      // Verificar que el parámetro no esté vacío
      if (!encodedChannelCode || encodedChannelCode.trim() === '') {
        throw new Error('Código de canal no proporcionado')
      }

      // Decodificar el código del canal desde base64
      let channelCode: string
      try {
        // Primero decodificar URL y luego base64
        const urlDecodedCode = decodeURIComponent(encodedChannelCode)
        console.log('URL decoded:', urlDecodedCode)
        
        channelCode = atob(urlDecodedCode)
        console.log('Base64 decoded channel code:', channelCode)
        
        // Verificar que el resultado no esté vacío
        if (!channelCode || channelCode.trim() === '') {
          throw new Error('Código de canal decodificado está vacío')
        }
      } catch (e) {
        console.error('Error decodificando:', e)
        console.error('String original:', encodedChannelCode)
        
        // Intentar decodificación directa como fallback
        try {
          console.log('Intentando decodificación directa...')
          channelCode = atob(encodedChannelCode)
          console.log('Decodificación directa exitosa:', channelCode)
          
          if (!channelCode || channelCode.trim() === '') {
            throw new Error('Código de canal decodificado está vacío')
          }
        } catch (e2) {
          console.error('Error en decodificación directa:', e2)
          throw new Error(`No se pudo decodificar el código de canal. Original: "${encodedChannelCode}"`)
        }
      }

      const response = await fetch(`/api/channel/access-validation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          channelCode: channelCode,
          checkPerm: true,
          perm: 'Canal'
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setChannelAccess(data)
      } else {
        setAccessError(data.message || 'No tienes acceso a este canal')
      }
    } catch (error: any) {
      console.error('Error validating channel access:', error)
      setAccessError(error.message || 'Error validando acceso al canal')
    } finally {
      setChannelLoading(false)
    }
  }, [user?._id])

  const loadChannelData = useCallback(() => {
    if (!channelAccess?.channel) return

    const channel = channelAccess.channel
    setFormData({
      name: channel.name || '',
      ident: channel.ident || '',
      ident_type: channel.ident_type || '01',
      phone: channel.phone || '',
      phone_code: channel.phone_code || '506',
      registro_fiscal_IVA: channel.registro_fiscal_IVA || '',
      email: channel.email || '',
      commercial_name: channel.commercial_name || ''
    })
  }, [channelAccess?.channel])

  const loadActividades = useCallback(async () => {
    if (!channelAccess?.channel?._id) return

    setActividadesLoading(true)
    try {
      const response = await fetch(`/api/actividades?channelId=${channelAccess.channel._id}&search=${searchTerm}`)
      const data = await response.json()

      if (response.ok) {
        // La API devuelve directamente los datos sin un campo 'success'
        if (data.actividades) {
          setActividades(data.actividades)
          console.log(`✅ Actividades cargadas: ${data.actividades.length}`)
        } else {
          console.log('ℹ️ No se encontraron actividades')
          setActividades([])
        }
      } else {
        console.error('Error loading actividades:', data.error || data.message)
        setActividades([])
      }
    } catch (error) {
      console.error('Error loading actividades:', error)
    } finally {
      setActividadesLoading(false)
    }
  }, [channelAccess?.channel?._id, searchTerm])

  useEffect(() => {
    // Si no está autenticado, redirigir al login
    if (!isLoading && !isAuthenticated) {
      router.push('/')
      return
    }

    // Si hay usuario logueado, validar acceso al canal
    if (user && params && params['channel-code']) {
      validateChannelAccess(params['channel-code'] as string)
    }
  }, [user, isAuthenticated, isLoading, params, router, validateChannelAccess])

  useEffect(() => {
    // Cargar datos del canal cuando se valida el acceso
    if (channelAccess?.hasAccess && channelAccess.channel) {
      loadChannelData()
      loadActividades()
    }
  }, [channelAccess, loadChannelData, loadActividades])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!channelAccess?.channel?._id) return

    setFormLoading(true)
    try {
      const response = await fetch(`/api/channels/current?channelId=${channelAccess.channel._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok && data.channel) {
        alert('Canal actualizado exitosamente')
        // Actualizar los datos del canal en el estado con los datos actualizados de la API
        if (channelAccess.channel) {
          setChannelAccess({
            ...channelAccess,
            channel: {
              ...channelAccess.channel,
              ...data.channel
            }
          })
        }
        // Actualizar también el formData con los datos actualizados
        setFormData({
          name: data.channel.name || '',
          ident: data.channel.ident || '',
          ident_type: data.channel.ident_type || '01',
          phone: data.channel.phone || '',
          phone_code: data.channel.phone_code || '506',
          registro_fiscal_IVA: data.channel.registro_fiscal_IVA || '',
          email: data.channel.email || '',
          commercial_name: data.channel.commercial_name || ''
        })
      } else {
        alert(`Error: ${data.error || data.message || 'Error actualizando canal'}`)
      }
    } catch (error) {
      console.error('Error updating channel:', error)
      alert('Error de conexión. Por favor intenta de nuevo.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadActividades()
  }

  const handleAddActividad = () => {
    setEditingActividad(null)
    setShowModal(true)
  }

  const handleEditActividad = (actividad: Actividad) => {
    setEditingActividad(actividad)
    setShowModal(true)
  }

  const handleDeleteActividad = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta actividad?')) return

    try {
      const response = await fetch(`/api/actividades/${id}?channelId=${channelAccess?.channel?._id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadActividades()
        alert('Actividad eliminada exitosamente')
      } else {
        const data = await response.json()
        alert(`Error: ${data.message || 'Error eliminando actividad'}`)
      }
    } catch (error) {
      console.error('Error deleting actividad:', error)
      alert('Error de conexión. Por favor intenta de nuevo.')
    }
  }

  const handleModalClose = (actividadSaved?: boolean) => {
    setShowModal(false)
    setEditingActividad(null)
    
    if (actividadSaved) {
      loadActividades()
    }
  }

  const syncFromHacienda = async () => {
    if (!channelAccess?.channel?._id || !channelAccess.channel.ident) return

    setHaciendaSyncLoading(true)
    try {
      const response = await fetch('/api/actividades/sync-hacienda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: channelAccess.channel._id,
          identificacion: channelAccess.channel.ident
        })
      })

      const data = await response.json()

      if (response.ok) {
        const processed = data.synchronized + data.updated || 0
        loadActividades()
      } else {
        alert(`Error en sincronización: ${data.error || data.message || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error syncing from Hacienda:', error)
      alert('Error de conexión durante la sincronización')
    } finally {
      setHaciendaSyncLoading(false)
    }
  }

  // Funciones para manejar sucursales


  const loadSucursales = async (activityId: string) => {
    setSucursalesLoading(true)
    try {
      // Obtener la actividad seleccionada
      const actividad = actividades.find(act => act._id === activityId)
      setSelectedActivity(actividad || null)
      
      const response = await fetch(`/api/sucursales?activityId=${activityId}`)
      const data = await response.json()

      if (response.ok) {
        // Cargar sucursales con nombres de ubicaciones
        const sucursalesWithNames = await Promise.all(
          (data.sucursales || []).map(async (sucursal: Sucursal) => {
            try {
              const [provinciaResponse, cantonResponse, distritoResponse] = await Promise.all([
                fetch(`/api/ubicaciones?type=provincia&id=${sucursal.provincia}`),
                fetch(`/api/ubicaciones?type=canton&id=${sucursal.canton}&provinciaId=${sucursal.provincia}`),
                fetch(`/api/ubicaciones?type=distrito&id=${sucursal.distrito}&provinciaId=${sucursal.provincia}&cantonId=${sucursal.canton}`)
              ])
              
              const [provinciaData, cantonData, distritoData] = await Promise.all([
                provinciaResponse.json(),
                cantonResponse.json(),
                distritoResponse.json()
              ])
              
              return {
                ...sucursal,
                provinciaNombre: provinciaData.nombre || sucursal.provincia,
                cantonNombre: cantonData.nombre || sucursal.canton,
                distritoNombre: distritoData.nombre || sucursal.distrito
              }
            } catch (error) {
              console.error('Error getting location names for sucursal:', error)
              return {
                ...sucursal,
                provinciaNombre: sucursal.provincia,
                cantonNombre: sucursal.canton,
                distritoNombre: sucursal.distrito
              }
            }
          })
        )
        
        setSucursales(sucursalesWithNames)
        setSelectedActivityId(activityId)
        console.log(`✅ Sucursales cargadas: ${sucursalesWithNames.length}`)
      } else {
        console.error('Error loading sucursales:', data.error || data.message)
        setSucursales([])
      }
    } catch (error) {
      console.error('Error loading sucursales:', error)
      setSucursales([])
    } finally {
      setSucursalesLoading(false)
    }
  }

  const handleAddSucursal = (activityId: string) => {
    setSelectedActivityId(activityId)
    setEditingSucursal(null)
    setShowSucursalModal(true)
  }

  const handleEditSucursal = (sucursal: Sucursal) => {
    setEditingSucursal(sucursal)
    setShowSucursalModal(true)
  }

  const handleDeleteSucursal = async (sucursalId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta sucursal?')) return

    try {
      const response = await fetch(`/api/sucursales/${sucursalId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Recargar sucursales si hay una actividad seleccionada
        if (selectedActivityId) {
          loadSucursales(selectedActivityId)
        }
        alert('Sucursal eliminada exitosamente')
      } else {
        const data = await response.json()
        alert(`Error: ${data.error || 'Error eliminando sucursal'}`)
      }
    } catch (error) {
      console.error('Error deleting sucursal:', error)
      alert('Error de conexión. Por favor intenta de nuevo.')
    }
  }

  const handleSucursalModalClose = (sucursalSaved?: boolean, nuevaSucursal?: Sucursal) => {
    setShowSucursalModal(false)
    setEditingSucursal(null)
    
    if (sucursalSaved && selectedActivityId) {
      loadSucursales(selectedActivityId).then(() => {
        // Si se creó una nueva sucursal, abrir automáticamente el modal de cajas
        if (nuevaSucursal) {
          setSelectedSucursal(nuevaSucursal)
          setShowCajasModal(true)
        }
      })
    }
  }

  // Funciones para manejar cajas
  const handleGestionarCajas = (sucursal: Sucursal) => {
    setSelectedSucursal(sucursal)
    setShowCajasModal(true)
  }

  const handleCajasModalClose = () => {
    setShowCajasModal(false)
    setSelectedSucursal(null)
  }

  const handleBackToChannelHome = () => {
    if (channelAccess?.channel?.code) {
      const encodedChannelCode = btoa(channelAccess.channel.code)
      router.push(`/home/${encodedChannelCode}`)
    }
  }

  const handleBackToHome = () => {
    router.push('/home')
  }

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

  if (isLoading || channelLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Validando acceso al canal...</p>
      </div>
    )
  }

  if (accessError || !channelAccess?.hasAccess) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <h2>❌ Acceso Denegado</h2>
          <p>{accessError || 'No tienes permisos para gestionar este canal'}</p>
          <button onClick={handleBackToHome} className={styles.backButton}>
            🏠 Volver al Inicio
          </button>
        </div>
      </div>
    )
  }

  if (!channelAccess.channel) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <h2>❌ Canal No Encontrado</h2>
          <p>El canal solicitado no existe o no está disponible</p>
          <button onClick={handleBackToHome} className={styles.backButton}>
            🏠 Volver al Inicio
          </button>
        </div>
      </div>
    )
  }

  const channel = channelAccess.channel

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerButtons}>
            <button onClick={handleBackToChannelHome} className={styles.backButton}>
              ← Canal: {channel.name}
            </button>
            <button onClick={handleBackToHome} className={styles.homeButton}>
              🏠 Inicio
            </button>
          </div>
          <div className={styles.headerContent}>
            <h1>⚙️ Gestión del Canal</h1>
            <p className={styles.channelInfo}>
              <span className={styles.channelCode}>{channel.code}</span>
              {channelAccess.isAdmin && <span className={styles.adminBadge}>👑 Administrador</span>}
            </p>
          </div>
        </div>

        <div className={styles.content}>
          {/* Información del Canal */}
          <section className={styles.section}>
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>📋 Información del Canal</h2>
              
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="name">Nombre del Canal *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={formLoading}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Código (Solo lectura)</label>
                    <input
                      type="text"
                      value={channel.code}
                      className={styles.readOnlyField}
                      readOnly
                    />
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
                      disabled={formLoading}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="ident_type">Tipo de Identificación *</label>
                    <select
                      id="ident_type"
                      name="ident_type"
                      value={formData.ident_type}
                      onChange={handleChange}
                      disabled={formLoading}
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
                    <label htmlFor="phone_code">Código de Teléfono *</label>
                    <select
                      id="phone_code"
                      name="phone_code"
                      value={formData.phone_code}
                      onChange={handleChange}
                      disabled={formLoading}
                      required
                    >
                      <option value="506">🇨🇷 +506 - Costa Rica</option>
                      <option value="1">🇺🇸 +1 - Estados Unidos</option>
                      <option value="52">🇲🇽 +52 - México</option>
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
                      disabled={formLoading}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={formLoading}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="commercial_name">Nombre Comercial</label>
                    <input
                      type="text"
                      id="commercial_name"
                      name="commercial_name"
                      value={formData.commercial_name}
                      onChange={handleChange}
                      disabled={formLoading}
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
                    disabled={formLoading}
                  />
                </div>

                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={formLoading}
                >
                  {formLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </form>
            </div>
          </section>

          {/* Actividades Económicas */}
          {channelAccess.permisos.includes('Actividades económicas') && (
          <section className={styles.section}>
            <div className={styles.card}>
              <div className={styles.actividadesHeader}>
                <h2 className={styles.sectionTitle}>📊 Actividades Económicas</h2>
                <div className={styles.actividadesActions}>
                  <button 
                    onClick={syncFromHacienda}
                    className={styles.syncButton}
                    disabled={haciendaSyncLoading}
                  >
                    {haciendaSyncLoading ? '🔄 Sincronizando...' : '🔄 Sincronizar con Hacienda'}
                  </button>
                  <button 
                    onClick={handleAddActividad}
                    className={styles.addButton}
                  >
                    ➕ Agregar Actividad
                  </button>
                </div>
              </div>

              <div className={styles.searchContainer}>
                <form onSubmit={handleSearch} className={styles.searchForm}>
                  <input
                    type="text"
                    placeholder="Buscar por código o nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                ) : actividades.length > 0 ? (
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
                            <span className={`${styles.estadoBadge} ${styles[`estado${actividad.estado}`]}`}>
                              {actividad.estado}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actions}>
                              <button
                                onClick={() => handleEditActividad(actividad)}
                                className={styles.editButton}
                                title="Editar Actividad"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteActividad(actividad._id)}
                                className={styles.deleteButton}
                                title="Eliminar Actividad"
                              >
                                🗑️
                              </button>
                              {channelAccess.permisos.includes('Sucursales') && (
                                <button
                                  onClick={() => loadSucursales(actividad._id)}
                                  className={styles.viewButton}
                                  title="Ver Sucursales"
                                >
                                  🏢
                                </button>
                              )}
                              <button
                                onClick={() => handleAddSucursal(actividad._id)}
                                className={styles.addButton}
                                title="Añadir Sucursal"
                              >
                                ➕
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className={styles.emptyState}>
                    <p>No hay actividades económicas registradas.</p>
                    <button onClick={handleAddActividad} className={styles.addButton}>
                      ➕ Agregar Primera Actividad
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
          )}

          {/* Sección de Sucursales */}
          {selectedActivityId && channelAccess.permisos.includes('Sucursales') && (
            <section className={styles.section}>
              <div className={styles.card}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    🏢 Sucursales de {selectedActivity?.nombre_personal || 'la Actividad'}
                  </h2>
                  <button 
                    onClick={() => {
                      setSelectedActivityId(null)
                      setSelectedActivity(null)
                      setSucursales([])
                    }}
                    className={styles.closeButton}
                    title="Cerrar vista de sucursales"
                  >
                    ✕
                  </button>
                </div>
                
                <div className={styles.sucursalesContainer}>
                  {sucursalesLoading ? (
                    <div className={styles.loading}>
                      <p>Cargando sucursales...</p>
                    </div>
                  ) : sucursales.length > 0 ? (
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Nombre</th>
                          <th>Provincia</th>
                          <th>Cantón</th>
                          <th>Distrito</th>
                          <th>Dirección</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sucursales.map((sucursal) => (
                          <tr key={sucursal._id}>
                            <td className={styles.codigoCell}>{sucursal.codigo}</td>
                            <td>{sucursal.nombre}</td>
                            <td>{sucursal.provinciaNombre || sucursal.provincia}</td>
                            <td>{sucursal.cantonNombre || sucursal.canton}</td>
                            <td>{sucursal.distritoNombre || sucursal.distrito}</td>
                            <td>{sucursal.direccion}</td>
                            <td>
                              <div className={styles.actions}>
                                <button
                                  onClick={() => handleEditSucursal(sucursal)}
                                  className={styles.editButton}
                                  title="Editar Sucursal"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteSucursal(sucursal._id)}
                                  className={styles.deleteButton}
                                  title="Eliminar Sucursal"
                                >
                                  🗑️
                                </button>
                                <button
                                  onClick={() => handleGestionarCajas(sucursal)}
                                  className={styles.cajasButton}
                                  title="Gestionar Cajas"
                                >
                                  🏪
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className={styles.emptyState}>
                      <p>No hay sucursales registradas para esta actividad.</p>
                      <button 
                        onClick={() => handleAddSucursal(selectedActivityId)} 
                        className={styles.addButton}
                      >
                        ➕ Agregar Primera Sucursal
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Modal de Actividad */}
      {showModal && (
        <ActividadModal
          actividad={editingActividad}
          channelId={channelAccess.channel._id}
          onClose={handleModalClose}
        />
      )}

      {/* Modal de Sucursal */}
      {showSucursalModal && selectedActivityId && (
        <SucursalModal
          sucursal={editingSucursal}
          activityId={selectedActivityId}
          onClose={handleSucursalModalClose as any}
        />
      )}

      {/* Modal de Cajas */}
      {showCajasModal && selectedSucursal && (
        <CajasModal
          sucursal={selectedSucursal}
          onClose={handleCajasModalClose}
        />
      )}
    </main>
  )
}