'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import BillsToolbar from './BillsToolbar'
import ColumnValueFilterModal, { ColumnFilter } from './ColumnValueFilterModal'
import ColumnVisibilityModal from './ColumnVisibilityModal'
import ProgressBar from './ProgressBar'
import FileLogsModal, { addFileLog } from './FileLogsModal'
import CabysEditModal from './CabysEditModal'
import CategorizarFacturaModal from './CategorizarFacturaModal'
import { generateCategorizacion } from '@/lib/categorization'
import styles from './BillsTable.module.css'

// Definición de columnas con sus propiedades
export interface ColumnDefinition {
  header: string
  systemName: string
  visible: boolean
}

// Interfaz para CABYS Item
interface CabysItem {
  codigo: string
  descripOf: string
  bienoserv: string
  descripPer: string
  descripGasInv: string
  categoria: string
  actEconomica: string
  vidaUtil: string | number
  importado: string
}

export const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  { header: "Eliminar", systemName: "opcionElim", visible: true },
  { header: "Descargar", systemName: "opcionDesc", visible: true },
  { header: "Categorizar", systemName: "opcionCategorizar", visible: true },
  { header: "Nombre original del archivo", systemName: "path", visible: true },
  { header: "Propiedad", systemName: "compraVentaRevisar", visible: true },
  { header: "Descartar", systemName: "opcionDescartar", visible: true },
  { header: "Sucursal", systemName: "sucursal", visible: true },
  { header: "Clave", systemName: "claveCon", visible: true },
  { header: "Proveedor del sistema", systemName: "proveedorSistemasCon", visible: true },
  { header: "¿Tiene respuesta?", systemName: "tieneRes", visible: true },
  { header: "Estado del comprobante", systemName: "estadoComprobate", visible: true },
  { header: "Obtener respuesta", systemName: "obtenerDoc", visible: true },
  { header: "Ver respuesta", systemName: "verdoc", visible: true },
  { header: "Anular factura", systemName: "anularDoc", visible: true },
  { header: "Día", systemName: "diaDoc", visible: true },
  { header: "Mes", systemName: "mesDoc", visible: true },
  { header: "Año", systemName: "annoDoc", visible: true },
  { header: "Fecha", systemName: "fechaEmisionCon", visible: true },
  { header: "Tipo de documento", systemName: "tipoDocNom", visible: true },
  { header: "Código actividad emisor", systemName: "codigoActividadEmisorCon", visible: true },
  { header: "Código actividad receptor", systemName: "codigoActividadReceptorCon", visible: true },
  { header: "Consecutivo", systemName: "numeroConsecutivoCon", visible: true },
  { header: "Nombre (Emisor)", systemName: "nombreCon", visible: true },
  { header: "Tipo Cédula (Emisor)", systemName: "tipoCon", visible: true },
  { header: "Número cédula (Emisor)", systemName: "numeroCon", visible: true },
  { header: "Cédula extranjero (Emisor)", systemName: "identificacionExtranjeroEmisorCon", visible: true },
  { header: "Registro fiscal 8707", systemName: "registroFiscalCon", visible: true },
  { header: "Nombre comercial (Emisor)", systemName: "nombreComercialCon", visible: true },
  { header: "Provincia (Emisor)", systemName: "provinciaCon", visible: true },
  { header: "Cantón (Emisor)", systemName: "cantonCon", visible: true },
  { header: "Distrito (Emisor)", systemName: "distritoCon", visible: true },
  { header: "Barrio (Emisor)", systemName: "barrioCon", visible: true },
  { header: "Otras señas (Emisor)", systemName: "otrasSenasCon", visible: true },
  { header: "Código teléfono (Emisor)", systemName: "codigoPaisCon", visible: true },
  { header: "Número teléfono (Emisor)", systemName: "numTelefonoCon", visible: true },
  { header: "Código fax (Emisor)", systemName: "codigoPais2Con", visible: true },
  { header: "Número fax (Emisor)", systemName: "numTelefono2Con", visible: true },
  { header: "Correo electrónico (Emisor)", systemName: "correoElectronicoCon", visible: true },
  { header: "Nombre (Receptor)", systemName: "nombre2Con", visible: true },
  { header: "Tipo Cédula (Receptor)", systemName: "tipo2Con", visible: true },
  { header: "Número Cédula (Receptor)", systemName: "numero2Con", visible: true },
  { header: "Cédula extranjero (Receptor)", systemName: "identificacionExtranjeroReceptorCon", visible: true },
  { header: "Nombre comercial (Receptor)", systemName: "nombreComercial2Con", visible: true },
  { header: "Provincia (Receptor)", systemName: "provincia2Con", visible: true },
  { header: "Canton (Receptor)", systemName: "canton2Con", visible: true },
  { header: "Distrito (Receptor)", systemName: "distrito2Con", visible: true },
  { header: "Barrio (Receptor)", systemName: "barrio2Con", visible: true },
  { header: "Otras señas (Receptor)", systemName: "otrasSenas2Con", visible: true },
  { header: "Otras señas extranjero (Receptor)", systemName: "otrasSenasExtranjeroCon", visible: true },
  { header: "Código teléfono (Receptor)", systemName: "codigoPais3Con", visible: true },
  { header: "Número teléfono (Receptor)", systemName: "numTelefono3Con", visible: true },
  { header: "Codigo fax (Receptor)", systemName: "codigoPais4Con", visible: true },
  { header: "Número fax (Receptor)", systemName: "numTelefono4Con", visible: true },
  { header: "Correo electrónico (Receptor)", systemName: "correoElectronico2Con", visible: true },
  /*
  { header: "Ley (Autorizado por ley especial)", systemName: "leyALECon", visible: true },
  { header: "Artículo (Autorizado por ley especial)", systemName: "articuloALECon", visible: true },
  { header: "Inciso (Autorizado por ley especial)", systemName: "incisoALECon", visible: true },
  { header: "Monto (Autorizado por ley especial)", systemName: "montoALECon", visible: true },
  { header: "Impuesto (Autorizado por ley especial)", systemName: "impuestoALECon", visible: true },
   */
  { header: "Tipo (Mercancía importada)", systemName: "tipoMercImpor", visible: true },
  { header: "País importador", systemName: "paisImportador", visible: true },
  { header: "Condición de la venta", systemName: "condicionVentaCon", visible: true },
  { header: "Condición de la venta (Otros)", systemName: "condicionVentaOtrosCon", visible: true },
  { header: "Plazo de crédito", systemName: "plazoCreditoCon", visible: true },
  { header: "Medio de pago", systemName: "medioPagoCon", visible: true },
  { header: "Tipo medio de pago", systemName: "tipoMedioPagoCon", visible: true },
  { header: "Medio de pago OTROS", systemName: "medioPagoOtroCon", visible: true },
  { header: "Total medio de pago", systemName: "totalMedioPago", visible: true },
  { header: "Tipo de moneda", systemName: "tipoMonedaLinea", visible: false },
  { header: "Número de línea", systemName: "numeroLineaCon", visible: true },
  { header: "Partida arancelaria", systemName: "partidaArancelariaCon", visible: true },
  { header: "CABYS", systemName: "codigoCon", visible: true },
  { header: "Añadir cabys", systemName: "anadirCabysDes", visible: true },
  { header: "Descripción personalizada", systemName: "descripcion", visible: true },
  { header: "Gasto o inventario", systemName: "descGasInv", visible: true },
  { header: "Bien o servicio", systemName: "bienoserv", visible: true },
  { header: "Categoría", systemName: "categ", visible: true },
  { header: "Actividad económica (Venta)", systemName: "codActVent", visible: true },
  { header: "Actividad económica (Compra)", systemName: "codActComp", visible: true },
  { header: "Actividad económica asociada", systemName: "claActCom", visible: true },
  { header: "Detalle de la mercancía", systemName: "detalleCon", visible: true },
  { header: "Agregar descripción", systemName: "agrDesc", visible: true },
  { header: "Tipo (Código comercial)", systemName: "tipo3Con", visible: true },
  { header: "Código (Código comercial)", systemName: "codigo2Con", visible: true },
  { header: "Cantidad", systemName: "cantidadCon", visible: true },
  { header: "Unidad Medida", systemName: "unidadMedidaCon", visible: true },
  { header: "Unidad Medida Comercial", systemName: "unidadMedidaComercialCon", visible: true },
  { header: "Tipo de transacción", systemName: "tipoTransaccionCon", visible: true },
  { header: "Número VIN o SERIE", systemName: "numeroVinOSerieCon", visible: true },
  { header: "Forma farmacéutica", systemName: "formaFarmaceutica", visible: true },
  { header: "Registro medicamento", systemName: "registroMedicamento", visible: true },
  { header: "Código de la moneda", systemName: "codigoMonedaCon", visible: true },
  { header: "Tipo de cambio", systemName: "tipoCambioCon", visible: true },
  { header: "Convertir valores (Moneda)", systemName: "conDesconValores", visible: true },
  { header: "Precio unitario (producto o servicio)", systemName: "precioUnitarioCon", visible: true },
  { header: "Monto Total (producto o servicio)", systemName: "montoTotalCon", visible: true },
  { header: "Monto descuento", systemName: "montoDescuentoCon", visible: true },
  { header: "Código descuento", systemName: "codigoDescuentoCon", visible: true },
  { header: "Código descuento otro", systemName: "codigoDescuentoOtroCon", visible: true },
  { header: "Naturaleza descuento", systemName: "naturalezaDescuentoCon", visible: true },
  { header: "Subtotal (producto o servicio)", systemName: "subTotalCon", visible: true },
  { header: "IVA cobrado fábrica", systemName: "ivaCobradoFabrica", visible: true },
  { header: "Base imponible (producto o servicio)", systemName: "baseImponibleCon", visible: true },
  { header: "Codigo (impuesto)", systemName: "codigo3Con", visible: true },
  { header: "Codigo otros (impuesto)", systemName: "codigo3OtrosCon", visible: true },
  { header: "Codigo tarifa (impuesto)", systemName: "codigoTarifaCon", visible: true },
  { header: "Tarifa (impuesto)", systemName: "tarifaCon", visible: true },
  { header: "Factor IVA (impuesto)", systemName: "factorIVACon", visible: true },
  { header: "Cantidad unidad de medida (Impuesto Específico)", systemName: "cantidadUnidadMedidaCon", visible: true },
  { header: "Porcentaje (Impuesto específico)", systemName: "porcentajeCon", visible: true },
  { header: "Proporción (Impuesto específico)", systemName: "proporcionCon", visible: true },
  { header: "Volumen Unidad Consumo (Impuesto específico)", systemName: "volumenUnidadConsumoCon", visible: true },
  { header: "Impuesto Unidad (Impuesto específico)", systemName: "impuestoUnidadCon", visible: true },
  { header: "Monto (impuesto)", systemName: "montoCon", visible: true },
  { header: "Monto exportación (impuesto)", systemName: "montoExportacionCon", visible: true },
  { header: "Tipo documento EX1 (exoneración)", systemName: "tipoDocumentoEXCon", visible: true },
  { header: "Tipo documento Otro (exoneración)", systemName: "tipoDocumentoOtroCon", visible: true },
  { header: "Número documento (exoneración)", systemName: "numeroDocumentoCon", visible: true },
  { header: "Artículo (exoneración)", systemName: "articuloCon", visible: true },
  { header: "Inciso (exoneración)", systemName: "incisoCon", visible: true },
  { header: "Nombre institución (exoneración)", systemName: "nombreInstitucionCon", visible: true },
  { header: "Nombre institución Otros (exoneración)", systemName: "nombreInstitucionOtrosCon", visible: true },
  { header: "Fecha emisión EX (exoneración)", systemName: "fechaEmision2Con", visible: true },
  { header: "Tarifa (exoneración)", systemName: "tarifaExoneracionCon", visible: true },
  { header: "Monto (exoneración)", systemName: "montoExoneracionCon", visible: true },
  { header: "Impuesto asumido emisor fábrica", systemName: "impuestoAsumidoEmisorFabrica", visible: true },
  { header: "Impuesto neto (producto o servicio)", systemName: "impuestoNetoCon", visible: true },
  { header: "Monto total línea (producto o servicio)", systemName: "montoTotalLineaCon", visible: true },
  { header: "Tipo documento (otros cargos)", systemName: "tipoDocumento2Con", visible: true },
  { header: "Tipo documento otros (otros cargos)", systemName: "tipoDocumentoOtros2Con", visible: true },
  { header: "Tipo identidad tercero (otros cargos)", systemName: "tipoIdentidadTerceroCon", visible: true },
  { header: "Número identidad tercero (otros cargos)", systemName: "numeroIdentidadTerceroCon", visible: true },
  { header: "Nombre identidad tercero (otros cargos)", systemName: "nombreTerceroCon", visible: true },
  { header: "Detalle (otros cargos)", systemName: "detalle2Con", visible: true },
  { header: "Porcentaje (otros cargos)", systemName: "porcentajeOtrosCon", visible: true },
  { header: "Monto del cargo (otros cargos)", systemName: "montoCargoCon", visible: true },
  { header: "Total servicios gravados", systemName: "totalServGravadosCon", visible: true },
  { header: "Total servicios exentos", systemName: "totalServExentosCon", visible: true },
  { header: "Total servicios exonerados", systemName: "totalServExoneradoCon", visible: true },
  { header: "Total servicios no sujetos", systemName: "totalServNoSujetosCon", visible: true },
  { header: "Total mercancías gravadas", systemName: "totalMercanciasGravadasCon", visible: true },
  { header: "Total mercancías exentas", systemName: "totalMercanciasExentasCon", visible: true },
  { header: "Total mercancías exoneradas", systemName: "totalMercExoneradaCon", visible: true },
  { header: "Total mercancías no sujetas", systemName: "totalMercNoSujetaCon", visible: true },
  { header: "Total gravado", systemName: "totalGravadoCon", visible: true },
  { header: "Total exento", systemName: "totalExentoCon", visible: true },
  { header: "Total exonerado", systemName: "totalExoneradoCon", visible: true },
  { header: "Total no sujeto", systemName: "totalNoSujetoCon", visible: true },
  { header: "Total venta", systemName: "totalVentaCon", visible: true },
  { header: "Total descuentos", systemName: "totalDescuentosCon", visible: true },
  { header: "Total venta neta", systemName: "totalVentaNetaCon", visible: true },
  { header: "Total impuesto", systemName: "totalImpuestoCon", visible: true },
  { header: "Total Impuesto asumido emisor fábrica", systemName: "totalImpAsumEmisorFabricaCon", visible: true },
  { header: "Total IVA devuelto", systemName: "totalIVADevueltoCon", visible: true },
  { header: "Total Otros cargos", systemName: "totalOtrosCargosCon", visible: true },
  { header: "Total comprobante", systemName: "totalComprobanteCon", visible: true },
  { header: "Tipo documento (referencia)", systemName: "tipoDocCon", visible: true },
  { header: "Tipo documento otro (referencia)", systemName: "tipoDocOtroCon", visible: true },
  { header: "Clave (referencia)", systemName: "claveRefCon", visible: true },
  { header: "Fecha emisión (referencia)", systemName: "fechaEmision3Con", visible: true },
  { header: "Código (Referencia)", systemName: "codigo4Con", visible: true },
  { header: "Código otro (Referencia)", systemName: "codigoOtro4Con", visible: true },
  { header: "Razón (referencia)", systemName: "razonCon", visible: true },
  { header: "Otro texto", systemName: "otroTextoCon", visible: true },
  { header: "Código (Otro texto)", systemName: "codigoOTCon", visible: true }
]

interface BillsTableProps {
  channelId: string
}

export default function BillsTable({ channelId }: { channelId: string }) {
  const [columns, setColumns] = useState<ColumnDefinition[]>(COLUMN_DEFINITIONS)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [bills, setBills] = useState<any[]>([])
  const [filteredBills, setFilteredBills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFileLogsModal, setShowFileLogsModal] = useState(false)
  
  // Estados para el modal de CABYS
  const [showCabysEditModal, setShowCabysEditModal] = useState(false)
  const [selectedCabysCodigo, setSelectedCabysCodigo] = useState<string | null>(null)
  
  // Estados para el modal de categorización
  const [showCategorizarModal, setShowCategorizarModal] = useState(false)
  const [selectedFacturaClave, setSelectedFacturaClave] = useState<string | null>(null)
  
  // Estados para el sistema de filtros
  const [showColumnFilterModal, setShowColumnFilterModal] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState<{ name: string; systemName: string } | null>(null)
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([])
  
  // Estados para la barra de progreso
  const [showProgress, setShowProgress] = useState(false)
  const [progressCurrent, setProgressCurrent] = useState(0)
  const [progressTotal, setProgressTotal] = useState(0)
  const [progressTitle, setProgressTitle] = useState("Procesando archivos...")
  
  const hasLoadedBills = useRef(false)
  const hasInitialized = useRef(false)

  // Obtener columnas visibles
  const visibleColumns = columns.filter(col => col.visible)

  // Función para decodificar Base64 a texto
  const fromBase64 = (str: string) => {
    try {
      return decodeURIComponent(escape(window.atob(str)))
    } catch {
      return atob(str) // Fallback
    }
  }

  // Función para extraer valor de un tag XML
  const extractTagValue = (doc: Document, tagName: string): string => {
    const elements = Array.from(doc.getElementsByTagName('*')) as Element[]
    for (const el of elements) {
      if (el.tagName === tagName || el.tagName.endsWith(':' + tagName)) {
        if (el.textContent) return el.textContent.trim()
      }
    }
    return ''
  }

  // Función para extraer valores con contexto (Emisor/Receptor)
  const extractContextValue = (doc: Document, context: string, tagName: string): string => {
    try {
      // Buscar el nodo contexto (Emisor o Receptor)
      const contextElements = Array.from(doc.getElementsByTagName('*')) as Element[]
      const contextElement = contextElements.find(el => 
        el.tagName === context || el.tagName.endsWith(':' + context)
      )
      
      if (contextElement) {
        // Buscar el tag dentro del contexto
        const childElements = Array.from(contextElement.getElementsByTagName('*')) as Element[]
        const targetElement = childElements.find(el => 
          el.tagName === tagName || el.tagName.endsWith(':' + tagName)
        )
        
        if (targetElement && targetElement.textContent) {
          return targetElement.textContent.trim()
        }
      }
      
      return ''
    } catch (error) {
      return ''
    }
  }

  // Función para convertir fecha ISO a formato emision (YYMMDDHHMMSS)
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

  // Función para obtener el nombre del tipo de documento
  const getTipoDocumentoNombre = (codigo: string): string => {
    const tipos: { [key: string]: string } = {
      '01': 'Factura electrónica',
      '02': 'Nota de débito electrónica',
      '03': 'Nota de crédito electrónica',
      '04': 'Tiquete electrónico',
      '05': 'Confirmación de aceptación del comprobante electrónico',
      '06': 'Confirmación de aceptación parcial del comprobante electrónico',
      '07': 'Confirmación de rechazo del comprobante electrónico',
      '08': 'Factura electrónica de compras',
      '09': 'Factura electrónica de exportación',
      '10': 'Recibo Electrónico de Pago'
    }
    return tipos[codigo] || codigo
  }

  // Función para extraer nodos MedioPago de un documento XML
  const extractMedioPagoNodes = (xmlDoc: Document) => {
    const medioPagoNodes: Array<{
      medioPagoCon?: string
      tipoMedioPagoCon?: string  
      medioPagoOtroCon?: string
      totalMedioPago?: string
    }> = []

    const rootElement = xmlDoc.documentElement

    // Buscar [Nodo-Principal]->MedioPago (hijos directos del root, no descendientes)
    const directMedioPagoElements = Array.from(rootElement.children).filter(child => child.nodeName === 'MedioPago')
    
    directMedioPagoElements.forEach((medioPago, index) => {
      if (medioPago.textContent?.trim()) {
        medioPagoNodes.push({
          medioPagoCon: medioPago.textContent.trim()
        })
      }
    })

    // Buscar [Nodo-Principal]->ResumenFactura->MedioPago
    const resumenFactura = rootElement.querySelector('ResumenFactura')
    
    if (resumenFactura) {
      const medioPagoElements = resumenFactura.querySelectorAll('MedioPago')
      
      medioPagoElements.forEach((medioPagoElement, index) => {
        const medioPagoData: any = {}

        // TipoMedioPago
        const tipoMedioPago = medioPagoElement.querySelector('TipoMedioPago')
        if (tipoMedioPago && tipoMedioPago.textContent?.trim()) {
          medioPagoData.medioPagoCon = tipoMedioPago.textContent.trim()
        }

        // MedioPagoOtros  
        const medioPagoOtros = medioPagoElement.querySelector('MedioPagoOtros')
        if (medioPagoOtros && medioPagoOtros.textContent?.trim()) {
          medioPagoData.medioPagoOtroCon = medioPagoOtros.textContent.trim()
        }

        // TotalMedioPago -> va a tipoMedioPagoCon según las instrucciones
        const totalMedioPago = medioPagoElement.querySelector('TotalMedioPago')
        if (totalMedioPago && totalMedioPago.textContent?.trim()) {
          medioPagoData.tipoMedioPagoCon = totalMedioPago.textContent.trim()
        }

        // Solo agregar si tiene al menos un valor
        if (Object.keys(medioPagoData).length > 0) {
          medioPagoNodes.push(medioPagoData)
        } else {
        }
      })
    }

    // Si no se encontraron nodos MedioPago, crear un objeto vacío para mantener la fila
    if (medioPagoNodes.length === 0) {
      medioPagoNodes.push({})
    }

    return medioPagoNodes
  }

  // Función para extraer nodos LineaDetalle de DetalleServicio de un documento XML
  const extractLineaDetalleNodes = (xmlDoc: Document) => {
    const lineaDetalleNodes: Array<{
      codigoCon?: string
      numeroLineaCon?: string
      partidaArancelariaCon?: string
      tipo3Con?: string
      codigo2Con?: string
      cantidadCon?: string
      unidadMedidaCon?: string
      tipoTransaccionCon?: string
      unidadMedidaComercialCon?: string
      detalleCon?: string
      numeroVinOSerieCon?: string
      registroMedicamento?: string
      formaFarmaceutica?: string
      precioUnitarioCon?: string
      montoTotalCon?: string
      subTotalCon?: string
      ivaCobradoFabrica?: string
      baseImponibleCon?: string
      impuestoAsumidoEmisorFabrica?: string
      impuestoNetoCon?: string
      montoTotalLineaCon?: string
    }> = []

    const rootElement = xmlDoc.documentElement

    // Buscar [Nodo-Principal]->DetalleServicio->LineaDetalle
    const detalleServicio = rootElement.querySelector('DetalleServicio')
    
    if (detalleServicio) {
      const lineaDetalleElements = detalleServicio.querySelectorAll('LineaDetalle')
      
      lineaDetalleElements.forEach((lineaDetalleElement, index) => {
        
        const lineaDetalleData: any = {}

        // Codigo (prioridad 1)
        const codigo = Array.from(lineaDetalleElement.children).find((child: any) => child.nodeName === 'Codigo')
        if (codigo && codigo.textContent?.trim()) {
          lineaDetalleData.codigoCon = codigo.textContent.trim()
        }
        // CodigoCABYS (prioridad 2, solo si no hay Codigo)
        else {
          const codigoCABYS = Array.from(lineaDetalleElement.children).find((child: any) => child.nodeName === 'CodigoCABYS')
          if (codigoCABYS && codigoCABYS.textContent?.trim()) {
            lineaDetalleData.codigoCon = codigoCABYS.textContent.trim()
          }
        }

        // NumeroLinea
        const numeroLinea = Array.from(lineaDetalleElement.children).find((child: any) => child.nodeName === 'NumeroLinea')
        if (numeroLinea && numeroLinea.textContent?.trim()) {
          lineaDetalleData.numeroLineaCon = numeroLinea.textContent.trim()
        }

        // PartidaArancelaria
        const partidaArancelaria = Array.from(lineaDetalleElement.children).find((child: any) => child.nodeName === 'PartidaArancelaria')
        if (partidaArancelaria && partidaArancelaria.textContent?.trim()) {
          lineaDetalleData.partidaArancelariaCon = partidaArancelaria.textContent.trim()
        }

        // CodigoComercial (tomar solo el primero)
        const codigoComercial = Array.from(lineaDetalleElement.children).find((child: any) => child.nodeName === 'CodigoComercial')
        if (codigoComercial) {
          const tipo = Array.from(codigoComercial.children).find((child: any) => child.nodeName === 'Tipo')
          if (tipo && tipo.textContent?.trim()) {
            lineaDetalleData.tipo3Con = tipo.textContent.trim()
          }
          
          const codigoComercialCodigo = Array.from(codigoComercial.children).find((child: any) => child.nodeName === 'Codigo')
          if (codigoComercialCodigo && codigoComercialCodigo.textContent?.trim()) {
            lineaDetalleData.codigo2Con = codigoComercialCodigo.textContent.trim()
          }
        }

        // Cantidad
        const cantidad = Array.from(lineaDetalleElement.children).find((child: any) => child.nodeName === 'Cantidad')
        if (cantidad && cantidad.textContent?.trim()) {
          lineaDetalleData.cantidadCon = cantidad.textContent.trim()
        }

        // UnidadMedida
        const unidadMedida = Array.from(lineaDetalleElement.children).find((child: any) => child.nodeName === 'UnidadMedida')
        if (unidadMedida && unidadMedida.textContent?.trim()) {
          lineaDetalleData.unidadMedidaCon = unidadMedida.textContent.trim()
        }

        // TipoTransaccion
        const tipoTransaccion = Array.from(lineaDetalleElement.children).find((child: any) => child.nodeName === 'TipoTransaccion')
        if (tipoTransaccion && tipoTransaccion.textContent?.trim()) {
          lineaDetalleData.tipoTransaccionCon = tipoTransaccion.textContent.trim()
        }

        // UnidadMedidaComercial
        const unidadMedidaComercial = Array.from(lineaDetalleElement.children).find((child: any) => child.nodeName === 'UnidadMedidaComercial')
        if (unidadMedidaComercial && unidadMedidaComercial.textContent?.trim()) {
          lineaDetalleData.unidadMedidaComercialCon = unidadMedidaComercial.textContent.trim()
        }

        // Detalle
        const detalle = Array.from(lineaDetalleElement.children).find((child: any) => child.nodeName === 'Detalle')
        if (detalle && detalle.textContent?.trim()) {
          lineaDetalleData.detalleCon = detalle.textContent.trim()
        }

        // NumeroVINoSerie (tomar solo el primero)
        const numeroVINoSerie = Array.from(lineaDetalleElement.children).find((child: any) => child.nodeName === 'NumeroVINoSerie')
        if (numeroVINoSerie && numeroVINoSerie.textContent?.trim()) {
          lineaDetalleData.numeroVinOSerieCon = numeroVINoSerie.textContent.trim()
        }

        // RegistroMedicamento
        const registroMedicamento = Array.from(lineaDetalleElement.children).find((child: any) => child.nodeName === 'RegistroMedicamento')
        if (registroMedicamento && registroMedicamento.textContent?.trim()) {
          lineaDetalleData.registroMedicamento = registroMedicamento.textContent.trim()
        }

        // FormaFarmaceutica
        const formaFarmaceutica = Array.from(lineaDetalleElement.children).find((child: any) => child.nodeName === 'FormaFarmaceutica')
        if (formaFarmaceutica && formaFarmaceutica.textContent?.trim()) {
          lineaDetalleData.formaFarmaceutica = formaFarmaceutica.textContent.trim()
        }

        // PrecioUnitario
        const precioUnitario = Array.from(lineaDetalleElement.children).find((child: any) => child.nodeName === 'PrecioUnitario')
        if (precioUnitario && precioUnitario.textContent?.trim()) {
          lineaDetalleData.precioUnitarioCon = precioUnitario.textContent.trim()
        }

        // MontoTotal
        const montoTotal = Array.from(lineaDetalleElement.children).find((child: any) => child.nodeName === 'MontoTotal')
        if (montoTotal && montoTotal.textContent?.trim()) {
          lineaDetalleData.montoTotalCon = montoTotal.textContent.trim()
        }

        // SubTotal
        const subTotal = Array.from(lineaDetalleElement.children).find((child: any) => child.nodeName === 'SubTotal')
        if (subTotal && subTotal.textContent?.trim()) {
          lineaDetalleData.subTotalCon = subTotal.textContent.trim()
        }

        // IVACobradoFabrica
        const ivaCobradoFabrica = Array.from(lineaDetalleElement.children).find((child: any) => child.nodeName === 'IVACobradoFabrica')
        if (ivaCobradoFabrica && ivaCobradoFabrica.textContent?.trim()) {
          lineaDetalleData.ivaCobradoFabrica = ivaCobradoFabrica.textContent.trim()
        }

        // BaseImponible
        const baseImponible = Array.from(lineaDetalleElement.children).find((child: any) => child.nodeName === 'BaseImponible')
        if (baseImponible && baseImponible.textContent?.trim()) {
          lineaDetalleData.baseImponibleCon = baseImponible.textContent.trim()
        }

        // ImpuestoAsumidoEmisorFabrica
        const impuestoAsumidoEmisorFabrica = Array.from(lineaDetalleElement.children).find((child: any) => child.nodeName === 'ImpuestoAsumidoEmisorFabrica')
        if (impuestoAsumidoEmisorFabrica && impuestoAsumidoEmisorFabrica.textContent?.trim()) {
          lineaDetalleData.impuestoAsumidoEmisorFabrica = impuestoAsumidoEmisorFabrica.textContent.trim()
        }

        // ImpuestoNeto
        const impuestoNeto = Array.from(lineaDetalleElement.children).find((child: any) => child.nodeName === 'ImpuestoNeto')
        if (impuestoNeto && impuestoNeto.textContent?.trim()) {
          lineaDetalleData.impuestoNetoCon = impuestoNeto.textContent.trim()
        }

        // MontoTotalLinea
        const montoTotalLinea = Array.from(lineaDetalleElement.children).find((child: any) => child.nodeName === 'MontoTotalLinea')
        if (montoTotalLinea && montoTotalLinea.textContent?.trim()) {
          lineaDetalleData.montoTotalLineaCon = montoTotalLinea.textContent.trim()
        }

        // Solo agregar si tiene al menos un valor
        if (Object.keys(lineaDetalleData).length > 0) {
          lineaDetalleNodes.push(lineaDetalleData)
        } else {
        }
      })
    }

    return lineaDetalleNodes
  }

  // Función para procesar XML y extraer datos para la tabla
  const processXmlData = useCallback((xmlString: string, channelData?: any, needsBase64Decode: boolean = true) => {
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlString, 'application/xml')

      const parserError = xmlDoc.getElementsByTagName('parsererror')[0]
      if (parserError) {
        console.error('XML inválido')
        return {}
      }

      // Detectar tipo de documento
      const rootElement = xmlDoc.documentElement
      const rootNodeName = rootElement.nodeName
      const isImportDocument = rootNodeName === 'MyCompaXMLDOCIMP'
      const isMyCompaXMLDoc = rootNodeName === 'MyCompaXMLDOC'
      const isCommonDocument = !isImportDocument && !isMyCompaXMLDoc

      // Extraer datos básicos
      const clave = extractTagValue(xmlDoc, 'Clave')
      const fechaEmision = extractTagValue(xmlDoc, 'FechaEmision') // Extraer FechaEmision para todos los tipos de documento
      const numeroConsecutivo = (isImportDocument || isMyCompaXMLDoc) ? null : extractTagValue(xmlDoc, 'NumeroConsecutivo')
      const proveedorSistemas = (isImportDocument || isMyCompaXMLDoc) ? null : extractTagValue(xmlDoc, 'ProveedorSistemas')
      // Buscar códigos de actividad según el tipo de documento
      let codigoActividadEmisor, codigoActividadReceptor, numeroCon, numero2Con, sucursalCodigo, tipoDocCodigo, tipoDocNom

      if (isImportDocument) {
        // Para documentos de importación MyCompaXMLDOCIMP
        codigoActividadEmisor = extractTagValue(xmlDoc, 'CodigoActividad')
        codigoActividadReceptor = null
        numeroCon = extractContextValue(xmlDoc, 'Emisor', 'NumeroIdentificacion')
        numero2Con = extractContextValue(xmlDoc, 'Receptor', 'Numero') || 
                    (xmlDoc.getElementsByTagName('Identificacion')[0] && 
                     extractContextValue(xmlDoc.getElementsByTagName('Identificacion')[0] as any, '', 'Numero'))
        
        // Extraer datos de la clave (posiciones específicas)
        sucursalCodigo = clave && clave.length >= 24 ? clave.substring(21, 24) : ''
        tipoDocCodigo = null
        tipoDocNom = 'Documento de importación'
      } else if (isMyCompaXMLDoc) {
        // Para documentos MyCompaXMLDOC
        codigoActividadEmisor = extractTagValue(xmlDoc, 'CodigoActividad')
        codigoActividadReceptor = null
        
        // Extraer datos de emisor y receptor específicos para MyCompaXMLDOC
        numeroCon = extractContextValue(xmlDoc, 'Emisor', 'NumeroIdentificacion')
        numero2Con = extractContextValue(xmlDoc, 'Receptor', 'Numero') || 
                    (xmlDoc.getElementsByTagName('Identificacion')[0] && 
                     extractContextValue(xmlDoc.getElementsByTagName('Identificacion')[0] as any, '', 'Numero'))
        
        // Extraer sucursal de la clave (posiciones 22, 23 y 24)
        sucursalCodigo = clave && clave.length >= 24 ? clave.substring(21, 24) : ''
        
        tipoDocNom = 'Documento MyCompaXML'
      } else {
        // Para facturas normales
        codigoActividadEmisor = extractContextValue(xmlDoc, 'Emisor', 'CodigoActividad') || 
                               extractContextValue(xmlDoc, 'Emisor', 'CodigoActividadEmisor') ||
                               extractTagValue(xmlDoc, 'CodigoActividad') || 
                               extractTagValue(xmlDoc, 'CodigoActividadEmisor')
        codigoActividadReceptor = extractContextValue(xmlDoc, 'Receptor', 'CodigoActividadReceptor') ||
                                 extractTagValue(xmlDoc, 'CodigoActividadReceptor')
        
        // Extraer datos de emisor y receptor para comparación
        numeroCon = extractContextValue(xmlDoc, 'Emisor', 'Numero')
        numero2Con = extractContextValue(xmlDoc, 'Receptor', 'Numero')
        
        // Procesar sucursal (primeros 3 dígitos del consecutivo)
        sucursalCodigo = numeroConsecutivo ? numeroConsecutivo.slice(0, 3) : ''
        
        // Procesar tipo de documento (dígitos 9 y 10 del consecutivo)
        tipoDocCodigo = numeroConsecutivo ? numeroConsecutivo.slice(8, 10) : ''
        tipoDocNom = getTipoDocumentoNombre(tipoDocCodigo)
      }
      
      // Determinar si es Venta, Compra o Indeterminable
      let compraVentaRevisar = 'Indeterminable'
      if (channelData && channelData.ident) {
        if (isImportDocument) {
          compraVentaRevisar = 'Documento de importación'
        } else if (isMyCompaXMLDoc) {
          compraVentaRevisar = 'Documento MyCompaXML'
        } else if (numeroCon === channelData.ident && numero2Con !== channelData.ident) {
          compraVentaRevisar = 'Venta'
        } else if (numero2Con === channelData.ident && numeroCon !== channelData.ident) {
          compraVentaRevisar = 'Compra'
        }
      }

      // Generar emision para documentos de importación y MyCompaXMLDOC si no existe
      const emision = (isImportDocument || isMyCompaXMLDoc) && fechaEmision ? emisionFromFecha(fechaEmision) : null

      // Crear datos base del documento (común a todas las filas)
      const baseDocumentData = {
        // Datos básicos procesados
        claveCon: clave,
        fechaEmisionCon: fechaEmision,
        emision: emision, // Agregar campo emision para consistencia
        numeroConsecutivoCon: numeroConsecutivo,
        tipoDocNom: tipoDocNom,
        
        // Datos específicos solicitados
        proveedorSistemasCon: proveedorSistemas,
        compraVentaRevisar: compraVentaRevisar,
        sucursal: sucursalCodigo, // Se procesará más en el componente si es necesario
        codigoActividadEmisorCon: codigoActividadEmisor,
        codigoActividadReceptorCon: codigoActividadReceptor,
        
        // Datos del Emisor (adaptados según tipo de documento)
        nombreCon: (isImportDocument || isMyCompaXMLDoc) ? extractContextValue(xmlDoc, 'Emisor', 'Nombre') : extractContextValue(xmlDoc, 'Emisor', 'Nombre'),
        tipoCon: (isImportDocument || isMyCompaXMLDoc) ? null : extractContextValue(xmlDoc, 'Emisor', 'Tipo'),
        numeroCon: (isImportDocument || isMyCompaXMLDoc) ? extractContextValue(xmlDoc, 'Emisor', 'NumeroIdentificacion') : extractContextValue(xmlDoc, 'Emisor', 'Numero'),
        nombreComercialCon: (isImportDocument || isMyCompaXMLDoc) ? null : extractContextValue(xmlDoc, 'Emisor', 'NombreComercial'),
        correoElectronicoCon: (isImportDocument || isMyCompaXMLDoc) ? null : extractContextValue(xmlDoc, 'Emisor', 'CorreoElectronico'),
        registroFiscalCon: (isImportDocument || isMyCompaXMLDoc) ? null : extractContextValue(xmlDoc, 'Emisor', 'NumRegimen'),
        
        // Datos del Receptor (adaptados según tipo de documento)
        nombre2Con: (isImportDocument || isMyCompaXMLDoc) ? extractContextValue(xmlDoc, 'Emisor', 'Nombre') : extractContextValue(xmlDoc, 'Receptor', 'Nombre'),
        tipo2Con: (isImportDocument || isMyCompaXMLDoc) ? 
          (extractContextValue(xmlDoc, 'Receptor', 'Tipo') || 
           (xmlDoc.getElementsByTagName('Identificacion')[0] && 
            extractContextValue(xmlDoc.getElementsByTagName('Identificacion')[0] as any, '', 'Tipo'))) : 
          extractContextValue(xmlDoc, 'Receptor', 'Tipo'),
        numero2Con: (isImportDocument || isMyCompaXMLDoc) ? 
          (extractContextValue(xmlDoc, 'Receptor', 'Numero') || 
           (xmlDoc.getElementsByTagName('Identificacion')[0] && 
            extractContextValue(xmlDoc.getElementsByTagName('Identificacion')[0] as any, '', 'Numero'))) : 
          extractContextValue(xmlDoc, 'Receptor', 'Numero'),
        nombreComercial2Con: (isImportDocument || isMyCompaXMLDoc) ? null : extractContextValue(xmlDoc, 'Receptor', 'NombreComercial'),
        correoElectronico2Con: (isImportDocument || isMyCompaXMLDoc) ? null : extractContextValue(xmlDoc, 'Receptor', 'CorreoElectronico'),
        
        // Ubicación Emisor
        provinciaCon: extractContextValue(xmlDoc, 'Emisor', 'Provincia'),
        cantonCon: extractContextValue(xmlDoc, 'Emisor', 'Canton'),
        distritoCon: extractContextValue(xmlDoc, 'Emisor', 'Distrito'),
        barrioCon: extractContextValue(xmlDoc, 'Emisor', 'Barrio'),
        otrasSenasCon: extractContextValue(xmlDoc, 'Emisor', 'OtrasSenas'),
        
        // Ubicación Receptor
        provincia2Con: extractContextValue(xmlDoc, 'Receptor', 'Provincia'),
        canton2Con: extractContextValue(xmlDoc, 'Receptor', 'Canton'),
        distrito2Con: extractContextValue(xmlDoc, 'Receptor', 'Distrito'),
        barrio2Con: extractContextValue(xmlDoc, 'Receptor', 'Barrio'),
        otrasSenas2Con: extractContextValue(xmlDoc, 'Receptor', 'OtrasSenas'),
        
        // Contacto Emisor
        codigoPaisCon: extractContextValue(xmlDoc, 'Emisor', 'CodigoPais'),
        numTelefonoCon: extractContextValue(xmlDoc, 'Emisor', 'NumTelefono'),
        codigoPais2Con: extractContextValue(xmlDoc, 'Emisor', 'CodigoPaisFax'),
        numTelefono2Con: extractContextValue(xmlDoc, 'Emisor', 'NumTelefonoFax'),
        
        // Contacto Receptor
        codigoPais3Con: extractContextValue(xmlDoc, 'Receptor', 'CodigoPais'),
        numTelefono3Con: extractContextValue(xmlDoc, 'Receptor', 'NumTelefono'),
        codigoPais4Con: extractContextValue(xmlDoc, 'Receptor', 'CodigoPaisFax'),
        numTelefono4Con: extractContextValue(xmlDoc, 'Receptor', 'NumTelefonoFax'),
        
        // Actividades económicas
        //codigoActividadEmisorCon: extractContextValue(xmlDoc, 'Emisor', 'CodigoActividad'),
        //codigoActividadReceptorCon: extractContextValue(xmlDoc, 'Receptor', 'CodigoActividad'),
        
        // Totales
        totalVentaCon: extractTagValue(xmlDoc, 'TotalVenta'),
        totalDescuentosCon: extractTagValue(xmlDoc, 'TotalDescuentos'),
        totalVentaNetaCon: extractTagValue(xmlDoc, 'TotalVentaNeta'),
        totalImpuestoCon: extractTagValue(xmlDoc, 'TotalImpuesto'),
        totalComprobanteCon: extractTagValue(xmlDoc, 'TotalComprobante'),
        totalServGravadosCon: extractTagValue(xmlDoc, 'TotalServGravados'),
        totalServExentosCon: extractTagValue(xmlDoc, 'TotalServExentos'),
        totalServExoneradoCon: extractTagValue(xmlDoc, 'TotalServExonerado'),
        totalServNoSujetosCon: extractTagValue(xmlDoc, 'TotalServNoSujeto'),
        totalMercanciasGravadasCon: extractTagValue(xmlDoc, 'TotalMercanciasGravadas'),
        totalMercanciasExentasCon: extractTagValue(xmlDoc, 'TotalMercanciasExentas'),
        totalMercExoneradaCon: extractTagValue(xmlDoc, 'TotalMercExonerada'),
        totalMercNoSujetaCon: extractTagValue(xmlDoc, 'TotalMercNoSujeta'),
        totalGravadoCon: extractTagValue(xmlDoc, 'TotalGravado'),
        totalExentoCon: extractTagValue(xmlDoc, 'TotalExento'),
        totalExoneradoCon: extractTagValue(xmlDoc, 'TotalExonerado'),
        totalNoSujetoCon: extractTagValue(xmlDoc, 'TotalNoSujeto'),
        
        // Condiciones de venta
        condicionVentaCon: extractTagValue(xmlDoc, 'CondicionVenta'),
        plazoCreditoCon: extractTagValue(xmlDoc, 'PlazoCredito'),
        medioPagoCon: extractTagValue(xmlDoc, 'MedioPago'),
        tipoMedioPagoCon: extractTagValue(xmlDoc, 'TipoMedioPago'),
        medioPagoOtroCon: extractTagValue(xmlDoc, 'MedioPagoOtros'),
        totalMedioPago: extractTagValue(xmlDoc, 'TotalMedioPago'),
        
        // Moneda
        codigoMonedaCon: extractTagValue(xmlDoc, 'CodigoMoneda'),
        tipoCambioCon: extractTagValue(xmlDoc, 'TipoCambio'),
        
        // Código (CABYS)
        codigoCon: extractTagValue(xmlDoc, 'Codigo') || extractTagValue(xmlDoc, 'CodigoCABYS'),
        
        // Campos de LineaDetalle (se llenarán desde la sección correspondiente)
        numeroLineaCon: extractTagValue(xmlDoc, 'NumeroLinea'),
        partidaArancelariaCon: extractTagValue(xmlDoc, 'PartidaArancelaria'),
        tipo3Con: extractTagValue(xmlDoc, 'Tipo'),
        codigo2Con: extractTagValue(xmlDoc, 'CodigoComercial'),
        cantidadCon: extractTagValue(xmlDoc, 'Cantidad'),
        unidadMedidaCon: extractTagValue(xmlDoc, 'UnidadMedida'),
        tipoTransaccionCon: extractTagValue(xmlDoc, 'TipoTransaccion'),
        unidadMedidaComercialCon: extractTagValue(xmlDoc, 'UnidadMedidaComercial'),
        detalleCon: extractTagValue(xmlDoc, 'Detalle'),
        numeroVinOSerieCon: extractTagValue(xmlDoc, 'NumeroVINoSerie'),
        registroMedicamento: extractTagValue(xmlDoc, 'RegistroMedicamento'),
        formaFarmaceutica: extractTagValue(xmlDoc, 'FormaFarmaceutica'),
        precioUnitarioCon: extractTagValue(xmlDoc, 'PrecioUnitario'),
        montoTotalCon: extractTagValue(xmlDoc, 'MontoTotal'),
        subTotalCon: extractTagValue(xmlDoc, 'SubTotal'),
        ivaCobradoFabrica: extractTagValue(xmlDoc, 'IVACobradoFabrica'),
        baseImponibleCon: extractTagValue(xmlDoc, 'BaseImponible'),
        impuestoAsumidoEmisorFabrica: extractTagValue(xmlDoc, 'ImpuestoAsumidoEmisorFabrica'),
        impuestoNetoCon: extractTagValue(xmlDoc, 'ImpuestoNeto'),
        montoTotalLineaCon: extractTagValue(xmlDoc, 'MontoTotalLinea'),
        
        // Fechas adicionales (adaptadas según tipo de documento)
        diaDoc: (isImportDocument || isMyCompaXMLDoc) ? 
          (clave && clave.length >= 5 ? clave.substring(3, 5) : '') : 
          (extractTagValue(xmlDoc, 'FechaEmision')?.split('-')[2]?.split('T')[0] || ''),
        mesDoc: (isImportDocument || isMyCompaXMLDoc) ? 
          (clave && clave.length >= 7 ? clave.substring(5, 7) : '') : 
          (extractTagValue(xmlDoc, 'FechaEmision')?.split('-')[1] || ''),
        annoDoc: (isImportDocument || isMyCompaXMLDoc) ? 
          (clave && clave.length >= 9 ? (isMyCompaXMLDoc ? clave.substring(7, 9) : '20' + clave.substring(7, 9)) : '') : 
          (extractTagValue(xmlDoc, 'FechaEmision')?.split('-')[0] || ''),
        
        // Campos específicos para documentos MyCompaXMLDOC
        leyALECon: isMyCompaXMLDoc ? extractTagValue(xmlDoc, 'Ley') : '',
        articuloALECon: isMyCompaXMLDoc ? extractTagValue(xmlDoc, 'Articulo') : '',
        incisoALECon: isMyCompaXMLDoc ? extractTagValue(xmlDoc, 'Inciso') : '',
        montoALECon: isMyCompaXMLDoc ? extractTagValue(xmlDoc, 'Monto') : '',
        impuestoALECon: isMyCompaXMLDoc ? extractTagValue(xmlDoc, 'Impuesto') : '',
      }

      // Para documentos comunes (no MyCompaXMLDOCIMP ni MyCompaXMLDOC), crear múltiples filas
      if (isCommonDocument) {
        
        // Extraer nodos MedioPago
        // const medioPagoNodes = extractMedioPagoNodes(xmlDoc)
        // console.log(`📊 Encontrados ${medioPagoNodes.length} nodos MedioPago`)
        
        // Extraer nodos LineaDetalle
        // const lineaDetalleNodes = extractLineaDetalleNodes(xmlDoc)
        // console.log(`📋 Encontrados ${lineaDetalleNodes.length} nodos LineaDetalle`)
        
        const result = []
        
        // SECCIÓN 1: Crear filas para MedioPago (con columnas de MedioPago llenas)
        /*
        if (false) {
          console.log('📊 Creando filas para sección MedioPago...')
          for (let i = 0; i < medioPagoNodes.length; i++) {
            const medioPagoData = medioPagoNodes[i]
            console.log(`📊 Creando fila MedioPago ${i + 1}:`, medioPagoData)
            
            result.push({
              ...baseDocumentData,
              // Solo llenar columnas de MedioPago
              medioPagoCon: medioPagoData.medioPagoCon || baseDocumentData.medioPagoCon || '',
              tipoMedioPagoCon: medioPagoData.tipoMedioPagoCon || baseDocumentData.tipoMedioPagoCon || '',
              medioPagoOtroCon: medioPagoData.medioPagoOtroCon || baseDocumentData.medioPagoOtroCon || '',
              totalMedioPago: medioPagoData.totalMedioPago || baseDocumentData.totalMedioPago || '',
              // Limpiar columnas de otras secciones (LineaDetalle)
              codigoCon: '',
              numeroLineaCon: '',
              partidaArancelariaCon: '',
              tipo3Con: '',
              codigo2Con: '',
              cantidadCon: '',
              unidadMedidaCon: '',
              tipoTransaccionCon: '',
              unidadMedidaComercialCon: '',
              detalleCon: '',
              numeroVinOSerieCon: '',
              registroMedicamento: '',
              formaFarmaceutica: '',
              precioUnitarioCon: '',
              montoTotalCon: '',
              subTotalCon: '',
              ivaCobradoFabrica: '',
              baseImponibleCon: '',
              impuestoAsumidoEmisorFabrica: '',
              impuestoNetoCon: '',
              montoTotalLineaCon: '',
            })
          }
        }
        
        // SECCIÓN 2: Crear filas para LineaDetalle (con columnas de MedioPago vacías)
        if (false) {
          console.log('📋 Creando filas para sección LineaDetalle...')
          for (let i = 0; i < lineaDetalleNodes.length; i++) {
            const lineaDetalleData = lineaDetalleNodes[i]
            console.log(`📋 Creando fila LineaDetalle ${i + 1}:`, lineaDetalleData)
            
            result.push({
              ...baseDocumentData,
              // Limpiar columnas de MedioPago (deben estar vacías)
              medioPagoCon: '',
              tipoMedioPagoCon: '',
              medioPagoOtroCon: '',
              totalMedioPago: '',
              // Solo llenar columnas de LineaDetalle
              codigoCon: lineaDetalleData.codigoCon || '',
              numeroLineaCon: lineaDetalleData.numeroLineaCon || '',
              partidaArancelariaCon: lineaDetalleData.partidaArancelariaCon || '',
              tipo3Con: lineaDetalleData.tipo3Con || '',
              codigo2Con: lineaDetalleData.codigo2Con || '',
              cantidadCon: lineaDetalleData.cantidadCon || '',
              unidadMedidaCon: lineaDetalleData.unidadMedidaCon || '',
              tipoTransaccionCon: lineaDetalleData.tipoTransaccionCon || '',
              unidadMedidaComercialCon: lineaDetalleData.unidadMedidaComercialCon || '',
              detalleCon: lineaDetalleData.detalleCon || '',
              numeroVinOSerieCon: lineaDetalleData.numeroVinOSerieCon || '',
              registroMedicamento: lineaDetalleData.registroMedicamento || '',
              formaFarmaceutica: lineaDetalleData.formaFarmaceutica || '',
              precioUnitarioCon: lineaDetalleData.precioUnitarioCon || '',
              montoTotalCon: lineaDetalleData.montoTotalCon || '',
              subTotalCon: lineaDetalleData.subTotalCon || '',
              ivaCobradoFabrica: lineaDetalleData.ivaCobradoFabrica || '',
              baseImponibleCon: lineaDetalleData.baseImponibleCon || '',
              impuestoAsumidoEmisorFabrica: lineaDetalleData.impuestoAsumidoEmisorFabrica || '',
              impuestoNetoCon: lineaDetalleData.impuestoNetoCon || '',
              montoTotalLineaCon: lineaDetalleData.montoTotalLineaCon || '',
            })
          }
        }*/
        
        // Si no hay ninguna sección, crear una fila base
        if (result.length === 0) {
          result.push(baseDocumentData)
        }
        
        // console.log(`✅ Retornando ${result.length} filas procesadas (${medioPagoNodes.length} MedioPago + ${lineaDetalleNodes.length} LineaDetalle)`)
        return result
      }

      // Para documentos MyCompaXMLDOCIMP y MyCompaXMLDOC, retornar un solo objeto (comportamiento original)
      return [baseDocumentData]
    } catch (error) {
      console.error('Error procesando XML:', error)
      return [{}]
    }
  }, [])

  const loadBills = useCallback(async () => {
    // Evitar ejecuciones múltiples
    if (hasLoadedBills.current) {
      return
    }
    
    hasLoadedBills.current = true
    setLoading(true)
    
    // Limpiar logs al inicio de la carga
    localStorage.removeItem(`fileLogs_${channelId}`)
    
    try {
      // Cargar datos del canal primero
      const channelResponse = await fetch(`/api/channels/current?channelId=${channelId}`)
      let channelData = null
      if (channelResponse.ok) {
        const channelResult = await channelResponse.json()
        channelData = channelResult.channel
      }

      const response = await fetch(`/api/facturas?channelId=${channelId}`)
      if (response.ok) {
        const data = await response.json()
        const items = Array.isArray(data.data) ? data.data : Array.isArray(data.facturas) ? data.facturas : []
        
        // Mostrar barra de progreso si hay archivos para procesar
        if (items.length > 0) {
          setProgressTitle("Cargando facturas desde la base de datos...")
          setProgressTotal(items.length)
          setProgressCurrent(0)
          setShowProgress(true)
        }
        
        // Procesar archivos uno por uno para mostrar progreso
        const mapped = []
        for (let i = 0; i < items.length; i++) {
          const it = items[i]
          
          // Decodificar XML de Base64 (datos de BD)
          const xmlString = it.xml ? fromBase64(it.xml) : ''
          
          // Procesar categorización si no existe o está vacía
          const tieneCategorizacion = it.categorizacion && 
            Array.isArray(it.categorizacion) && 
            it.categorizacion.length > 0
          
          if (xmlString && !tieneCategorizacion) {
            try {
              console.log(`⏳ Generando categorización para factura: ${it.clave}`)
              const categorizacion = await generateCategorizacion(xmlString, channelId)
              
              // Actualizar categorización en la base de datos
              if (categorizacion && Array.isArray(categorizacion) && categorizacion.length > 0) {
                const updateResponse = await fetch('/api/facturas/categorizar', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    clave: it.clave,
                    channelId: channelId,
                    categorizacion: categorizacion
                  })
                })
                
                if (updateResponse.ok) {
                  console.log(`✅ Categorización actualizada para: ${it.clave}`)
                  // Actualizar el item con la nueva categorización
                  it.categorizacion = categorizacion
                } else {
                  const errorData = await updateResponse.json().catch(() => ({}))
                  console.error(`❌ Error actualizando categorización para: ${it.clave}`, errorData)
                }
              } else {
                console.log(`⚠️ Categorización vacía generada para: ${it.clave}`)
              }
            } catch (error) {
              console.error(`❌ Error generando categorización para ${it.clave}:`, error)
            }
          } else if (xmlString && tieneCategorizacion) {
            console.log(`ℹ️ Factura ${it.clave} ya tiene categorización, omitiendo generación`)
          }
          
          // Procesar XML para extraer datos (ahora retorna array)
          const xmlDataArray = xmlString ? processXmlData(xmlString, channelData, true) : [{}]
          
          // Generar log para cada factura cargada desde la BD
          if (it.path && it.clave) {
            // Determinar el tipo de log basado en si es documento de respuesta
            const logType = it.esRespuesta ? 'response' : 'success'
            const logSummary = it.esRespuesta 
              ? `Documento de respuesta cargado desde BD`
              : `Factura cargada desde BD`
            const logDetail = it.esRespuesta
              ? `El documento de respuesta "${it.path}" con clave "${it.clave}" ha sido cargado exitosamente desde la base de datos.`
              : `La factura "${it.path}" con clave "${it.clave}" ha sido cargada exitosamente desde la base de datos.`
            
            addFileLog(channelId, {
              fileName: it.path,
              summary: logSummary,
              detail: logDetail,
              type: logType
            })
          }
          
          // Procesar cada fila generada por el XML
          for (const xmlData of (xmlDataArray as any[])) {
            // Procesar sucursal si es compra
            let sucursalNombre = (xmlData as any).sucursal || ''
            if ((xmlData as any).compraVentaRevisar === 'Compra' && (xmlData as any).sucursal) {
              try {
                const sucursalResponse = await fetch(`/api/sucursales?activityId=&codigo=${(xmlData as any).sucursal}&channelId=${channelId}`)
                if (sucursalResponse.ok) {
                  const sucursalData = await sucursalResponse.json()
                  if (sucursalData.sucursales && sucursalData.sucursales.length > 0) {
                    sucursalNombre = sucursalData.sucursales[0].nombre
                  }
                }
              } catch (err) {
                console.error('Error cargando sucursal:', err)
              }
            }
            
            // Procesar actividad económica si es compra
            let actividadNombre = (xmlData as any).codigoActividadEmisorCon || ''
            if ((xmlData as any).compraVentaRevisar === 'Compra' && (xmlData as any).codigoActividadEmisorCon) {
              try {
                const actividadResponse = await fetch(`/api/actividades?channelId=${channelId}&codigo=${(xmlData as any).codigoActividadEmisorCon}`)
                if (actividadResponse.ok) {
                  const actividadData = await actividadResponse.json()
                  if (actividadData.actividades && actividadData.actividades.length > 0) {
                    const actividad = actividadData.actividades[0]
                    actividadNombre = actividad.nombre_personal || actividad.nombre_original || actividadNombre
                  }
                }
              } catch (err) {
                console.error('Error cargando actividad:', err)
              }
            }
            
            const processedItem = {
              ...it,
              _id: it._id ? (typeof it._id === 'string' ? it._id : String(it._id)) : it._id, // Asegurar que _id sea string
              clave: it.clave,
              path: it.path || '', // Campo path desde BD
              ...xmlData, // Combinar datos extraídos del XML
              sucursal: sucursalNombre, // Nombre de sucursal procesado
              codigoActividadEmisorCon: actividadNombre, // Nombre de actividad procesado
              // Mantener el emision para ordenamiento
              emision: it.emision,
              // Asegurar que claveCon esté presente
              claveCon: (xmlData as any).claveCon || it.clave,
              // Convertir emision a fecha si no hay fechaEmisionCon del XML
              fechaEmisionCon: (xmlData as any).fechaEmisionCon || 
                (it.emision && typeof it.emision === 'string' && it.emision.length === 12
                  ? `20${it.emision.slice(0,2)}-${it.emision.slice(2,4)}-${it.emision.slice(4,6)}T${it.emision.slice(6,8)}:${it.emision.slice(8,10)}:${it.emision.slice(10,12)}`
                  : '-')
            }
            
            // Enriquecer con datos de CABYS si codigoCon no está vacío
            const enrichedItem = await enrichRowWithCabysData(processedItem)
            
            mapped.push(enrichedItem)
          }
          
          // Actualizar progreso
          setProgressCurrent(i + 1)
          
          // Pequeña pausa para permitir que la UI se actualice
          if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 10))
          }
        }
        
        // Ocultar barra de progreso
        setShowProgress(false)
        
        // Ordenar por fecha de emisión de forma descendente (más reciente primero)
        const sorted = mapped.sort((a, b) => {
          // Función para convertir fecha a timestamp para comparación
          const getTimestamp = (item: any) => {
            // Si tiene fechaEmisionCon del XML (formato ISO), usarla
            if (item.fechaEmisionCon && item.fechaEmisionCon !== '-' && item.fechaEmisionCon.includes('T')) {
              return new Date(item.fechaEmisionCon).getTime()
            }
            // Si tiene emision (formato YYMMDDHHMMSS), convertirla
            if (item.emision && typeof item.emision === 'string' && item.emision.length === 12) {
              const year = '20' + item.emision.slice(0, 2)
              const month = item.emision.slice(2, 4)
              const day = item.emision.slice(4, 6)
              const hour = item.emision.slice(6, 8)
              const minute = item.emision.slice(8, 10)
              const second = item.emision.slice(10, 12)
              return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).getTime()
            }
            // Valor por defecto para documentos sin fecha
            return 0
          }
          
          const timestampA = getTimestamp(a)
          const timestampB = getTimestamp(b)
          
          return timestampB - timestampA // Descendente (más reciente primero)
        })
        
        setBills(sorted)
        
        // Mostrar modal de logs después de cargar las facturas
        setTimeout(() => {
          setShowFileLogsModal(true)
        }, 500) // Pequeño delay para que la carga se complete
        
      } else {
        setBills([])
      }
    } catch (error) {
      console.error('Error loading bills:', error)
      setBills([])
      setShowProgress(false) // Ocultar barra de progreso en caso de error
    } finally {
      setLoading(false)
    }
  }, [channelId, processXmlData])

  useEffect(() => {
    
    // Solo ejecutar la inicialización una vez por channelId
    if (hasInitialized.current) {
      return
    }
    
    hasInitialized.current = true
    
    // Cargar configuración de columnas desde localStorage
    const savedColumns = localStorage.getItem(`bills-columns-${channelId}`)
    if (savedColumns) {
      try {
        const parsedColumns = JSON.parse(savedColumns)
        
        // Fusionar columnas guardadas con las definiciones actuales
        // para incluir nuevas columnas que puedan haberse agregado
        const mergedColumns = COLUMN_DEFINITIONS.map(defaultCol => {
          const savedCol = parsedColumns.find((col: ColumnDefinition) => col.systemName === defaultCol.systemName)
          return savedCol ? { ...defaultCol, visible: savedCol.visible } : defaultCol
        })
        
        setColumns(mergedColumns)
      } catch (error) {
        console.error('Error parsing saved columns:', error)
        // Si hay error, usar las definiciones por defecto
        setColumns(COLUMN_DEFINITIONS)
      }
    } else {
      // Si no hay columnas guardadas, usar las definiciones por defecto
      setColumns(COLUMN_DEFINITIONS)
    }
    
    // Resetear el flag cuando cambia el channelId para permitir recargar
    hasLoadedBills.current = false
    
    // Cargar facturas cuando cambia el channelId
    loadBills()
  }, [channelId, loadBills])

  const [cancelProgressCallback, setCancelProgressCallback] = useState<(() => void) | null>(null)

  const handleShowProgress = (show: boolean, current: number, total: number, title: string) => {
    setShowProgress(show)
    setProgressCurrent(current)
    setProgressTotal(total)
    setProgressTitle(title)
  }

  const handleCancelProgress = () => {
    if (cancelProgressCallback) {
      cancelProgressCallback()
    }
    setShowProgress(false)
    setCancelProgressCallback(null)
  }

  // Función para enriquecer datos de CABYS
  const enrichRowWithCabysData = async (row: any): Promise<any> => {
    // Solo procesar si codigoCon no está vacío
    if (!row.codigoCon || row.codigoCon.trim() === '') {
      return row
    }

    try {
      let cabysData = null

      // 1. Buscar en la base de datos (cabys_personales)
      try {
        const dbResponse = await fetch(`/api/cabys-personales?codigo=${row.codigoCon}&channelId=${channelId}`)
        if (dbResponse.ok) {
          const result = await dbResponse.json()
          if (result.success && result.cabys) {
            cabysData = result.cabys
          }
        }
      } catch (dbError) {
        console.error('Error loading CABYS from DB:', dbError)
      }

      // 2. Buscar en el archivo JSON si no hay datos completos en DB
      let jsonData = null
      try {
        const jsonResponse = await fetch('/cabys_data.json')
        if (jsonResponse.ok) {
          const cabysDataJson = await jsonResponse.json()
          if (cabysDataJson.data && Array.isArray(cabysDataJson.data)) {
            jsonData = cabysDataJson.data.find((item: any) => item.codigo === row.codigoCon)
          }
        }
      } catch (jsonError) {
        console.error('Error loading CABYS from JSON:', jsonError)
      }

      // 3. Combinar datos (prioridad a DB, rellenar con JSON si hay datos incompletos)
      if (cabysData || jsonData) {
        const enrichedRow = {
          ...row,
          // descripcion -> descripPer (prioridad DB, no hay en JSON)
          descripcion: cabysData?.descripPer || row.descripcion || '',
          // descripGasInv -> descGasInv
          descGasInv: cabysData?.descripGasInv || jsonData?.descripGasInv || row.descripGasInv || '',
          // bienoserv -> bienoserv
          bienoserv: cabysData?.bienoserv || jsonData?.bienoserv || row.bienoserv || '',
          // categ -> categoria
          categ: cabysData?.categoria || jsonData?.categoria || row.categ || '',
          // claActCom -> actEconomica (siempre)
          claActCom: cabysData?.actEconomica || row.claActCom || ''
        }

        // codActVent -> actEconomica (solo si es Venta)
        if (row.compraVentaRevisar === 'Venta') {
          enrichedRow.codActVent = cabysData?.actEconomica || row.codActVent || ''
        }

        // codActComp -> actEconomica (solo si es Compra)
        if (row.compraVentaRevisar === 'Compra') {
          enrichedRow.codActComp = cabysData?.actEconomica || row.codActComp || ''
        }


        return enrichedRow
      }

      // ############################################################################################
      // ############################################################################################
      // ############################################################################################
      // ############################################################################################
      // ############################################################################################

      // DEBO CONSEGUIR QUE TAMBIÉN SE ACTUALICE LOS VALORES DE LA TABLA CUANDO ACTUALIZO EL CABYS DESDE "CABYS->CONSULTAR CABYS REGISTRADOS"
      
      // ############################################################################################
      // ############################################################################################
      // ############################################################################################
      // ############################################################################################
      // ############################################################################################

      // Si no se encontró información, devolver la fila sin modificar
      return row
    } catch (error) {
      console.error('Error enriching row with CABYS data:', error)
      return row
    }
  }

  const handleBillsRemoved = (claves: string[]) => {
    // Eliminar las facturas del estado usando las claves
    setBills(prev => prev.filter(bill => {
      const billClave = bill.claveCon || bill.clave
      return !claves.includes(billClave)
    }))
  }

  const handleBillsAdded = async (rows: any[]) => {
    // Procesar archivos nuevos que vienen del BillsToolbar
    const processedRows = await Promise.all(rows.map(async (row) => {
      if (row.xmlContent) {
        // Es un archivo nuevo con contenido XML sin codificar
        // Cargar datos del canal si no están disponibles
        let channelData = null
        try {
          const channelResponse = await fetch(`/api/channels/current?channelId=${channelId}`)
          if (channelResponse.ok) {
            const channelResult = await channelResponse.json()
            channelData = channelResult.channel
          }
        } catch (error) {
          console.error('Error loading channel data:', error)
        }

        // Procesar XML SIN decodificación Base64 (ahora retorna array)
        const xmlDataArray = processXmlData(row.xmlContent, channelData, false)
        
        // Procesar cada fila generada por el XML
        const processedItems = []
        for (const xmlData of (xmlDataArray as any[])) {
          // Procesar sucursal si es compra
          let sucursalNombre = (xmlData as any).sucursal || ''
          if ((xmlData as any).compraVentaRevisar === 'Compra' && (xmlData as any).sucursal) {
            try {
              const sucursalResponse = await fetch(`/api/sucursales?activityId=&codigo=${(xmlData as any).sucursal}&channelId=${channelId}`)
              if (sucursalResponse.ok) {
                const sucursalData = await sucursalResponse.json()
                if (sucursalData.sucursales && sucursalData.sucursales.length > 0) {
                  sucursalNombre = sucursalData.sucursales[0].nombre
                }
              }
            } catch (err) {
              console.error('Error cargando sucursal:', err)
            }
          }
          
          // Procesar actividad económica si es compra
          let actividadNombre = (xmlData as any).codigoActividadEmisorCon || ''
          if ((xmlData as any).compraVentaRevisar === 'Compra' && (xmlData as any).codigoActividadEmisorCon) {
            try {
              const actividadResponse = await fetch(`/api/actividades?channelId=${channelId}`)
              if (actividadResponse.ok) {
                const actividadData = await actividadResponse.json()
                if (actividadData.actividades) {
                  const actividad = actividadData.actividades.find((act: any) => act.codigo === (xmlData as any).codigoActividadEmisorCon)
                  if (actividad) {
                    actividadNombre = actividad.nombre_personal || actividad.nombre_original || (xmlData as any).codigoActividadEmisorCon
                  }
                }
              }
            } catch (err) {
              console.error('Error cargando actividad:', err)
            }
          }
          
          // Construir el objeto de la fila
          const rowData = {
            ...row,
            ...xmlData,
            sucursal: sucursalNombre,
            codigoActividadEmisorCon: actividadNombre
          }
          
          // Enriquecer con datos de CABYS si codigoCon no está vacío
          const enrichedRow = await enrichRowWithCabysData(rowData)
          
          processedItems.push(enrichedRow)
        }

        return processedItems
      }
      
      return row
    }))

    setBills(prev => {
      // Aplanar el array en caso de que algunos elementos sean arrays (múltiples filas por XML)
      const flattenedRows = processedRows.flat()
      // Combinar las filas existentes con las nuevas procesadas
      const combined = [...prev, ...flattenedRows]
      
      // Ordenar por campo "emision" de forma descendente (más reciente primero)
      const sorted = combined.sort((a, b) => {
        const emisionA = a.emision || '000000000000'
        const emisionB = b.emision || '000000000000'
        
        // Comparación como strings (formato: yymmddhhmmss)
        // Descendente: más reciente primero
        return emisionB.localeCompare(emisionA)
      })
      
      return sorted
    })
  }

  const handleColumnVisibilityChange = (updatedColumns: ColumnDefinition[]) => {
    setColumns(updatedColumns)
    // Guardar configuración en localStorage
    localStorage.setItem(`bills-columns-${channelId}`, JSON.stringify(updatedColumns))
  }

  // Funciones para el sistema de filtros
  const applyFilters = useCallback((bills: any[], filters: ColumnFilter[]) => {
    if (filters.length === 0) {
      return bills
    }

    return bills.filter(bill => {
      return filters.every(filter => {
        const value = bill[filter.systemName]
        const stringValue = value !== null && value !== undefined ? String(value) : ''
        const trimmedValue = stringValue.trim()
        
        // Si no hay valores seleccionados en el filtro, mostrar todo
        if (filter.values.length === 0) return true
        
        // Verificar si el valor está en los valores seleccionados
        const selectedValues = filter.values
          .filter(v => v.checked)
          .map(v => v.value)
        
        // Manejar la opción especial "Vacíos"
        if (selectedValues.includes('__EMPTY__') && trimmedValue === '') {
          return true
        }
        
        // Para valores no vacíos, verificar si está en la lista de valores seleccionados
        if (trimmedValue !== '') {
          return selectedValues.includes(stringValue)
        }
        
        // Si el valor está vacío pero "Vacíos" no está seleccionado, no mostrar
        return false
      })
    })
  }, [])

  const reloadRowsWithCabysCode = async (codigo: string) => {
    if (!codigo || codigo.trim() === '') return

    try {
      // Obtener el estado actual de bills y actualizar las filas afectadas
      setBills((prevBills) => {
        // Crear una promesa para actualizar las filas de forma asíncrona
        Promise.all(
          prevBills.map(async (bill) => {
            // Solo actualizar filas con el mismo codigoCon
            if (bill.codigoCon === codigo) {
              // Volver a enriquecer esta fila con los datos actualizados
              const enrichedBill = await enrichRowWithCabysData(bill)
              return enrichedBill
            }
            return bill
          })
        ).then((updatedBills) => {
          // Actualizar el estado con los datos nuevos
          setBills(updatedBills)
        })
        
        // Retornar el estado sin cambios inmediatamente
        // El estado se actualizará cuando las promesas se resuelvan
        return prevBills
      })
    } catch (error) {
      console.error('Error recargando filas con código CABYS:', error)
    }
  }

  const handleCabysEditClick = (bill: any) => {
    // Solo abrir modal si codigoCon tiene un valor
    if (bill.codigoCon && bill.codigoCon.trim() !== '') {
      // Solo enviamos el código, el modal se encargará de cargar los datos
      setSelectedCabysCodigo(bill.codigoCon)
      setShowCabysEditModal(true)
    }
  }

  const handleCabysEditClose = () => {
    setShowCabysEditModal(false)
    setSelectedCabysCodigo(null)
  }

  const handleCabysEditSave = async (updatedCabys: CabysItem) => {
    
    // Cerrar el modal primero
    setShowCabysEditModal(false)
    setSelectedCabysCodigo(null)
    
    // Recargar las filas que tienen el mismo código CABYS
    // para reflejar los cambios guardados
    await reloadRowsWithCabysCode(updatedCabys.codigo)
  }

  const handleCategorizarClick = async (bill: any) => {
    // Buscar por clave (claveCon o clave)
    const clave = bill.claveCon || bill.clave
    
    if (!clave) {
      console.error('❌ No se puede abrir modal: falta la clave de la factura')
      alert('Error: No se puede identificar la factura. Falta la clave.')
      return
    }

    // Mostrar barra de progreso
    setShowProgress(true)
    setProgressCurrent(0)
    setProgressTotal(1)
    setProgressTitle('Categorizando factura...')

    try {
      // Obtener la factura completa desde la base de datos
      const response = await fetch(`/api/facturas?channelId=${channelId}&clave=${encodeURIComponent(clave)}`)
      
      if (!response.ok) {
        throw new Error('Error al obtener la factura')
      }

      const data = await response.json()
      
      if (!data.success || !data.factura || !data.factura.xml) {
        throw new Error('No se encontró el XML de la factura')
      }

      // Actualizar progreso
      setProgressCurrent(0.3)
      setProgressTitle('Categorizando factura... (Obteniendo datos)')

      // Decodificar XML de Base64
      const xmlString = fromBase64(data.factura.xml)
      
      if (!xmlString) {
        throw new Error('No se pudo decodificar el XML de la factura')
      }

      // Actualizar progreso
      setProgressCurrent(0.5)
      setProgressTitle('Categorizando factura... (Generando categorización)')

      // Generar categorización
      console.log(`⏳ Generando categorización para factura: ${clave}`)
      const categorizacion = await generateCategorizacion(xmlString, channelId)

      // Actualizar progreso
      setProgressCurrent(0.8)
      setProgressTitle('Categorizando factura... (Guardando)')

      // Actualizar categorización en la base de datos
      if (categorizacion && Array.isArray(categorizacion) && categorizacion.length > 0) {
        const updateResponse = await fetch('/api/facturas/categorizar', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            clave: clave,
            channelId: channelId,
            categorizacion: categorizacion
          })
        })

        if (updateResponse.ok) {
          console.log(`✅ Categorización actualizada para: ${clave}`)
        } else {
          const errorData = await updateResponse.json().catch(() => ({}))
          console.error(`❌ Error actualizando categorización para: ${clave}`, errorData)
          // Continuar de todas formas para abrir el modal
        }
      } else {
        console.log(`⚠️ Categorización vacía generada para: ${clave}`)
      }

      // Completar progreso
      setProgressCurrent(1)
      setProgressTitle('Categorización completada')

      // Pequeño delay para que se vea el progreso completo
      await new Promise(resolve => setTimeout(resolve, 300))

      // Ocultar barra de progreso
      setShowProgress(false)

      // Abrir el modal (cargará los datos actualizados desde la BD)
      setSelectedFacturaClave(clave)
      setShowCategorizarModal(true)
    } catch (error) {
      console.error('Error al categorizar factura:', error)
      
      // Ocultar barra de progreso
      setShowProgress(false)
      
      alert('Error al generar la categorización. Se abrirá el modal con los datos existentes.')
      // Abrir el modal de todas formas
      setSelectedFacturaClave(clave)
      setShowCategorizarModal(true)
    }
  }

  const handleCategorizarClose = () => {
    setShowCategorizarModal(false)
    setSelectedFacturaClave(null)
  }

  const handleColumnHeaderClick = (column: ColumnDefinition) => {
    // No permitir filtrar columnas de acción
    const actionColumns = ['opcionElim', 'opcionDesc', 'opcionCategorizar', 'opcionDescartar', 'anadirCabysDes', 'obtenerDoc', 'verdoc', 'anularDoc']
    if (actionColumns.includes(column.systemName)) {
      return
    }

    setSelectedColumn({
      name: column.header,
      systemName: column.systemName
    })
    setShowColumnFilterModal(true)
  }

  const handleApplyFilter = (systemName: string, selectedValues: string[]) => {
    setColumnFilters(prev => {
      // Remover filtro existente para esta columna
      const filteredPrev = prev.filter(f => f.systemName !== systemName)
      
      // Marcar todos los filtros como no siendo el último
      const updatedPrev = filteredPrev.map(f => ({ ...f, isLastFiltered: false }))
      
      // Obtener el filtro existente para esta columna
      const existingFilter = prev.find(f => f.systemName === systemName)
      
      // Lógica corregida para crear el nuevo filtro:
      let newFilterValues: { value: string; checked: boolean }[] = []
      
      if (existingFilter && existingFilter.isLastFiltered) {
        // Era la última columna filtrada: mantener todos los valores originales del filtro
        newFilterValues = existingFilter.values.map(v => ({
          value: v.value,
          checked: selectedValues.includes(v.value)
        }))
      } else {
        // NO era la última columna filtrada o es nuevo filtro: usar solo valores visibles
        const dataToUse = filteredBills.length > 0 ? filteredBills : bills
        const uniqueValues = new Set<string>()
        
        dataToUse.forEach(bill => {
          const value = bill[systemName]
          if (value !== null && value !== undefined && value !== '') {
            uniqueValues.add(String(value))
          }
        })

        newFilterValues = Array.from(uniqueValues).map(value => ({
          value,
          checked: selectedValues.includes(value)
        }))
      }

      const newFilter: ColumnFilter = {
        columnName: selectedColumn?.name || '',
        systemName,
        values: newFilterValues,
        isLastFiltered: true
      }

      return [...updatedPrev, newFilter]
    })
  }

  const handleRemoveFilter = (systemName: string) => {
    setColumnFilters(prev => {
      const filtered = prev.filter(f => f.systemName !== systemName)
      
      // Si hay filtros restantes, marcar el último como isLastFiltered
      if (filtered.length > 0) {
        const updated = [...filtered]
        updated[updated.length - 1].isLastFiltered = true
        return updated
      }
      
      return filtered
    })
  }

  const handleRemoveAllFilters = () => {
    setColumnFilters([])
  }

  // Aplicar filtros cuando cambien los bills o los filtros
  useEffect(() => {
    const filtered = applyFilters(bills, columnFilters)
    setFilteredBills(filtered)
  }, [bills, columnFilters, applyFilters])

  const renderTableHeader = () => {
    const actionColumns = ['opcionElim', 'opcionDesc', 'opcionDescartar', 'anadirCabysDes', 'obtenerDoc', 'verdoc', 'anularDoc']
    
    return (
      <thead>
        <tr>
          {visibleColumns.map((column) => {
            const isFiltered = columnFilters.some(f => f.systemName === column.systemName)
            const isLastFiltered = columnFilters.find(f => f.systemName === column.systemName)?.isLastFiltered
            const isClickable = !actionColumns.includes(column.systemName)
            
            return (
              <th 
                key={column.systemName} 
                className={`${styles.tableHeader} ${isClickable ? styles.clickableHeader : ''} ${isFiltered ? styles.filteredHeader : ''} ${isLastFiltered ? styles.lastFilteredHeader : ''}`}
                onClick={() => isClickable && handleColumnHeaderClick(column)}
                title={isClickable ? 'Haz clic para filtrar esta columna' : ''}
              >
                <div className={styles.headerContent}>
                  <span>{column.header}</span>
                  {isFiltered && (
                    <span className={styles.filterIndicator}>
                      🔽
                    </span>
                  )}
                  {isLastFiltered && (
                    <span className={styles.lastFilterIndicator}>
                      ●
                    </span>
                  )}
                </div>
              </th>
            )
          })}
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
                <span>Cargando facturas...</span>
              </div>
            </td>
          </tr>
        </tbody>
      )
    }

    if (filteredBills.length === 0 && !loading) {
      return (
        <tbody>
          <tr>
            <td colSpan={visibleColumns.length} className={styles.emptyCell}>
              <div className={styles.emptyContent}>
                <span>📄</span>
                <p>{bills.length === 0 ? 'No hay facturas registradas' : 'No hay facturas que coincidan con los filtros aplicados'}</p>
              </div>
            </td>
          </tr>
        </tbody>
      )
    }

    return (
      <tbody>
        {filteredBills.map((bill, index) => (
          <tr key={bill._id || index} className={styles.tableRow}>
            {visibleColumns.map((column) => (
              <td key={column.systemName} className={styles.tableCell}>
                {renderCellContent(bill, column)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    )
  }

  const renderCellContent = (bill: any, column: ColumnDefinition) => {
    const value = bill[column.systemName]
    
    // Columnas de acción especiales
    if (column.systemName === 'opcionElim') {
      const handleDelete = async () => {
        if (!bill.clave) return
        const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar la factura con clave: ${bill.clave}?`)
        if (!confirmed) return

        try {
          const response = await fetch(`/api/facturas?channelId=${channelId}&clave=${encodeURIComponent(bill.clave)}`, {
            method: 'DELETE'
          })

          if (!response.ok) {
            throw new Error('Error en el servidor')
          }

          // Remover de la tabla
          setBills(prev => prev.filter(b => b !== bill))
          alert('Factura eliminada exitosamente')

        } catch (error) {
          console.error('Error eliminando factura:', error)
          alert('Error al eliminar la factura')
        }
      }

      const hasActiveFilters = columnFilters.length > 0
      
      return (
        <button 
          className={`${styles.actionButton} ${hasActiveFilters ? styles.disabled : ''}`}
          title={hasActiveFilters ? "No se puede eliminar mientras hay filtros activos" : "Eliminar"}
          onClick={hasActiveFilters ? undefined : handleDelete}
          disabled={hasActiveFilters}
        >
          🗑️
        </button>
      )
    }

    if (column.systemName === 'opcionDesc') {
      const handleDownload = async () => {
        try {
          if (!bill.clave) {
            alert('No hay clave disponible para descargar')
            return
          }

          // Hacer consulta a la base de datos para obtener el registro completo
          const response = await fetch(`/api/facturas?channelId=${channelId}&clave=${encodeURIComponent(bill.clave)}`)
          
          if (!response.ok) {
            throw new Error('Error al obtener el registro de la base de datos')
          }

          const data = await response.json()
          
          if (!data.success || !data.factura || !data.factura.xml) {
            alert('No se encontró el XML en la base de datos')
            return
          }

          // Decodificar XML de Base64
          const decodedXML = decodeURIComponent(escape(window.atob(data.factura.xml)))
          
          // Crear blob y descargar
          const blob = new Blob([decodedXML], { type: 'application/xml' })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${bill.clave || 'documento'}.xml`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        } catch (error) {
          console.error('Error descargando archivo:', error)
          alert('Error al descargar el archivo XML')
        }
      }

      return (
        <button className={styles.actionButton} title="Descargar XML" onClick={handleDownload}>
          📥
        </button>
      )
    }

    if (column.systemName === 'opcionCategorizar') {
      return (
        <button 
          className={styles.actionButton} 
          title="Categorizar factura" 
          onClick={() => handleCategorizarClick(bill)}
        >
          🏷️
        </button>
      )
    }
    
    if (column.systemName === 'opcionDescartar') {
      const handleDiscard = async () => {
        if (!bill.clave) return
        
        const confirmed = window.confirm(`¿Estás seguro de que deseas descartar la factura con clave: ${bill.clave}?`)
        if (!confirmed) return

        try {
          // Extraer tipoDoc (dígitos 9-10 del numeroConsecutivoCon)
          const numeroConsecutivo = bill.numeroConsecutivoCon || ''
          const tipoDoc = numeroConsecutivo.length >= 10 ? 
            numeroConsecutivo.substring(8, 10) : ''

          // Preparar datos para guardar en facturas_descartadas
          const discardData = {
            clave: bill.clave || bill.claveCon || '',
            nombre: bill.path || '',
            tipoDoc: tipoDoc || '',
            dia: bill.diaDoc || '',
            mes: bill.mesDoc || '',
            anno: bill.annoDoc || '',
            nombreEmisor: bill.nombreCon || '',
            cedulaEmisor: bill.numeroCon || '',
            nombreReceptor: bill.nombre2Con || '',
            cedulaReceptor: bill.numero2Con || '',
            total: bill.totalComprobanteCon || '',
            impuesto: bill.totalImpuestoCon || '',
            xml: bill.xml || '', // XML en Base64 tal como está almacenado
            channel_id: channelId
          }

          // Crear registro en facturas_descartadas
          const response = await fetch('/api/facturas-descartadas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(discardData)
          })

          const result = await response.json()

          if (result.success) {
            // Eliminar de la colección facturas
            const deleteResponse = await fetch(`/api/facturas?channelId=${channelId}&clave=${encodeURIComponent(bill.clave || bill.claveCon)}`, {
              method: 'DELETE'
            })

            if (deleteResponse.ok) {
              // Remover de la tabla
              setBills(prev => prev.filter(b => b !== bill))
              alert('Factura descartada exitosamente')
            } else {
              alert('Error al eliminar la factura de la base de datos')
            }
          } else {
            alert(result.error || 'Error al descartar la factura')
          }
        } catch (error) {
          console.error('Error al descartar factura:', error)
          alert('Error al descartar la factura')
        }
      }

      return (
        <button className={styles.actionButton} title="Descartar" onClick={handleDiscard}>
          ❌
        </button>
      )
    }
    
    if (column.systemName === 'obtenerDoc') {
      return (
        <button className={styles.actionButton} title="Obtener respuesta">
          📥
        </button>
      )
    }
    
    if (column.systemName === 'verdoc') {
      return (
        <button className={styles.actionButton} title="Ver respuesta">
          👁️
        </button>
      )
    }
    
    if (column.systemName === 'anularDoc') {
      return (
        <button className={styles.actionButton} title="Anular factura">
          🚫
        </button>
      )
    }
    
    if (column.systemName === 'anadirCabysDes') {
      // Solo mostrar el botón si codigoCon no está vacío
      if (!bill.codigoCon || bill.codigoCon.trim() === '') {
        return null
      }
      
      return (
        <button 
          className={styles.actionButton} 
          title="Añadir CABYS" 
          onClick={() => handleCabysEditClick(bill)}
        >
          ➕
        </button>
      )
    }

    // Columna compraVentaRevisar con colores específicos
    if (column.systemName === 'compraVentaRevisar') {
      const colorClass = 
        value === 'Venta' ? styles.venta :
        value === 'Compra' ? styles.compra :
        value === 'Documento de importación' ? styles.importacion :
        value === 'Documento MyCompaXML' ? styles.mycompaxmldoc :
        styles.indeterminable
      
      return (
        <span className={colorClass}>
          {value || '-'}
        </span>
      )
    }

    // Columna tipoDocNom - sin color especial para documentos de importación
    if (column.systemName === 'tipoDocNom') {
      // No aplicar color para "Documento de importación"
      return value || '-'
    }

    // Valor por defecto
    return value || '-'
  }

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <BillsToolbar
        onFilterColumns={() => setShowFilterModal(true)}
        onBillsAdded={handleBillsAdded}
        onBillsRemoved={handleBillsRemoved}
        channelId={channelId}
        hasActiveFilters={columnFilters.length > 0}
        onShowProgress={(show, current, total, title) => {
          handleShowProgress(show, current, total, title)
          // Si el título indica categorización, preparar el callback de cancelación
          if (show && title.includes('Categorizando')) {
            // El callback se establecerá cuando BillsToolbar lo pase
          }
        }}
        onCancelProgress={(callback) => {
          setCancelProgressCallback(() => callback)
        }}
      />

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>📊 Tabla de Facturas</h2>
          <span className={styles.recordCount}>
            {loading ? 'Cargando...' : `${filteredBills.length} de ${bills.length} registros`}
          </span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          {renderTableHeader()}
          {renderTableBody()}
        </table>
      </div>

      {/* Modal de visibilidad de columnas */}
      {showFilterModal && (
        <ColumnVisibilityModal
          isOpen={showFilterModal}
          columns={columns}
          onApply={handleColumnVisibilityChange}
          onClose={() => setShowFilterModal(false)}
        />
      )}

      {/* Modal de filtros por columna */}
      {showColumnFilterModal && selectedColumn && (
        <ColumnValueFilterModal
          isOpen={showColumnFilterModal}
          onClose={() => setShowColumnFilterModal(false)}
          columnName={selectedColumn.name}
          systemName={selectedColumn.systemName}
          data={bills}
          filteredData={filteredBills}
          currentFilters={columnFilters}
          onApplyFilter={handleApplyFilter}
          onRemoveFilter={handleRemoveFilter}
          onRemoveAllFilters={handleRemoveAllFilters}
          isLastFiltered={columnFilters.find(f => f.systemName === selectedColumn.systemName)?.isLastFiltered || false}
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

      {/* Barra de progreso */}
      <ProgressBar
        current={progressCurrent}
        total={progressTotal}
        isVisible={showProgress}
        title={progressTitle}
        onCancel={progressTitle.includes('Categorizando') ? handleCancelProgress : undefined}
      />

      {/* Modal de edición de CABYS */}
      {showCabysEditModal && selectedCabysCodigo && (
        <CabysEditModal
          codigo={selectedCabysCodigo}
          channelId={channelId}
          onSave={handleCabysEditSave}
          onClose={handleCabysEditClose}
        />
      )}

      {/* Modal de categorización */}
      {showCategorizarModal && selectedFacturaClave && (
        <CategorizarFacturaModal
          clave={selectedFacturaClave}
          channelId={channelId}
          onClose={handleCategorizarClose}
        />
      )}
    </div>
  )
}
