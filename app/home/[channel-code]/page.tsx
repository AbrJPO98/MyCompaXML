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
          channelCode: channelCode
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
                <button 
                  onClick={handleGoToChannelEdit} 
                  className={styles.actionButton}
                >
                  ✏️ Gestionar Canal y Actividades
                </button>
                
                <button 
                  onClick={handleGoToInventory} 
                  className={styles.actionButton}
                >
                  📦 Gestionar Inventario
                </button>
                
                <button 
                  onClick={handleGoToBillsManagement} 
                  className={styles.actionButton}
                >
                  📄 Gestionar Facturas
                </button>
                
                <div className={styles.actionDescription}>
                  <p>Desde aquí puedes acceder a la gestión completa del canal, incluyendo:</p>
                  <ul>
                    <li>📝 Editar información del canal</li>
                    <li>📊 Gestionar actividades económicas</li>
                    <li>🔄 Sincronizar con Hacienda</li>
                    <li>📋 Ver y administrar datos</li>
                    <li>📦 Gestionar inventario de productos</li>
                    <li>📄 Administrar facturas y comprobantes</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}