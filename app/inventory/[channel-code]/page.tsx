'use client'
import React, { useState, useEffect, useCallback } from 'react'

// Forzar renderizado dinámico para evitar errores de build
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import InventarioModal from '@/components/InventarioModal'
import styles from './inventory.module.css'

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
}

interface Inventario {
  _id: string
  cabys: string
  descripcion: string
  titulo?: string
  tipo: string
  precio: number
  cantidad: number
  channel_id: string
  createdAt: string
  updatedAt: string
}

interface UserChannelAccess {
  hasAccess: boolean
  isAdmin: boolean
  permisos: string[]
  channel: Channel | null
}

export default function InventoryPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isAuthenticated, isLoading } = useAuth()
  
  // Estados del canal y acceso
  const [channelAccess, setChannelAccess] = useState<UserChannelAccess | null>(null)
  const [channelLoading, setChannelLoading] = useState(true)
  const [accessError, setAccessError] = useState<string | null>(null)
  
  // Estados del inventario
  const [inventario, setInventario] = useState<Inventario[]>([])
  const [inventarioLoading, setInventarioLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Estados del modal
  const [showModal, setShowModal] = useState(false)
  const [editingInventario, setEditingInventario] = useState<Inventario | null>(null)

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
          perm: 'Inventario'
        })
      })

      const data = await response.json()

      if (response.ok && data.success && data.hasAccess) {
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

  const loadInventario = useCallback(async () => {
    if (!channelAccess?.channel?._id) return
    
    setInventarioLoading(true)
    try {
      const response = await fetch(`/api/inventario?channelId=${channelAccess.channel._id}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setInventario(data || [])
      } else {
        console.error('Error loading inventario:', response.statusText)
        setInventario([])
      }
    } catch (error) {
      console.error('Error loading inventario:', error)
      setInventario([])
    } finally {
      setInventarioLoading(false)
    }
  }, [channelAccess?.channel?._id])

  useEffect(() => {
    // Si no está autenticado, redirigir al login
    if (!isLoading && !isAuthenticated) {
      router.push('/')
      return
    }

    // Si está autenticado y tenemos parámetros, validar acceso al canal
    if (user && params && params['channel-code']) {
      validateChannelAccess(params['channel-code'] as string)
    }
  }, [user, isAuthenticated, isLoading, params, router, validateChannelAccess])

  useEffect(() => {
    // Cargar inventario cuando tengamos acceso al canal
    if (channelAccess?.hasAccess && channelAccess.channel) {
      loadInventario()
    }
  }, [channelAccess, loadInventario])

  const handleAddInventario = () => {
    setEditingInventario(null)
    setShowModal(true)
  }

  const handleEditInventario = (inventario: Inventario) => {
    setEditingInventario(inventario)
    setShowModal(true)
  }

  const handleDeleteInventario = async (inventario: Inventario) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el artículo "${inventario.descripcion}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/inventario/${inventario._id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Artículo eliminado exitosamente')
        loadInventario()
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error || 'Error eliminando artículo'}`)
      }
    } catch (error) {
      console.error('Error deleting inventario:', error)
      alert('Error de conexión al eliminar artículo')
    }
  }

  const handleModalClose = (inventarioSaved?: boolean) => {
    setShowModal(false)
    setEditingInventario(null)
    
    if (inventarioSaved) {
      loadInventario()
    }
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

  // Filtrar inventario basado en el término de búsqueda
  const filteredInventario = inventario.filter(item =>
    item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.titulo && item.titulo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    item.cabys.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            <h1>📦 Gestión de Inventario</h1>
            <p className={styles.channelInfo}>
              <span className={styles.channelCode}>{channel.code}</span>
              {channelAccess.isAdmin && <span className={styles.adminBadge}>👑 Administrador</span>}
            </p>
          </div>
        </div>

        {/* Inventario */}
        <section className={styles.section}>
          <div className={styles.card}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>📋 Artículos de Inventario</h2>
              <button 
                onClick={handleAddInventario} 
                className={styles.addButton}
              >
                ➕ Agregar Artículo
              </button>
            </div>

            <div className={styles.controls}>
              <div className={styles.searchContainer}>
                <input
                  type="text"
                  placeholder="Buscar por descripción, CABYS o tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            </div>

            {inventarioLoading ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Cargando inventario...</p>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>CABYS</th>
                      <th>Título</th>
                      <th>Tipo</th>
                      <th>Precio</th>
                      <th>Cantidad</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventario.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={styles.noData}>
                          {searchTerm ? 'No se encontraron artículos con ese criterio de búsqueda' : 'No hay artículos en el inventario'}
                        </td>
                      </tr>
                    ) : (
                      filteredInventario.map((item) => (
                        <tr key={item._id}>
                          <td className={styles.cabys}>{item.cabys}</td>
                          <td className={styles.descripcion}>
                            {item.titulo ? item.titulo : item.descripcion}
                          </td>
                          <td className={styles.tipo}>{item.tipo}</td>
                          <td className={styles.precio}>₡{item.precio.toLocaleString()}</td>
                          <td className={styles.cantidad}>{item.cantidad}</td>
                          <td className={styles.actions}>
                            <button
                              onClick={() => handleEditInventario(item)}
                              className={styles.editButton}
                              title="Editar artículo"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteInventario(item)}
                              className={styles.deleteButton}
                              title="Eliminar artículo"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Modal para agregar/editar inventario */}
      {showModal && (
        <InventarioModal
          inventario={editingInventario}
          channelId={channelAccess?.channel?._id || ''}
          onClose={handleModalClose}
        />
      )}
    </main>
  )
}