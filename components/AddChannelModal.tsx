'use client'
import React, { useState, useEffect } from 'react'
import styles from './AddChannelModal.module.css'

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
  createdAt: string
  updatedAt: string
}

interface UserChannelStatus {
  hasAccess: boolean
  isActive?: boolean
}

interface AddChannelModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onChannelRequested: () => void
}

const AddChannelModal: React.FC<AddChannelModalProps> = ({
  isOpen,
  onClose,
  userId,
  onChannelRequested
}) => {
  const [channels, setChannels] = useState<Channel[]>([])
  const [channelStatuses, setChannelStatuses] = useState<Record<string, UserChannelStatus>>({})
  const [loading, setLoading] = useState(false)
  const [requestingChannels, setRequestingChannels] = useState<Set<string>>(new Set())

  // Cargar todos los canales disponibles
  const loadChannels = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/channels/all')
      const data = await response.json()

      if (response.ok && data.success) {
        setChannels(data.channels)
        // Cargar el estado de acceso para cada canal
        await loadChannelStatuses(data.channels)
      } else {
        console.error('Error loading channels:', data.message)
      }
    } catch (error) {
      console.error('Error loading channels:', error)
    } finally {
      setLoading(false)
    }
  }

  // Cargar el estado de acceso del usuario para cada canal
  const loadChannelStatuses = async (channelList: Channel[]) => {
    try {
      const response = await fetch(`/api/user-channels/status?userId=${userId}`)
      const data = await response.json()

      if (response.ok && data.success) {
        const statusMap: Record<string, UserChannelStatus> = {}
        data.statuses.forEach((status: any) => {
          statusMap[status.channelId] = {
            hasAccess: true,
            isActive: status.isActive
          }
        })
        setChannelStatuses(statusMap)
      }
    } catch (error) {
      console.error('Error loading channel statuses:', error)
    }
  }

  // Solicitar acceso a un canal
  const requestChannelAccess = async (channelId: string) => {
    setRequestingChannels(prev => new Set(prev).add(channelId))
    
    try {
      const response = await fetch('/api/user-channels/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          channelId,
          is_admin: false,
          isActive: false
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Actualizar el estado local
        setChannelStatuses(prev => ({
          ...prev,
          [channelId]: { hasAccess: true, isActive: false }
        }))
        
        // Notificar al componente padre
        onChannelRequested()
        
        alert('Solicitud de acceso enviada exitosamente')
      } else {
        alert(result.error || 'Error al enviar la solicitud')
      }
    } catch (error) {
      console.error('Error requesting channel access:', error)
      alert('Error de conexión. Por favor intenta de nuevo.')
    } finally {
      setRequestingChannels(prev => {
        const newSet = new Set(prev)
        newSet.delete(channelId)
        return newSet
      })
    }
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Obtener el estado de un canal para el usuario
  const getChannelStatus = (channelId: string) => {
    const status = channelStatuses[channelId]
    if (!status || !status.hasAccess) {
      return 'no-access'
    }
    return status.isActive ? 'accessible' : 'pending'
  }

  // Renderizar botón según el estado
  const renderActionButton = (channel: Channel) => {
    const status = getChannelStatus(channel._id)
    const isRequesting = requestingChannels.has(channel._id)

    switch (status) {
      case 'accessible':
        return (
          <span className={styles.statusBadge + ' ' + styles.accessible}>
            ✅ Accesible
          </span>
        )
      case 'pending':
        return (
          <span className={styles.statusBadge + ' ' + styles.pending}>
            ⏳ Pendiente
          </span>
        )
      default:
        return (
          <button
            onClick={() => requestChannelAccess(channel._id)}
            className={styles.requestButton}
            disabled={isRequesting || !channel.isActive}
            title={!channel.isActive ? 'Canal inactivo' : 'Solicitar acceso a este canal'}
          >
            {isRequesting ? 'Solicitando...' : 'Solicitar acceso'}
          </button>
        )
    }
  }

  // Cargar canales cuando se abre el modal
  useEffect(() => {
    if (isOpen && userId) {
      loadChannels()
    }
  }, [isOpen, userId])

  // Cerrar modal con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Canales Disponibles</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>
              <p>Cargando canales disponibles...</p>
            </div>
          ) : channels.length > 0 ? (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nombre del Canal</th>
                    <th>Código</th>
                    <th>Identificación</th>
                    <th>Estado</th>
                    <th>Fecha de Creación</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {channels.map((channel) => (
                    <tr key={channel._id}>
                      <td>
                        <div className={styles.channelInfo}>
                          <strong>{channel.name}</strong>
                          <small>Teléfono: +{channel.phone_code} {channel.phone}</small>
                        </div>
                      </td>
                      <td>
                        <span className={styles.channelCode}>
                          {channel.code}
                        </span>
                      </td>
                      <td>
                        <div className={styles.identInfo}>
                          <span>{channel.ident}</span>
                          <small>Tipo: {channel.ident_type}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.status} ${channel.isActive ? styles.active : styles.inactive}`}>
                          {channel.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>{formatDate(channel.createdAt)}</td>
                      <td>
                        {renderActionButton(channel)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>No hay canales disponibles en este momento.</p>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button
            onClick={onClose}
            className={styles.closeModalButton}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddChannelModal
