'use client'
import React, { useState, useEffect, useCallback } from 'react'
import styles from './ChannelMembersTable.module.css'
import PendingMembersModal from './PendingMembersModal'

// Definición de columnas para la tabla de miembros
export interface MemberColumnDefinition {
  header: string
  systemName: string
  visible: boolean
}

export const MEMBER_COLUMN_DEFINITIONS: MemberColumnDefinition[] = [
  { header: "Nombre", systemName: "nombre", visible: true },
  { header: "Tipo de cédula", systemName: "tipoCedula", visible: true },
  { header: "Cédula", systemName: "cedula", visible: true },
  { header: "Correo electrónico", systemName: "email", visible: true },
  { header: "Número de teléfono", systemName: "telefono", visible: true },
  { header: "¿Es admin?", systemName: "esAdmin", visible: true },
  { header: "Eliminar", systemName: "eliminar", visible: true }
]

export const PENDING_MEMBER_COLUMN_DEFINITIONS: MemberColumnDefinition[] = [
  { header: "Nombre", systemName: "nombre", visible: true },
  { header: "Tipo de cédula", systemName: "tipoCedula", visible: true },
  { header: "Cédula", systemName: "cedula", visible: true },
  { header: "Correo electrónico", systemName: "email", visible: true },
  { header: "Número de teléfono", systemName: "telefono", visible: true },
  { header: "Solicitud", systemName: "solicitud", visible: true }
]

interface ChannelMembersTableProps {
  channelId: string
}

export default function ChannelMembersTable({ channelId }: ChannelMembersTableProps) {
  const [columns, setColumns] = useState<MemberColumnDefinition[]>(MEMBER_COLUMN_DEFINITIONS)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [pendingCount, setPendingCount] = useState<number>(0)

  // Obtener columnas visibles
  const visibleColumns = columns.filter(col => col.visible)

  const loadMembers = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/user-channels?channelId=${channelId}`)
      if (response.ok) {
        const data = await response.json()
        const userChannels = Array.isArray(data.data) ? data.data : []
        
        // Procesar los datos que ya vienen con la información del usuario
        const members = userChannels
          .filter((userChannel: any) => userChannel.isActive) // Solo miembros activos
          .map((userChannel: any) => {
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
              createdAt: userChannel.createdAt
            }
          })
        
        setMembers(members)
      } else {
        setError('Error al cargar los miembros del canal')
      }
    } catch (error: any) {
      console.error('Error loading members:', error)
      setError(error.message || 'Error cargando miembros del canal')
    } finally {
      setLoading(false)
    }
  }, [channelId])

  const loadPendingCount = useCallback(async () => {
    try {
      const response = await fetch(`/api/user-channels/pending-count?channelId=${channelId}`)
      if (response.ok) {
        const data = await response.json()
        setPendingCount(data.count || 0)
      } else {
        console.error('Error loading pending count')
        setPendingCount(0)
      }
    } catch (error: any) {
      console.error('Error loading pending count:', error)
      setPendingCount(0)
    }
  }, [channelId])


  useEffect(() => {
    loadMembers()
    loadPendingCount()
  }, [loadMembers, loadPendingCount])

  const renderTableHeader = () => {
    return (
      <thead>
        <tr>
          {visibleColumns.map((column) => (
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
            <td colSpan={visibleColumns.length} className={styles.loadingCell}>
              <div className={styles.loadingContent}>
                <div className={styles.spinner}></div>
                <span>Cargando miembros...</span>
              </div>
            </td>
          </tr>
        </tbody>
      )
    }

    if (error) {
      return (
        <tbody>
          <tr>
            <td colSpan={visibleColumns.length} className={styles.errorCell}>
              <div className={styles.errorContent}>
                <span>❌</span>
                <p>{error}</p>
              </div>
            </td>
          </tr>
        </tbody>
      )
    }

    if (members.length === 0 && !loading) {
      return (
        <tbody>
          <tr>
            <td colSpan={visibleColumns.length} className={styles.emptyCell}>
              <div className={styles.emptyContent}>
                <span>👥</span>
                <p>No hay miembros activos en este canal</p>
              </div>
            </td>
          </tr>
        </tbody>
      )
    }

    return (
      <tbody>
        {members.map((member, index) => (
          <tr key={member._id || index} className={styles.tableRow}>
            {visibleColumns.map((column) => (
              <td key={column.systemName} className={styles.tableCell}>
                {renderCellContent(member, column)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    )
  }

  const renderCellContent = (member: any, column: MemberColumnDefinition) => {
    const value = member[column.systemName]
    
    // Columna de eliminar
    if (column.systemName === 'eliminar') {
      return (
        <button 
          className={styles.actionButton} 
          title="Eliminar miembro"
          onClick={() => handleDeleteMember(member)}
        >
          🗑️
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

  const handleEditMember = (member: any) => {
    // Implementar lógica para editar miembro
    console.log('Editar miembro:', member)
  }

  const handleDeleteMember = async (member: any) => {
    if (!member.userChannelId) return
    
    const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar al miembro "${member.nombre}" del canal?`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/user-channels?id=${member.userChannelId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error en el servidor')
      }

      // Remover de la tabla
      setMembers(prev => prev.filter(m => m._id !== member._id))
      alert('Miembro eliminado exitosamente del canal')

    } catch (error) {
      console.error('Error eliminando miembro:', error)
      alert('Error al eliminar el miembro del canal')
    }
  }

  const handleAddMember = () => {
    // Implementar lógica para agregar miembro
    console.log('Agregar nuevo miembro')
  }


  const handleClosePendingModal = () => {
    setShowPendingModal(false)
    // Recargar la tabla principal y el contador de pendientes
    loadMembers()
    loadPendingCount()
  }


  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>👥 Miembros del Canal</h2>
          <span className={styles.recordCount}>
            {loading ? 'Cargando...' : `${members.length} miembros`}
          </span>
        </div>
        <div className={styles.headerRight}>
          <button 
            className={styles.pendingButton}
            onClick={() => setShowPendingModal(true)}
          >
            ⏳ Pendientes {pendingCount > 0 && `(${pendingCount})`}
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          {renderTableHeader()}
          {renderTableBody()}
        </table>
      </div>

      {/* Modal personalizado para miembros pendientes */}
      <PendingMembersModal
        isOpen={showPendingModal}
        onClose={handleClosePendingModal}
        channelId={channelId}
      />
    </div>
  )
}
