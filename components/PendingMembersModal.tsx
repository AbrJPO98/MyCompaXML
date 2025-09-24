'use client'
import React, { useState, useEffect, useCallback } from 'react'
import styles from './PendingMembersModal.module.css'
import { MemberColumnDefinition, PENDING_MEMBER_COLUMN_DEFINITIONS } from './ChannelMembersTable'

interface PendingMember {
  _id: string
  userChannelId: string
  userId: string
  nombre: string
  tipoCedula: string
  cedula: string
  email: string
  telefono: string
  esAdmin: boolean
  isActive: boolean
  createdAt: string
  isAccepted: boolean
}

interface PendingMembersModalProps {
  isOpen: boolean
  onClose: () => void
  channelId: string
}

const PendingMembersModal: React.FC<PendingMembersModalProps> = ({
  isOpen,
  onClose,
  channelId
}) => {
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([])
  const [loading, setLoading] = useState(false)

  const loadPendingMembers = useCallback(async () => {
    setLoading(true)
    
    try {
      const response = await fetch(`/api/user-channels?channelId=${channelId}&isActive=false`)
      if (response.ok) {
        const data = await response.json()
        const userChannels = Array.isArray(data.data) ? data.data : []
        
        // Procesar los datos de miembros pendientes
        const pending = userChannels.map((userChannel: any) => {
          const userInfo = userChannel.userInfo

          let tipoCedula = "Física";
          switch (userInfo?.type_ident) {
            case "01":
              tipoCedula = "Física";
              break;
            case "02":
              tipoCedula = "Jurídica";
              break;
            case "03":
              tipoCedula = "DIMEX";
              break;
            case "04":
              tipoCedula = "NITE";
              break;
            case "##":
              tipoCedula = "Pasaporte";
              break;
          }
          
          return {
            _id: userChannel._id,
            userChannelId: userChannel._id,
            userId: userChannel.user,
            nombre: userInfo?.name || 'Sin nombre',
            tipoCedula: tipoCedula,
            cedula: userInfo?.ident || '',
            email: userInfo?.email || '',
            telefono: userInfo?.phone_code && userInfo?.phone ? `+${userInfo.phone_code} ${userInfo.phone}` : '',
            esAdmin: userChannel.is_admin || false,
            isActive: userChannel.isActive,
            createdAt: userChannel.createdAt,
            isAccepted: false
          }
        })
        
        setPendingMembers(pending)
      } else {
        console.error('Error al cargar miembros pendientes')
      }
    } catch (error: any) {
      console.error('Error loading pending members:', error)
    } finally {
      setLoading(false)
    }
  }, [channelId])

  const handleAcceptRequest = async (member: PendingMember) => {
    if (!member.userChannelId) return
    
    const confirmed = window.confirm(`¿Estás seguro de que deseas aceptar la solicitud de "${member.nombre}"?`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/user-channels?id=${member.userChannelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: true
        })
      })

      if (!response.ok) {
        throw new Error('Error en el servidor')
      }

      // Actualizar el estado local del miembro
      setPendingMembers(prev => 
        prev.map(m => 
          m._id === member._id 
            ? { ...m, isAccepted: true }
            : m
        )
      )

      alert('Solicitud aceptada exitosamente')

    } catch (error) {
      console.error('Error aceptando solicitud:', error)
      alert('Error al aceptar la solicitud')
    }
  }

  const renderTableHeader = () => {
    return (
      <thead>
        <tr>
          {PENDING_MEMBER_COLUMN_DEFINITIONS.map((column) => (
            <th key={column.systemName} className={styles.tableHeader}>
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
    )
  }

  const renderTableBody = () => {
    if (loading) {
      return (
        <tbody>
          <tr>
            <td colSpan={PENDING_MEMBER_COLUMN_DEFINITIONS.length} className={styles.loadingCell}>
              <div className={styles.loadingContent}>
                <div className={styles.spinner}></div>
                <span>Cargando solicitudes...</span>
              </div>
            </td>
          </tr>
        </tbody>
      )
    }

    if (pendingMembers.length === 0 && !loading) {
      return (
        <tbody>
          <tr>
            <td colSpan={PENDING_MEMBER_COLUMN_DEFINITIONS.length} className={styles.emptyCell}>
              <div className={styles.emptyContent}>
                <span>📋</span>
                <p>No hay solicitudes pendientes</p>
              </div>
            </td>
          </tr>
        </tbody>
      )
    }

    return (
      <tbody>
        {pendingMembers.map((member, index) => (
          <tr key={member._id || index} className={styles.tableRow}>
            {PENDING_MEMBER_COLUMN_DEFINITIONS.map((column) => (
              <td key={column.systemName} className={styles.tableCell}>
                {renderCellContent(member, column)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    )
  }

  const renderCellContent = (member: PendingMember, column: MemberColumnDefinition) => {
    const value = member[column.systemName as keyof PendingMember]
    
    // Columna de solicitud
    if (column.systemName === 'solicitud') {
      if (member.isAccepted) {
        return (
          <span className={styles.acceptedLabel}>
            ✅ Aceptada
          </span>
        )
      }
      
      return (
        <button 
          className={styles.acceptButton}
          onClick={() => handleAcceptRequest(member)}
        >
          ✅ Aceptar
        </button>
      )
    }

    // Columna de es admin con colores
    if (column.systemName === 'esAdmin') {
      const adminClass = value ? styles.roleAdmin : styles.roleMember
      
      return (
        <span className={adminClass}>
          {value ? 'Sí' : 'No'}
        </span>
      )
    }

    // Valor por defecto
    return value || '-'
  }

  useEffect(() => {
    if (isOpen) {
      loadPendingMembers()
    }
  }, [isOpen, loadPendingMembers])

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>⏳ Solicitudes Pendientes</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              {renderTableHeader()}
              {renderTableBody()}
            </table>
          </div>
        </div>

        <div className={styles.modalFooter}>
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

export default PendingMembersModal
