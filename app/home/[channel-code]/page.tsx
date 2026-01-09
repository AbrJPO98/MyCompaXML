'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import styles from './channel-home.module.css'

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
}

interface UserChannelAccess {
  hasAccess: boolean
  isAdmin: boolean
  permisos: string[]
  channel: Channel | null
}

export default function ChannelHomePage() {
  const router = useRouter()
  const params = useParams()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [channelAccess, setChannelAccess] = useState<UserChannelAccess | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const validateChannelAccess = useCallback(async (encodedChannelCode: string) => {
    if (!user?._id) return

    setLoading(true)
    setError(null)

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
          checkPerm: false,
          perm: 'Canal'
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setChannelAccess(data)
      } else {
        setError(data.message || 'No tienes acceso a este canal')
      }
    } catch (error: any) {
      console.error('Error validating channel access:', error)
      setError(error.message || 'Error validando acceso al canal')
    } finally {
      setLoading(false)
    }
  }, [user?._id])

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

  const handleGoToChannelEdit = () => {
    if (channelAccess?.channel?.code) {
      const encodedChannelCode = btoa(channelAccess.channel.code)
      router.push(`/channels/${encodedChannelCode}`)
    }
  }

  const handleGoToInventory = () => {
    if (channelAccess?.channel?.code) {
      const encodedChannelCode = btoa(channelAccess.channel.code)
      router.push(`/inventory/${encodedChannelCode}`)
    }
  }

  const handleGoToBillsManagement = () => {
    if (channelAccess?.channel?.code) {
      const encodedChannelCode = btoa(channelAccess.channel.code)
      router.push(`/bills-management/${encodedChannelCode}`)
    }
  }

  const handleGoToElectronicBilling = () => {
    if (channelAccess?.channel?.code) {
      const encodedChannelCode = btoa(channelAccess.channel.code)
      router.push(`/electronic-billing/${encodedChannelCode}`)
    }
  }

  const handleGoToChannelMembers = () => {
    if (channelAccess?.channel?.code) {
      const encodedChannelCode = btoa(channelAccess.channel.code)
      router.push(`/channel-members/${encodedChannelCode}`)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading || loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Validando acceso al canal...</p>
      </div>
    )
  }

  if (error || !channelAccess?.hasAccess) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <h2>❌ Acceso Denegado</h2>
          <p>{error || 'No tienes permisos para acceder a este canal'}</p>
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
  const hasPerm = (perm: string) => Boolean(channelAccess?.permisos?.includes(perm))

  const actionItems = [
    {
      key: 'members',
      icon: '👥',
      title: 'Miembros del canal',
      description: 'Administra los usuarios asociados al canal y asigna sus roles.',
      perm: 'Usuarios',
      disabled: !hasPerm('Usuarios'),
      onClick: handleGoToChannelMembers
    },
    {
      key: 'channel',
      icon: '✏️',
      title: 'Canal y actividades económicas',
      description: 'Edita datos del canal, gestiona actividades económicas y sincroniza con Hacienda.',
      perm: 'Canal',
      disabled: !hasPerm('Canal'),
      onClick: handleGoToChannelEdit
    },
    {
      key: 'inventory',
      icon: '📦',
      title: 'Inventario',
      description: 'Crea y administra productos/servicios, precios y configuraciones para facturación.',
      perm: 'Inventario',
      disabled: !hasPerm('Inventario'),
      onClick: handleGoToInventory
    },
    {
      key: 'bills',
      icon: '📄',
      title: 'Gestor de facturas',
      description: 'Gestiona facturas, archivos y flujos del comprobante dentro del canal.',
      perm: 'Gestor de facturas',
      disabled: !hasPerm('Gestor de facturas'),
      onClick: handleGoToBillsManagement
    },
    {
      key: 'ebilling',
      icon: '⚡',
      title: 'Facturador / Facturación electrónica',
      description: 'Emite comprobantes electrónicos y gestiona procesos relacionados.',
      perm: 'Facturador',
      disabled: !hasPerm('Facturador'),
      onClick: handleGoToElectronicBilling
    }
  ]

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>🏢 {channel.name}</h1>
          <p className={styles.channelCode}>Código: {channel.code}</p>
          {channelAccess.isAdmin && (
            <span className={styles.adminBadge}>👑 Administrador</span>
          )}
          <button onClick={handleBackToHome} className={styles.backButton}>
            ← Volver al Inicio
          </button>
        </div>

        <div className={styles.content}>
          {/* Información del Canal */}
          <section className={styles.section}>
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>📋 Información del Canal</h2>
              
              <div className={styles.channelInfo}>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <label>Nombre del Canal:</label>
                    <span>{channel.name}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Código:</label>
                    <span className={styles.code}>{channel.code}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Identificación:</label>
                    <span>{getIdentTypeLabel(channel.ident_type)} - {channel.ident}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Teléfono:</label>
                    <span>+{channel.phone_code} {channel.phone}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Registro Fiscal IVA:</label>
                    <span>{channel.registro_fiscal_IVA || 'No especificado'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Estado:</label>
                    <span className={`${styles.status} ${channel.isActive ? styles.active : styles.inactive}`}>
                      {channel.isActive ? '✅ Activo' : '❌ Inactivo'}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Fecha de Creación:</label>
                    <span>{formatDate(channel.createdAt)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Tu Rol:</label>
                    <span className={`${styles.role} ${channelAccess.isAdmin ? styles.admin : styles.member}`}>
                      {channelAccess.isAdmin ? '👑 Administrador' : '👤 Miembro'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Acciones del Canal */}
          <section className={styles.section}>
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>⚙️ Acciones del Canal</h2>
              
              <div className={styles.actions}>
                <div className={styles.actionsDropdown}>
                  <div className={styles.actionsMenu}>
                    {actionItems
                      .filter((item) => (item.key === 'members' ? hasPerm('Usuarios') : true))
                      .map((item) => {
                        const allowed = hasPerm(item.perm)
                        return (
                          <div key={item.key} className={styles.actionItem}>
                            <div className={styles.actionItemLeft}>
                              <div className={styles.actionItemTitleRow}>
                                <span className={styles.actionItemIcon}>{item.icon}</span>
                                <span className={styles.actionItemTitle}>{item.title}</span>
                              </div>
                              <div className={styles.actionItemDescription}>{item.description}</div>
                              {!allowed && (
                                <div className={styles.actionItemDenied}>Sin permiso ({item.perm})</div>
                              )}
                            </div>

                            <div className={styles.actionItemRight}>
                              <button
                                type="button"
                                className={styles.actionAccessButton}
                                onClick={item.onClick}
                                disabled={!allowed}
                              >
                                Acceder
                              </button>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}