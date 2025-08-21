'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import BillsTable from '@/components/BillsTable'
import styles from './bills-management.module.css'

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

const BillsManagementPage: React.FC = () => {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  
  const [channel, setChannel] = useState<Channel | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  const validateChannelAccess = useCallback(async () => {
    if (!user?._id) return

    setLoading(true)
    setAccessDenied(false)

    try {
      if (!params || !params['channel-code']) {
        setAccessDenied(true)
        setLoading(false)
        return
      }

      const encodedChannelCode = params['channel-code'] as string
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
        setChannel(data.channel)
        setAccessDenied(false)
      } else {
        console.error('Access validation failed:', data.message || 'No tienes acceso a este canal')
        setAccessDenied(true)
      }
    } catch (error: any) {
      console.error('Error validating channel access:', error)
      setAccessDenied(true)
    } finally {
      setLoading(false)
    }
  }, [user?._id, params])

  useEffect(() => {
    if (authLoading) return
    
    if (!isAuthenticated || !user) {
      router.push('/')
      return
    }

    if (params && params['channel-code']) {
      validateChannelAccess()
    }
  }, [user, authLoading, isAuthenticated, params, router, validateChannelAccess])

  const handleGoBack = () => {
    if (channel && channel.code) {
      // Usar el mismo patrón que en home: channel.code sin encodeURIComponent
      const encodedChannelCode = btoa(channel.code)
      router.push(`/home/${encodedChannelCode}`)
    } else {
      router.push('/home')
    }
  }

  if (authLoading || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Validando acceso...</p>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className={styles.accessDenied}>
        <div className={styles.card}>
          <h2>🚫 Acceso Denegado</h2>
          <p>No tienes permisos para acceder a la gestión de facturas de este canal.</p>
          <button 
            onClick={handleGoBack}
            className={styles.backButton}
          >
            ← Volver
          </button>
        </div>
      </div>
    )
  }

  if (!channel) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.card}>
          <h2>❌ Error</h2>
          <p>No se pudo cargar la información del canal.</p>
          <button 
            onClick={handleGoBack}
            className={styles.backButton}
          >
            ← Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            onClick={handleGoBack}
            className={styles.backButton}
          >
            ← Volver
          </button>
          <div className={styles.headerInfo}>
            <h1>📄 Gestión de Facturas</h1>
            <div className={styles.channelInfo}>
              <span className={styles.channelName}>{channel.name}</span>
              <span className={styles.channelId}>ID: {channel.ident}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <BillsTable channelId={channel._id} />
      </div>
    </div>
  )
}

export default BillsManagementPage
