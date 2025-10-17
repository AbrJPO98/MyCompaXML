'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import ClientesModal from '@/components/ClientesModal'
import AddCryptoKeyModal from '@/components/AddCryptoKeyModal'
import styles from './electronic-billing.module.css'

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

const ElectronicBillingPage: React.FC = () => {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  
  const [channel, setChannel] = useState<Channel | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [showFacturasMenu, setShowFacturasMenu] = useState(false)
  const [showFirmaMenu, setShowFirmaMenu] = useState(false)
  const [showClientesMenu, setShowClientesMenu] = useState(false)
  const [showClientesModal, setShowClientesModal] = useState(false)
  const [showAddCryptoKeyModal, setShowAddCryptoKeyModal] = useState(false)

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

  const handleFacturasClick = () => {
    setShowFacturasMenu(!showFacturasMenu)
    setShowFirmaMenu(false)
    setShowClientesMenu(false)
  }

  const handleFirmaClick = () => {
    setShowFirmaMenu(!showFirmaMenu)
    setShowFacturasMenu(false)
    setShowClientesMenu(false)
  }

  const handleClientesClick = () => {
    setShowClientesMenu(!showClientesMenu)
    setShowFacturasMenu(false)
    setShowFirmaMenu(false)
  }

  const handleBackdropClick = () => {
    setShowFacturasMenu(false)
    setShowFirmaMenu(false)
    setShowClientesMenu(false)
  }

  const handleNuevaFactura = () => {
    setShowFacturasMenu(false)
    // TODO: Implement new invoice functionality
    console.log('Nueva factura clicked')
  }

  const handleConsultarFactura = () => {
    setShowFacturasMenu(false)
    // TODO: Implement consult invoice functionality
    console.log('Consultar factura clicked')
  }

  const handleDocumentoFactura = () => {
    setShowFacturasMenu(false)
    // TODO: Implement invoice document functionality
    console.log('Documento de la factura clicked')
  }

  const handleAnadirFirma = () => {
    setShowFirmaMenu(false)
    setShowAddCryptoKeyModal(true)
  }

  const handleCryptoKeySuccess = () => {
    console.log('Firma digital guardada exitosamente')
    // Aquí puedes agregar lógica adicional después de guardar la firma
    // Por ejemplo, mostrar una notificación, actualizar el estado, etc.
  }

  const handleListaClientes = () => {
    setShowClientesMenu(false)
    setShowClientesModal(true)
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
          <p>No tienes permisos para acceder a la facturación electrónica de este canal.</p>
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
            <h1>⚡ Facturación Electrónica</h1>
            <div className={styles.channelInfo}>
              <span className={styles.channelName}>{channel.name}</span>
              <span className={styles.channelId}>ID: {channel.ident}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.tableContainer}>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.toolbarSection}>
              <div className={styles.dropdown}>
                <button
                  onClick={handleFacturasClick}
                  className={`${styles.toolbarButton} ${showFacturasMenu ? styles.active : ''}`}
                >
                  📄 Facturas
                  <span className={styles.dropdownArrow}>
                    {showFacturasMenu ? '▲' : '▼'}
                  </span>
                </button>
                
                {showFacturasMenu && (
                  <>
                    <div className={styles.backdrop} onClick={handleBackdropClick}></div>
                    <div className={styles.dropdownMenu}>
                      <button
                        onClick={handleNuevaFactura}
                        className={styles.dropdownItem}
                      >
                        ➕ Nueva factura
                      </button>
                      <button
                        onClick={handleConsultarFactura}
                        className={styles.dropdownItem}
                      >
                        🔍 Consultar factura
                      </button>
                      <button
                        onClick={handleDocumentoFactura}
                        className={styles.dropdownItem}
                      >
                        📋 Documento de la factura
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className={styles.dropdown}>
                <button
                  onClick={handleFirmaClick}
                  className={`${styles.toolbarButton} ${showFirmaMenu ? styles.active : ''}`}
                >
                  ✍️ Firma
                  <span className={styles.dropdownArrow}>
                    {showFirmaMenu ? '▲' : '▼'}
                  </span>
                </button>
                
                {showFirmaMenu && (
                  <>
                    <div className={styles.backdrop} onClick={handleBackdropClick}></div>
                    <div className={styles.dropdownMenu}>
                      <button
                        onClick={handleAnadirFirma}
                        className={styles.dropdownItem}
                      >
                        ➕ Añadir firma
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className={styles.dropdown}>
                <button
                  onClick={handleClientesClick}
                  className={`${styles.toolbarButton} ${showClientesMenu ? styles.active : ''}`}
                >
                  👥 Clientes
                  <span className={styles.dropdownArrow}>
                    {showClientesMenu ? '▲' : '▼'}
                  </span>
                </button>
                
                {showClientesMenu && (
                  <>
                    <div className={styles.backdrop} onClick={handleBackdropClick}></div>
                    <div className={styles.dropdownMenu}>
                      <button
                        onClick={handleListaClientes}
                        className={styles.dropdownItem}
                      >
                        📋 Lista de clientes
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className={styles.tableHeader}>
            <h2>📊 Facturas Electrónicas</h2>
          </div>
          
          <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Clave</th>
                  <th>Tipo de factura</th>
                  <th>Sucursal</th>
                  <th>Actividad económica</th>
                  <th>Nombre (Emisor)</th>
                  <th>Cédula (Receptor)</th>
                  <th>Nombre (Receptor)</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Total (Factura)</th>
                  <th>Total (Impuesto)</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.emptyRow}>
                  <td colSpan={11} className={styles.emptyMessage}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>📋</div>
                      <h3>No hay facturas electrónicas</h3>
                      <p>Las facturas electrónicas aparecerán aquí una vez que se configuren y envíen.</p>
                      <button className={styles.addButton} disabled>
                        + Agregar Factura Electrónica
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Clientes */}
      <ClientesModal
        isOpen={showClientesModal}
        onClose={() => setShowClientesModal(false)}
      />

      {/* Modal de Añadir Firma Digital */}
      {channel && (
        <AddCryptoKeyModal
          isOpen={showAddCryptoKeyModal}
          onClose={() => setShowAddCryptoKeyModal(false)}
          channelId={channel._id}
          onSuccess={handleCryptoKeySuccess}
        />
      )}
    </div>
  )
}

export default ElectronicBillingPage
