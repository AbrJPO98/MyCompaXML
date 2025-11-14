'use client'
import React, { useState, useEffect, useCallback } from 'react'
import DescripcionPersonalizadaFormModal from './DescripcionPersonalizadaFormModal'
import styles from './DescripcionesPersonalizadasModal.module.css'

interface DescripcionPersonalizada {
  _id: string
  codigo: string
  desc_pers: string
  desc_fact: string
  descripGasInv: string
  bienoserv: string
  categoria: string
  vidaUtil: string
  importado: string
  act_eco: string
  channel_id: string
}

interface DescripcionesPersonalizadasModalProps {
  channelId: string
  onClose: () => void
  onShowProgress?: (show: boolean, current: number, total: number, title: string) => void
}

const DescripcionesPersonalizadasModal: React.FC<DescripcionesPersonalizadasModalProps> = ({ 
  channelId, 
  onClose,
  onShowProgress
}) => {
  const [descripciones, setDescripciones] = useState<DescripcionPersonalizada[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingDescripcion, setEditingDescripcion] = useState<DescripcionPersonalizada | null>(null)

  const loadDescripciones = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/descripciones-personalizadas?channelId=${channelId}`)
      
      if (response.ok) {
        const data = await response.json()
        setDescripciones(data.descripciones || [])
      } else {
        console.error('Error loading descripciones:', response.status)
        setDescripciones([])
      }
    } catch (error) {
      console.error('Error loading descripciones:', error)
      setDescripciones([])
    } finally {
      setLoading(false)
    }
  }, [channelId])

  useEffect(() => {
    loadDescripciones()
  }, [loadDescripciones])

  const handleAddClick = () => {
    setEditingDescripcion(null)
    setShowFormModal(true)
  }

  const handleEditClick = (descripcion: DescripcionPersonalizada) => {
    setEditingDescripcion(descripcion)
    setShowFormModal(true)
  }

  const handleDeleteClick = async (descripcion: DescripcionPersonalizada) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la descripción personalizada para el código CABYS "${descripcion.codigo}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/descripciones-personalizadas?id=${descripcion._id}&channelId=${channelId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Descripción eliminada exitosamente')
        loadDescripciones()
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error || 'Error eliminando descripción'}`)
      }
    } catch (error) {
      console.error('Error deleting descripcion:', error)
      alert('Error de conexión al eliminar descripción')
    }
  }

  const handleFormClose = (saved?: boolean) => {
    setShowFormModal(false)
    setEditingDescripcion(null)
    
    if (saved) {
      loadDescripciones()
    }
  }

  // Filtrar descripciones basado en el término de búsqueda
  const filteredDescripciones = descripciones.filter(desc =>
    desc.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    desc.desc_pers.toLowerCase().includes(searchTerm.toLowerCase()) ||
    desc.desc_fact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    desc.descripGasInv.toLowerCase().includes(searchTerm.toLowerCase()) ||
    desc.bienoserv.toLowerCase().includes(searchTerm.toLowerCase()) ||
    desc.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    desc.act_eco.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <h2>📋 Descripciones personalizadas de CABYS</h2>
            <button 
              onClick={onClose}
              className={styles.closeButton}
            >
              ×
            </button>
          </div>

          <div className={styles.modalBody}>
            <div className={styles.controls}>
              <div className={styles.searchContainer}>
                <input
                  type="text"
                  placeholder="Buscar por código, descripción, categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              <button 
                onClick={handleAddClick}
                className={styles.addButton}
              >
                ➕ Agregar Nueva
              </button>
            </div>

            {loading ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Cargando descripciones personalizadas...</p>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>CABYS</th>
                      <th>Descripción personalizada</th>
                      <th>Descripción factura</th>
                      <th>Gasto o inventario</th>
                      <th>Bien o servicio</th>
                      <th>Categoría</th>
                      <th>Vida útil</th>
                      <th>Importado</th>
                      <th>Actividad económica</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDescripciones.length === 0 ? (
                      <tr>
                        <td colSpan={10} className={styles.noData}>
                          {searchTerm 
                            ? 'No se encontraron descripciones con ese criterio de búsqueda' 
                            : 'No hay descripciones personalizadas registradas'}
                        </td>
                      </tr>
                    ) : (
                      filteredDescripciones.map((desc) => (
                        <tr key={desc._id}>
                          <td>{desc.codigo}</td>
                          <td>{desc.desc_pers || '-'}</td>
                          <td>{desc.desc_fact || '-'}</td>
                          <td>{desc.descripGasInv || '-'}</td>
                          <td>{desc.bienoserv || '-'}</td>
                          <td>{desc.categoria || '-'}</td>
                          <td>{desc.vidaUtil || '-'}</td>
                          <td>{desc.importado || '-'}</td>
                          <td>{desc.act_eco || '-'}</td>
                          <td className={styles.actions}>
                            <button
                              onClick={() => handleEditClick(desc)}
                              className={styles.editButton}
                              title="Editar descripción"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteClick(desc)}
                              className={styles.deleteButton}
                              title="Eliminar descripción"
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

          <div className={styles.modalFooter}>
            <p className={styles.recordCount}>
              {filteredDescripciones.length} de {descripciones.length} descripciones
            </p>
          </div>
        </div>
      </div>

      {/* Modal de formulario para añadir/editar */}
      {showFormModal && (
        <DescripcionPersonalizadaFormModal
          descripcion={editingDescripcion}
          channelId={channelId}
          onClose={handleFormClose}
          onShowProgress={onShowProgress}
        />
      )}
    </>
  )
}

export default DescripcionesPersonalizadasModal

