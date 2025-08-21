'use client'
import React, { useRef, useState } from 'react'
import CabysSelectionModal from './CabysSelectionModal'
import CabysEditModal from './CabysEditModal'
import LawAuthorizedDocModal from './LawAuthorizedDocModal'
import styles from './BillsToolbar.module.css'

interface BillsToolbarProps {
  onFilterColumns: () => void
  onBillsAdded?: (rows: any[]) => void
  channelId: string
}

const BillsToolbar: React.FC<BillsToolbarProps> = ({ onFilterColumns, onBillsAdded, channelId }) => {
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)
  const [showCabysMenu, setShowCabysMenu] = useState(false)
  const [showProcessesMenu, setShowProcessesMenu] = useState(false)
  const [showFilesMenu, setShowFilesMenu] = useState(false)
  const [showCabysModal, setShowCabysModal] = useState(false)
  const [showCabysEditModal, setShowCabysEditModal] = useState(false)
  const [selectedCabysForEdit, setSelectedCabysForEdit] = useState<any>(null)
  const [showLawDocModal, setShowLawDocModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleWorkspaceClick = () => {
    setShowWorkspaceMenu(!showWorkspaceMenu)
    setShowCabysMenu(false)
    setShowProcessesMenu(false)
    setShowFilesMenu(false)
  }

  const handleCabysClick = () => {
    setShowCabysMenu(!showCabysMenu)
    setShowWorkspaceMenu(false)
    setShowProcessesMenu(false)
    setShowFilesMenu(false)
  }

  const handleProcessesClick = () => {
    setShowProcessesMenu(!showProcessesMenu)
    setShowWorkspaceMenu(false)
    setShowCabysMenu(false)
    setShowFilesMenu(false)
  }

  const handleFilesClick = () => {
    setShowFilesMenu(!showFilesMenu)
    setShowWorkspaceMenu(false)
    setShowCabysMenu(false)
    setShowProcessesMenu(false)
  }

  const handleFilterColumns = () => {
    setShowWorkspaceMenu(false)
    onFilterColumns()
  }

  const handleConsultarCabys = () => {
    setShowCabysMenu(false)
    setShowCabysModal(true)
  }

  const handleCreateLawDoc = () => {
    setShowProcessesMenu(false)
    setShowLawDocModal(true)
  }

  const handleCabysSelect = (cabysItem: any) => {
    // Para el modal de consulta, solo cerramos sin hacer nada
    console.log('CABYS consultado:', cabysItem)
  }

  const handleCabysEdit = (cabysItem: any) => {
    setSelectedCabysForEdit(cabysItem)
    setShowCabysModal(false)
    setShowCabysEditModal(true)
  }

  const handleCabysEditSave = (updatedCabys: any) => {
    console.log('CABYS editado y guardado:', updatedCabys)
    // No necesitamos hacer nada específico aquí, solo cerrar el modal
  }

  const handleCabysEditClose = () => {
    setShowCabysEditModal(false)
    setSelectedCabysForEdit(null)
    setShowCabysModal(true) // Return to selection modal
  }

  // Cerrar menús al hacer clic fuera
  const handleBackdropClick = () => {
    setShowWorkspaceMenu(false)
    setShowCabysMenu(false)
    setShowProcessesMenu(false)
    setShowFilesMenu(false)
  }

  const handleAddFilesClick = () => {
    setShowFilesMenu(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const handleDeleteAllFiles = async () => {
    setShowFilesMenu(false)
    
    // Confirmar con el usuario
    const confirmDelete = window.confirm(
      '¿Está seguro de que desea eliminar TODOS los archivos de la tabla de facturas? Esta acción no se puede deshacer.'
    )
    
    if (!confirmDelete) {
      return
    }

    try {
      const response = await fetch('/api/facturas/delete-all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channelId: channelId
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          alert(`${result.deletedCount} facturas eliminadas exitosamente`)
          // Recargar la tabla
          window.location.reload()
        } else {
          alert('Error al eliminar las facturas: ' + (result.message || 'Error desconocido'))
        }
      } else {
        alert('Error de conexión al eliminar las facturas')
      }
    } catch (error) {
      console.error('Error deleting all files:', error)
      alert('Error al eliminar las facturas')
    }
  }

  const toBase64 = (str: string) => {
    try {
      return window.btoa(unescape(encodeURIComponent(str)))
    } catch {
      return btoa(str) // Fallback
    }
  }

  const extractTagValue = (doc: Document, tagName: string): string => {
    // Buscar coincidencias con o sin namespace (ns:Tag)
    const elements = Array.from(doc.getElementsByTagName('*')) as Element[]
    for (const el of elements) {
      if (el.tagName === tagName || el.tagName.endsWith(':' + tagName)) {
        if (el.textContent) return el.textContent.trim()
      }
    }
    return ''
  }

  const emisionFromFecha = (fechaIso: string): string => {
    // Formato esperado: YYYY-MM-DDThh:mm:ss±zz:zz
    // Resultado: yymmddhhmmss
    const match = fechaIso.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
    if (!match) return ''
    
    const year = match[1].slice(-2) // últimos 2 dígitos del año
    const month = match[2]
    const day = match[3]
    const hour = match[4]
    const minute = match[5]
    const second = match[6]
    
    return `${year}${month}${day}${hour}${minute}${second}`
  }

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const rows: any[] = []
    const payload: any[] = []

    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith('.xml')) continue
      
      try {
        const text = await file.text()
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(text, 'application/xml')

        // Verificar si hay errores de parseo
        const parserError = xmlDoc.getElementsByTagName('parsererror')[0]
        if (parserError) {
          console.error('XML inválido en archivo:', file.name)
          continue
        }

        // Buscar Clave y FechaEmision
        const clave = extractTagValue(xmlDoc, 'Clave')
        const fechaEmision = extractTagValue(xmlDoc, 'FechaEmision')

        if (!clave || !fechaEmision) {
          console.warn('No se encontraron Clave o FechaEmision en', file.name)
          continue
        }

        const emision = emisionFromFecha(fechaEmision)
        const xmlB64 = toBase64(text)

        payload.push({
          clave,
          xml: xmlB64,
          emision,
          path: file.name, // Nombre del archivo como path
          channel_id: channelId
        })

        rows.push({
          _id: `temp_${Date.now()}_${Math.random()}`, // ID temporal para React
          clave,
          claveCon: clave,
          fechaEmisionCon: fechaEmision,
          emision,
          path: file.name,
          xmlContent: text // Enviar contenido XML sin codificar para procesamiento en BillsTable
        })
      } catch (error) {
        console.error('Error procesando archivo:', file.name, error)
      }
    }

    if (payload.length === 0) {
      alert('No se pudieron procesar los archivos XML seleccionados')
      return
    }

    try {
      const response = await fetch('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Error en el servidor')
      }

      const result = await response.json()
      console.log('Facturas subidas:', result)

      // Solo agregar a la tabla las facturas que realmente se insertaron (no duplicados)
      const duplicateClaves = new Set()
      if (result.clavesDuplicadas) {
        result.clavesDuplicadas.forEach((clave: string) => duplicateClaves.add(clave))
      }

      // Filtrar solo las filas que no son duplicados
      const nonDuplicateRows = rows.filter(row => !duplicateClaves.has(row.clave))

      if (onBillsAdded && nonDuplicateRows.length > 0) {
        onBillsAdded(nonDuplicateRows)
      }

      const insertedCount = result.insertadas || 0
      const duplicateCount = result.duplicados || 0
      
      if (duplicateCount > 0) {
        alert(`${insertedCount} facturas subidas exitosamente. ${duplicateCount} duplicados fueron ignorados.`)
      } else {
        alert(`${insertedCount} facturas subidas exitosamente`)
      }

    } catch (error) {
      console.error('Error subiendo facturas:', error)
      alert('Error al subir las facturas al servidor')
    }
  }

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbarSection}>
          <div className={styles.dropdown}>
            <button
              onClick={handleFilesClick}
              className={`${styles.toolbarButton} ${showFilesMenu ? styles.active : ''}`}
            >
              📁 Archivos
              <span className={styles.dropdownArrow}>
                {showFilesMenu ? '▲' : '▼'}
              </span>
            </button>
            
            {showFilesMenu && (
              <>
                <div className={styles.backdrop} onClick={handleBackdropClick}></div>
                <div className={styles.dropdownMenu}>
                  <button
                    onClick={handleAddFilesClick}
                    className={styles.dropdownItem}
                  >
                    ➕ Agregar archivos
                  </button>
                  <button
                    onClick={handleDeleteAllFiles}
                    className={`${styles.dropdownItem} ${styles.deleteItem}`}
                  >
                    🗑️ Eliminar archivos
                  </button>
                </div>
              </>
            )}
          </div>

          <div className={styles.dropdown}>
            <button
              onClick={handleWorkspaceClick}
              className={`${styles.toolbarButton} ${showWorkspaceMenu ? styles.active : ''}`}
            >
              🛠️ Espacio de trabajo
              <span className={styles.dropdownArrow}>
                {showWorkspaceMenu ? '▲' : '▼'}
              </span>
            </button>
            
            {showWorkspaceMenu && (
              <>
                <div className={styles.backdrop} onClick={handleBackdropClick}></div>
                <div className={styles.dropdownMenu}>
                  <button
                    onClick={handleFilterColumns}
                    className={styles.dropdownItem}
                  >
                    🔍 Filtrar columnas
                  </button>
                </div>
              </>
            )}
          </div>

          <div className={styles.dropdown}>
            <button
              onClick={handleCabysClick}
              className={`${styles.toolbarButton} ${showCabysMenu ? styles.active : ''}`}
            >
              📋 CABYS
              <span className={styles.dropdownArrow}>
                {showCabysMenu ? '▲' : '▼'}
              </span>
            </button>
            
            {showCabysMenu && (
              <>
                <div className={styles.backdrop} onClick={handleBackdropClick}></div>
                <div className={styles.dropdownMenu}>
                  <button
                    onClick={handleConsultarCabys}
                    className={styles.dropdownItem}
                  >
                    📊 Consultar CABYS registrados
                  </button>
                </div>
              </>
            )}
          </div>

          <div className={styles.dropdown}>
            <button
              onClick={handleProcessesClick}
              className={`${styles.toolbarButton} ${showProcessesMenu ? styles.active : ''}`}
            >
              ⚙️ Procesos
              <span className={styles.dropdownArrow}>
                {showProcessesMenu ? '▲' : '▼'}
              </span>
            </button>
            
            {showProcessesMenu && (
              <>
                <div className={styles.backdrop} onClick={handleBackdropClick}></div>
                <div className={styles.dropdownMenu}>
                  <button
                    onClick={handleCreateLawDoc}
                    className={styles.dropdownItem}
                  >
                    📜 Crear documento autorizado por la ley
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de consulta de CABYS */}
      {showCabysModal && (
        <CabysSelectionModal
          channelId={channelId}
          onSelect={handleCabysSelect}
          onEdit={handleCabysEdit}
          onClose={() => setShowCabysModal(false)}
        />
      )}

      {/* Modal de edición de CABYS */}
      {showCabysEditModal && selectedCabysForEdit && (
        <CabysEditModal
          cabysItem={selectedCabysForEdit}
          channelId={channelId}
          onSave={handleCabysEditSave}
          onClose={handleCabysEditClose}
        />
      )}

      {/* Modal de documento autorizado por ley */}
      {showLawDocModal && (
        <LawAuthorizedDocModal
          channelId={channelId}
          onClose={() => setShowLawDocModal(false)}
        />
      )}

      {/* Input oculto para seleccionar múltiples XML */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml"
        multiple
        onChange={handleFilesSelected}
        style={{ display: 'none' }}
      />
    </>
  )
}

export default BillsToolbar
