'use client'
import React, { useRef, useState } from 'react'
import CabysSelectionModal from './CabysSelectionModal'
import CabysEditModal from './CabysEditModal'
import DescripcionesPersonalizadasModal from './DescripcionesPersonalizadasModal'
import LawAuthorizedDocModal from './LawAuthorizedDocModal'
import DiscardedBillsModal from './DiscardedBillsModal'
import CreateFileSetModal from './CreateFileSetModal'
import ManageFileSetModal from './ManageFileSetModal'
import SpecialMessagesModal from './SpecialMessagesModal'
import FileLogsModal, { addFileLog } from './FileLogsModal'
import ImportDocModal from './ImportDocModal'
import FileSetsMenuModal from './FileSetsMenuModal'
import styles from './BillsToolbar.module.css'

interface BillsToolbarProps {
  onFilterColumns: () => void
  onBillsAdded?: (rows: any[]) => void
  channelId: string
  hasActiveFilters?: boolean
  onShowProgress?: (show: boolean, current: number, total: number, title: string) => void
}

const BillsToolbar: React.FC<BillsToolbarProps> = ({ onFilterColumns, onBillsAdded, channelId, hasActiveFilters = false, onShowProgress }) => {
  // Función para validar formato de clave (50 dígitos numéricos)
  const isValidClave = (clave: string): boolean => {
    if (!clave) return false
    // Debe tener exactamente 50 caracteres y ser solo números
    return /^\d{50}$/.test(clave)
  }

  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)
  const [showCabysMenu, setShowCabysMenu] = useState(false)
  const [showProcessesMenu, setShowProcessesMenu] = useState(false)
  const [showFilesMenu, setShowFilesMenu] = useState(false)
  const [showFileSetsMenuModal, setShowFileSetsMenuModal] = useState(false)
  const [showCabysModal, setShowCabysModal] = useState(false)
  const [showCabysEditModal, setShowCabysEditModal] = useState(false)
  const [showDescripcionesPersonalizadasModal, setShowDescripcionesPersonalizadasModal] = useState(false)
  const [selectedCabysCodigo, setSelectedCabysCodigo] = useState<string | null>(null)
  const [showLawDocModal, setShowLawDocModal] = useState(false)
  const [showDiscardedBillsModal, setShowDiscardedBillsModal] = useState(false)
  const [showCreateFileSetModal, setShowCreateFileSetModal] = useState(false)
  const [showManageFileSetModal, setShowManageFileSetModal] = useState(false)
  const [showSpecialMessagesModal, setShowSpecialMessagesModal] = useState(false)
  const [showDataExtrasMenu, setShowDataExtrasMenu] = useState(false)
  const [showFileLogsModal, setShowFileLogsModal] = useState(false)
  const [showImportDocModal, setShowImportDocModal] = useState(false)
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

  const handleFileSetsClick = () => {
    setShowFilesMenu(false)
    setShowFileSetsMenuModal(true)
  }

  const handleFilterColumns = () => {
    setShowWorkspaceMenu(false)
    onFilterColumns()
  }

  const handleConsultarCabys = () => {
    setShowCabysMenu(false)
    setShowCabysModal(true)
  }

  const handleDescripcionesPersonalizadas = () => {
    setShowCabysMenu(false)
    setShowDescripcionesPersonalizadasModal(true)
  }

  const handleCreateLawDoc = () => {
    setShowProcessesMenu(false)
    setShowLawDocModal(true)
  }

  const handleCreateImportDoc = () => {
    setShowProcessesMenu(false)
    setShowImportDocModal(true)
  }

  const handleCabysSelect = (cabysItem: any) => {
    // Para el modal de consulta, solo cerramos sin hacer nada
    console.log('CABYS consultado:', cabysItem)
  }

  const handleCabysEdit = (codigo: string) => {
    setSelectedCabysCodigo(codigo)
    setShowCabysModal(false)
    setShowCabysEditModal(true)
  }

  const handleCabysEditSave = (updatedCabys: any) => {
    console.log('CABYS editado y guardado:', updatedCabys)
    // No necesitamos hacer nada específico aquí, solo cerrar el modal
  }

  const handleCabysEditClose = () => {
    setShowCabysEditModal(false)
    setSelectedCabysCodigo(null)
    setShowCabysModal(true) // Return to selection modal
  }

  const handleShowDiscardedBills = () => {
    setShowFilesMenu(false)
    setShowDiscardedBillsModal(true)
  }

  const handleCreateFileSet = () => {
    setShowCreateFileSetModal(true)
  }

  const handleManageFileSet = () => {
    setShowManageFileSetModal(true)
  }

  const handleSpecialMessages = () => {
    setShowSpecialMessagesModal(true)
    setShowProcessesMenu(false)
    setShowFilesMenu(false) // También cerrar menú de archivos
  }

  const handleDataExtrasClick = () => {
    setShowDataExtrasMenu(!showDataExtrasMenu)
    setShowWorkspaceMenu(false)
    setShowCabysMenu(false)
    setShowProcessesMenu(false)
    setShowFilesMenu(false)
  }

  const handleFileLogsClick = () => {
    setShowFileLogsModal(true)
    setShowDataExtrasMenu(false)
  }

  // Cerrar menús al hacer clic fuera
  const handleBackdropClick = () => {
    setShowWorkspaceMenu(false)
    setShowCabysMenu(false)
    setShowProcessesMenu(false)
    setShowFilesMenu(false)
    setShowDataExtrasMenu(false)
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

    const fileArray = Array.from(files)
    const rows: any[] = []
    const payload: any[] = []
    const claves: string[] = []

    // Mostrar barra de progreso
    if (onShowProgress) {
      onShowProgress(true, 0, fileArray.length, "Procesando archivos XML...")
    }

    // Primer paso: extraer todas las claves de los archivos
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
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

        claves.push(clave)
      } catch (error) {
        console.error('Error procesando archivo', file.name, ':', error)
      }
      
      // Actualizar progreso
      if (onShowProgress) {
        onShowProgress(true, i + 1, fileArray.length, "Procesando archivos XML...")
      }
    }

    // Verificar si alguna clave está descartada
    let clavesDescartadas: string[] = []
    if (claves.length > 0) {
      try {
        const checkResponse = await fetch('/api/facturas-descartadas/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            claves: claves,
            channelId: channelId
          })
        })

        const checkResult = await checkResponse.json()
        if (checkResult.success) {
          clavesDescartadas = checkResult.data.clavesDescartadas || []
        }
      } catch (error) {
        console.error('Error verificando facturas descartadas:', error)
      }
    }

    // Arrays separados para archivos especiales (MensajeHacienda/MensajeReceptor)
    const specialPayload: any[] = []

    // Segundo paso: procesar solo los archivos permitidos
    for (const file of Array.from(files)) {
      // Validación 1: Tipo de archivo
      if (!file.name.toLowerCase().endsWith('.xml')) {
        addFileLog(channelId, {
          fileName: file.name,
          summary: 'Archivo no es de tipo .xml',
          detail: `El archivo "${file.name}" no tiene la extensión .xml requerida. Solo se permiten archivos XML.`,
          type: 'rejected'
        })
        continue
      }
      
      try {
        const text = await file.text()
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(text, 'application/xml')

        // Validación 2: Parseo XML válido
        const parserError = xmlDoc.getElementsByTagName('parsererror')[0]
        if (parserError) {
          addFileLog(channelId, {
            fileName: file.name,
            summary: 'XML inválido o malformado',
            detail: `El archivo "${file.name}" contiene un XML inválido o malformado que no puede ser procesado. Error de parseo: ${parserError.textContent || 'Error de estructura XML'}.`,
            type: 'rejected'
          })
          console.error('XML inválido en archivo:', file.name)
          continue
        }

        // Detectar si es un archivo especial (MensajeHacienda, MensajeReceptor o MyCompaXMLDOCIMP)
        const rootElement = xmlDoc.documentElement
        const rootNodeName = rootElement.nodeName
        const esRespuesta = rootNodeName === 'MensajeHacienda' || rootNodeName === 'MensajeReceptor'
        const esDocumentoImportacion = rootNodeName === 'MyCompaXMLDOCIMP'
        const esDocumentoMyCompaXML = rootNodeName === 'MyCompaXMLDOC'
        
        if (esDocumentoImportacion) {
          // Procesar documento de importación MyCompaXMLDOCIMP
          const clave = extractTagValue(xmlDoc, 'Clave')
          
          // Validación 3: Clave debe existir y ser válida
          if (!clave) {
            addFileLog(channelId, {
              fileName: file.name,
              summary: 'No se encontró el campo Clave',
              detail: `El documento de importación "${file.name}" no contiene el campo "Clave" requerido en el nodo principal.`,
              type: 'rejected'
            })
            console.warn('No se encontró Clave en documento de importación:', file.name)
            continue
          }

          if (!isValidClave(clave)) {
            addFileLog(channelId, {
              fileName: file.name,
              summary: 'Formato de clave inválido',
              detail: `El documento de importación "${file.name}" contiene una clave "${clave}" con formato inválido. La clave debe tener exactamente 50 dígitos numéricos.`,
              type: 'rejected'
            })
            continue
          }

          // Validación 4: Verificar si la clave está descartada
          if (clavesDescartadas.includes(clave)) {
            addFileLog(channelId, {
              fileName: file.name,
              summary: 'Documento previamente descartado',
              detail: `El documento de importación "${file.name}" con clave "${clave}" fue previamente descartado y no puede ser procesado.`,
              type: 'rejected'
            })
            console.warn(`Documento de importación con clave ${clave} está descartado, se omite el archivo ${file.name}`)
            continue
          }

          // Extraer FechaEmision para ordenamiento
          const fechaEmision = extractTagValue(xmlDoc, 'FechaEmision')
          
          // Generar emision en formato YYMMDDHHMMSS para consistencia
          const emision = fechaEmision ? emisionFromFecha(fechaEmision) : null

          const xmlB64 = toBase64(text)
          
          payload.push({
            clave,
            xml: xmlB64,
            emision, // Agregar campo emision para consistencia
            path: file.name,
            channel_id: channelId,
            esRespuesta: false, // Los documentos de importación no son documentos de respuesta
            tipoDocumento: 'importacion' // Marcador especial para identificar el tipo
          })

          rows.push({
            _id: `temp_${Date.now()}_${Math.random()}`, // ID temporal para React
            clave,
            claveCon: clave,
            fechaEmisionCon: fechaEmision, // Agregar fecha de emisión para ordenamiento
            emision, // Agregar campo emision para consistencia
            path: file.name,
            xmlContent: text // Enviar contenido XML sin codificar para procesamiento en BillsTable
          })

          // No agregar log de éxito aquí - se agregará después de verificar duplicados
          
          console.log(`Documento de importación detectado: ${file.name}`)
          continue
        }

        if (esDocumentoMyCompaXML) {
          // Procesar documento MyCompaXMLDOC
          const clave = extractTagValue(xmlDoc, 'Clave')
          
          // Validación 3: Clave debe existir y ser válida
          if (!clave) {
            addFileLog(channelId, {
              fileName: file.name,
              summary: 'No se encontró el campo Clave',
              detail: `El documento MyCompaXMLDOC "${file.name}" no contiene el campo "Clave" requerido en el nodo principal.`,
              type: 'rejected'
            })
            console.warn('No se encontró Clave en documento MyCompaXMLDOC:', file.name)
            continue
          }

          if (!isValidClave(clave)) {
            addFileLog(channelId, {
              fileName: file.name,
              summary: 'Formato de clave inválido',
              detail: `El documento MyCompaXMLDOC "${file.name}" contiene una clave "${clave}" con formato inválido. La clave debe tener exactamente 50 dígitos numéricos.`,
              type: 'rejected'
            })
            continue
          }

          // Validación 4: Verificar si la clave está descartada
          if (clavesDescartadas.includes(clave)) {
            addFileLog(channelId, {
              fileName: file.name,
              summary: 'Documento previamente descartado',
              detail: `El documento MyCompaXMLDOC "${file.name}" con clave "${clave}" fue previamente descartado y no puede ser procesado.`,
              type: 'rejected'
            })
            console.warn(`Documento MyCompaXMLDOC con clave ${clave} está descartado, se omite el archivo ${file.name}`)
            continue
          }

          // Extraer FechaEmision para ordenamiento
          const fechaEmision = extractTagValue(xmlDoc, 'FechaEmision')
          
          // Generar emision en formato YYMMDDHHMMSS para consistencia
          const emision = fechaEmision ? emisionFromFecha(fechaEmision) : null

          const xmlB64 = toBase64(text)
          
          payload.push({
            clave,
            xml: xmlB64,
            emision, // Agregar campo emision para consistencia
            path: file.name,
            channel_id: channelId,
            esRespuesta: false, // Los documentos MyCompaXMLDOC no son documentos de respuesta
            tipoDocumento: 'mycompaxmldoc' // Marcador especial para identificar el tipo
          })

          rows.push({
            _id: `temp_${Date.now()}_${Math.random()}`, // ID temporal para React
            clave,
            claveCon: clave,
            fechaEmisionCon: fechaEmision, // Agregar fecha de emisión para ordenamiento
            emision, // Agregar campo emision para consistencia
            path: file.name,
            xmlContent: text // Enviar contenido XML sin codificar para procesamiento en BillsTable
          })

          // No agregar log de éxito aquí - se agregará después de verificar duplicados
          
          console.log(`Documento MyCompaXMLDOC detectado: ${file.name}`)
          continue
        }
        
        if (esRespuesta) {
          // Procesar archivo especial (documento de respuesta)
          const clave = extractTagValue(xmlDoc, 'Clave')
          
          // Validación 3: Clave debe existir y ser válida
          if (!clave) {
            addFileLog(channelId, {
              fileName: file.name,
              summary: 'No se encontró el campo Clave',
              detail: `El documento de respuesta "${file.name}" no contiene el campo "Clave" requerido en el nodo principal.`,
              type: 'rejected'
            })
            console.warn('No se encontró Clave en mensaje especial:', file.name)
            continue
          }

          if (!isValidClave(clave)) {
            addFileLog(channelId, {
              fileName: file.name,
              summary: 'Formato de clave inválido',
              detail: `El documento de respuesta "${file.name}" contiene una clave "${clave}" con formato inválido. La clave debe tener exactamente 50 dígitos numéricos.`,
              type: 'rejected'
            })
            continue
          }

          // Validación 4: Verificar si la clave está descartada
          if (clavesDescartadas.includes(clave)) {
            addFileLog(channelId, {
              fileName: file.name,
              summary: 'Documento previamente descartado',
              detail: `El documento de respuesta "${file.name}" con clave "${clave}" pertenece a una factura que fue previamente descartada y no puede ser procesado.`,
              type: 'rejected'
            })
            console.warn(`Mensaje con clave ${clave} está descartado, se omite el archivo ${file.name}`)
            continue
          }

          const xmlB64 = toBase64(text)
          
          specialPayload.push({
            clave,
            xml: xmlB64,
            path: file.name,
            channel_id: channelId,
            esRespuesta: true, // Marcar como documento de respuesta
            tipo: rootNodeName // Para identificar el tipo de mensaje
          })
          
          // No agregar log de éxito aquí - se agregará después de verificar duplicados
          
          console.log(`Documento de respuesta detectado: ${file.name} (${rootNodeName})`)
          continue
        }

        // Procesar archivo normal (factura)
        const clave = extractTagValue(xmlDoc, 'Clave')
        const fechaEmision = extractTagValue(xmlDoc, 'FechaEmision')

        // Validación 3: Clave debe existir y ser válida
        if (!clave) {
          addFileLog(channelId, {
            fileName: file.name,
            summary: 'No se encontró el campo Clave',
            detail: `La factura "${file.name}" no contiene el campo "Clave" requerido en el nodo principal.`,
            type: 'rejected'
          })
          console.warn('No se encontró Clave en', file.name)
          continue
        }

        if (!isValidClave(clave)) {
          addFileLog(channelId, {
            fileName: file.name,
            summary: 'Formato de clave inválido',
            detail: `La factura "${file.name}" contiene una clave "${clave}" con formato inválido. La clave debe tener exactamente 50 dígitos numéricos.`,
            type: 'rejected'
          })
          continue
        }

        if (!fechaEmision) {
          addFileLog(channelId, {
            fileName: file.name,
            summary: 'No se encontró el campo FechaEmision',
            detail: `La factura "${file.name}" no contiene el campo "FechaEmision" requerido para determinar la fecha de emisión.`,
            type: 'rejected'
          })
          console.warn('No se encontró FechaEmision en', file.name)
          continue
        }

        // Validación 4: Verificar si la clave está descartada
        if (clavesDescartadas.includes(clave)) {
          addFileLog(channelId, {
            fileName: file.name,
            summary: 'Factura previamente descartada',
            detail: `La factura "${file.name}" con clave "${clave}" fue previamente descartada y no puede ser procesada.`,
            type: 'rejected'
          })
          console.warn(`Factura con clave ${clave} está descartada, se omite el archivo ${file.name}`)
          continue
        }

        const emision = emisionFromFecha(fechaEmision)
        const xmlB64 = toBase64(text)

        payload.push({
          clave,
          xml: xmlB64,
          emision,
          path: file.name, // Nombre del archivo como path
          channel_id: channelId,
          esRespuesta: false // Facturas normales no son documentos de respuesta
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

        // No agregar log de éxito aquí - se agregará después de verificar duplicados
      } catch (error) {
        addFileLog(channelId, {
          fileName: file.name,
          summary: 'Error interno de procesamiento',
          detail: `Error inesperado al procesar el archivo "${file.name}": ${error instanceof Error ? error.message : 'Error desconocido'}. Verifique que el archivo no esté corrupto.`,
          type: 'rejected'
        })
        console.error('Error procesando archivo:', file.name, error)
        continue // Evitar que el archivo rechazado se agregue a la base de datos
      }
    }

    // Procesar archivos especiales si los hay
    let specialResult = null
    if (specialPayload.length > 0) {
      try {
        const specialResponse = await fetch('/api/facturas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(specialPayload)
        })

        if (specialResponse.ok) {
          specialResult = await specialResponse.json()
          console.log('Mensajes especiales subidos:', specialResult)
          
          // Crear set de claves duplicadas para filtrar
          const duplicateSpecialClaves = new Set()
          if (specialResult.clavesDuplicadas) {
            specialResult.clavesDuplicadas.forEach((clave: string) => duplicateSpecialClaves.add(clave))
          }

          // Agregar logs para archivos especiales duplicados
          if (specialResult.clavesDuplicadas && specialResult.clavesDuplicadas.length > 0) {
            specialResult.clavesDuplicadas.forEach((clave: string) => {
              // Encontrar el archivo especial correspondiente a esta clave
              const duplicateSpecial = specialPayload.find(item => item.clave === clave)
              if (duplicateSpecial) {
                addFileLog(channelId, {
                  fileName: duplicateSpecial.path,
                  summary: 'Documento de respuesta duplicado detectado',
                  detail: `El documento de respuesta "${duplicateSpecial.path}" (${duplicateSpecial.tipo}) con clave "${clave}" ya existe en la base de datos con el mismo valor de esRespuesta. El archivo duplicado fue ignorado.`,
                  type: 'rejected'
                })
              }
            })
          }

          // Agregar logs de éxito solo para documentos de respuesta no duplicados
          specialPayload.forEach(item => {
            if (!duplicateSpecialClaves.has(item.clave)) {
              addFileLog(channelId, {
                fileName: item.path,
                summary: `Documento de respuesta ${item.tipo} procesado`,
                detail: `El documento de respuesta "${item.path}" (${item.tipo}) con clave "${item.clave}" ha sido procesado exitosamente y guardado en la base de datos.`,
                type: 'response'
              })
            }
          })
        }
      } catch (error) {
        console.error('Error subiendo mensajes especiales:', error)
      }
    }

    // Procesar facturas normales si las hay
    let normalResult = null
    if (payload.length > 0) {
      try {
        const response = await fetch('/api/facturas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          throw new Error('Error en el servidor')
        }

        normalResult = await response.json()
        console.log('Facturas subidas:', normalResult)

        // Solo agregar a la tabla las facturas que realmente se insertaron (no duplicados)
        const duplicateClaves = new Set()
        if (normalResult.clavesDuplicadas) {
          normalResult.clavesDuplicadas.forEach((clave: string) => duplicateClaves.add(clave))
        }

        // Agregar logs para archivos duplicados
        if (normalResult.clavesDuplicadas && normalResult.clavesDuplicadas.length > 0) {
          normalResult.clavesDuplicadas.forEach((clave: string) => {
            // Encontrar el archivo correspondiente a esta clave
            const duplicateRow = rows.find(row => row.clave === clave)
            if (duplicateRow) {
              addFileLog(channelId, {
                fileName: duplicateRow.path,
                summary: 'Archivo duplicado detectado',
                detail: `La factura "${duplicateRow.path}" con clave "${clave}" ya existe en la base de datos con el mismo valor de esRespuesta. El archivo duplicado fue ignorado.`,
                type: 'rejected'
              })
            }
          })
        }

        // Filtrar solo las filas que no son duplicados
        const nonDuplicateRows = rows.filter(row => !duplicateClaves.has(row.clave))

        // Agregar logs de éxito solo para archivos no duplicados
        nonDuplicateRows.forEach(row => {
          const isImportDoc = row.tipoDocumento === 'importacion'
          addFileLog(channelId, {
            fileName: row.path,
            summary: isImportDoc ? 'Documento de importación procesado exitosamente' : 'Factura procesada exitosamente',
            detail: isImportDoc 
              ? `El documento de importación "${row.path}" con clave "${row.clave}" ha sido procesado exitosamente y agregado a la tabla.`
              : `La factura "${row.path}" con clave "${row.clave}" ha sido procesada exitosamente y agregada a la tabla.`,
            type: 'success'
          })
        })

        if (onBillsAdded && nonDuplicateRows.length > 0) {
          onBillsAdded(nonDuplicateRows)
        }
      } catch (error) {
        console.error('Error subiendo facturas:', error)
        alert('Error al subir las facturas al servidor')
        return
      }
    }

    // Mostrar mensaje de resultado combinado
    const normalInserted = normalResult?.insertadas || 0
    const normalDuplicates = normalResult?.duplicados || 0
    const specialInserted = specialResult?.insertadas || 0
    const specialDuplicates = specialResult?.duplicados || 0

    if (payload.length === 0 && specialPayload.length === 0) {
      alert('No se pudieron procesar los archivos XML seleccionados')
      return
    }

    let message = ''
    if (normalInserted > 0) {
      message += `${normalInserted} facturas subidas exitosamente`
      if (normalDuplicates > 0) {
        message += `, ${normalDuplicates} duplicados ignorados`
      }
    }
    
    if (specialInserted > 0) {
      if (message) message += '. '
      message += `${specialInserted} mensajes especiales subidos exitosamente`
      if (specialDuplicates > 0) {
        message += `, ${specialDuplicates} duplicados ignorados`
      }
    }

    // Ocultar barra de progreso
    if (onShowProgress) {
      onShowProgress(false, 0, 0, "")
    }

    if (message) {
      alert(message)
    } else {
      alert('No se procesaron archivos nuevos (todos eran duplicados)')
    }

    // Auto-abrir modal de logs después de procesar archivos
    setTimeout(() => {
      setShowFileLogsModal(true)
    }, 100) // Pequeño delay para que el alert se cierre antes
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
                    className={`${styles.dropdownItem} ${hasActiveFilters ? styles.disabled : ''}`}
                    disabled={hasActiveFilters}
                    title={hasActiveFilters ? 'No se puede agregar archivos mientras hay filtros activos' : ''}
                  >
                    ➕ Agregar archivos
                  </button>
                  <button
                    onClick={handleDeleteAllFiles}
                    className={`${styles.dropdownItem} ${styles.deleteItem} ${hasActiveFilters ? styles.disabled : ''}`}
                    disabled={hasActiveFilters}
                    title={hasActiveFilters ? 'No se puede eliminar archivos mientras hay filtros activos' : ''}
                  >
                    🗑️ Eliminar archivos
                  </button>
                  <button
                    onClick={handleShowDiscardedBills}
                    className={styles.dropdownItem}
                  >
                    📋 Archivos descartados
                  </button>
                  <button
                    onClick={handleSpecialMessages}
                    className={styles.dropdownItem}
                  >
                    📨 Ver documentos de respuesta
                  </button>
                  <button
                    onClick={handleFileSetsClick}
                    className={`${styles.dropdownItem} ${hasActiveFilters ? styles.disabled : ''}`}
                    disabled={hasActiveFilters}
                    title={hasActiveFilters ? 'No se puede gestionar conjuntos de archivos mientras hay filtros activos' : ''}
                  >
                    📁 Conjuntos de archivos
                  </button>
                </div>
              </>
            )}
          </div>


          {/* Botón Datos extras */}
          <div className={styles.dropdown}>
            <button
              onClick={handleDataExtrasClick}
              className={`${styles.toolbarButton} ${showDataExtrasMenu ? styles.active : ''}`}
            >
              📊 Datos extras
              <span className={styles.dropdownArrow}>
                {showDataExtrasMenu ? '▲' : '▼'}
              </span>
            </button>
            
            {showDataExtrasMenu && (
              <>
                <div className={styles.backdrop} onClick={handleBackdropClick}></div>
                <div className={styles.dropdownMenu}>
                  <button
                    onClick={handleFileLogsClick}
                    className={styles.dropdownItem}
                  >
                    📋 Ver detalle
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
                  <button
                    onClick={handleDescripcionesPersonalizadas}
                    className={styles.dropdownItem}
                  >
                    📝 Descripciones personalizadas de CABYS
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
                  <button
                    onClick={handleCreateImportDoc}
                    className={styles.dropdownItem}
                  >
                    📄 Crear documento de importación
                  </button>
                  <button
                    onClick={handleSpecialMessages}
                    className={styles.dropdownItem}
                  >
                    📨 Mensajes especiales
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
      {showCabysEditModal && selectedCabysCodigo && (
        <CabysEditModal
          codigo={selectedCabysCodigo}
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

      {/* Modal de facturas descartadas */}
      {showDiscardedBillsModal && (
        <DiscardedBillsModal
          isOpen={showDiscardedBillsModal}
          onClose={() => setShowDiscardedBillsModal(false)}
          channelId={channelId}
        />
      )}

      {/* Modal de crear conjunto de archivos */}
      {showCreateFileSetModal && (
        <CreateFileSetModal
          isOpen={showCreateFileSetModal}
          onClose={() => setShowCreateFileSetModal(false)}
          channelId={channelId}
        />
      )}

      {/* Modal de gestión de conjuntos de archivos */}
      {showManageFileSetModal && (
        <ManageFileSetModal
          isOpen={showManageFileSetModal}
          onClose={() => setShowManageFileSetModal(false)}
          channelId={channelId}
          onFilesAdded={onBillsAdded}
        />
      )}

      {/* Input oculto para seleccionar múltiples XML */}
      {/* Modal de mensajes especiales */}
      {showSpecialMessagesModal && (
        <SpecialMessagesModal
          isOpen={showSpecialMessagesModal}
          onClose={() => setShowSpecialMessagesModal(false)}
          channelId={channelId}
        />
      )}

      {/* Modal de logs de archivos */}
      {showFileLogsModal && (
        <FileLogsModal
          isOpen={showFileLogsModal}
          onClose={() => setShowFileLogsModal(false)}
          channelId={channelId}
        />
      )}

      {/* Modal de documento de importación */}
      {showImportDocModal && (
        <ImportDocModal
          isOpen={showImportDocModal}
          onClose={() => setShowImportDocModal(false)}
          channelId={channelId}
        />
      )}

      {/* Modal de menú de conjuntos de archivos */}
      {showFileSetsMenuModal && (
        <FileSetsMenuModal
          isOpen={showFileSetsMenuModal}
          onClose={() => setShowFileSetsMenuModal(false)}
          onCreateFileSet={handleCreateFileSet}
          onManageFileSet={handleManageFileSet}
        />
      )}

      {/* Modal de descripciones personalizadas */}
      {showDescripcionesPersonalizadasModal && (
        <DescripcionesPersonalizadasModal
          channelId={channelId}
          onClose={() => setShowDescripcionesPersonalizadasModal(false)}
        />
      )}

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
