'use client'
import React, { useState, useEffect, useCallback } from 'react'
import BillsToolbar from './BillsToolbar'
import ColumnFilterModal from './ColumnFilterModal'
import styles from './BillsTable.module.css'

// Definición de columnas con sus propiedades
export interface ColumnDefinition {
  header: string
  systemName: string
  visible: boolean
}

export const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  { header: "Eliminar", systemName: "opcionElim", visible: true },
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
  { header: "Ley (Autorizado por ley especial)", systemName: "leyALECon", visible: true },
  { header: "Artículo (Autorizado por ley especial)", systemName: "articuloALECon", visible: true },
  { header: "Inciso (Autorizado por ley especial)", systemName: "incisoALECon", visible: true },
  { header: "Monto (Autorizado por ley especial)", systemName: "montoALECon", visible: true },
  { header: "Impuesto (Autorizado por ley especial)", systemName: "impuestoALECon", visible: true },
  { header: "Tipo (Mercancía importada)", systemName: "tipoMercImpor", visible: true },
  { header: "País importador", systemName: "paisImportador", visible: true },
  { header: "Condición de la venta", systemName: "condicionVentaCon", visible: true },
  { header: "Condición de la venta (Otros)", systemName: "condicionVentaOtrosCon", visible: true },
  { header: "Plazo de crédito", systemName: "plazoCreditoCon", visible: true },
  { header: "Medio de pago", systemName: "medioPagoCon", visible: true },
  { header: "Tipo medio de pago", systemName: "tipoMedioPagoCon", visible: true },
  { header: "Medio de pago OTROS", systemName: "medioPagoOtroCon", visible: true },
  { header: "Tipo de moneda", systemName: "tipoMonedaLinea", visible: false },
  { header: "Número de línea", systemName: "numeroLineaCon", visible: true },
  { header: "Partida arancelaria", systemName: "partidaArancelariaCon", visible: true },
  { header: "CABYS", systemName: "codigoCon", visible: true },
  { header: "Añadir cabys", systemName: "anadirCabysDes", visible: true },
  { header: "Descripción", systemName: "descripcion", visible: true },
  { header: "Gasto o inventario", systemName: "descGasInv", visible: true },
  { header: "Bien o servicio", systemName: "bienoserv", visible: true },
  { header: "Categoría", systemName: "categ", visible: true },
  { header: "Actividad económica (Venta)", systemName: "codActVent", visible: true },
  { header: "Actividad económica (Compra)", systemName: "codActComp", visible: true },
  { header: "Actividad económica asociada", systemName: "claActCom", visible: true },
  { header: "Detalle de la mercancía", systemName: "detalleCon", visible: true },
  { header: "Descripción personalizada", systemName: "agrDesc", visible: true },
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
  const [loading, setLoading] = useState(true)

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

      // Extraer datos básicos
      const clave = extractTagValue(xmlDoc, 'Clave')
      const fechaEmision = extractTagValue(xmlDoc, 'FechaEmision')
      const numeroConsecutivo = extractTagValue(xmlDoc, 'NumeroConsecutivo')
      const proveedorSistemas = extractTagValue(xmlDoc, 'ProveedorSistemas')
      // Buscar códigos de actividad en el contexto del Emisor y Receptor
      const codigoActividadEmisor = extractContextValue(xmlDoc, 'Emisor', 'CodigoActividad') || 
                                   extractContextValue(xmlDoc, 'Emisor', 'CodigoActividadEmisor') ||
                                   extractTagValue(xmlDoc, 'CodigoActividad') || 
                                   extractTagValue(xmlDoc, 'CodigoActividadEmisor')
      const codigoActividadReceptor = extractContextValue(xmlDoc, 'Receptor', 'CodigoActividadReceptor') ||
                                     extractTagValue(xmlDoc, 'CodigoActividadReceptor')

      // Debug logging para códigos de actividad
      console.log('Códigos de actividad extraídos:')
      console.log('- Emisor (CodigoActividad):', extractContextValue(xmlDoc, 'Emisor', 'CodigoActividad'))
      console.log('- Emisor (CodigoActividadEmisor):', extractContextValue(xmlDoc, 'Emisor', 'CodigoActividadEmisor'))
      console.log('- Global (CodigoActividad):', extractTagValue(xmlDoc, 'CodigoActividad'))
      console.log('- Global (CodigoActividadEmisor):', extractTagValue(xmlDoc, 'CodigoActividadEmisor'))
      console.log('- Receptor (CodigoActividadReceptor):', extractContextValue(xmlDoc, 'Receptor', 'CodigoActividadReceptor'))
      console.log('- Global (CodigoActividadReceptor):', extractTagValue(xmlDoc, 'CodigoActividadReceptor'))
      console.log('- Resultado final emisor:', codigoActividadEmisor)
      console.log('- Resultado final receptor:', codigoActividadReceptor)
      
      // Extraer datos de emisor y receptor para comparación
      const numeroCon = extractContextValue(xmlDoc, 'Emisor', 'Numero')
      const numero2Con = extractContextValue(xmlDoc, 'Receptor', 'Numero')
      
      // Procesar sucursal (primeros 3 dígitos del consecutivo)
      const sucursalCodigo = numeroConsecutivo.slice(0, 3)
      
      // Procesar tipo de documento (dígitos 9 y 10 del consecutivo)
      const tipoDocCodigo = numeroConsecutivo.slice(8, 10)
      const tipoDocNom = getTipoDocumentoNombre(tipoDocCodigo)
      
      // Determinar si es Venta, Compra o Indeterminable
      let compraVentaRevisar = 'Indeterminable'
      if (channelData && channelData.ident) {
        if (numeroCon === channelData.ident && numero2Con !== channelData.ident) {
          compraVentaRevisar = 'Venta'
        } else if (numero2Con === channelData.ident && numeroCon !== channelData.ident) {
          compraVentaRevisar = 'Compra'
        }
      }

      // Extraer todos los datos necesarios para las columnas de la tabla
      return {
        // Datos básicos procesados
        claveCon: clave,
        fechaEmisionCon: fechaEmision,
        numeroConsecutivoCon: numeroConsecutivo,
        tipoDocNom: tipoDocNom,
        
        // Datos específicos solicitados
        proveedorSistemasCon: proveedorSistemas,
        compraVentaRevisar: compraVentaRevisar,
        sucursal: sucursalCodigo, // Se procesará más en el componente si es necesario
        codigoActividadEmisorCon: codigoActividadEmisor,
        codigoActividadReceptorCon: codigoActividadReceptor,
        
        // Datos del Emisor
        nombreCon: extractContextValue(xmlDoc, 'Emisor', 'Nombre'),
        tipoCon: extractContextValue(xmlDoc, 'Emisor', 'Tipo'),
        numeroCon: extractContextValue(xmlDoc, 'Emisor', 'Numero'),
        nombreComercialCon: extractContextValue(xmlDoc, 'Emisor', 'NombreComercial'),
        correoElectronicoCon: extractContextValue(xmlDoc, 'Emisor', 'CorreoElectronico'),
        registroFiscalCon: extractContextValue(xmlDoc, 'Emisor', 'NumRegimen'),
        
        // Datos del Receptor
        nombre2Con: extractContextValue(xmlDoc, 'Receptor', 'Nombre'),
        tipo2Con: extractContextValue(xmlDoc, 'Receptor', 'Tipo'),
        numero2Con: extractContextValue(xmlDoc, 'Receptor', 'Numero'),
        nombreComercial2Con: extractContextValue(xmlDoc, 'Receptor', 'NombreComercial'),
        correoElectronico2Con: extractContextValue(xmlDoc, 'Receptor', 'CorreoElectronico'),
        
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
        
        // Moneda
        codigoMonedaCon: extractTagValue(xmlDoc, 'CodigoMoneda'),
        tipoCambioCon: extractTagValue(xmlDoc, 'TipoCambio'),
        
        // Fechas adicionales
        diaDoc: extractTagValue(xmlDoc, 'FechaEmision')?.split('-')[2]?.split('T')[0] || '',
        mesDoc: extractTagValue(xmlDoc, 'FechaEmision')?.split('-')[1] || '',
        annoDoc: extractTagValue(xmlDoc, 'FechaEmision')?.split('-')[0] || '',
      }
    } catch (error) {
      console.error('Error procesando XML:', error)
      return {}
    }
  }, [])

  const loadBills = useCallback(async () => {
    setLoading(true)
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
        const items = Array.isArray(data.facturas) ? data.facturas : []
        
        const mapped = await Promise.all(items.map(async (it: any) => {
          // Decodificar XML de Base64 (datos de BD)
          const xmlString = it.xml ? fromBase64(it.xml) : ''
          
          // Procesar XML para extraer datos (SÍ necesita decodificación Base64)
          const xmlData = xmlString ? processXmlData(xmlString, channelData, true) : {}
          
          // Procesar sucursal si es compra
          let sucursalNombre = xmlData.sucursal || ''
          if (xmlData.compraVentaRevisar === 'Compra' && xmlData.sucursal) {
            try {
              const sucursalResponse = await fetch(`/api/sucursales?activityId=&codigo=${xmlData.sucursal}&channelId=${channelId}`)
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
          let actividadNombre = xmlData.codigoActividadEmisorCon || ''
          if (xmlData.compraVentaRevisar === 'Compra' && xmlData.codigoActividadEmisorCon) {
            try {
              const actividadResponse = await fetch(`/api/actividades?channelId=${channelId}&codigo=${xmlData.codigoActividadEmisorCon}`)
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
          
          return {
            ...it,
            clave: it.clave,
            path: it.path || '', // Campo path desde BD
            ...xmlData, // Combinar datos extraídos del XML
            sucursal: sucursalNombre, // Nombre de sucursal procesado
            codigoActividadEmisorCon: actividadNombre, // Nombre de actividad procesado
            // Mantener el emision para ordenamiento
            emision: it.emision,
            // Asegurar que claveCon esté presente
            claveCon: xmlData.claveCon || it.clave,
            // Convertir emision a fecha si no hay fechaEmisionCon del XML
            fechaEmisionCon: xmlData.fechaEmisionCon || 
              (it.emision && typeof it.emision === 'string' && it.emision.length === 12
                ? `20${it.emision.slice(0,2)}-${it.emision.slice(2,4)}-${it.emision.slice(4,6)}T${it.emision.slice(6,8)}:${it.emision.slice(8,10)}:${it.emision.slice(10,12)}`
                : '-')
          }
        }))
        
        // Ordenar por campo "emision" de forma descendente (más reciente primero)
        const sorted = mapped.sort((a, b) => {
          const emisionA = a.emision || '000000000000'
          const emisionB = b.emision || '000000000000'
          return emisionB.localeCompare(emisionA)
        })
        
        setBills(sorted)
      } else {
        setBills([])
      }
    } catch (error) {
      console.error('Error loading bills:', error)
      setBills([])
    } finally {
      setLoading(false)
    }
  }, [channelId, processXmlData])

  useEffect(() => {
    // Cargar configuración de columnas desde localStorage
    const savedColumns = localStorage.getItem(`bills-columns-${channelId}`)
    if (savedColumns) {
      try {
        const parsedColumns = JSON.parse(savedColumns)
        setColumns(parsedColumns)
      } catch (error) {
        console.error('Error parsing saved columns:', error)
      }
    }
    
    // Aquí cargarías los datos reales de facturas
    // Por ahora simulamos datos vacíos
    loadBills()
  }, [channelId, loadBills])

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

        // Procesar XML SIN decodificación Base64
        const xmlData = processXmlData(row.xmlContent, channelData, false)
        
        // Procesar sucursal si es compra
        let sucursalNombre = xmlData.sucursal || ''
        if (xmlData.compraVentaRevisar === 'Compra' && xmlData.sucursal) {
          try {
            const sucursalResponse = await fetch(`/api/sucursales?activityId=&codigo=${xmlData.sucursal}&channelId=${channelId}`)
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
        let actividadNombre = xmlData.codigoActividadEmisorCon || ''
        if (xmlData.compraVentaRevisar === 'Compra' && xmlData.codigoActividadEmisorCon) {
          try {
            const actividadResponse = await fetch(`/api/actividades?channelId=${channelId}`)
            if (actividadResponse.ok) {
              const actividadData = await actividadResponse.json()
              if (actividadData.actividades) {
                const actividad = actividadData.actividades.find((act: any) => act.codigo === xmlData.codigoActividadEmisorCon)
                if (actividad) {
                  actividadNombre = actividad.nombre_personal || actividad.nombre_original || xmlData.codigoActividadEmisorCon
                }
              }
            }
          } catch (err) {
            console.error('Error cargando actividad:', err)
          }
        }

        return {
          ...row,
          ...xmlData,
          sucursal: sucursalNombre,
          codigoActividadEmisorCon: actividadNombre
        }
      }
      
      return row
    }))

    setBills(prev => {
      // Combinar las filas existentes con las nuevas procesadas
      const combined = [...prev, ...processedRows]
      
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

  const renderTableHeader = () => (
    <thead>
      <tr>
        {visibleColumns.map((column) => (
          <th key={column.systemName} className={styles.tableHeader}>
            {column.header}
          </th>
        ))}
      </tr>
    </thead>
  )

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

    if (bills.length === 0) {
      return (
        <tbody>
          <tr>
            <td colSpan={visibleColumns.length} className={styles.emptyCell}>
              <div className={styles.emptyContent}>
                <span>📄</span>
                <p>No hay facturas registradas</p>
              </div>
            </td>
          </tr>
        </tbody>
      )
    }

    return (
      <tbody>
        {bills.map((bill, index) => (
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

      return (
        <button className={styles.actionButton} title="Eliminar" onClick={handleDelete}>
          🗑️
        </button>
      )
    }
    
    if (column.systemName === 'opcionDescartar') {
      return (
        <button className={styles.actionButton} title="Descartar">
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
      return (
        <button className={styles.actionButton} title="Añadir CABYS">
          ➕
        </button>
      )
    }

    // Columna compraVentaRevisar con colores específicos
    if (column.systemName === 'compraVentaRevisar') {
      const colorClass = 
        value === 'Venta' ? styles.venta :
        value === 'Compra' ? styles.compra :
        styles.indeterminable
      
      return (
        <span className={colorClass}>
          {value || '-'}
        </span>
      )
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
        channelId={channelId}
      />

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>📊 Tabla de Facturas</h2>
          <span className={styles.recordCount}>
            {loading ? 'Cargando...' : `${bills.length} registros`}
          </span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          {renderTableHeader()}
          {renderTableBody()}
        </table>
      </div>

      {/* Modal de filtrado de columnas */}
      {showFilterModal && (
        <ColumnFilterModal
          columns={columns}
          onApply={handleColumnVisibilityChange}
          onClose={() => setShowFilterModal(false)}
        />
      )}
    </div>
  )
}
