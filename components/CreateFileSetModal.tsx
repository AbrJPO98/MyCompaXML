'use client'
import React, { useState, useEffect, useCallback } from 'react'
import styles from './CreateFileSetModal.module.css'

interface BillFile {
  _id: string
  clave: string
  path: string
  xml: string
}

interface CreateFileSetModalProps {
  isOpen: boolean
  onClose: () => void
  channelId: string
}

const CreateFileSetModal: React.FC<CreateFileSetModalProps> = ({
  isOpen,
  onClose,
  channelId
}) => {
  const [bills, setBills] = useState<BillFile[]>([])
  const [selectedBills, setSelectedBills] = useState<Set<string>>(new Set())
  const [setName, setSetName] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

    try {
      // Preparar los archivos seleccionados
      const selectedBillsData = bills
        .filter(bill => selectedBills.has(bill._id))
        .map(bill => ({
          clave: bill.clave,
          nombre: bill.path,
          xml: bill.xml
        }))

      const response = await fetch('/api/conjunto-archivos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: setName.trim(),
          archivos: selectedBillsData,
          channel_id: channelId
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(`Conjunto de archivos "${setName}" creado exitosamente`)
        onClose()
      } else {
        setError(result.error || 'Error al crear conjunto de archivos')
      }
    } catch (error) {
      console.error('Error al crear conjunto de archivos:', error)
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>📁 Crear Conjunto de Archivos</h2>
          <button 
            onClick={onClose}
            className={styles.closeButton}
            disabled={saving}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Input para nombre del conjunto */}
          <div className={styles.nameSection}>
            <label htmlFor="setName" className={styles.label}>
              Nombre del conjunto:
            </label>
            <input
              id="setName"
              type="text"
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              className={styles.nameInput}
              placeholder="Ingresa un nombre para el conjunto..."
              disabled={saving}
            />
          </div>

          {/* Error */}
          {error && (
            <div className={styles.error}>
              <p>❌ {error}</p>
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
    </div>
  )
}

export default CreateFileSetModal
