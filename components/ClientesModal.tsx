'use client'
import React, { useState, useEffect, useCallback } from 'react'
import ClienteFormModal from './ClienteFormModal'
import styles from './ClientesModal.module.css'

interface Ubicaciones {
  provincias: {
    [key: string]: {
      nombre: string
      cantones: {
        [key: string]: {
          nombre: string
          distritos: {
            [key: string]: string
          }
        }
      }
    }
  }
}

interface Cliente {
  _id: string
  ident: string
  type_ident: string
  ident_extranjero?: string
  name: string
  email?: string
  name_commercial?: string
  country_code?: string
  phone?: string
  province?: string
  canton?: string
  district?: string
  address?: string
  address_extranjero?: string
  createdAt: string
  updatedAt: string
}

interface ClientesModalProps {
  isOpen: boolean
  onClose: () => void
  channelId?: string
}

const ClientesModal: React.FC<ClientesModalProps> = ({ isOpen, onClose, channelId }) => {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showClienteForm, setShowClienteForm] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [ubicaciones, setUbicaciones] = useState<Ubicaciones | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // Cargar datos de ubicaciones de Costa Rica
  const loadUbicaciones = useCallback(async () => {
    try {
      const response = await fetch('/CR_ubicaciones.json')
      if (response.ok) {
        const data = await response.json()
        setUbicaciones(data)
      }
    } catch (error) {
      console.error('Error loading ubicaciones:', error)
    }
  }, [])

  // Construir dirección completa basada en los códigos
  const buildDireccion = (cliente: Cliente): string => {
    if (!ubicaciones || !cliente.province) return cliente.address || '-'
    
    const provincia = ubicaciones.provincias[cliente.province]
    if (!provincia) return cliente.address || '-'
    
    let direccion = provincia.nombre
    
    if (cliente.canton) {
      const canton = provincia.cantones[cliente.canton]
      if (canton) {
        direccion += `, ${canton.nombre}`
        
        if (cliente.district) {
          const distrito = canton.distritos[cliente.district]
          if (distrito) {
            direccion += `, ${distrito}`
          }
        }
      }
    }
    
    if (cliente.address) {
      direccion += `, ${cliente.address}`
    }
    
    return direccion
  }

  const loadClientes = useCallback(async (page: number = 1, search: string = '') => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      })
      
      if (search.trim()) {
        params.append('search', search.trim())
      }

      const response = await fetch(`/api/clientes?${params}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setClientes(data.data)
        setPagination(data.pagination)
      } else {
        setError(data.message || 'Error al cargar clientes')
      }
    } catch (error) {
      console.error('Error loading clientes:', error)
      setError('Error de conexión al cargar clientes')
    } finally {
      setLoading(false)
    }
  }, [pagination.limit])

  useEffect(() => {
    if (isOpen) {
      loadUbicaciones()
      loadClientes(1, searchTerm)
    }
  }, [isOpen, loadUbicaciones, loadClientes, searchTerm])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadClientes(1, searchTerm)
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setShowClienteForm(true)
  }

  const handleDelete = async (cliente: Cliente) => {
    const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar al cliente "${cliente.name}"?`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/clientes?id=${cliente._id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert('Cliente eliminado exitosamente')
        loadClientes(pagination.page, searchTerm)
      } else {
        alert(data.message || 'Error al eliminar cliente')
      }
    } catch (error) {
      console.error('Error deleting cliente:', error)
      alert('Error de conexión al eliminar cliente')
    }
  }

  const handleAddNew = () => {
    setEditingCliente(null)
    setShowClienteForm(true)
  }

  const handleFormClose = () => {
    setShowClienteForm(false)
    setEditingCliente(null)
    loadClientes(pagination.page, searchTerm)
  }

  const getTipoIdentText = (type: string) => {
    switch (type) {
      case '01': return 'Física'
      case '02': return 'Jurídica'
      case '03': return 'DIMEX'
      case '04': return 'NITE'
      default: return type
    }
  }

  const handlePageChange = (newPage: number) => {
    loadClientes(newPage, searchTerm)
  }

  if (!isOpen) return null

  return (
    <>
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <h2>👥 Gestión de Clientes</h2>
            <button onClick={onClose} className={styles.closeButton}>
              ✕
            </button>
          </div>

          <div className={styles.modalBody}>
            {/* Barra de búsqueda y botón agregar */}
            <div className={styles.toolbar}>
              <form onSubmit={handleSearch} className={styles.searchForm}>
                <input
                  type="text"
                  placeholder="Buscar por nombre, identificación o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
                <button type="submit" className={styles.searchButton}>
                  🔍 Buscar
                </button>
              </form>
              <button onClick={handleAddNew} className={styles.addButton}>
                ➕ Agregar Cliente
              </button>
            </div>

            {/* Tabla de clientes */}
            {loading ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Cargando clientes...</p>
              </div>
            ) : error ? (
              <div className={styles.error}>
                <p>❌ {error}</p>
                <button onClick={() => loadClientes(pagination.page, searchTerm)} className={styles.retryButton}>
                  🔄 Reintentar
                </button>
              </div>
            ) : (
              <>
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Identificación</th>
                        <th>Tipo</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Dirección</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientes.length === 0 ? (
                        <tr>
                          <td colSpan={7} className={styles.noData}>
                            No se encontraron clientes
                          </td>
                        </tr>
                      ) : (
                        clientes.map((cliente) => (
                          <tr key={cliente._id}>
                            <td>{cliente.ident}</td>
                            <td>
                              <span className={styles.typeTag}>
                                {getTipoIdentText(cliente.type_ident)}
                              </span>
                            </td>
                            <td>
                              <div>
                                <div className={styles.clientName}>{cliente.name}</div>
                                {cliente.name_commercial && (
                                  <div className={styles.commercialName}>
                                    {cliente.name_commercial}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>{cliente.email || '-'}</td>
                            <td>
                              {cliente.phone ? (
                                <span>
                                  {cliente.country_code} {cliente.phone}
                                </span>
                              ) : '-'}
                            </td>
                            <td>
                              <div className={styles.direccion}>
                                {buildDireccion(cliente)}
                              </div>
                            </td>
                            <td>
                              <div className={styles.actions}>
                                <button
                                  onClick={() => handleEdit(cliente)}
                                  className={styles.editButton}
                                  title="Editar cliente"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDelete(cliente)}
                                  className={styles.deleteButton}
                                  title="Eliminar cliente"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                {pagination.pages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={styles.pageButton}
                    >
                      ← Anterior
                    </button>
                    
                    <span className={styles.pageInfo}>
                      Página {pagination.page} de {pagination.pages} 
                      ({pagination.total} clientes)
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className={styles.pageButton}
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de formulario de cliente */}
      {showClienteForm && (
        <ClienteFormModal
          isOpen={showClienteForm}
          onClose={handleFormClose}
          cliente={editingCliente}
          onSave={handleFormClose}
          channelId={channelId}
        />
      )}
    </>
  )
}

export default ClientesModal
