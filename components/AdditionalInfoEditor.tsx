import React, { useCallback, useMemo, useState } from 'react'
import styles from './AdditionalInfoEditor.module.css'

export type AdditionalInfoNode =
  | {
      id: string
      type: 'field'
      name: string // nombre original (sin normalizar)
      key: string // nombre convertido (PascalCase)
      value: string
    }
  | {
      id: string
      type: 'group'
      name: string // nombre original (sin normalizar)
      key: string // nombre convertido (PascalCase)
      children: AdditionalInfoNode[]
    }

export function normalizeAdditionalName(input: string): string {
  // Eliminar tildes/diacríticos, símbolos especiales y espacios, y poner en PascalCase
  const cleaned = (input || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // diacríticos
    .replace(/[^0-9a-zA-Z\s]+/g, ' ') // símbolos -> espacios
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned) return ''

  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
}

function makeId(): string {
  // crypto.randomUUID() está disponible en la mayoría de navegadores modernos
  // fallback simple si no existe.
  const anyCrypto = (globalThis as any).crypto
  if (anyCrypto?.randomUUID) return anyCrypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function deleteNodeById(nodes: AdditionalInfoNode[], id: string): AdditionalInfoNode[] {
  const filtered = nodes.filter((n) => n.id !== id)
  return filtered.map((n) => {
    if (n.type === 'group') return { ...n, children: deleteNodeById(n.children, id) }
    return n
  })
}

function getNodesAtPath(nodes: AdditionalInfoNode[], path: string[]): AdditionalInfoNode[] {
  let current: AdditionalInfoNode[] = nodes
  for (const id of path) {
    const found = current.find((n) => n.id === id && n.type === 'group') as
      | Extract<AdditionalInfoNode, { type: 'group' }>
      | undefined
    if (!found) return current
    current = found.children
  }
  return current
}

function updateNodesAtPath(
  nodes: AdditionalInfoNode[],
  path: string[],
  updater: (current: AdditionalInfoNode[]) => AdditionalInfoNode[]
): AdditionalInfoNode[] {
  if (path.length === 0) return updater(nodes)
  const [head, ...rest] = path
  return nodes.map((n) => {
    if (n.type === 'group' && n.id === head) {
      return { ...n, children: updateNodesAtPath(n.children, rest, updater) }
    }
    return n
  })
}

interface AdditionalInfoEditorProps {
  value: AdditionalInfoNode[]
  onChange: (next: AdditionalInfoNode[]) => void
}

export default function AdditionalInfoEditor({ value, onChange }: AdditionalInfoEditorProps) {
  const [path, setPath] = useState<string[]>([])

  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldValue, setNewFieldValue] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [creatingType, setCreatingType] = useState<'field' | 'group' | null>(null)

  const normalizedNewFieldName = useMemo(() => normalizeAdditionalName(newFieldName), [newFieldName])
  const normalizedNewGroupName = useMemo(
    () => normalizeAdditionalName(newGroupName),
    [newGroupName]
  )

  const currentNodes = useMemo(() => getNodesAtPath(value || [], path), [path, value])

  const addFieldHere = useCallback(() => {
    const key = normalizedNewFieldName
    const name = (newFieldName || '').trim()
    if (!key || !name) return
    const node: AdditionalInfoNode = {
      id: makeId(),
      type: 'field',
      name,
      key,
      value: newFieldValue || ''
    }
    const next = updateNodesAtPath(value || [], path, (list) => [...list, node])
    onChange(next)
    setNewFieldName('')
    setNewFieldValue('')
    setCreatingType(null)
  }, [newFieldName, newFieldValue, normalizedNewFieldName, onChange, path, value])

  const addGroupHere = useCallback(() => {
    const key = normalizedNewGroupName
    const name = (newGroupName || '').trim()
    if (!key || !name) return
    const node: AdditionalInfoNode = { id: makeId(), type: 'group', name, key, children: [] }
    const next = updateNodesAtPath(value || [], path, (list) => [...list, node])
    onChange(next)
    setNewGroupName('')
    setCreatingType(null)
  }, [newGroupName, normalizedNewGroupName, onChange, path, value])

  const onUpdateField = useCallback(
    (id: string, patch: Partial<Extract<AdditionalInfoNode, { type: 'field' }>>) => {
      const next = updateNodesAtPath(value || [], [], (all) => {
        const walk = (nodes: AdditionalInfoNode[]): AdditionalInfoNode[] =>
          nodes.map((n) => {
            if (n.id === id && n.type === 'field') return { ...n, ...patch }
            if (n.type === 'group') return { ...n, children: walk(n.children) }
            return n
          })
        return walk(all)
      })
      onChange(next)
    },
    [onChange, value]
  )

  const onUpdateGroup = useCallback(
    (id: string, patch: Partial<Extract<AdditionalInfoNode, { type: 'group' }>>) => {
      const next = updateNodesAtPath(value || [], [], (all) => {
        const walk = (nodes: AdditionalInfoNode[]): AdditionalInfoNode[] =>
          nodes.map((n) => {
            if (n.id === id && n.type === 'group') return { ...n, ...patch }
            if (n.type === 'group') return { ...n, children: walk(n.children) }
            return n
          })
        return walk(all)
      })
      onChange(next)
    },
    [onChange, value]
  )

  const enterGroup = useCallback(
    (groupId: string) => {
      setPath((p) => [...p, groupId])
    },
    [setPath]
  )

  const goBack = useCallback(() => {
    setPath((p) => p.slice(0, -1))
  }, [])

  const onDelete = useCallback(
    (id: string) => {
      onChange(deleteNodeById(value || [], id))
    },
    [onChange, value]
  )

  return (
    <div className={styles.wrapper}>
      <div className={styles.navRow}>
        <div className={styles.navLeft}>
          {path.length > 0 && (
            <button type="button" className={styles.smallButton} onClick={goBack}>
              ← Retroceder de nivel
            </button>
          )}
          <div className={styles.breadcrumb}>
            Nivel: <strong>{path.length}</strong>
          </div>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Nombre</th>
              <th>Texto convertido</th>
              <th>Contenido</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentNodes.map((n) => {
                const keyPreview = n.key || normalizeAdditionalName(n.name)
                if (n.type === 'group') {
                  return (
                    <tr key={n.id}>
                      <td>Grupo</td>
                      <td>
                        <input
                          className={styles.tableInput}
                          value={n.name}
                          onChange={(e) =>
                            onUpdateGroup(n.id, {
                              name: e.target.value,
                              key: normalizeAdditionalName(e.target.value)
                            })
                          }
                          placeholder="Nombre del grupo"
                        />
                      </td>
                      <td className={styles.mono}>{keyPreview || '-'}</td>
                      <td className={styles.muted}>—</td>
                      <td className={styles.actionsCell}>
                        <button
                          type="button"
                          className={styles.smallButton}
                          onClick={() => enterGroup(n.id)}
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          className={styles.dangerButton}
                          onClick={() => onDelete(n.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={n.id}>
                    <td>Dato</td>
                    <td>
                      <input
                        className={styles.tableInput}
                        value={n.name}
                        onChange={(e) =>
                          onUpdateField(n.id, {
                            name: e.target.value,
                            key: normalizeAdditionalName(e.target.value)
                          })
                        }
                        placeholder="Nombre del dato"
                      />
                    </td>
                    <td className={styles.mono}>{keyPreview || '-'}</td>
                    <td>
                      <input
                        className={styles.tableInput}
                        value={n.value}
                        onChange={(e) => onUpdateField(n.id, { value: e.target.value })}
                        placeholder="Letras o números"
                      />
                    </td>
                    <td className={styles.actionsCell}>
                      <button
                        type="button"
                        className={styles.dangerButton}
                        onClick={() => onDelete(n.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                )
              })}
            
            {/* Fila para crear nuevo elemento */}
            {creatingType === null ? (
              <tr className={styles.createRow}>
                <td colSpan={5} className={styles.createCell}>
                  <button
                    type="button"
                    className={styles.createButton}
                    onClick={() => setCreatingType('field')}
                  >
                    + Crear dato
                  </button>
                  <button
                    type="button"
                    className={styles.createButton}
                    onClick={() => setCreatingType('group')}
                  >
                    + Crear grupo
                  </button>
                </td>
              </tr>
            ) : creatingType === 'field' ? (
              <tr className={styles.createRow}>
                <td>Dato</td>
                <td>
                  <input
                    className={styles.tableInput}
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="Nombre del dato"
                    autoFocus
                  />
                </td>
                <td className={styles.mono}>{normalizedNewFieldName || '-'}</td>
                <td>
                  <input
                    className={styles.tableInput}
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    placeholder="Letras o números"
                  />
                </td>
                <td className={styles.actionsCell}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={addFieldHere}
                    disabled={!normalizedNewFieldName || !newFieldName.trim()}
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    className={styles.smallButton}
                    onClick={() => {
                      setCreatingType(null)
                      setNewFieldName('')
                      setNewFieldValue('')
                    }}
                  >
                    Cancelar
                  </button>
                </td>
              </tr>
            ) : (
              <tr className={styles.createRow}>
                <td>Grupo</td>
                <td>
                  <input
                    className={styles.tableInput}
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Nombre del grupo"
                    autoFocus
                  />
                </td>
                <td className={styles.mono}>{normalizedNewGroupName || '-'}</td>
                <td className={styles.muted}>—</td>
                <td className={styles.actionsCell}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={addGroupHere}
                    disabled={!normalizedNewGroupName || !newGroupName.trim()}
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    className={styles.smallButton}
                    onClick={() => {
                      setCreatingType(null)
                      setNewGroupName('')
                    }}
                  >
                    Cancelar
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


