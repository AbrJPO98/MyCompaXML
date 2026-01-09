'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import ChannelMembersTable from '@/components/ChannelMembersTable'
import styles from './channel-members.module.css'

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

export default function ChannelMembersPage() {
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
          checkPerm: true,
          perm: 'Usuarios'
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

  const handleBackToChannel = () => {
    if (channelAccess?.channel?.code) {
      const encodedChannelCode = btoa(channelAccess.channel.code)
      router.push(`/home/${encodedChannelCode}`)
    }
  }

  const handleBackToHome = () => {
    router.push('/home')
  }

  if (isLoading || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Validando acceso al canal...</p>
      </div>
    )
  }

  if (error || !channelAccess?.hasAccess) {
    return (
      <div className={styles.accessDenied}>
        <div className={styles.card}>
          <h2>🚫 Acceso Denegado</h2>
          <p>{error || 'No tienes permisos para acceder a este canal'}</p>
          <button onClick={handleBackToHome} className={styles.backButton}>
            ← Volver al Inicio
          </button>
        </div>
      </div>
    )
  }

  if (!channelAccess.channel) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.card}>
          <h2>❌ Canal No Encontrado</h2>
          <p>El canal solicitado no existe o no está disponible</p>
          <button onClick={handleBackToHome} className={styles.backButton}>
            ← Volver al Inicio
          </button>
        </div>
      </div>
    )
  }

  // Verificar que el usuario sea administrador para acceder a la gestión de miembros
  if (!channelAccess.permisos.includes('Usuarios')) {
    return (
      <div className={styles.accessDenied}>
        <div className={styles.card}>
          <h2>🚫 Permisos Insuficientes</h2>
          <p>Solo los administradores o miembros con permisos de gestión de usuarios pueden gestionar los miembros</p>
          <button onClick={handleBackToChannel} className={styles.backButton}>
            ← Volver al Canal
          </button>
        </div>
      </div>
    )
  }

  const channel = channelAccess.channel

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            onClick={handleBackToChannel}
            className={styles.backButton}
          >
            ← Volver
          </button>
          <div className={styles.headerInfo}>
            <h1>👥 Miembros del Canal</h1>
            <div className={styles.channelInfo}>
              <span className={styles.channelName}>{channel.name}</span>
              <span className={styles.channelId}>ID: {channel.ident}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <ChannelMembersTable channelId={channel._id} perms={channelAccess.permisos} />
      </div>
    </div>
  )
}
