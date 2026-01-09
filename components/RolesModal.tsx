'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import styles from './RolesModal.module.css'

const PERMISSIONS = [
  'Usuarios',
  'Roles',
  'Canal',
  'Actividades económicas',
  'Sucursales',
  'Inventario',
  'Gestor de facturas',
  'Contabilidad',
  'Clientes',
  'Facturador'
] as const

type PermissionName = (typeof PERMISSIONS)[number]

interface Role {
  _id: string
  nombre: string
  permisos?: Array<{ nombre: PermissionName }>
  deletable?: boolean
  channel_id: string
}

interface RolesModalProps {
  isOpen: boolean
  onClose: () => void
  channelId: string
  onRolesChanged?: () => void
}

function makeNoStoreFetchOptions() {
  return {
    cache: 'no-store' as const,
    headers: {
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache'
    }
  }
}

export default function RolesModal({ isOpen, onClose, channelId, onRolesChanged }: RolesModalProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [selectedPerms, setSelectedPerms] = useState<Record<PermissionName, boolean>>(() => {
    const init: any = {}
    PERMISSIONS.forEach((p) => (init[p] = false))
    return init
  })

  const selectedPermNames = useMemo(() => {
    return PERMISSIONS.filter((p) => selectedPerms[p])
  }, [selectedPerms])

  const resetForm = useCallback(() => {
    setEditingRoleId(null)
    setNombre('')
    setSelectedPerms(() => {
      const init: any = {}
      PERMISSIONS.forEach((p) => (init[p] = false))
      return init
    })
  }, [])

  const loadRoles = useCallback(async () => {
    if (!channelId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/roles?channelId=${channelId}`, makeNoStoreFetchOptions())
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error cargando roles')
      }
      setRoles(Array.isArray(data.data) ? data.data : [])
    } catch (e: any) {
      setError(e?.message || 'Error cargando roles')
      setRoles([])
    } finally {
      setLoading(false)
    }
  }, [channelId])

  useEffect(() => {
    if (isOpen) {
      loadRoles()
      resetForm()
    }
  }, [isOpen, loadRoles, resetForm])

  const startEdit = (role: Role) => {
    setEditingRoleId(role._id)
    setNombre(role.nombre || '')
    const map: any = {}
    PERMISSIONS.forEach((p) => (map[p] = false))
    ;(role.permisos || []).forEach((p) => {
      if (p?.nombre && PERMISSIONS.includes(p.nombre)) map[p.nombre] = true
    })
    setSelectedPerms(map)
  }

  const togglePerm = (p: PermissionName) => {
    setSelectedPerms((prev) => ({ ...prev, [p]: !prev[p] }))
  }

  const saveRole = async () => {
    if (!nombre.trim()) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        nombre: nombre.trim(),
        permisos: selectedPermNames,
        channel_id: channelId
      }

      const res = editingRoleId
        ? await fetch(`/api/roles/${editingRoleId}`, {
            method: 'PUT',
            ...makeNoStoreFetchOptions(),
            headers: {
              ...makeNoStoreFetchOptions().headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          })
        : await fetch(`/api/roles`, {
            method: 'POST',
            ...makeNoStoreFetchOptions(),
            headers: {
              ...makeNoStoreFetchOptions().headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error guardando rol')
      }

      await loadRoles()
      resetForm()
      onRolesChanged?.()
    } catch (e: any) {
      setError(e?.message || 'Error guardando rol')
    } finally {
      setSaving(false)
    }
  }

  const deleteRole = async (role: Role) => {
    const confirmed = window.confirm(`¿Eliminar el rol "${role.nombre}"?`)
    if (!confirmed) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/roles/${role._id}`, { method: 'DELETE', ...makeNoStoreFetchOptions() })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error eliminando rol')
      }
      await loadRoles()
      onRolesChanged?.()
    } catch (e: any) {
      setError(e?.message || 'Error eliminando rol')
    } finally {
      setSaving(false)
    }
  }

  const close = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div className={`${styles.backdrop} modal-backdrop fade show`} onClick={close} />
      <div className={`${styles.modal} modal fade show d-block`} role="dialog" aria-modal="true" onClick={close}>
        <div className={`${styles.dialog} modal-dialog modal-dialog-centered modal-lg`} onClick={(e) => e.stopPropagation()}>
          <div className={`${styles.content} modal-content`}>
            <div className={styles.header}>
              <h3 className={styles.title}>Roles</h3>
              <button type="button" className={styles.closeButton} onClick={close}>
                ×
              </button>
            </div>

            <div className={styles.body}>
              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.form}>
                <div className={styles.formRow}>
                  <label className={styles.label}>Nombre</label>
                  <input className={styles.input} value={nombre} onChange={(e) => setNombre(e.target.value)} />
                </div>

                <div className={styles.permsGrid}>
                  {PERMISSIONS.map((p) => (
                    <label key={p} className={styles.checkboxLabel}>
                      <input type="checkbox" checked={selectedPerms[p]} onChange={() => togglePerm(p)} />
                      <span>{p}</span>
                    </label>
                  ))}
                </div>

                <div className={styles.actions}>
                  <button type="button" className={styles.primaryButton} onClick={saveRole} disabled={saving || !nombre.trim()}>
                    {editingRoleId ? 'Guardar cambios' : 'Crear rol'}
                  </button>
                  <button type="button" className={styles.secondaryButton} onClick={resetForm} disabled={saving}>
                    Limpiar
                  </button>
                </div>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Permisos</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={3} className={styles.muted}>
                          Cargando...
                        </td>
                      </tr>
                    ) : roles.length === 0 ? (
                      <tr>
                        <td colSpan={3} className={styles.muted}>
                          No hay roles
                        </td>
                      </tr>
                    ) : (
                      roles.map((r) => (
                        <tr key={r._id}>
                          <td>{r.nombre}</td>
                          <td className={styles.permsCell}>
                            {(r.permisos || []).length > 0 ? (r.permisos || []).map((p) => p.nombre).join(', ') : '-'}
                          </td>
                          <td className={styles.actionsCell}>
                            <button type="button" className={styles.smallButton} onClick={() => startEdit(r)} disabled={saving}>
                              Editar
                            </button>
                            <button
                              type="button"
                              className={styles.dangerButton}
                              onClick={() => deleteRole(r)}
                              disabled={saving || r.deletable === false}
                              title={r.deletable === false ? 'Este rol no se puede eliminar' : 'Eliminar'}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.footer}>
              <button type="button" className={styles.secondaryButton} onClick={close}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


