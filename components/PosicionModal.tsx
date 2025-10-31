'use client'
import React, { useState, useEffect } from 'react'
import styles from './PosicionModal.module.css'

interface Actividad {
  _id: string
  codigo: string
  nombre_personal: string
}

interface Sucursal {
  _id: string
  codigo: string
  nombre: string
}

interface Caja {
  _id: string
  numero: string
}

interface PosicionModalProps {
  isOpen: boolean
  onClose: () => void
  channelId: string
  userId: string
  userName: string
  onUpdate: () => void
}

export default function PosicionModal({
  isOpen,
  onClose,
  channelId,
  userId,
  userName,
  onUpdate
}: PosicionModalProps) {
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [cajas, setCajas] = useState<Caja[]>([])
  
  const [selectedActividad, setSelectedActividad] = useState<string>('')
  const [selectedSucursal, setSelectedSucursal] = useState<string>('')
  const [selectedCaja, setSelectedCaja] = useState<string>('')
  
  const [loading, setLoading] = useState(false)
  const [loadingActividades, setLoadingActividades] = useState(false)
  const [loadingSucursales, setLoadingSucursales] = useState(false)
  const [loadingCajas, setLoadingCajas] = useState(false)
  const [loadingCurrentPosition, setLoadingCurrentPosition] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar actividades y posición actual al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadActividades()
      loadCurrentPosition()
      // Limpiar selecciones previas
      setSelectedActividad('')
      setSelectedSucursal('')
      setSelectedCaja('')
      setSucursales([])
      setCajas([])
      setError(null)
    }
  }, [isOpen, channelId, userId])

  // Cargar sucursales cuando se selecciona una actividad
  useEffect(() => {
    if (selectedActividad) {
      loadSucursales(selectedActividad)
      // Limpiar selecciones dependientes
      setSelectedSucursal('')
      setSelectedCaja('')
      setCajas([])
    } else {
      setSucursales([])
      setSelectedSucursal('')
      setSelectedCaja('')
      setCajas([])
    }
  }, [selectedActividad])

  // Cargar cajas cuando se selecciona una sucursal
  useEffect(() => {
    if (selectedSucursal) {
      loadCajas(selectedSucursal)
      setSelectedCaja('')
    } else {
      setCajas([])
      setSelectedCaja('')
    }
  }, [selectedSucursal])

  const loadActividades = async () => {
    setLoadingActividades(true)
    try {
      const response = await fetch(`/api/actividades?channelId=${channelId}`)
      if (response.ok) {
        const data = await response.json()
        setActividades(data.data || [])
      } else {
        setError('Error al cargar las actividades económicas')
      }
    } catch (error) {
      console.error('Error loading actividades:', error)
      setError('Error al cargar las actividades económicas')
    } finally {
      setLoadingActividades(false)
    }
  }

  const loadSucursales = async (activityId: string) => {
    setLoadingSucursales(true)
    try {
      const response = await fetch(`/api/sucursales?activityId=${activityId}`)
      if (response.ok) {
        const data = await response.json()
        setSucursales(data.data || [])
      } else {
        setError('Error al cargar las sucursales')
      }
    } catch (error) {
      console.error('Error loading sucursales:', error)
      setError('Error al cargar las sucursales')
    } finally {
      setLoadingSucursales(false)
    }
  }

  const loadCajas = async (sucursalId: string) => {
    setLoadingCajas(true)
    try {
      const response = await fetch(`/api/cajas?sucursalId=${sucursalId}`)
      if (response.ok) {
        const data = await response.json()
        setCajas(data.data || [])
      } else {
        setError('Error al cargar las cajas')
      }
    } catch (error) {
      console.error('Error loading cajas:', error)
      setError('Error al cargar las cajas')
    } finally {
      setLoadingCajas(false)
    }
  }

  const loadCurrentPosition = async () => {
    setLoadingCurrentPosition(true)
    try {
      const response = await fetch(`/api/user-channels/current-position?channelId=${channelId}&userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        const position = data.data
        
        if (position && position.act_eco) {
          // Establecer la actividad seleccionada
          setSelectedActividad(position.act_eco._id)
          
          // Cargar sucursales para esta actividad
          await loadSucursales(position.act_eco._id)
          
          // Después de cargar sucursales, establecer la sucursal seleccionada
          setTimeout(async () => {
            if (position.sucursal) {
              setSelectedSucursal(position.sucursal._id)
              
              // Cargar cajas para esta sucursal
              await loadCajas(position.sucursal._id)
              
              // Después de cargar cajas, establecer la caja seleccionada
              setTimeout(() => {
                if (position.caja) {
                  setSelectedCaja(position.caja._id)
                }
              }, 100)
            }
          }, 100)
        }
      } else {
        // No hay posición asignada, esto es normal para usuarios nuevos
        console.log('No hay posición asignada para este usuario')
      }
    } catch (error) {
      console.error('Error loading current position:', error)
      // No mostrar error si no hay posición asignada
    } finally {
      setLoadingCurrentPosition(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedActividad || !selectedSucursal || !selectedCaja) {
      setError('Por favor selecciona todos los campos requeridos')
      return
    }

    const isEditing = selectedActividad && selectedSucursal && selectedCaja
    const actionText = isEditing ? 'actualizar' : 'asignar'
    
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas ${actionText} la posición a "${userName}"?\n\n` +
      `Actividad: ${actividades.find(a => a._id === selectedActividad)?.nombre_personal}\n` +
      `Sucursal: ${sucursales.find(s => s._id === selectedSucursal)?.nombre}\n` +
      `Caja: ${cajas.find(c => c._id === selectedCaja)?.numero}`
    )

    if (!confirmed) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/user-channels/position', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId,
          userId,
          act_eco: selectedActividad,
          sucursal: selectedSucursal,
          caja: selectedCaja
        }),
      })

      if (response.ok) {
        alert(`Posición ${actionText}da exitosamente`)
        onUpdate()
        onClose()
      } else {
        const data = await response.json()
        setError(data.message || `Error al ${actionText} la posición`)
      }
    } catch (error) {
      console.error('Error updating position:', error)
      setError('Error al asignar la posición')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>
            {loadingCurrentPosition ? 'Cargando...' : 
             selectedActividad && selectedSucursal && selectedCaja ? 
             `Editar Posición - ${userName}` : 
             `Asignar Posición - ${userName}`}
          </h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="actividad" className={styles.label}>
              Actividad Económica *
            </label>
            <select
              id="actividad"
              value={selectedActividad}
              onChange={(e) => setSelectedActividad(e.target.value)}
              className={styles.select}
              disabled={loadingActividades || loading}
              required
            >
              <option value="">
                {loadingActividades ? 'Cargando...' : 'Selecciona una actividad'}
              </option>
              {actividades.map((actividad) => (
                <option key={actividad._id} value={actividad._id}>
                  {actividad.codigo} - {actividad.nombre_personal}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="sucursal" className={styles.label}>
              Sucursal *
            </label>
            <select
              id="sucursal"
              value={selectedSucursal}
              onChange={(e) => setSelectedSucursal(e.target.value)}
              className={styles.select}
              disabled={!selectedActividad || loadingSucursales || loading}
              required
            >
              <option value="">
                {loadingSucursales ? 'Cargando...' : 
                 !selectedActividad ? 'Primero selecciona una actividad' : 
                 'Selecciona una sucursal'}
              </option>
              {sucursales.map((sucursal) => (
                <option key={sucursal._id} value={sucursal._id}>
                  {sucursal.codigo} - {sucursal.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="caja" className={styles.label}>
              Caja *
            </label>
            <select
              id="caja"
              value={selectedCaja}
              onChange={(e) => setSelectedCaja(e.target.value)}
              className={styles.select}
              disabled={!selectedSucursal || loadingCajas || loading}
              required
            >
              <option value="">
                {loadingCajas ? 'Cargando...' : 
                 !selectedSucursal ? 'Primero selecciona una sucursal' : 
                 'Selecciona una caja'}
              </option>
              {cajas.map((caja) => (
                <option key={caja._id} value={caja._id}>
                  Caja {caja.numero}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || !selectedActividad || !selectedSucursal || !selectedCaja}
            >
              {loading ? 'Guardando...' : 
               selectedActividad && selectedSucursal && selectedCaja ? 
               'Actualizar Posición' : 
               'Asignar Posición'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
