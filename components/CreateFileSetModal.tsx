'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { generateCategorizacion } from '@/lib/categorization'
import ProgressBar from './ProgressBar'
import styles from './CreateFileSetModal.module.css'

interface BillFile {
  _id: string
  clave: string
  path: string
  xml: string
}

interface CategorizacionIssue {
  cabys: string
  desc_fact: string
  missingFields: string[]
}

interface BillIssue {
  clave: string
  path: string
  issues: CategorizacionIssue[]
}

interface CreateFileSetModalProps {
  isOpen: boolean
  onClose: () => void
  channelId: string
  onBillsRemoved?: (claves: string[]) => void
}

const CreateFileSetModal: React.FC<CreateFileSetModalProps> = ({
  isOpen,
  onClose,
  channelId,
  onBillsRemoved
}) => {
  const [bills, setBills] = useState<BillFile[]>([])
  const [selectedBills, setSelectedBills] = useState<Set<string>>(new Set())
  const [setName, setSetName] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationIssues, setValidationIssues] = useState<BillIssue[]>([])
  const [selectedErrorDetails, setSelectedErrorDetails] = useState<string>('')
  const [errorsExpanded, setErrorsExpanded] = useState<boolean>(false)
  const [showProgress, setShowProgress] = useState(false)
  const [progressCurrent, setProgressCurrent] = useState(0)
  const [progressTotal, setProgressTotal] = useState(0)
  const [progressTitle, setProgressTitle] = useState('Categorizando facturas seleccionadas...')

  // Función para decodificar Base64 a texto
  const fromBase64 = (str: string) => {
    try {
      return decodeURIComponent(escape(window.atob(str)))
    } catch {
      return atob(str) // Fallback
    }
  }

  const loadBills = useCallback(async () => {
    if (!channelId || !isOpen) return

    setLoading(true)
    setError(null)

    try {
      console.log('Cargando facturas para channelId:', channelId)
      const response = await fetch(`/api/facturas?channelId=${channelId}`)
      const result = await response.json()
      console.log('Respuesta API facturas:', result)

      if (result.success) {
        console.log('Facturas cargadas:', result.data?.length || 0)
        setBills(result.data || [])
      } else {
        console.error('Error en respuesta API:', result.error)
        setError(result.error || 'Error al cargar facturas')
      }
    } catch (error) {
      console.error('Error al cargar facturas:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [channelId, isOpen])

  useEffect(() => {
    if (isOpen) {
      loadBills()
      setSelectedBills(new Set())
      setSetName('')
      setError(null)
    }
  }, [isOpen, loadBills])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBills(new Set(bills.map(bill => bill._id)))
    } else {
      setSelectedBills(new Set())
    }
  }

  const handleSelectBill = (billId: string, checked: boolean) => {
    const newSelected = new Set(selectedBills)
    if (checked) {
      newSelected.add(billId)
    } else {
      newSelected.delete(billId)
    }
    setSelectedBills(newSelected)
  }

  const handleCreateSet = async () => {
    if (!setName.trim()) {
      setError('El nombre del conjunto es requerido')
      return
    }

    if (selectedBills.size === 0) {
      setError('Debe seleccionar al menos una factura')
      return
    }

    setSaving(true)
    setError(null)
    setValidationIssues([])

    try {
      // Preparar las facturas seleccionadas
      const selectedBillsList = bills.filter(bill => selectedBills.has(bill._id))

      // Configurar barra de progreso
      setProgressTitle('Categorizando facturas seleccionadas...')
      setProgressTotal(selectedBillsList.length)
      setProgressCurrent(0)
      setShowProgress(true)

      // Para cada factura seleccionada:
      // 1. Obtenerla desde la base de datos usando clave + channelId
      // 2. Generar la categorización a partir de su XML
      // 3. Actualizar Factura.categorizacion en la BD
      // 4. Construir el objeto de archivo con su categorización para guardarlo en la colección de Categorizacion
      const archivosConCategorizacion = []
      const validationIssuesLocal: BillIssue[] = []
      const clavesCategorizadasExitosamente: string[] = [] // Rastrear facturas categorizadas exitosamente

      for (let index = 0; index < selectedBillsList.length; index++) {
        const bill = selectedBillsList[index]
        try {
          // Paso 1: obtener la factura completa desde la base de datos
          const facturaResponse = await fetch(`/api/facturas?channelId=${channelId}&clave=${encodeURIComponent(bill.clave)}`)
          if (!facturaResponse.ok) {
            throw new Error('Error al obtener la factura desde la base de datos')
          }

          const facturaData = await facturaResponse.json()

          if (!facturaData.success || !facturaData.factura || !facturaData.factura.xml) {
            throw new Error('No se encontró el XML de la factura en la base de datos')
          }

          // Paso 2: decodificar XML de Base64 y generar categorización
          const xmlString = fromBase64(facturaData.factura.xml)

          if (!xmlString) {
            throw new Error('No se pudo decodificar el XML de la factura')
          }

          const categorizacion = await generateCategorizacion(xmlString, channelId)

          // Validar que los campos críticos de cada item de categorización no estén vacíos
          let hasDefects = false
          const issuesForBill: CategorizacionIssue[] = []
          const fieldsToCheck = ['bienoserv', 'descripGasInv', 'categoria', 'actEconomica', 'vidaUtil', 'importado']

          if (!Array.isArray(categorizacion) || categorizacion.length === 0) {
            // Si no se generó ninguna categorización, considerarlo como defecto completo
            hasDefects = true
            issuesForBill.push({
              cabys: '',
              desc_fact: '',
              missingFields: [...fieldsToCheck]
            })
          } else {
            categorizacion.forEach((item: any) => {
              const missingFields: string[] = []

              fieldsToCheck.forEach((field) => {
                const value = item?.[field]
                if (!value || String(value).trim() === '') {
                  missingFields.push(field)
                }
              })

              if (missingFields.length > 0) {
                hasDefects = true
                issuesForBill.push({
                  cabys: item?.cabys || '',
                  desc_fact: item?.desc_fact || '',
                  missingFields
                })
              }
            })
          }

          // Si hay defectos, NO guardar categorización en la BD para esta factura
          // y registrar los problemas para mostrarlos al usuario
          if (hasDefects) {
            validationIssuesLocal.push({
              clave: bill.clave,
              path: bill.path,
              issues: issuesForBill
            })

            archivosConCategorizacion.push({
              clave: bill.clave,
              nombre: bill.path,
              xml: facturaData.factura.xml,
              categorizacion: []
            })
          } else {
            // Paso 3: actualizar categorización en la colección de facturas
            if (categorizacion && Array.isArray(categorizacion) && categorizacion.length > 0) {
              try {
                const updateResponse = await fetch('/api/facturas/categorizar', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    clave: bill.clave,
                    channelId: channelId,
                    categorizacion: categorizacion
                  })
                })

                if (!updateResponse.ok) {
                  console.error(`Error actualizando categorización para factura ${bill.clave}`)
                }
              } catch (updateError) {
                console.error(`Error llamando a /api/facturas/categorizar para factura ${bill.clave}:`, updateError)
              }
            }

            // Paso 4: agregar al arreglo de archivos de la categorización
            archivosConCategorizacion.push({
              clave: bill.clave,
              nombre: bill.path,
              xml: facturaData.factura.xml,
              categorizacion: Array.isArray(categorizacion) ? categorizacion : []
            })
            
            // Registrar que esta factura fue categorizada exitosamente
            clavesCategorizadasExitosamente.push(bill.clave)
          }

        } catch (billError) {
          console.error(`Error procesando factura ${bill.clave} para la categorización:`, billError)

          // Aún así, guardar el archivo en el conjunto, aunque sin categorización
          archivosConCategorizacion.push({
            clave: bill.clave,
            nombre: bill.path,
            xml: bill.xml,
            categorizacion: []
          })
        }

        // Actualizar progreso después de procesar cada factura
        setProgressCurrent(index + 1)
      }

      // Si hubo problemas de validación, no guardar la categorización en BD
      if (validationIssuesLocal.length > 0) {
        setValidationIssues(validationIssuesLocal)
        return;
      }

      // Crear el registro de categorización (antes Conjunto de archivos)
      const response = await fetch('/api/conjunto-archivos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: setName.trim(),
          archivos: archivosConCategorizacion,
          channel_id: channelId
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Eliminar solo las facturas que fueron categorizadas exitosamente
        const clavesAEliminar = clavesCategorizadasExitosamente
        let eliminadasExitosas = 0
        let eliminadasConError = 0

        // Eliminar cada factura de la base de datos
        for (const clave of clavesAEliminar) {
          try {
            const deleteResponse = await fetch(`/api/facturas?channelId=${channelId}&clave=${clave}`, {
              method: 'DELETE'
            })

            if (deleteResponse.ok) {
              eliminadasExitosas++
            } else {
              console.error(`Error eliminando factura ${clave} de la base de datos`)
              eliminadasConError++
            }
          } catch (deleteError) {
            console.error(`Error al eliminar factura ${clave}:`, deleteError)
            eliminadasConError++
          }
        }

        // Notificar al componente padre para que elimine las facturas de la tabla
        if (onBillsRemoved && eliminadasExitosas > 0) {
          onBillsRemoved(clavesAEliminar)
        }

        if (eliminadasConError > 0) {
          alert(`Categorización "${setName}" creada exitosamente. ${eliminadasExitosas} facturas eliminadas, ${eliminadasConError} con errores.`)
        } else {
          alert(`Categorización "${setName}" creada exitosamente. ${eliminadasExitosas} facturas eliminadas.`)
        }
        
        onClose()
      } else {
        setError(result.error || 'Error al crear la categorización')
      }
    } catch (error) {
      console.error('Error al crear la categorización:', error)
      setError('Error de conexión')
    } finally {
      setSaving(false)
      setShowProgress(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${validationIssues.length > 0 ? styles.modalLarge : ''}`}>
        <div className={styles.modalHeader}>
          <h2>📁 Crear Categorización</h2>
          <button 
            onClick={onClose}
            className={styles.closeButton}
            disabled={saving}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Input para nombre de la categorización */}
          <div className={styles.nameSection}>
            <label htmlFor="setName" className={styles.label}>
              Nombre de la categorización:
            </label>
            <input
              id="setName"
              type="text"
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              className={styles.nameInput}
              placeholder="Ingresa un nombre para la categorización..."
              disabled={saving}
            />
          </div>

          {/* Error */}
          {error && (
            <div className={styles.error}>
              <p>❌ {error}</p>
            </div>
          )}

          {/* Detalle de problemas de categorización */}
          {validationIssues.length > 0 && (
            <div className={styles.error}>
              <div className={styles.errorHeader}>
                <p>⚠️ Se encontraron facturas con categorización incompleta. No se guardó la nueva categorización.</p>
                <button
                  type="button"
                  className={styles.collapseButton}
                  onClick={() => setErrorsExpanded(!errorsExpanded)}
                  aria-expanded={errorsExpanded}
                >
                  {errorsExpanded ? '▼ Ocultar detalles' : '▶ Mostrar detalles'}
                </button>
              </div>
              {errorsExpanded && (
                <div className={styles.errorDetailsContainer}>
                  <div className={styles.errorTableWrapper}>
                    <table className={styles.errorTable}>
                      <thead>
                        <tr>
                          <th>Clave</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationIssues.map((billIssue) => (
                          <tr key={billIssue.clave}>
                            <td>{billIssue.clave}</td>
                            <td>
                              <button
                                type="button"
                                className={styles.errorDetailsButton}
                                onClick={() => {
                                  const lines = billIssue.issues.map((issue) => {
                                    return `• CABYS: ${issue.cabys || '-'}\n  Detalle: ${issue.desc_fact || '-'}\n  Campos faltantes: ${issue.missingFields.join(', ')}`
                                  })
                                  setSelectedErrorDetails(lines.join('\n\n'))
                                }}
                              >
                                Ver errores
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.errorTextareaWrapper}>
                    <label className={styles.errorTextareaLabel}>Detalle de errores</label>
                    <textarea
                      className={styles.errorTextarea}
                      value={selectedErrorDetails}
                      readOnly
                      placeholder="Selecciona una factura en la tabla para ver el detalle de sus errores de categorización..."
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Cargando facturas...</p>
            </div>
          ) : bills.length === 0 ? (
            <div className={styles.empty}>
              <p>No hay facturas disponibles</p>
            </div>
          ) : (
            <>
              {/* Controles de selección */}
              <div className={styles.controls}>
                <label className={styles.selectAllLabel}>
                  <input
                    type="checkbox"
                    checked={selectedBills.size === bills.length && bills.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    disabled={saving}
                  />
                  Seleccionar todas ({selectedBills.size}/{bills.length})
                </label>
              </div>

              {/* Tabla de facturas */}
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Agregar</th>
                      <th>Nombre</th>
                      <th>Clave</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((bill) => (
                      <tr key={bill._id}>
                        <td className={styles.checkboxCell}>
                          <input
                            type="checkbox"
                            checked={selectedBills.has(bill._id)}
                            onChange={(e) => handleSelectBill(bill._id, e.target.checked)}
                            disabled={saving}
                          />
                        </td>
                        <td title={bill.path} className={styles.truncate}>
                          {bill.path}
                        </td>
                        <td title={bill.clave} className={styles.truncate}>
                          {bill.clave}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={handleCreateSet}
            disabled={saving || selectedBills.size === 0 || !setName.trim()}
          >
            {saving ? 'Creando...' : 'Confirmar'}
          </button>
        </div>
      </div>

      {/* Barra de progreso para el proceso de categorización */}
      <ProgressBar
        current={progressCurrent}
        total={progressTotal}
        isVisible={showProgress}
        title={progressTitle}
      />
    </div>
  )
}

export default CreateFileSetModal
