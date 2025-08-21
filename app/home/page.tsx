'use client'
import React, { useEffect, useState, useCallback } from 'react'

// Forzar renderizado dinámico para evitar errores de build
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import EditUserModal from '@/components/EditUserModal'
import styles from './home.module.css'

interface UserChannel {
  _id: string
  user_id: string
  channel_id: string
  is_admin: boolean
  createdAt: string
  updatedAt: string
  channel: {
    _id: string
    code: string
    name: string
    ident: string
    ident_type: string
    phone: string
    phone_code: string
    registro_fiscal_IVA: string
    isActive: boolean
    createdAt: string
  } | null
}

export default function HomePage() {
  const router = useRouter()
  const { user, logout, isAuthenticated, isLoading, refreshUser } = useAuth()
  const [userChannels, setUserChannels] = useState<UserChannel[]>([])
  const [channelsLoading, setChannelsLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)

  const loadUserChannels = useCallback(async () => {
    if (!user?._id) return

    setChannelsLoading(true)
    try {
      const response = await fetch(`/api/user-channels?userId=${user._id}`)
      const data = await response.json()

      if (response.ok && data.success) {
        console.log('Loaded user channels:', data.channels.length)
        setUserChannels(data.channels)
      } else {
        console.error('Error loading user channels:', data.message)
      }
    } catch (error) {
      console.error('Error loading user channels:', error)
    } finally {
      setChannelsLoading(false)
    }
  }, [user?._id])

  useEffect(() => {
    // Si no está autenticado, redirigir al login
    if (!isLoading && !isAuthenticated) {
      router.push('/')
      return
    }

    // Si hay usuario logueado, cargar sus canales
    if (user) {
      loadUserChannels()
    }
  }, [user, isAuthenticated, isLoading, router, loadUserChannels])

  const handleLogout = () => {
    logout()
  }

  const handleEditUser = () => {
    setShowEditModal(true)
  }

  const handleEditModalClose = async (userUpdated?: boolean) => {
    setShowEditModal(false)
    
    if (userUpdated && refreshUser) {
      // Refrescar los datos del usuario en el contexto
      await refreshUser()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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

  const handleChannelAccess = (channelCode: string) => {
    try {
      console.log('Original channel code:', channelCode)
      
      // Verificar que el código no esté vacío
      if (!channelCode || channelCode.trim() === '') {
        alert('Error: Código de canal no válido')
        return
      }

      // Convertir el código del canal a base64 y luego hacer URL-safe
      const cleanChannelCode = channelCode.trim()
      const base64Code = btoa(cleanChannelCode)
      const urlSafeCode = encodeURIComponent(base64Code)
      console.log('Base64 code:', base64Code)
      console.log('URL-safe code:', urlSafeCode)
      
      router.push(`/home/${urlSafeCode}`)
    } catch (error) {
      console.error('Error encoding channel code:', error)
      alert('Error procesando el acceso al canal')
    }
  }

  if (isLoading || channelsLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando...</p>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Bienvenido, {user.name}!</h1>
          <p>Panel de control principal</p>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Cerrar Sesión
          </button>
        </div>

        <div className={styles.content}>
          {/* Sección 1: Información del Usuario */}
          <section className={styles.section}>
            <div className={styles.card}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>📋 Información del Usuario</h2>
                <button 
                  onClick={handleEditUser}
                  className={styles.editButton}
                >
                  ✏️ Editar
                </button>
              </div>
              <div className={styles.userInfo}>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <label>Nombre completo:</label>
                    <span>{user.name}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Email:</label>
                    <span>{user.email}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Identificación:</label>
                    <span>{getIdentTypeLabel(user.type_ident)} - {user.ident}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Teléfono:</label>
                    <span>+{user.phone_code} {user.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Sección 2: Canales del Usuario */}
          <section className={styles.section}>
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>🏢 Canales del Usuario ({userChannels.length})</h2>
              
              {userChannels.length > 0 ? (
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Nombre del Canal</th>
                        <th>Código</th>
                        <th>Fecha de Creación</th>
                        <th>Es Administrador</th>
                        <th>Estado del Canal</th>
                        <th>Ingresar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userChannels.map((userChannel) => (
                        <tr key={userChannel._id}>
                          <td>
                            <div className={styles.channelName}>
                              <strong>{userChannel.channel?.name || 'Canal sin nombre'}</strong>
                              <small>{userChannel.channel?.ident}</small>
                            </div>
                          </td>
                          <td>
                            <span className={styles.channelCode}>
                              {userChannel.channel?.code || 'N/A'}
                            </span>
                          </td>
                          <td>
                            {userChannel.channel?.createdAt 
                              ? formatDate(userChannel.channel.createdAt)
                              : formatDate(userChannel.createdAt)
                            }
                          </td>
                          <td>
                            <span className={`${styles.adminBadge} ${userChannel.is_admin ? styles.isAdmin : styles.notAdmin}`}>
                              {userChannel.is_admin ? '✅ Sí' : '❌ No'}
                            </span>
                          </td>
                          <td>
                            <span className={`${styles.status} ${userChannel.channel?.isActive ? styles.active : styles.inactive}`}>
                              {userChannel.channel?.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => handleChannelAccess(userChannel.channel?.code || '')}
                              className={styles.accessButton}
                              disabled={!userChannel.channel?.isActive || !userChannel.channel?.code}
                            >
                              🏢 Ingresar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>No tienes canales asignados aún.</p>
                  <small>Contacta al administrador para que te asigne a un canal.</small>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Modal de Edición */}
      {showEditModal && user && (
        <EditUserModal
          user={user}
          onClose={handleEditModalClose}
        />
      )}
    </main>
  )
} 