'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import styles from './NuevaFacturaModal.module.css'
import AdditionalInfoEditor, { type AdditionalInfoNode } from './AdditionalInfoEditor'

interface NuevaFacturaModalProps {
  isOpen: boolean
  onClose: () => void
  channelId: string
  userId: string
  onFacturaGenerada?: () => void
}

interface InvoiceData {
  actividadEconomica: {
    _id: string
    nombre_personal: string
    codigo: string
  } | null
  sucursal: {
    _id: string
    nombre: string
    codigo: string
    provincia?: string
    canton?: string
    distrito?: string
    direccion?: string
  } | null
  caja: {
    _id: string
    numero: string
    numeracion_facturas: { [key: string]: string }
  } | null
  channel: {
    _id: string
    name: string
    ident_type: string
    ident: string
    commercial_name: string
    phone_code: string
    phone: string
    email: string
    registro_fiscal_IVA: string
    crypto_key?: {
      status?: string
    }
  } | null
}

interface UbicacionesData {
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

interface ActividadEconomica {
  name: number | string
  description: string
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
  act_ecos?: string[]
}

interface ProductoSurtidoItem {
  cabys: string
  titulo: string
  descripcion: string
  tipo: string
  precio: number
  cantidad: number
  codigoComercial: string
  tipoCodigoComercial: string
  unidadMedida: string
  unidadMedidaComercial: string
  montoDescuento: number
  codigoDescuento: string
  detalleDescuento: string
  ivaCobradoFabrica: number
  baseImponible: number
  codigoImpuesto: string
  detalleImpuesto: string
  tipoTarifa: string
  tarifa: number
  cantidadUnidadMedida: number
  porcentajeEspecifico: number
  proporcion: number
  volumenPorUnidadConsumo: number
  impuestoPorUnidad: number
}

interface InventarioItem {
  _id: string
  descripcion: string
  titulo: string
  partidaArancelaria: string
  cabys: string
  codigoComercial: string
  tipoCodigoComercial: string
  unidadMedida: string
  unidadMedidaComercial: string
  tipoTransaccion: string
  esMedicamento: boolean
  registro: string
  formaFarmaceutica: string
  esVinSerie: boolean
  numeroVinSerie: string
  naturalezaDescuento: string
  codigoDescuento: string
  detalleDescuento: string
  codigoImpuesto: string
  detalleImpuesto: string
  tipoTarifa: string
  tipoTarifaGeneral: string
  esEspecifico: boolean
  proporcion: number
  porcentajeEspecifico: number
  factorCalculoIVA: number
  impuestoPorUnidad: number
  cantidadUnidadMedida: number
  volumenPorUnidadConsumo: number
  documentoExoneracion: string
  detalleExoneracion: string
  numeroDocumentoExoneracion: string
  articuloExoneracion: string
  incisoExoneracion: string
  institucionExoneracion: string
  detalleInstitucionExoneracion: string
  fechaAutorizacionExoneracion: string
  montoExportacion: number
  cantidad: number
  precio: number
  image?: string
  tieneDescuento?: boolean
  tipoDescuento?: string
  montoDescuento?: number
  tieneImpuesto?: boolean
  tarifa?: number
  tieneExoneracion?: boolean
  porcentajeExoneracion?: number
  baseImponible?: number
  tipoMercancia?: string
  detalleSurtido?: ProductoSurtidoItem[]
}

interface desgloseImpuesto {
  codigo: string
  condigoTarifaIVA: string
  totalMontoImpuesto: number
}

interface medioPago {
  tipoMedioPago: string
  medioPagoOtros: string
  totalMedioPago: number
}

interface TotalesFinales {
  totalServGravados: number
  totalServExentos: number
  totalServExonerado: number
  totalServNoSujeto: number
  totalMercanciasGravadas: number
  totalMercanciasExentas: number
  totalMercExonerada: number
  totalMercNoSujeta: number
  totalGravado: number
  totalExento: number
  totalExonerado: number
  totalNoSujeto: number
  totalVenta: number
  totalDescuentos: number
  totalVentaNeta: number
  totalDesgloseImpuesto: desgloseImpuesto[]
  totalImpuesto: number
  totalImpAsumEmisorFabrica: number
  totalIVADevuelto: number
  totalOtrosCargos: number
  medioPago: medioPago[]
  totalComprobante: number
}

interface OtroCargo {
  id: string
  tipoDocumento: string
  detalleOtros: string
  porcentajeCargo: string
  montoCargo: string
  detalleCargo: string
  esTercero: boolean
  nombreTercero: string
  tipoTercero: string
  numeroIdentificacion: string
}

interface MedioPagoItem {
  id: string
  tipoMedioPago: string
  descripcion: string
  totalMedioPago: number
  usarTotalVenta: boolean
}

interface LineOptions {
  applyDiscount: boolean
  applyTax: boolean
  applyExoneration: boolean
}

const TIPOS_DOCUMENTO = [
  { value: '01', label: '01 - Factura electrónica' },
  { value: '02', label: '02 - Nota de débito electrónica' },
  { value: '03', label: '03 - Nota de crédito electrónica' },
  { value: '04', label: '04 - Tiquete electrónico' },
  { value: '08', label: '08 - Factura electrónica de compras' },
  { value: '09', label: '09 - Factura electrónica de exportación' },
  { value: '10', label: '10 - Recibo Electrónico de Pago' }
]

const TIPOS_IDENTIFICACION: { [key: string]: string } = {
  '01': 'Física',
  '02': 'Jurídica',
  '03': 'DIMEX',
  '04': 'NITE',
  '##': 'Extranjero'
}

const TIPOS_DOCUMENTO_CARGO = [
  { value: '01', label: '01 - Contribución parafiscal' },
  { value: '02', label: '02 - Timbre de la Cruz Roja' },
  { value: '03', label: '03 - Timbre de Benemérito Cuerpo de Bomberos de Costa Rica' },
  { value: '04', label: '04 - Cobro de un tercero' },
  { value: '05', label: '05 - Costos de Exportación' },
  { value: '06', label: '06 - Impuesto de servicio 10%' },
  { value: '07', label: '07 - Timbre de Colegios Profesionales' },
  { value: '99', label: '99 - Otros Cargos' }
]

const TIPOS_DOCUMENTO_REFERENCIA = [
  { value: '01', label: '01 - Factura electrónica' },
  { value: '02', label: '02 - Nota de débito electrónica' },
  { value: '03', label: '03 - Nota de crédito electrónica' },
  { value: '04', label: '04 - Tiquete electrónico' },
  { value: '05', label: '05 - Nota de despacho' },
  { value: '06', label: '06 - Contrato' },
  { value: '07', label: '07 - Procedimiento' },
  { value: '08', label: '08 - Comprobante emitido en contingencia' },
  { value: '09', label: '09 - Devolución mercadería' },
  { value: '10', label: '10 - Sustituye factura rechazada por el Ministerio de Hacienda' },
  { value: '11', label: '11 - Sustituye factura rechazada por el Receptor del comprobante' },
  { value: '12', label: '12 - Sustituye Factura de exportación' },
  { value: '13', label: '13 - Facturación mes vencido' },
  { value: '14', label: '14 - Comprobante aportado por contribuyente del Régimen de Tributación Simplificado' },
  { value: '15', label: '15 - Sustituye una Factura electrónica de Compra' },
  { value: '99', label: '99 - Otros' }
]

const CODIGOS_REFERENCIA = [
  { value: '01', label: '01 - Anula Documento de Referencia' },
  { value: '02', label: '02 - Corrige monto' },
  { value: '04', label: '04 - Referencia a otro documento' },
  { value: '05', label: '05 - Sustituye comprobante provisional por contingencia' },
  { value: '99', label: '99 - Otros' }
]

const CONDICIONES_VENTA = [
  { value: '01', label: '01 - Contado' },
  { value: '02', label: '02 - Crédito' },
  { value: '03', label: '03 - Consignación' },
  { value: '04', label: '04 - Apartado' },
  { value: '05', label: '05 - Arrendamiento con opción de compra' },
  { value: '06', label: '06 - Arrendamiento en función financiera' },
  { value: '07', label: '07 - Cobro a favor de un tercero' },
  { value: '08', label: '08 - Servicios prestados al Estado' },
  { value: '09', label: '09 - Pago de servicios prestado al Estado' },
  { value: '10', label: '10 - Venta a crédito en IVA hasta 90 días (Artículo 27, LIVA)' },
  { value: '11', label: '11 - Pago de venta a crédito en IVA hasta 90 días (Artículo 27, LIVA)' },
  { value: '12', label: '12 - Venta Mercancía No Nacionalizada' },
  { value: '13', label: '13 - Venta Bienes Usados No Contribuyente' },
  { value: '14', label: '14 - Arrendamiento Operativo' },
  { value: '15', label: '15 - Arrendamiento Financiero' },
  { value: '99', label: '99 - Otros' }
]

const UNIDADES_PLAZO = [
  { value: 'Días', label: 'Días' },
  { value: 'Meses', label: 'Meses' },
  { value: 'Años', label: 'Años' }
]

const TIPOS_MONEDA = [
  { value: 'CRC', label: 'Colón costarricense (CRC)' },
  { value: 'USD', label: 'Dólar Americano (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'JPY', label: 'Yen japonés (JPY)' }
]

const TIPOS_MEDIO_PAGO = [
  { value: '01', label: '01 - Efectivo' },
  { value: '02', label: '02 - Tarjeta' },
  { value: '03', label: '03 - Cheque' },
  { value: '04', label: '04 - Transferencia – depósito bancario' },
  { value: '05', label: '05 - Recaudado por terceros' },
  { value: '99', label: '99 - Otros' }
]

export default function NuevaFacturaModal({ isOpen, onClose, channelId, userId, onFacturaGenerada }: NuevaFacturaModalProps) {
  const [tipoDocumento, setTipoDocumento] = useState('01')
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [consecutivo, setConsecutivo] = useState('')
  const [ubicaciones, setUbicaciones] = useState<UbicacionesData | null>(null)
  const [ubicacionTexto, setUbicacionTexto] = useState('')

  // Estados para información del receptor
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('')
  const [actividadesEconomicas, setActividadesEconomicas] = useState<ActividadEconomica[]>([])
  const [actividadEconomicaSearch, setActividadEconomicaSearch] = useState('')
  const [actividadEconomicaFiltrada, setActividadEconomicaFiltrada] = useState<ActividadEconomica[]>([])
  const [actividadEconomicaSeleccionada, setActividadEconomicaSeleccionada] = useState<string>('')
  const [showActividadEconomicaDropdown, setShowActividadEconomicaDropdown] = useState(false)
  const actividadEconomicaInputRef = useRef<HTMLInputElement | null>(null)

  // Estados para campos del receptor
  const [nombreReceptor, setNombreReceptor] = useState('')
  const [tipoIdentificacionReceptor, setTipoIdentificacionReceptor] = useState('')
  const [numeroIdentificacionReceptor, setNumeroIdentificacionReceptor] = useState('')
  const [nombreComercialReceptor, setNombreComercialReceptor] = useState('')
  const [codigoPaisReceptor, setCodigoPaisReceptor] = useState('')
  const [numeroTelefonoReceptor, setNumeroTelefonoReceptor] = useState('')
  const [correoElectronicoReceptor, setCorreoElectronicoReceptor] = useState('')
  const [provinciaReceptor, setProvinciaReceptor] = useState('')
  const [cantonReceptor, setCantonReceptor] = useState('')
  const [distritoReceptor, setDistritoReceptor] = useState('')
  const [otrasSenasReceptor, setOtrasSenasReceptor] = useState('')

  // Estados para selects dependientes de ubicación
  const [cantonesDisponibles, setCantonesDisponibles] = useState<{ [key: string]: string }>({})
  const [distritosDisponibles, setDistritosDisponibles] = useState<{ [key: string]: string }>({})

  // Estado para búsqueda en Hacienda
  const [searchingHacienda, setSearchingHacienda] = useState(false)

  // Estados para condición de la venta
  const [condicionVenta, setCondicionVenta] = useState('')
  const [especificacion, setEspecificacion] = useState('')
  const [plazoCredito, setPlazoCredito] = useState('')
  const [unidadPlazoCredito, setUnidadPlazoCredito] = useState('Días')

  // Estados para tipo de cambio
  const [tipoMoneda, setTipoMoneda] = useState('CRC')
  const [cambioMoneda, setCambioMoneda] = useState('1')
  const [loadingCambio, setLoadingCambio] = useState(false)

  // Estados para detalle de la factura basado en inventario
  const [inventarioItems, setInventarioItems] = useState<InventarioItem[]>([])
  const [cantidadesSeleccionadas, setCantidadesSeleccionadas] = useState<Record<string, number>>({})

  // Estado para sección de totales collapsable
  const [totalsExpanded, setTotalsExpanded] = useState(false)
  const [lineOptions, setLineOptions] = useState<Record<string, LineOptions>>({})

  // Estados para Documento de referencia
  const [referenceFile, setReferenceFile] = useState<File | null>(null)
  const [referenceFilePath, setReferenceFilePath] = useState('')
  const [referenceClave, setReferenceClave] = useState('')
  const [referenceTipoDocumento, setReferenceTipoDocumento] = useState('')
  const [referenceCodigo, setReferenceCodigo] = useState('')
  const [referenceRazon, setReferenceRazon] = useState('')

  // Estados para Detalle de la factura
  const [detalleFactura, setDetalleFactura] = useState('')
  const [otrosCargosText, setOtrosCargosText] = useState('')

  // Estados para Detalle de la factura
  const [totalesFinales, setTotalesFinales] = useState<TotalesFinales>({
    totalServGravados: 0,
    totalServExentos: 0,
    totalServExonerado: 0,
    totalServNoSujeto: 0,
    totalMercanciasGravadas: 0,
    totalMercanciasExentas: 0,
    totalMercExonerada: 0,
    totalMercNoSujeta: 0,
    totalGravado: 0,
    totalExento: 0,
    totalExonerado: 0,
    totalNoSujeto: 0,
    totalVenta: 0,
    totalDescuentos: 0,
    totalVentaNeta: 0,
    totalDesgloseImpuesto: [],
    totalImpuesto: 0,
    totalImpAsumEmisorFabrica: 0,
    totalIVADevuelto: 0,
    totalOtrosCargos: 0,
    medioPago: [],
    totalComprobante: 0
  })

  // Estados para Información adicional
  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfoNode[]>([])

  // Estados para Otros cargos
  const [otrosCargos, setOtrosCargos] = useState<OtroCargo[]>([])
  const [nuevoCargo, setNuevoCargo] = useState<Omit<OtroCargo, 'id'>>({
    tipoDocumento: '',
    detalleOtros: '',
    porcentajeCargo: '',
    montoCargo: '',
    detalleCargo: '',
    esTercero: false,
    nombreTercero: '',
    tipoTercero: '',
    numeroIdentificacion: ''
  })

  // Estados para Medios de pago
  const [mediosPago, setMediosPago] = useState<MedioPagoItem[]>([])
  const [nuevoMedioPago, setNuevoMedioPago] = useState<Omit<MedioPagoItem, 'id' | 'usarTotalVenta'>>({
    tipoMedioPago: '',
    descripcion: '',
    totalMedioPago: 0
  })
  const [usarTotalVenta, setUsarTotalVenta] = useState(false)

  const extractClaveFromXml = (xmlText: string): string => {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(xmlText, 'application/xml')
      const parserError = doc.getElementsByTagName('parsererror')[0]
      if (parserError) return ''

      const root = doc.documentElement
      if (!root) return ''

      // Preferir el nodo directo del root: [nodo-principal] -> clave
      const directChild = Array.from(root.children || []).find(
        (el) => (el as Element).localName?.toLowerCase() === 'clave'
      )
      const directValue = directChild?.textContent?.trim()
      if (directValue) return directValue

      // Fallback: buscar cualquier nodo "clave" (por namespaces o estructuras distintas)
      const anyClave = Array.from(doc.getElementsByTagName('*')).find(
        (el) => (el as Element).localName?.toLowerCase() === 'clave'
      )
      return anyClave?.textContent?.trim() || ''
    } catch {
      return ''
    }
  }

  const handleReferenceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setReferenceFile(file)
    // En navegadores modernos el path real no se expone (normalmente "C:\\fakepath\\...").
    setReferenceFilePath(e.target.value || (file?.name ?? ''))

    if (!file) {
      setReferenceClave('')
      return
    }

    try {
      const xmlText = await file.text()
      const clave = extractClaveFromXml(xmlText)
      setReferenceClave(clave)
    } catch {
      setReferenceClave('')
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadUbicaciones()
      loadActividadesEconomicas()
      if (channelId) {
        loadClientes()
        loadInventario()
      }
    }
  }, [isOpen, channelId])

  useEffect(() => {
    if (isOpen && channelId && userId) {
      loadInvoiceData()
    }
  }, [isOpen, channelId, userId])

  useEffect(() => {
    calculateConsecutivo()
    buildUbicacion()
  }, [tipoDocumento, invoiceData, ubicaciones])

  // Efecto para actualizar cantones cuando cambia la provincia
  useEffect(() => {
    if (ubicaciones && provinciaReceptor) {
      const provinciaData = ubicaciones.provincias[provinciaReceptor]
      if (provinciaData) {
        const cantones: { [key: string]: string } = {}
        Object.keys(provinciaData.cantones).forEach(key => {
          cantones[key] = provinciaData.cantones[key].nombre
        })
        setCantonesDisponibles(cantones)
      } else {
        setCantonesDisponibles({})
      }
      // Resetear cantón y distrito cuando cambia la provincia
      setCantonReceptor('')
      setDistritoReceptor('')
      setDistritosDisponibles({})
    } else {
      setCantonesDisponibles({})
    }
  }, [provinciaReceptor, ubicaciones])

  // Efecto para actualizar distritos cuando cambia el cantón
  useEffect(() => {
    if (ubicaciones && provinciaReceptor && cantonReceptor) {
      const provinciaData = ubicaciones.provincias[provinciaReceptor]
      const cantonData = provinciaData?.cantones[cantonReceptor]
      if (cantonData) {
        setDistritosDisponibles(cantonData.distritos)
      } else {
        setDistritosDisponibles({})
      }
      // Resetear distrito cuando cambia el cantón
      setDistritoReceptor('')
    } else {
      setDistritosDisponibles({})
    }
  }, [cantonReceptor, provinciaReceptor, ubicaciones])

  // Efecto para actualizar el total del medio de pago cuando cambia totalComprobante y usarTotalVenta está seleccionado
  useEffect(() => {
    if (usarTotalVenta && mediosPago.length === 0) {
      setNuevoMedioPago(prev => ({
        ...prev,
        totalMedioPago: totalesFinales.totalComprobante
      }))
    }
  }, [totalesFinales.totalComprobante, usarTotalVenta])

  // Si hay registros en la tabla que usan "Total de la venta", mantener el monto sincronizado con totalComprobante
  useEffect(() => {
    const nuevoTotal = totalesFinales.totalComprobante
    setMediosPago((prev) => {
      if (!prev.some((mp) => mp.usarTotalVenta)) return prev
      return prev.map((mp) => (mp.usarTotalVenta ? { ...mp, totalMedioPago: nuevoTotal } : mp))
    })
  }, [totalesFinales.totalComprobante])

  // Efecto para filtrar actividades económicas
  useEffect(() => {
    if (actividadEconomicaSearch && !clienteSeleccionado) {
      const filtrado = actividadesEconomicas.filter(act => {
        const searchLower = actividadEconomicaSearch.toLowerCase()
        const nameMatch = String(act.name).toLowerCase().includes(searchLower)
        const descMatch = act.description.toLowerCase().includes(searchLower)
        return nameMatch || descMatch
      })
      setActividadEconomicaFiltrada(filtrado.slice(0, 10)) // Limitar a 10 resultados
      setShowActividadEconomicaDropdown(filtrado.length > 0)
    } else {
      setActividadEconomicaFiltrada([])
      setShowActividadEconomicaDropdown(false)
    }
  }, [actividadEconomicaSearch, actividadesEconomicas, clienteSeleccionado])

  // Efecto para obtener el tipo de cambio cuando cambia la moneda
  useEffect(() => {
    const fetchTipoCambio = async () => {
      if (tipoMoneda === 'CRC') {
        setCambioMoneda('1')
        return
      }

      setLoadingCambio(true)
      try {
        const response = await fetch(`https://currency-api.pages.dev/v1/currencies/${tipoMoneda.toLowerCase()}.json`)
        if (!response.ok) {
          throw new Error('Error al obtener el tipo de cambio')
        }
        const data = await response.json()

        // Acceder primero a la propiedad con el código de la moneda (usd, eur, jpy, etc.)
        const monedaCode = tipoMoneda.toLowerCase()
        if (data[monedaCode] && data[monedaCode].crc !== undefined) {
          const valorCambio = parseFloat(data[monedaCode].crc)
          const valorRedondeado = valorCambio.toFixed(5)
          setCambioMoneda(valorRedondeado)
        } else {
          console.error(`No se encontró la propiedad "${monedaCode}.crc" en la respuesta`)
          setCambioMoneda('')
        }
      } catch (error) {
        console.error('Error al obtener el tipo de cambio:', error)
        setCambioMoneda('')
      } finally {
        setLoadingCambio(false)
      }
    }

    fetchTipoCambio()
  }, [tipoMoneda])

  const loadUbicaciones = async () => {
    try {
      const response = await fetch('/CR_ubicaciones.json')
      if (response.ok) {
        const data = await response.json()
        setUbicaciones(data)
      }
    } catch (error) {
      console.error('Error cargando ubicaciones:', error)
    }
  }

  const loadActividadesEconomicas = async () => {
    try {
      const response = await fetch('/actividades_economicas_CR.json')
      if (response.ok) {
        const data = await response.json()
        setActividadesEconomicas(data)
      }
    } catch (error) {
      console.error('Error cargando actividades económicas:', error)
    }
  }

  const loadClientes = async () => {
    try {
      const response = await fetch(`/api/clientes/by-channel?channelId=${channelId}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setClientes(result.data || [])
        }
      }
    } catch (error) {
      console.error('Error cargando clientes:', error)
    }
  }

  const loadInventario = async () => {
    if (!channelId) return
    try {
      const response = await fetch(`/api/inventario?channelId=${channelId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (response.ok) {
        const data: any[] = await response.json()
        // La API ya filtra por channel_id, pero verificamos por seguridad
        // Mapear correctamente todos los campos incluyendo image
        const items: InventarioItem[] = (data || [])
          .filter((item: any): item is InventarioItem => {
            // Asegurar que el channel_id coincida con el canal actual
            // Puede venir como ObjectId, string, o objeto con _id
            let itemChannelId: string = ''
            if (item.channel_id) {
              if (typeof item.channel_id === 'string') {
                itemChannelId = item.channel_id
              } else if (item.channel_id._id) {
                itemChannelId = String(item.channel_id._id)
              } else if (item.channel_id.toString) {
                itemChannelId = item.channel_id.toString()
              }
            }
            const currentChannelId = String(channelId)
            return itemChannelId === currentChannelId
          })
          .map((item: any) => ({
            _id: item._id || item._id?.toString() || '',
            cabys: item.cabys || '',
            descripcion: item.descripcion || '',
            tipo: item.tipo || '',
            cantidad: Number(item.cantidad) || 0,
            precio: Number(item.precio) || 0,
            partidaArancelaria: item.partidaArancelaria || '',
            codigoComercial: item.codigoComercial || '',
            tipoCodigoComercial: item.tipoCodigoComercial || '',
            unidadMedida: item.unidadMedida || '',
            unidadMedidaComercial: item.unidadMedidaComercial || '',
            tipoTransaccion: item.tipoTransaccion || '',
            esMedicamento: item.esMedicamento || false,
            registro: item.registro || '',
            formaFarmaceutica: item.formaFarmaceutica || '',
            esVinSerie: item.esVinSerie || false,
            numeroVinSerie: item.numeroVinSerie || '',
            tieneDescuento: Boolean(item.tieneDescuento),
            naturalezaDescuento: item.naturalezaDescuento || '',
            montoDescuento: Number(item.montoDescuento) || 0,
            codigoDescuento: item.codigoDescuento || '',
            tipoDescuento: item.tipoDescuento || '',
            detalleDescuento: item.detalleDescuento || '',
            baseImponible: Number(item.baseImponible) || 0,
            tieneImpuesto: Boolean(item.tieneImpuesto),
            codigoImpuesto: item.codigoImpuesto || '',
            detalleImpuesto: item.detalleImpuesto || '',
            tipoTarifa: item.tipoTarifa || '',
            tipoTarifaGeneral: item.tipoTarifaGeneral || item.tipoTarifa || '',
            tarifa: Number(item.tarifa) || 0,
            factorCalculoIVA: Number(item.factorCalculoIVA) || 0,
            esEspecifico: Boolean(item.esEspecifico),
            porcentajeEspecifico: Number(item.porcentajeEspecifico) || 0,
            impuestoPorUnidad: Number(item.impuestoPorUnidad) || 0,
            cantidadUnidadMedida: Number(item.cantidadUnidadMedida) || 0,
            volumenPorUnidadConsumo: Number(item.volumenPorUnidadConsumo) || 0,
            proporcion: Number(item.proporcion) || 0,
            tieneExoneracion: Boolean(item.tieneExoneracion),
            documentoExoneracion: item.documentoExoneracion || '',
            detalleExoneracion: item.detalleExoneracion || '',
            numeroDocumentoExoneracion: item.numeroDocumentoExoneracion || '',
            articuloExoneracion: item.articuloExoneracion || '',
            incisoExoneracion: item.incisoExoneracion || '',
            institucionExoneracion: item.institucionExoneracion || '',
            detalleInstitucionExoneracion: item.detalleInstitucionExoneracion || '',
            fechaAutorizacionExoneracion: item.fechaAutorizacionExoneracion || '',
            porcentajeExoneracion: Number(item.porcentajeExoneracion) || 0,
            montoExportacion: Number(item.montoExportacion) || 0,
            titulo: item.titulo ? String(item.titulo).trim() : '',
            image: item.image ? String(item.image).trim() : '',
            tipoMercancia: item.tipoMercancia || 'Normal',
            detalleSurtido: item.detalleSurtido && Array.isArray(item.detalleSurtido)
              ? item.detalleSurtido.map((surtidoItem: any) => ({
                cabys: surtidoItem.cabys || '',
                titulo: surtidoItem.titulo || '',
                descripcion: surtidoItem.descripcion || '',
                tipo: surtidoItem.tipo || '',
                precio: Number(surtidoItem.precio) || 0,
                cantidad: Number(surtidoItem.cantidad) || 0,
                codigoComercial: surtidoItem.codigoComercial || '',
                tipoCodigoComercial: surtidoItem.tipoCodigoComercial || '',
                unidadMedida: surtidoItem.unidadMedida || '',
                unidadMedidaComercial: surtidoItem.unidadMedidaComercial || '',
                montoDescuento: Number(surtidoItem.montoDescuento) || 0,
                codigoDescuento: surtidoItem.codigoDescuento || '',
                detalleDescuento: surtidoItem.detalleDescuento || '',
                ivaCobradoFabrica: Number(surtidoItem.ivaCobradoFabrica) || 0,
                baseImponible: Number(surtidoItem.baseImponible) || 0,
                codigoImpuesto: surtidoItem.codigoImpuesto || '',
                detalleImpuesto: surtidoItem.detalleImpuesto || '',
                tipoTarifa: surtidoItem.tipoTarifa || '',
                tarifa: Number(surtidoItem.tarifa) || 0,
                cantidadUnidadMedida: Number(surtidoItem.cantidadUnidadMedida) || 0,
                porcentajeEspecifico: Number(surtidoItem.porcentajeEspecifico) || 0,
                proporcion: Number(surtidoItem.proporcion) || 0,
                volumenPorUnidadConsumo: Number(surtidoItem.volumenPorUnidadConsumo) || 0,
                impuestoPorUnidad: Number(surtidoItem.impuestoPorUnidad) || 0
              }))
              : undefined,
          }))
          .filter((item: InventarioItem) => item._id) // Filtrar items sin _id válido

        setInventarioItems(items)
        const nextOptions: Record<string, LineOptions> = {}
        items.forEach((item) => {
          nextOptions[item._id] = {
            applyDiscount: Boolean(item.tieneDescuento),
            applyTax: Boolean(item.tieneImpuesto),
            applyExoneration: Boolean(item.tieneExoneracion) && Boolean(item.tieneImpuesto)
          }
        })
        setLineOptions(nextOptions)
        // Inicializar cantidades seleccionadas manteniendo valores previos si existen
        setCantidadesSeleccionadas((prev) => {
          const next: Record<string, number> = {}
          items.forEach((item) => {
            const current = prev[item._id]
            next[item._id] = typeof current === 'number' ? current : 0
          })
          return next
        })
      }
    } catch (error) {
      console.error('Error cargando inventario:', error)
    }
  }

  const handleClienteChange = (clienteId: string) => {
    setClienteSeleccionado(clienteId)

    if (clienteId === '') {
      // Limpiar todos los campos
      setNombreReceptor('')
      setTipoIdentificacionReceptor('')
      setNumeroIdentificacionReceptor('')
      setNombreComercialReceptor('')
      setCodigoPaisReceptor('')
      setNumeroTelefonoReceptor('')
      setCorreoElectronicoReceptor('')
      setProvinciaReceptor('')
      setCantonReceptor('')
      setDistritoReceptor('')
      setOtrasSenasReceptor('')
      setActividadEconomicaSeleccionada('')
      setActividadEconomicaSearch('')
      setCantonesDisponibles({})
      setDistritosDisponibles({})
    } else {
      // Llenar campos con datos del cliente seleccionado
      const cliente = clientes.find(c => c._id === clienteId)
      if (cliente) {
        setNombreReceptor(cliente.name || '')
        setTipoIdentificacionReceptor(cliente.type_ident || '')
        setNumeroIdentificacionReceptor(cliente.ident || '')
        setNombreComercialReceptor(cliente.name_commercial || '')
        setCodigoPaisReceptor(cliente.country_code || '')
        setNumeroTelefonoReceptor(cliente.phone || '')
        setCorreoElectronicoReceptor(cliente.email || '')
        // Establecer provincia primero para que se carguen los cantones
        setProvinciaReceptor(cliente.province || '')
        // Usar setTimeout para asegurar que los cantones se carguen antes de establecer el cantón
        setTimeout(() => {
          setCantonReceptor(cliente.canton || '')
          setTimeout(() => {
            setDistritoReceptor(cliente.district || '')
          }, 100)
        }, 100)
        setOtrasSenasReceptor(cliente.address || '')
        // Si el cliente tiene actividades económicas, seleccionar la primera por defecto
        if (cliente.act_ecos && cliente.act_ecos.length > 0) {
          setActividadEconomicaSeleccionada(cliente.act_ecos[0])
        } else {
          setActividadEconomicaSeleccionada('')
        }
        setActividadEconomicaSearch('')
      }
    }
  }

  const getActividadEconomicaName = (code: string): string => {
    const actividad = actividadesEconomicas.find(act => String(act.name) === String(code))
    return actividad ? `${actividad.name} - ${actividad.description}` : code
  }

  const handleActividadEconomicaSelect = (actividad: ActividadEconomica) => {
    setActividadEconomicaSearch(`${actividad.name} - ${actividad.description}`)
    setActividadEconomicaSeleccionada(String(actividad.name))
    setShowActividadEconomicaDropdown(false)
    setActividadEconomicaFiltrada([])
  }

  const clearActividadEconomicaSelection = () => {
    setActividadEconomicaSearch('')
    setActividadEconomicaSeleccionada('')
    setActividadEconomicaFiltrada([])
    setShowActividadEconomicaDropdown(false)
    setTimeout(() => actividadEconomicaInputRef.current?.focus(), 0)
  }

  const handleChangeCantidad = (inventarioId: string, delta: number, maxCantidad: number) => {
    setCantidadesSeleccionadas((prev) => {
      const actual = prev[inventarioId] || 0
      let nueva = actual + delta
      if (nueva < 0) nueva = 0
      if (nueva > maxCantidad) nueva = maxCantidad
      if (nueva === 0) {
        const next = { ...prev }
        delete next[inventarioId]
        setLineOptions((options) => {
          const nextOptions = { ...options }
          delete nextOptions[inventarioId]
          return nextOptions
        })
        return next
      }
      return { ...prev, [inventarioId]: nueva }
    })
  }

  const getDetalle = () => {

    const unidadesMedida = ["Al", "Alc", "Cm", "d", "h", "I", "Os", "Spe", "Sp", "s", "St"]

    totalesFinales.totalServGravados = 0;
    totalesFinales.totalServExentos = 0;
    totalesFinales.totalServExonerado = 0;
    totalesFinales.totalServNoSujeto = 0;
    totalesFinales.totalMercanciasGravadas = 0;
    totalesFinales.totalMercanciasExentas = 0;
    totalesFinales.totalMercExonerada = 0;
    totalesFinales.totalMercNoSujeta = 0;
    totalesFinales.totalGravado = 0;
    totalesFinales.totalExento = 0;
    totalesFinales.totalExonerado = 0;
    totalesFinales.totalNoSujeto = 0;
    totalesFinales.totalVenta = 0;
    totalesFinales.totalDescuentos = 0;
    totalesFinales.totalVentaNeta = 0;
    totalesFinales.totalDesgloseImpuesto = [];
    totalesFinales.totalImpuesto = 0;
    totalesFinales.totalImpAsumEmisorFabrica = 0;
    totalesFinales.totalIVADevuelto = 0;
    totalesFinales.totalComprobante = 0;
    totalesFinales.totalOtrosCargos = otrosCargos.reduce((acc, cargo) => acc + Number(cargo.montoCargo || 0), 0);

    let detalleText = '';
    let numeroLinea = 1;

    const selectedItems = Object.entries(cantidadesSeleccionadas).filter(([_, cantidad]) => cantidad > 0);

    Object.entries(cantidadesSeleccionadas).forEach(([inventarioId, cantidad]: [string, number]) => {
      if (cantidad > 0) {
        const item = inventarioItems.find((item) => item._id === inventarioId)
        if (item) {
          const options = lineOptions[inventarioId] || {
            applyDiscount: Boolean(item.tieneDescuento),
            applyTax: Boolean(item.tieneImpuesto),
            applyExoneration: Boolean(item.tieneExoneracion) && Boolean(item.tieneImpuesto)
          }
          const vinSerie = item.esVinSerie ? `<NumeroVINoSerie>${item.numeroVinSerie}</NumeroVINoSerie>` : '';
          const registroMedicamento = item.esMedicamento ? `<RegistroMedicamento>${item.registro}</RegistroMedicamento>` : '';
          const formaFarmaceutica = item.esMedicamento ? `<FormaFarmaceutica>${item.formaFarmaceutica}</FormaFarmaceutica>` : '';

          const propiedades = {
            "servicios": { gravado: "totalServGravados", exento: "totalServExentos", exonerado: "totalServExonerado", noSujeto: "totalServNoSujeto" },
            "mercancias": { gravado: "totalMercanciasGravadas", exento: "totalMercanciasExentas", exonerado: "totalMercExonerada", noSujeto: "totalMercNoSujeto" },
          };

          const positionProp = unidadesMedida.includes(item.unidadMedida) ? "mercancias" : "servicios";

          const propiedadCalculo = propiedades[positionProp as keyof typeof propiedades];

          let detalleSurtido = '';
          let totalImpuestoSurtido = 0;
          let tipoImpuestoSurtido = '';
          let tipoDescuentoSurtido = '';
          let totalDescuentoSurtido = 0;
          if (item.tipoMercancia === 'Surtido' && item.detalleSurtido && item.detalleSurtido.length > 0) {
            detalleSurtido = `<DetalleSurtido>`;

            item.detalleSurtido.forEach((surtidoItem: any) => {

              let codigoComercialSurtido = '';
              if (surtidoItem.tipoCodigoComercial != '') {
                let codigoComercialSurtidoOtro = '';
                if (surtidoItem.tipoCodigoComercial === '99') {
                  codigoComercialSurtidoOtro = `<CodigoComercialSurtidoOtros>${surtidoItem.detalleCodigoComercial}</CodigoComercialSurtidoOtros>`;
                }
                codigoComercialSurtido = `<CodigoComercialSurtido>
                  <TipoSurtido>${surtidoItem.tipoCodigoComercial}</TipoSurtido>
                  <CodigoSurtido>${surtidoItem.codigoComercial}</CodigoSurtido>
                  ${codigoComercialSurtidoOtro}
                </CodigoComercialSurtido>`;
              }

              let descuentoSurtido = '';
              if (options.applyDiscount && surtidoItem.tieneDescuento) {
                let descuentoSurtidoOtro = '';
                if (surtidoItem.tipoDescuento === '99') {
                  descuentoSurtidoOtro = `<DescuentoSurtidoOtros>${surtidoItem.detalleDescuento}</DescuentoSurtidoOtros>`;
                }
                descuentoSurtido = `<DescuentoSurtido>
                  <MontoDescuentoSurtido>${surtidoItem.montoDescuento}</MontoDescuentoSurtido>
                  <CodigoDescuentoSurtido>${surtidoItem.codigoDescuento}</CodigoDescuentoSurtido>
                  ${descuentoSurtidoOtro}
                </DescuentoSurtido>`;
                totalDescuentoSurtido += Number(surtidoItem.montoDescuento);
                if (surtidoItem.codigoDescuento != '') {
                  tipoDescuentoSurtido = surtidoItem.codigoDescuento;
                }
              }

              const montoTotalSurtido = surtidoItem.precio * surtidoItem.cantidad;

              const subtotalSurtido = montoTotalSurtido - (options.applyDiscount && surtidoItem.tieneDescuento ? (surtidoItem.montoDescuento || 0) : 0);

              let impuestoSurtido = '';
              if (options.applyTax && surtidoItem.tieneImpuesto) {
                let impuestoSurtidoOtro = '';
                if (surtidoItem.tipoImpuesto === '99') {
                  impuestoSurtidoOtro = `<CodigoImpuestoOTROSurtido>${surtidoItem.detalleImpuesto}</CodigoImpuestoOTROSurtido>`;
                }
                let datosImpuestoEspecificoSurtido = '';
                if (surtidoItem.cantidadUnidadMedida != '' || surtidoItem.porcentajeEspecifico != 0 || surtidoItem.proporcion != 0 || surtidoItem.volumenPorUnidadConsumo != 0 || surtidoItem.impuestoPorUnidad != 0) {

                  datosImpuestoEspecificoSurtido = `<DatosImpuestoEspecificoSurtido>`;
                  let especificoCantidadUnidadMedida = '';
                  let especificoPorcentaje = '';
                  let especificoProporcion = '';
                  let especificoVolumenUnidadConsumo = '';
                  let especificoImpuestoUnidad = '';
                  if (surtidoItem.cantidadUnidadMedida != '') {
                    especificoCantidadUnidadMedida = `<CantidadUnidadMedidaSurtido>${surtidoItem.cantidadUnidadMedida}</CantidadUnidadMedidaSurtido>`;
                  }
                  if (surtidoItem.porcentajeEspecifico != 0) {
                    especificoPorcentaje = `<PorcentajeSurtido>${surtidoItem.porcentajeEspecifico}</PorcentajeSurtido>`;
                  }
                  if (surtidoItem.proporcion != 0) {
                    especificoProporcion = `<ProporcionSurtido>${surtidoItem.proporcion}</ProporcionSurtido>`;
                  }
                  if (surtidoItem.volumenPorUnidadConsumo != 0) {
                    especificoVolumenUnidadConsumo = `<VolumenUnidadConsumoSurtido>${surtidoItem.volumenPorUnidadConsumo}</VolumenUnidadConsumoSurtido>`;
                  }
                  if (surtidoItem.impuestoPorUnidad != 0) {
                    especificoImpuestoUnidad = `<ImpuestoUnidadSurtido>${surtidoItem.impuestoPorUnidad}</ImpuestoUnidadSurtido>`;
                  }
                  datosImpuestoEspecificoSurtido += `
                    ${especificoCantidadUnidadMedida}
                    ${especificoPorcentaje}
                    ${especificoProporcion}
                    ${especificoVolumenUnidadConsumo}
                    ${especificoImpuestoUnidad}
                  `;
                  datosImpuestoEspecificoSurtido += `</DatosImpuestoEspecificoSurtido>`;
                }

                let impuestoSurtidoMonto = subtotalSurtido * surtidoItem.cantidad;

                impuestoSurtido = `<ImpuestoSurtido>
                  <CodigoImpuestoSurtido>${surtidoItem.codigoImpuesto}</CodigoImpuestoSurtido>
                  ${impuestoSurtidoOtro}
                  <CodigoTarifaIVASurtido>${surtidoItem.tipoTarifa}</CodigoTarifaIVASurtido>
                  <TarifaSurtido>${surtidoItem.tarifa}</TarifaSurtido>
                  ${datosImpuestoEspecificoSurtido}
                  <MontoImpuestoSurtido>${impuestoSurtidoMonto}</MontoImpuestoSurtido>
                </ImpuestoSurtido>`;
                totalImpuestoSurtido += Number(impuestoSurtidoMonto);
                if (surtidoItem.codigoImpuesto != '') {
                  tipoImpuestoSurtido = surtidoItem.codigoImpuesto;
                }
              }

              detalleSurtido += `<LineaDetalleSurtido>
                <CodigoCABYSSurtido>${surtidoItem.cabys}</CodigoCABYSSurtido>
                ${codigoComercialSurtido}
                <CantidadSurtido>${surtidoItem.cantidad}</CantidadSurtido>
                <UnidadMedidaSurtido>${surtidoItem.unidadMedida}</UnidadMedidaSurtido>
                <UnidadMedidaComercialSurtido>${surtidoItem.unidadMedidaComercial}</UnidadMedidaComercialSurtido>
                <DetalleSurtido>${surtidoItem.descripcion}</DetalleSurtido>
                <PrecioUnitarioSurtido>${surtidoItem.precio}</PrecioUnitarioSurtido>
                <MontoTotalSurtido>${montoTotalSurtido}</MontoTotalSurtido>
                ${descuentoSurtido}
                <SubTotalSurtido>${subtotalSurtido}</SubTotalSurtido>
                <IVACobradoFabricaSurtido>${surtidoItem.ivaCobradoFabrica}</IVACobradoFabricaSurtido>
                <BaseImponibleSurtido>${surtidoItem.baseImponible}</BaseImponibleSurtido>
                ${impuestoSurtido}
              </LineaDetalleSurtido>`;
            });

            detalleSurtido += `</DetalleSurtido>`
          }

          let descuento = '';

          const montoTotal = item.precio * cantidad;
          const subTotal = montoTotal - (options.applyDiscount && item.tieneDescuento ? (item.montoDescuento || 0) : 0);
          let descuento_for_monto = 0;

          let impuesto = '';
          let impuestoNeto = 0;
          switch (item.tipoMercancia) {
            case 'Surtido':
              if (options.applyTax && tipoImpuestoSurtido != '') {
                impuesto = `<Impuesto>
                  <Codigo>${tipoImpuestoSurtido}</Codigo>
                  <Monto>${totalImpuestoSurtido}</Monto>
                </Impuesto>`;
                impuestoNeto = totalImpuestoSurtido;

                totalesFinales.totalDesgloseImpuesto.push({
                  codigo: item.codigoImpuesto,
                  condigoTarifaIVA: item.codigoImpuesto == '01' || item.codigoImpuesto == '07' ? item.tipoTarifa : '',
                  totalMontoImpuesto: impuestoNeto,
                });
                totalesFinales.totalImpuesto += impuestoNeto;
              }
              if (options.applyDiscount && tipoDescuentoSurtido != '') {
                descuento = `<Descuento>
                  <MontoDescuento>${totalDescuentoSurtido}</MontoDescuento>
                  <CodigoDescuento>${tipoDescuentoSurtido}</CodigoDescuento>
                </Descuento>`;
                descuento_for_monto = totalDescuentoSurtido;
              }
              break;
            default:
              if (options.applyDiscount && item.tieneDescuento) {
                const codigoDescuentoOtro = item.codigoDescuento === '99' ? `<CodigoDescuentoOTRO>${item.detalleDescuento}</CodigoDescuentoOTRO>` : ``;
                descuento = `<Descuento>
                  <MontoDescuento>${item.montoDescuento}</MontoDescuento>
                  <CodigoDescuento>${item.codigoDescuento}</CodigoDescuento>
                  ${codigoDescuentoOtro}
                  <NaturalezaDescuento>${item.naturalezaDescuento}</NaturalezaDescuento>
                </Descuento>`;
                descuento_for_monto = Number(item.montoDescuento || 0);
              }

              if (options.applyTax && item.tieneImpuesto) {
                const codigoImpuestoOtro = item.codigoImpuesto === '99' ? `<CodigoImpuestoOTRO>${item.detalleImpuesto}</CodigoImpuestoOTRO>` : ``;

                let impuestoEspecifico = '';

                if (item.cantidadUnidadMedida != 0 || item.porcentajeEspecifico != 0 || item.proporcion != 0 || item.volumenPorUnidadConsumo != 0 || item.impuestoPorUnidad != 0) {

                  impuestoEspecifico = `<DatosImpuestoEspecifico>`;
                  let especificoCantidadUnidadMedida = '';
                  let especificoPorcentaje = '';
                  let especificoProporcion = '';
                  let especificoVolumenUnidadConsumo = '';
                  let especificoImpuestoUnidad = '';
                  if (String(item.cantidadUnidadMedida) != '') {
                    especificoCantidadUnidadMedida = `<CantidadUnidadMedida>${item.cantidadUnidadMedida}</CantidadUnidadMedida>`;
                  }
                  if (String(item.porcentajeEspecifico) != '') {
                    especificoPorcentaje = `<Porcentaje>${item.porcentajeEspecifico}</Porcentaje>`;
                  }
                  if (String(item.proporcion) != '') {
                    especificoProporcion = `<Proporcion>${item.proporcion}</Proporcion>`;
                  }
                  if (String(item.volumenPorUnidadConsumo) != '') {
                    especificoVolumenUnidadConsumo = `<VolumenUnidadConsumo>${item.volumenPorUnidadConsumo}</VolumenUnidadConsumo>`;
                  }
                  if (String(item.impuestoPorUnidad) != '') {
                    especificoImpuestoUnidad = `<ImpuestoUnidad>${item.impuestoPorUnidad}</ImpuestoUnidad>`;
                  }
                  impuestoEspecifico += `
                    ${especificoCantidadUnidadMedida}
                    ${especificoPorcentaje}
                    ${especificoProporcion}
                    ${especificoVolumenUnidadConsumo}
                    ${especificoImpuestoUnidad}
                  `;
                  impuestoEspecifico += `</DatosImpuestoEspecifico>`;
                }

                let factorCalculoIVA = String(item.factorCalculoIVA) != '' ? `<FactorCalculoIVA>${item.factorCalculoIVA}</FactorCalculoIVA>` : ``;

                let montoImpuesto = Number(item.tarifa) * Number(item.baseImponible);

                let exoneracion = '';
                let montoExoneracionFinal = 0;
                if (options.applyExoneration && item.tieneExoneracion && options.applyTax) {
                  let montoExoneracion = (Number(item.porcentajeExoneracion) * Number(montoImpuesto)) / 100;
                  let documentoExoneracion = item.documentoExoneracion != '' ? `<TipoDocumentoEX1>${item.documentoExoneracion}</TipoDocumentoEX1>` : ``;
                  let tipoDocumentoOtro = item.documentoExoneracion == '99' ? `<TipoDocumentoOTRO>${item.detalleExoneracion}</TipoDocumentoOTRO>` : ``;
                  let numeroDocumentoExoneracion = String(item.numeroDocumentoExoneracion) != '' ? `<NumeroDocumento>${item.numeroDocumentoExoneracion}</NumeroDocumento>` : ``;
                  let articuloExoneracion = item.articuloExoneracion != '' ? `<Articulo>${item.articuloExoneracion}</Articulo>` : ``;
                  let incisoExoneracion = item.incisoExoneracion != '' ? `<Inciso>${item.incisoExoneracion}</Inciso>` : ``;
                  let institucionExoneracion = item.institucionExoneracion != '' ? `<NombreInstitucion>${item.institucionExoneracion}</NombreInstitucion>` : ``;
                  let detalleInstitucionExoneracion = item.documentoExoneracion == '99' ? `<NombreInstitucionOtros>${item.detalleInstitucionExoneracion}</NombreInstitucionOtros>` : ``;
                  let fechaAutorizacionExoneracion = item.fechaAutorizacionExoneracion != '' ? `<FechaEmisionEX>${item.fechaAutorizacionExoneracion}</FechaEmisionEX>` : ``;
                  let porcentajeExoneracion = item.porcentajeExoneracion != 0 ? `<TarifaExonerada>${item.porcentajeExoneracion}</TarifaExonerada>` : ``;
                  let exoneracionMonto = item.montoExportacion != 0 ? `<MontoExoneracion>${montoExoneracion}</MontoExoneracion>` : ``;
                  exoneracion = `<Exoneracion>
                    ${documentoExoneracion}
                    ${tipoDocumentoOtro}
                    ${numeroDocumentoExoneracion}
                    ${articuloExoneracion}
                    ${incisoExoneracion}
                    ${institucionExoneracion}
                    ${detalleInstitucionExoneracion}
                    ${fechaAutorizacionExoneracion}
                    ${porcentajeExoneracion}
                    ${exoneracionMonto}
                  </Exoneracion>`;
                  montoExoneracionFinal = montoExoneracion;
                }

                impuesto = `<Impuesto>
                  <Codigo>${item.codigoImpuesto}</Codigo>
                  ${codigoImpuestoOtro}
                  <CodigoTarifaIVA>${item.tipoTarifa}</CodigoTarifaIVA>
                  <Tarifa>${item.tarifa}</Tarifa>
                  ${factorCalculoIVA}
                  ${impuestoEspecifico}
                  <Monto>${montoImpuesto}</Monto>
                  <MontoExportacion>${item.montoExportacion}</MontoExportacion>
                  ${exoneracion}
                </Impuesto>`;
                impuestoNeto = montoImpuesto - montoExoneracionFinal;
                totalesFinales.totalDesgloseImpuesto.push({
                  codigo: item.codigoImpuesto,
                  condigoTarifaIVA: item.codigoImpuesto == '01' || item.codigoImpuesto == '07' ? item.tipoTarifa : '',
                  totalMontoImpuesto: impuestoNeto,
                });
                totalesFinales.totalImpuesto += impuestoNeto;
              }
              break;
          }

          totalesFinales.totalDescuentos += descuento_for_monto;

          let enviarAExento = false;
          if (impuesto != '') {
            const tiposImpuesto = ['01', '07', '08'];
            if (tiposImpuesto.includes(item.codigoImpuesto)) {
              const tiposTarifa = ['01', '11'];
              if (item.codigoImpuesto == '01' && tiposTarifa.includes(item.tipoTarifa)) {
                const propiedadNoSujeto = propiedadCalculo.noSujeto as keyof TotalesFinales;
                (totalesFinales[propiedadNoSujeto] as number) += montoTotal;
              }
              else {
                if (item.porcentajeExoneracion != undefined && Number(item.porcentajeExoneracion) > 0) {
                  const propiedadGravado = propiedadCalculo.gravado as keyof TotalesFinales;
                  (totalesFinales[propiedadGravado] as number) += (1 - item.porcentajeExoneracion / (item.tarifa || 0)) * montoTotal;

                  const propiedadExonerado = propiedadCalculo.exonerado as keyof TotalesFinales;
                  (totalesFinales[propiedadExonerado] as number) += item.porcentajeExoneracion / (item.tarifa || 0) * montoTotal;
                }
                else {
                  const propiedadGravado = propiedadCalculo.gravado as keyof TotalesFinales;
                  (totalesFinales[propiedadGravado] as number) += montoTotal;
                }
              }
            }
            else if (selectedItems.length === 1 && (item.montoDescuento || 0) > 0) { // Mayor a 0 y una sola línea en la tabla de mercancías
              enviarAExento = true;
            }
          }
          else {
            enviarAExento = true;
          }

          if (enviarAExento) {
            const propiedadExento = propiedadCalculo.exento as keyof TotalesFinales;
            (totalesFinales[propiedadExento] as number) += montoTotal;
          }

          detalleText += `
          <LineaDetalle>
            <NumeroLinea>${numeroLinea}</NumeroLinea>
            <PartidaArancelaria>${item.partidaArancelaria}</PartidaArancelaria>
            <CodigoCABYS>${item.cabys}</CodigoCABYS>
            <CodigoComercial>
              <Tipo>${item.tipoCodigoComercial}</Tipo>
              <Codigo>${item.codigoComercial}</Codigo>
            </CodigoComercial>
            <Cantidad>${cantidad}</Cantidad>
            <UnidadMedida>${item.unidadMedida}</UnidadMedida>
            <UnidadMedidaComercial>${item.unidadMedidaComercial}</UnidadMedidaComercial>
            <TipoTransaccion>${item.tipoTransaccion}</TipoTransaccion>
            <Detalle>${item.descripcion}</Detalle>
            ${vinSerie}
            ${registroMedicamento}
            ${formaFarmaceutica}
            <PrecioUnitario>${item.precio}</PrecioUnitario>
            <MontoTotal>${montoTotal}</MontoTotal>
            ${descuento}
            <SubTotal>${subTotal}</SubTotal>
            <BaseImponible>${item.baseImponible}</BaseImponible>
            ${detalleSurtido}
            ${impuesto}
            <ImpuestoNeto>${impuestoNeto}</ImpuestoNeto>
            <MontoTotalLinea>${subTotal + impuestoNeto}</MontoTotalLinea>
          </LineaDetalle>`
          numeroLinea++;
        }
      }
    })

    totalesFinales.totalGravado += totalesFinales.totalServGravados + totalesFinales.totalMercanciasGravadas;
    totalesFinales.totalExento += totalesFinales.totalServExentos + totalesFinales.totalMercanciasExentas;
    totalesFinales.totalExonerado += totalesFinales.totalServExonerado + totalesFinales.totalMercExonerada;
    totalesFinales.totalNoSujeto += totalesFinales.totalServNoSujeto + totalesFinales.totalMercNoSujeta;
    totalesFinales.totalVenta += totalesFinales.totalGravado + totalesFinales.totalExento + totalesFinales.totalExonerado + totalesFinales.totalNoSujeto;
    totalesFinales.totalVentaNeta += totalesFinales.totalVenta - totalesFinales.totalDescuentos;
    totalesFinales.totalComprobante += totalesFinales.totalVentaNeta + totalesFinales.totalOtrosCargos + totalesFinales.totalImpuesto;

    setDetalleFactura(detalleText)
    // Forzar actualización de estado para que la tabla de totales se re-renderice
    setTotalesFinales((prev) => ({
      ...totalesFinales,
      medioPago: prev.medioPago
    }))
  }

  const getOtrosCargos = () => {
    let otrosCargosText = ''
    otrosCargos.forEach((cargo) => {
      const tipoDocumentOtro = cargo.tipoDocumento === '99' ? `<TipoDocumentoOTRO>${cargo.detalleOtros}</TipoDocumentoOTRO>` : ``;
      otrosCargosText += `
      <OtroCargo>
        <TipoDocumentoOC>${cargo.tipoDocumento}</TipoDocumentoOC>
        ${tipoDocumentOtro}
        <DetalleOtros>${cargo.detalleOtros}</DetalleOtros>
        <IdentificacionTercero>
          <Tipo>${cargo.tipoTercero}</Tipo>
          <Numero>${cargo.numeroIdentificacion}</Numero>
        </IdentificacionTercero>
        <NombreTercero>${cargo.nombreTercero}</NombreTercero>
        <Detalle>${cargo.detalleCargo}</Detalle>
        <PorcentajeOC>${cargo.porcentajeCargo}</PorcentajeOC>
        <MontoCargo>${cargo.montoCargo}</MontoCargo>
      </OtroCargo>`
    })
    setOtrosCargosText(otrosCargosText)
  }

  // Mantener XML de OtrosCargos sincronizado
  useEffect(() => {
    if (!isOpen) return
    getOtrosCargos()
  }, [isOpen, otrosCargos])

  // Recalcular totales/detalle cada vez que cambie la tabla (cantidades/checks) o los otros cargos
  useEffect(() => {
    if (!isOpen) return
    getDetalle()
  }, [isOpen, cantidadesSeleccionadas, lineOptions, inventarioItems, otrosCargos])

  const getDefaultLineOption = (item: InventarioItem): LineOptions => ({
    applyDiscount: Boolean(item.tieneDescuento),
    applyTax: Boolean(item.tieneImpuesto),
    applyExoneration: Boolean(item.tieneExoneracion) && Boolean(item.tieneImpuesto)
  })

  const formatCurrency = (value: number) => {
    return `₡${value.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const handleQuantityInputChange = (inventarioId: string, value: number, maxCantidad: number) => {
    if (value <= 0) {
      setCantidadesSeleccionadas((prev) => {
        const next = { ...prev }
        delete next[inventarioId]
        return next
      })
      setLineOptions((options) => {
        const nextOptions = { ...options }
        delete nextOptions[inventarioId]
        return nextOptions
      })
      return
    }

    const nueva = Math.min(Math.max(value, 0), maxCantidad)
    setCantidadesSeleccionadas((prev) => ({
      ...prev,
      [inventarioId]: nueva
    }))
  }

  const handleLineOptionChange = (inventarioId: string, option: keyof LineOptions, value: boolean) => {
    setLineOptions((prev) => {
      const invoiceItem = inventarioItems.find((item) => item._id === inventarioId)
      const defaultOption = invoiceItem ? getDefaultLineOption(invoiceItem) : { applyDiscount: false, applyTax: false, applyExoneration: false }
      const nextOption = {
        ...(prev[inventarioId] || defaultOption),
        [option]: value
      }

      if (option === 'applyTax' && !value) {
        nextOption.applyExoneration = false
      }

      return {
        ...prev,
        [inventarioId]: nextOption
      }
    })
  }

  const searchHacienda = async () => {
    const identificacion = numeroIdentificacionReceptor.trim()

    if (!identificacion) {
      alert('Por favor ingrese un número de identificación para buscar')
      return
    }

    setSearchingHacienda(true)

    try {
      const response = await fetch(
        `https://api.hacienda.go.cr/fe/ae?identificacion=${encodeURIComponent(identificacion)}`
      )

      if (!response.ok) {
        throw new Error('No se encontró información para esta identificación')
      }

      const data = await response.json()

      // Actualizar el nombre si está disponible
      if (data.nombre) {
        setNombreReceptor(data.nombre)
      }

      // Mapear tipoIdentificacion a las opciones disponibles
      let tipoIdentificacion = '01' // Por defecto
      if (data.tipoIdentificacion) {
        const tipo = String(data.tipoIdentificacion).trim()
        // Mapear según las opciones disponibles: 01, 02, 03, 04, ##
        if (tipo === '01' || tipo === '02' || tipo === '03' || tipo === '04') {
          tipoIdentificacion = tipo
        } else {
          // Si no coincide, usar '01' por defecto
          tipoIdentificacion = '01'
        }
      }

      setTipoIdentificacionReceptor(tipoIdentificacion)

    } catch (error: any) {
      console.error('Error buscando en Hacienda:', error)
      alert(error.message || 'Error al consultar la información en Hacienda')
    } finally {
      setSearchingHacienda(false)
    }
  }

  const loadInvoiceData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/user-channels/invoice-data?channelId=${channelId}&userId=${userId}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setInvoiceData(result.data)
        }
      } else {
        console.error('Error cargando datos de facturación')
      }
    } catch (error) {
      console.error('Error cargando datos de facturación:', error)
    } finally {
      setLoading(false)
    }
  }

  const buildUbicacion = () => {
    if (!invoiceData?.sucursal || !ubicaciones) {
      setUbicacionTexto('')
      return
    }

    const { provincia, canton, distrito, direccion } = invoiceData.sucursal

    if (!provincia || !canton || !distrito) {
      setUbicacionTexto(direccion || '')
      return
    }

    try {
      // Obtener nombre de provincia
      const provinciaData = ubicaciones.provincias[provincia]
      const nombreProvincia = provinciaData?.nombre || provincia

      // Obtener nombre de cantón
      const cantonData = provinciaData?.cantones[canton]
      const nombreCanton = cantonData?.nombre || canton

      // Obtener nombre de distrito
      const nombreDistrito = cantonData?.distritos[distrito] || distrito

      // Construir ubicación completa
      const partes = [nombreDistrito, nombreCanton, nombreProvincia, direccion].filter(Boolean)
      setUbicacionTexto(partes.join(', '))
    } catch (error) {
      console.error('Error construyendo ubicación:', error)
      setUbicacionTexto(direccion || '')
    }
  }

  const calculateConsecutivo = () => {
    if (!invoiceData?.sucursal || !invoiceData?.caja) {
      setConsecutivo('')
      return
    }

    // Código de sucursal (padLeft a 5 dígitos)
    const codigoSucursal = invoiceData.sucursal.codigo.padStart(3, '0')

    // Número de caja (padLeft a 3 dígitos)
    const numeroCaja = invoiceData.caja.numero.padStart(5, '0')

    // Tipo de documento (padLeft a 2 dígitos)
    const tipoDoc = tipoDocumento.padStart(2, '0')

    // Número de factura del tipo de documento seleccionado (padLeft a 10 dígitos)
    const numeracionFacturas = invoiceData.caja.numeracion_facturas || {}
    const numeroFacturaRaw = parseInt(numeracionFacturas[tipoDocumento] || '0') + 1
    const numeroFactura = String(numeroFacturaRaw).padStart(10, '0')

    // Concatenar todo
    const consecutivoCalculado = `${codigoSucursal}${numeroCaja}${tipoDoc}${numeroFactura}`

    setConsecutivo(consecutivoCalculado)
  }

  // Funciones para manejar Otros cargos
  const handleCargoFieldChange = (field: keyof Omit<OtroCargo, 'id'>, value: string | boolean) => {
    setNuevoCargo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddCargo = () => {
    // Validar que tipoDocumento esté seleccionado
    if (!nuevoCargo.tipoDocumento) {
      alert('Por favor seleccione un tipo de documento')
      return
    }

    // Validar que si es tipo 99, detalleOtros no esté vacío
    if (nuevoCargo.tipoDocumento === '99' && !nuevoCargo.detalleOtros.trim()) {
      alert('Por favor ingrese el detalle (Otros) para el tipo de documento 99')
      return
    }

    // Validar que porcentaje o monto estén presentes
    if (!nuevoCargo.porcentajeCargo && !nuevoCargo.montoCargo) {
      alert('Por favor ingrese un porcentaje o monto del cargo')
      return
    }

    // Validar campos de tercero si está marcado
    if (nuevoCargo.esTercero) {
      if (!nuevoCargo.nombreTercero.trim()) {
        alert('Por favor ingrese el nombre del tercero')
        return
      }
      if (!nuevoCargo.tipoTercero) {
        alert('Por favor seleccione el tipo de tercero')
        return
      }
      if (!nuevoCargo.numeroIdentificacion.trim()) {
        alert('Por favor ingrese el número de identificación')
        return
      }
    }

    const cargo: OtroCargo = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...nuevoCargo
    }

    setOtrosCargos(prev => [...prev, cargo])

    // Resetear el formulario
    setNuevoCargo({
      tipoDocumento: '',
      detalleOtros: '',
      porcentajeCargo: '',
      montoCargo: '',
      detalleCargo: '',
      esTercero: false,
      nombreTercero: '',
      tipoTercero: '',
      numeroIdentificacion: ''
    })
  }

  const handleRemoveCargo = (id: string) => {
    setOtrosCargos(prev => prev.filter(cargo => cargo.id !== id))
  }

  const handleAddMedioPago = () => {
    // Validar que tipoMedioPago esté seleccionado
    if (!nuevoMedioPago.tipoMedioPago) {
      alert('Por favor seleccione un tipo de medio de pago')
      return
    }

    // Validar que si es tipo 99, descripcion no esté vacía
    if (nuevoMedioPago.tipoMedioPago === '99' && !nuevoMedioPago.descripcion.trim()) {
      alert('Por favor ingrese la descripción para el tipo de medio de pago 99')
      return
    }

    // Usar totalComprobante si el checkbox está seleccionado, sino usar el valor ingresado
    const totalMedioPago = usarTotalVenta ? totalesFinales.totalComprobante : nuevoMedioPago.totalMedioPago

    const medioPago: MedioPagoItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      tipoMedioPago: nuevoMedioPago.tipoMedioPago,
      descripcion: nuevoMedioPago.descripcion,
      totalMedioPago: totalMedioPago,
      usarTotalVenta: usarTotalVenta
    }

    setMediosPago(prev => [...prev, medioPago])

    // Agregar a totalesFinales.medioPago
    setTotalesFinales(prev => ({
      ...prev,
      medioPago: [...prev.medioPago, {
        tipoMedioPago: medioPago.tipoMedioPago,
        medioPagoOtros: medioPago.tipoMedioPago === '99' ? medioPago.descripcion : '',
        totalMedioPago: medioPago.totalMedioPago
      }]
    }))

    // Resetear el formulario y el checkbox
    setNuevoMedioPago({
      tipoMedioPago: '',
      descripcion: '',
      totalMedioPago: 0
    })
    setUsarTotalVenta(false)
  }

  const handleRemoveMedioPago = (id: string) => {
    setMediosPago(prev => {
      const updated = prev.filter(mp => mp.id !== id)
      // Sincronizar totalesFinales.medioPago con los medios de pago restantes
      setTotalesFinales(prevTotales => ({
        ...prevTotales,
        medioPago: updated.map(mp => ({
          tipoMedioPago: mp.tipoMedioPago,
          medioPagoOtros: mp.tipoMedioPago === '99' ? mp.descripcion : '',
          totalMedioPago: mp.totalMedioPago
        }))
      }))
      return updated
    })
  }

  const closeModal = (force = false) => {
    if (force || (!loading && !isSubmitting)) {
      setTipoDocumento('01')
      setInvoiceData(null)
      setIsSubmitting(false)
      setConsecutivo('')
      setUbicacionTexto('')
      // Limpiar estados del receptor
      setClienteSeleccionado('')
      setNombreReceptor('')
      setTipoIdentificacionReceptor('')
      setNumeroIdentificacionReceptor('')
      setNombreComercialReceptor('')
      setCodigoPaisReceptor('')
      setNumeroTelefonoReceptor('')
      setCorreoElectronicoReceptor('')
      setProvinciaReceptor('')
      setCantonReceptor('')
      setDistritoReceptor('')
      setOtrasSenasReceptor('')
      setActividadEconomicaSeleccionada('')
      setActividadEconomicaSearch('')
      setCantonesDisponibles({})
      setDistritosDisponibles({})
      // Limpiar estados de condición de la venta
      setCondicionVenta('')
      setEspecificacion('')
      setPlazoCredito('')
      setUnidadPlazoCredito('Días')
      // Limpiar estados de tipo de cambio
      setTipoMoneda('CRC')
      setCambioMoneda('1')
      // Limpiar detalle de factura
      setInventarioItems([])
      setCantidadesSeleccionadas({})
      // Limpiar documento de referencia
      setReferenceFile(null)
      setReferenceFilePath('')
      setReferenceClave('')
      setReferenceTipoDocumento('')
      setReferenceCodigo('')
      setReferenceRazon('')
      // Limpiar información adicional
      setAdditionalInfo([])
      // Limpiar otros cargos
      setOtrosCargos([])
      setNuevoCargo({
        tipoDocumento: '',
        detalleOtros: '',
        porcentajeCargo: '',
        montoCargo: '',
        detalleCargo: '',
        esTercero: false,
        nombreTercero: '',
        tipoTercero: '',
        numeroIdentificacion: ''
      })
      // Limpiar medios de pago
      setMediosPago([])
      setNuevoMedioPago({
        tipoMedioPago: '',
        descripcion: '',
        totalMedioPago: 0
      })
      setUsarTotalVenta(false)
      setTotalesFinales(prev => ({
        ...prev,
        medioPago: []
      }))
      onClose()
    }
  }

  const handleClose = () => {
    closeModal(false)
  }

  const escapeXml = (input: string) => {
    return (input ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  const formatCostaRicaDateTime = () => {
    const now = new Date()
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
    const cr = new Date(utcMs - 6 * 60 * 60_000)
    const iso = cr.toISOString().replace('Z', '')
    const noMs = iso.replace(/\.\d{3}$/, '')
    return `${noMs}-06:00`
  }

  const toBase64Utf8 = (value: string) => {
    const bytes = new TextEncoder().encode(value)
    let binary = ''
    const chunkSize = 0x8000
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize)
      binary += String.fromCharCode.apply(null, Array.from(chunk))
    }
    return btoa(binary)
  }

  const buildOtrosXml = (nodes: AdditionalInfoNode[]): string => {
    const otroTextoParts: string[] = []

    const buildContenido = (list: AdditionalInfoNode[]): string => {
      let out = ''
      for (const n of list || []) {
        if (n.type === 'field') {
          const value = (n.value ?? '').trim()
          if (!value) continue

          // Soporte directo para "OtroTexto"
          if (n.key === 'OtroTexto') {
            otroTextoParts.push(value)
            continue
          }

          out += `\n          <${n.key}>${escapeXml(value)}</${n.key}>`
          continue
        }

        if (n.type === 'group') {
          const inner = buildContenido(n.children || [])
          if (!inner.trim()) continue
          out += `\n          <${n.key}>${inner}\n          </${n.key}>`
        }
      }
      return out
    }

    const contenido = buildContenido(nodes || [])
    const otroTextoXml = otroTextoParts
      .filter((t) => t.trim())
      .map((t) => `\n        <OtroTexto>${escapeXml(t.trim())}</OtroTexto>`)
      .join('')

    const otroContenidoXml = contenido.trim()
      ? `\n        <OtroContenido>${contenido}\n        </OtroContenido>`
      : ''

    if (!otroTextoXml && !otroContenidoXml) return ''

    return `\n      <Otros>${otroTextoXml}${otroContenidoXml}\n      </Otros>`
  }

  const buildAndDownloadXml = async () => {
    if (isSubmitting) return

    const map: Record<string, { header: string; tipo: string }> = {
      '01': { header: 'FacturaElectronica', tipo: 'facturaElectronica' },
      '02': { header: 'NotaDebitoElectronica', tipo: 'notaDebitoElectronica' },
      '03': { header: 'NotaCreditoElectronica', tipo: 'notaCreditoElectronica' },
      '04': { header: 'TiqueteElectronico', tipo: 'tiqueteElectronico' },
      '08': { header: 'FacturaElectronicaCompra', tipo: 'facturaElectronicaCompra' },
      '09': { header: 'FacturaElectronicaExportacion', tipo: 'facturaElectronicaExportacion' },
      '10': { header: 'ReciboElectronicoPago', tipo: 'reciboElectronicoPago' }
    }

    const normalizedTipoDocumento = (tipoDocumento || '').padStart(2, '0')
    const def = map[normalizedTipoDocumento]
    if (!def) {
      alert('Tipo de documento no soportado para generación XML')
      return
    }

    const hasDetalleItems = Object.values(cantidadesSeleccionadas).some(
      (cantidad) => Number(cantidad) > 0
    )
    if (!hasDetalleItems) {
      alert('Debe agregar al menos 1 registro en "Detalle de la factura" antes de generar el XML')
      return
    }

    if (normalizedTipoDocumento === '01') {
      const clienteFields = [
        nombreReceptor,
        tipoIdentificacionReceptor,
        numeroIdentificacionReceptor,
        codigoPaisReceptor,
        numeroTelefonoReceptor,
        correoElectronicoReceptor
      ]
      const clienteIncompleto = clienteFields.some((field) => !String(field || '').trim())
      if (clienteIncompleto) {
        alert('La información del cliente está incompleta para Factura electrónica')
        return
      }
    }

    if (normalizedTipoDocumento === '03') {
      const referenciaIncompleta =
        !referenceFile ||
        !String(referenceClave || '').trim() ||
        !String(referenceTipoDocumento || '').trim() ||
        !String(referenceCodigo || '').trim() ||
        !String(referenceRazon || '').trim()

      if (referenciaIncompleta) {
        alert('La información de "Documento de referencia" está incompleta para Nota de crédito electrónica')
        return
      }
    }

    const confirmed = window.confirm('Se creara y enviara la factura electronica. Deseas continuar?')
    if (!confirmed) return

    setIsSubmitting(true)
    let completed = false

    try {
      const now = new Date()
      const day = String(now.getDate()).padStart(2, '0')
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const year2 = String(now.getFullYear()).slice(-2)

      const canalIdentRaw = String(invoiceData?.channel?.ident || '').replace(/\D/g, '')
      if (!canalIdentRaw) {
        alert('No se encontró la identificación (ident) del canal para construir la clave')
        return
      }
      const canalIdent12 = canalIdentRaw.padStart(12, '0').slice(-12)

      const consec = String(consecutivo || '').trim()
      if (!consec) {
        alert('No se encontró el consecutivo para construir la clave')
        return
      }

      const random8 = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('')
      const clave = `506${day}${month}${year2}${canalIdent12}${consec}1${random8}`
      const xmlns = `https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/${def.tipo}`
      const schemaLocation = `${xmlns} ${xmlns}.xsd`
      const codigoActividadReceptor = actividadEconomicaSearch.split(' - ')[0]
      const fechaEmision = formatCostaRicaDateTime()
      const registroFiscal = invoiceData?.channel?.registro_fiscal_IVA;
      let registroFiscalNode = '';
      if (registroFiscal && registroFiscal.trim() !== '') {
        registroFiscalNode = `<Registrofiscal8707>${registroFiscal}</Registrofiscal8707>`;
      }
      let ubicacionEmisor = `<Ubicacion>`;
      if (invoiceData?.sucursal?.provincia) { // Provincia de la sucursal
        ubicacionEmisor += `<Provincia>${invoiceData?.sucursal?.provincia}</Provincia>`;
        if (invoiceData?.sucursal?.canton) { // Cantón de la sucursal
          ubicacionEmisor += `<Canton>${invoiceData?.sucursal?.canton}</Canton>`;
          if (invoiceData?.sucursal?.distrito) { // Distrito de la sucursal
            ubicacionEmisor += `<Distrito>${invoiceData?.sucursal?.distrito}</Distrito>`;
            if (invoiceData?.sucursal?.direccion) { // Dirección de la sucursal
              ubicacionEmisor += `<OtrasSenas>${invoiceData?.sucursal?.direccion}</OtrasSenas>`;
            }
          }
        }
      }
      ubicacionEmisor += `</Ubicacion>`;

      let ubicacionReceptor = `<Ubicacion>`;
      if (provinciaReceptor) { // Provincia del receptor
        ubicacionReceptor += `<Provincia>${provinciaReceptor}</Provincia>`;
        if (cantonReceptor) { // Cantón del receptor
          ubicacionReceptor += `<Canton>${cantonReceptor}</Canton>`;
          if (distritoReceptor) { // Distrito del receptor
            ubicacionReceptor += `<Distrito>${distritoReceptor}</Distrito>`;
            if (otrasSenasReceptor) { // Otras senas del receptor
              ubicacionReceptor += `<OtrasSenas>${otrasSenasReceptor}</OtrasSenas>`;
            }
          }
        }
      }
      ubicacionReceptor += `</Ubicacion>`;

      const condicionVentaText = condicionVenta.split(' - ')[0];
      let condicionVentaEspecificacionNode = '';
      if (condicionVentaText && condicionVentaText.trim() === '99') {
        condicionVentaEspecificacionNode = `<CondicionVentaOtros>${especificacion}</CondicionVentaOtros>`;
      }

      let totalDesgloseImpuesto = '';
      totalesFinales.totalDesgloseImpuesto.forEach((impuesto) => {
        totalDesgloseImpuesto += `
      <TotalDesgloseImpuesto>
        <Codigo>${impuesto.codigo}</Codigo>
        <CodigoTarifaIVA>${impuesto.condigoTarifaIVA}</CodigoTarifaIVA>
        <TotalMontoImpuesto>${impuesto.totalMontoImpuesto}</TotalMontoImpuesto>
      </TotalDesgloseImpuesto>`;
      });

      let medioPagoText = '';
      mediosPago.forEach((pago) => {
        const medioPagoOtros = pago.tipoMedioPago === '99' ? pago.descripcion : ''
        const totalMedioPago = pago.usarTotalVenta ? totalesFinales.totalComprobante : pago.totalMedioPago
        medioPagoText += `
      <MedioPago>
        <TipoMedioPago>${pago.tipoMedioPago}</TipoMedioPago>
        <MedioPagoOtros>${medioPagoOtros}</MedioPagoOtros>
        <TotalMedioPago>${totalMedioPago}</TotalMedioPago>
      </MedioPago>`;
      });

      let infoReferencia = '';
      if (referenceFile) {
        let tipoDocOtro = referenceTipoDocumento === '99' ? `<TipoDocOtro>${referenceRazon}</TipoDocOtro>` : '';
        let codigoOtro = referenceCodigo === '99' ? `<CodigoReferenciaOtro>${referenceRazon}</CodigoReferenciaOtro>` : '';
        infoReferencia = `
      <InfoReferencia>
        <TipoDocIR>${referenceTipoDocumento}</TipoDocIR>
        ${tipoDocOtro}
        <Codigo>${referenceCodigo}</Codigo>
        ${codigoOtro}
        <Razon>${referenceRazon}</Razon>
      </InfoReferencia>`;
      }

      const otrosText = buildOtrosXml(additionalInfo)


      let xml =
        `<?xml version="1.0" encoding="utf-8"?>
      <${def.header} xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="${xmlns}" xsi:schemaLocation="${schemaLocation}">
        <Clave>${clave}</Clave>
        <ProveedorSistemas>000000</ProveedorSistemas>
        <CodigoActividadEmisor>${invoiceData?.actividadEconomica?.codigo}</CodigoActividadEmisor>
        <CodigoActividadReceptor>${codigoActividadReceptor}</CodigoActividadReceptor>
        <NumeroConsecutivo>${consec}</NumeroConsecutivo>
        <FechaEmision>${fechaEmision}</FechaEmision>
        <Emisor>
          <Nombre>${invoiceData?.channel?.name}</Nombre>
          <Identificacion>
            <Tipo>${invoiceData?.channel?.ident_type}</Tipo>
            <Numero>${invoiceData?.channel?.ident}</Numero>
          </Identificacion>
          ${registroFiscalNode}
          <NombreComercial>${invoiceData?.channel?.commercial_name}</NombreComercial>
          ${ubicacionEmisor}
          <Telefono>
            <CodigoPais>${invoiceData?.channel?.phone_code}</CodigoPais>
            <NumTelefono>${invoiceData?.channel?.phone}</NumTelefono>
          </Telefono>
          <CorreoElectronico>${invoiceData?.channel?.email}</CorreoElectronico>
        </Emisor>
        <Receptor>
          <Nombre>${nombreReceptor}</Nombre>
          <Identificacion>
            <Tipo>${tipoIdentificacionReceptor}</Tipo>
            <Numero>${numeroIdentificacionReceptor}</Numero>
          </Identificacion>
          <NombreComercial>${nombreComercialReceptor}</NombreComercial>
          ${ubicacionReceptor}
          <Telefono>
            <CodigoPais>${codigoPaisReceptor}</CodigoPais>
            <NumTelefono>${numeroTelefonoReceptor}</NumTelefono>
          </Telefono>
          <CorreoElectronico>${correoElectronicoReceptor}</CorreoElectronico>
        </Receptor>
        <CondicionVenta>${condicionVentaText}</CondicionVenta>
        ${condicionVentaEspecificacionNode}
        <PlazoCredito>${plazoCredito}</PlazoCredito>
        <Detalle>${detalleFactura}</Detalle>
        ${otrosCargosText}
        <ResumenFactura>
          <CodigoTipoMoneda>
            <CodigoMoneda>${tipoMoneda}</CodigoMoneda>
            <TipoCambio>${cambioMoneda}</TipoCambio>
          </CodigoTipoMoneda>
          <TotalServGravados>${totalesFinales.totalServGravados}</TotalServGravados>
          <TotalServExentos>${totalesFinales.totalServExentos}</TotalServExentos>
          <TotalServExonerado>${totalesFinales.totalServExonerado}</TotalServExonerado>
          <TotalServNoSujeto>${totalesFinales.totalServNoSujeto}</TotalServNoSujeto>
          <TotalMercanciasGravadas>${totalesFinales.totalMercanciasGravadas}</TotalMercanciasGravadas>
          <TotalMercanciasExentas>${totalesFinales.totalMercanciasExentas}</TotalMercanciasExentas>
          <TotalMercExonerada>${totalesFinales.totalMercExonerada}</TotalMercExonerada>
          <TotalMercNoSujeta>${totalesFinales.totalMercNoSujeta}</TotalMercNoSujeta>
          <TotalGravado>${totalesFinales.totalGravado}</TotalGravado>
          <TotalExento>${totalesFinales.totalExento}</TotalExento>
          <TotalExonerado>${totalesFinales.totalExonerado}</TotalExonerado>
          <TotalNoSujeto>${totalesFinales.totalNoSujeto}</TotalNoSujeto>
          <TotalVenta>${totalesFinales.totalVenta}</TotalVenta>
          <TotalDescuentos>${totalesFinales.totalDescuentos}</TotalDescuentos>
          <TotalVentaNeta>${totalesFinales.totalVentaNeta}</TotalVentaNeta>
          ${totalDesgloseImpuesto}
          <TotalImpuesto>${totalesFinales.totalImpuesto}</TotalImpuesto>
          <TotalImpAsumEmisorFabrica>${totalesFinales.totalImpAsumEmisorFabrica}</TotalImpAsumEmisorFabrica>
          <TotalIVADevuelto>${totalesFinales.totalIVADevuelto}</TotalIVADevuelto>
          <TotalOtrosCargos>${totalesFinales.totalOtrosCargos}</TotalOtrosCargos>
          ${medioPagoText}
          <TotalComprobante>${totalesFinales.totalComprobante}</TotalComprobante>
        </ResumenFactura>
        ${infoReferencia}
        ${otrosText}
      </${def.header}>`

      // Firmar XML (server-side) con XAdES-EPES. Nunca se expone la llave privada al cliente.
      try {
        const signResp = await fetch('/api/xml/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId,
            xml,
            // Para XAdES-EPES, usamos como policyIdentifier el namespace del comprobante (v4.4)
            policyIdentifier: xmlns
          })
        })
        const signData = await signResp.json()
        if (signResp.ok && signData?.success && signData?.signedXml) {
          xml = signData.signedXml
        } else {
          const signError = signData?.error || 'No se pudo firmar el XML'
          console.error('No se pudo firmar el XML:', signError)
          alert(signError)
          return
        }
      } catch (e: any) {
        console.error('Error firmando XML:', e)
        alert(e?.message || 'Error firmando XML')
        return
      }

      try {
        const includeReceptor = normalizedTipoDocumento === '01'
        const fechaActualCR = formatCostaRicaDateTime()
        const xmlBase64 = toBase64Utf8(xml)
        const tokenResp = await fetch('/api/channel/crypto-key/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId,
            clave,
            fecha: fechaActualCR,
            emisor: {
              tipoIdentificacion: invoiceData?.channel?.ident_type || '',
              numeroIdentificacion: invoiceData?.channel?.ident || ''
            },
            receptor: includeReceptor
              ? {
                tipoIdentificacion: tipoIdentificacionReceptor,
                numeroIdentificacion: numeroIdentificacionReceptor
              }
              : undefined,
            includeReceptor,
            comprobanteXml: xmlBase64
          })
        })
        const tokenData = await tokenResp.json()

        const tipoEnvio = invoiceData?.channel?.crypto_key?.status === 'sand' ? 'stag' : 'prod'
        const [fechaParte, horaParteRaw = ''] = fechaActualCR.split('T')
        const horaParte = horaParteRaw.split('-')[0] || ''
        const tipoFacturaLabel =
          TIPOS_DOCUMENTO.find((t) => t.value === normalizedTipoDocumento)?.label || normalizedTipoDocumento

        await fetch('/api/facturas-generadas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel_id: channelId,
            clave,
            tipo_factura: tipoFacturaLabel,
            sucursal: invoiceData?.sucursal?.nombre || '',
            actividad_economica: invoiceData?.actividadEconomica?.nombre_personal || '',
            nombre_emisor: invoiceData?.channel?.name || '',
            cedula_receptor: normalizedTipoDocumento === '01' ? numeroIdentificacionReceptor : '',
            nombre_receptor: normalizedTipoDocumento === '01' ? nombreReceptor : '',
            fecha: fechaParte || fechaActualCR,
            hora: horaParte,
            total_factura: Number(totalesFinales.totalComprobante || 0),
            total_impuesto: Number(totalesFinales.totalImpuesto || 0),
            estado: 'pendiente',
            xml: xmlBase64,
            tipo: tipoEnvio
          })
        })

        if (!tokenResp.ok || !tokenData?.success) {
          alert(tokenData?.error || 'No se pudo enviar la factura a la API de recepción')
        }
        onFacturaGenerada?.()
        completed = true
      } catch (error: any) {
        alert(error?.message || 'Error enviando factura')
      }
    } finally {
      setIsSubmitting(false)
      if (completed) {
        closeModal(true)
      }
    }
  }

  if (!isOpen) return null


  const summaryItems = inventarioItems.filter((item) => {
    const cantidad = cantidadesSeleccionadas[item._id] || 0
    return cantidad > 0
  })

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>📄 Nueva Factura</h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            disabled={loading || isSubmitting}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Cargando datos...</p>
            </div>
          ) : (
            <>
              {/* Sección: Datos principales de la factura */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Datos principales de la factura</h3>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="tipoDocumento">
                      Tipo de documento <span className={styles.required}>*</span>
                    </label>
                    <select
                      id="tipoDocumento"
                      value={tipoDocumento}
                      onChange={(e) => setTipoDocumento(e.target.value)}
                      className={styles.selectInput}
                    >
                      {TIPOS_DOCUMENTO.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Actividad económica
                    </label>
                    <div className={styles.valueDisplay}>
                      {invoiceData?.actividadEconomica?.nombre_personal || 'No asignada'}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Sucursal
                    </label>
                    <div className={styles.valueDisplay}>
                      {invoiceData?.sucursal?.nombre || 'No asignada'}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Consecutivo
                    </label>
                    <div className={styles.valueDisplay}>
                      {consecutivo || 'Calculando...'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección: Información del emisor */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Información del emisor</h3>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Nombre del emisor
                    </label>
                    <div className={styles.valueDisplay}>
                      {invoiceData?.channel?.name || 'No disponible'}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Tipo de identificación
                    </label>
                    <div className={styles.valueDisplay}>
                      {invoiceData?.channel?.ident_type
                        ? `${invoiceData.channel.ident_type} - ${TIPOS_IDENTIFICACION[invoiceData.channel.ident_type] || invoiceData.channel.ident_type}`
                        : 'No disponible'}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Número de identificación
                    </label>
                    <div className={styles.valueDisplay}>
                      {invoiceData?.channel?.ident || 'No disponible'}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Nombre comercial
                    </label>
                    <div className={styles.valueDisplay}>
                      {invoiceData?.channel?.commercial_name || 'No disponible'}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Código de teléfono
                    </label>
                    <div className={styles.valueDisplay}>
                      {invoiceData?.channel?.phone_code || 'No disponible'}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Número de teléfono
                    </label>
                    <div className={styles.valueDisplay}>
                      {invoiceData?.channel?.phone || 'No disponible'}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Email
                    </label>
                    <div className={styles.valueDisplay}>
                      {invoiceData?.channel?.email || 'No disponible'}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Registro fiscal 8707
                    </label>
                    <div className={styles.valueDisplay}>
                      {invoiceData?.channel?.registro_fiscal_IVA || 'No disponible'}
                    </div>
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.label}>
                      Ubicación
                    </label>
                    <div className={styles.valueDisplay}>
                      {ubicacionTexto || 'No disponible'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección: Información del receptor */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Información del receptor</h3>

                <div className={styles.formGrid}>
                  <div className={styles.formGroupFull}>
                    <label htmlFor="clienteSeleccionado" className={styles.label}>
                      Clientes registrados
                    </label>
                    <select
                      id="clienteSeleccionado"
                      value={clienteSeleccionado}
                      onChange={(e) => handleClienteChange(e.target.value)}
                      className={styles.selectInput}
                    >
                      <option value="">Seleccione un cliente</option>
                      {clientes.map((cliente) => (
                        <option key={cliente._id} value={cliente._id}>
                          {cliente.name} - {cliente.ident}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="nombreReceptor" className={styles.label}>
                      Nombre del receptor
                    </label>
                    <input
                      type="text"
                      id="nombreReceptor"
                      value={nombreReceptor}
                      onChange={(e) => setNombreReceptor(e.target.value)}
                      className={styles.textInput}
                      placeholder="Ingrese el nombre"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="tipoIdentificacionReceptor" className={styles.label}>
                      Tipo de identificación
                    </label>
                    <select
                      id="tipoIdentificacionReceptor"
                      value={tipoIdentificacionReceptor}
                      onChange={(e) => setTipoIdentificacionReceptor(e.target.value)}
                      className={styles.selectInput}
                    >
                      <option value="">Seleccione</option>
                      <option value="01">01 - Física</option>
                      <option value="02">02 - Jurídica</option>
                      <option value="03">03 - DIMEX</option>
                      <option value="04">04 - NITE</option>
                      <option value="##">## - Extranjero</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="numeroIdentificacionReceptor" className={styles.label}>
                      Número de identificación
                    </label>
                    <div className={styles.inputWithButton}>
                      <input
                        type="text"
                        id="numeroIdentificacionReceptor"
                        value={numeroIdentificacionReceptor}
                        onChange={(e) => setNumeroIdentificacionReceptor(e.target.value)}
                        className={styles.textInput}
                        placeholder="Ingrese el número"
                        disabled={searchingHacienda}
                      />
                      <button
                        type="button"
                        onClick={searchHacienda}
                        disabled={searchingHacienda || !numeroIdentificacionReceptor.trim()}
                        className={styles.searchButton}
                        title="Buscar en Hacienda"
                      >
                        {searchingHacienda ? (
                          <span className={styles.spinner}></span>
                        ) : (
                          '🔍'
                        )}
                      </button>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="nombreComercialReceptor" className={styles.label}>
                      Nombre comercial
                    </label>
                    <input
                      type="text"
                      id="nombreComercialReceptor"
                      value={nombreComercialReceptor}
                      onChange={(e) => setNombreComercialReceptor(e.target.value)}
                      className={styles.textInput}
                      placeholder="Ingrese el nombre comercial"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="codigoPaisReceptor" className={styles.label}>
                      Código del país
                    </label>
                    <input
                      type="text"
                      id="codigoPaisReceptor"
                      value={codigoPaisReceptor}
                      onChange={(e) => setCodigoPaisReceptor(e.target.value)}
                      className={styles.textInput}
                      placeholder="Ej: 506"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="numeroTelefonoReceptor" className={styles.label}>
                      Número de teléfono
                    </label>
                    <input
                      type="text"
                      id="numeroTelefonoReceptor"
                      value={numeroTelefonoReceptor}
                      onChange={(e) => setNumeroTelefonoReceptor(e.target.value)}
                      className={styles.textInput}
                      placeholder="Ingrese el número"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="correoElectronicoReceptor" className={styles.label}>
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      id="correoElectronicoReceptor"
                      value={correoElectronicoReceptor}
                      onChange={(e) => setCorreoElectronicoReceptor(e.target.value)}
                      className={styles.textInput}
                      placeholder="ejemplo@correo.com"
                    />
                  </div>

                  <div className={styles.formGroupFull}>
                    <label htmlFor="actividadEconomicaReceptor" className={styles.label}>
                      Actividad económica
                    </label>
                    {clienteSeleccionado ? (
                      <select
                        id="actividadEconomicaReceptor"
                        value={actividadEconomicaSeleccionada}
                        onChange={(e) => setActividadEconomicaSeleccionada(e.target.value)}
                        className={styles.selectInput}
                      >
                        <option value="">Seleccione una actividad</option>
                        {clientes
                          .find(c => c._id === clienteSeleccionado)
                          ?.act_ecos?.map((code) => {
                            const actividad = actividadesEconomicas.find(
                              act => String(act.name) === String(code)
                            )
                            return (
                              <option key={code} value={code}>
                                {actividad ? `${actividad.name} - ${actividad.description}` : code}
                              </option>
                            )
                          })}
                      </select>
                    ) : (
                      <div className={styles.autocompleteContainer}>
                        {(() => {
                          const isLocked = Boolean(actividadEconomicaSeleccionada)
                          return (
                            <>
                              <div className={styles.inputWithButton}>
                                <input
                                  ref={actividadEconomicaInputRef}
                                  type="text"
                                  id="actividadEconomicaReceptor"
                                  value={actividadEconomicaSearch}
                                  readOnly={isLocked}
                                  onChange={(e) => {
                                    if (isLocked) return
                                    setActividadEconomicaSearch(e.target.value)
                                    setActividadEconomicaSeleccionada('')
                                  }}
                                  onFocus={() => {
                                    if (isLocked) return
                                    if (actividadEconomicaSearch) {
                                      setShowActividadEconomicaDropdown(true)
                                    }
                                  }}
                                  onBlur={() => {
                                    // Cerrar dropdown después de un pequeño delay para permitir el click
                                    setTimeout(() => setShowActividadEconomicaDropdown(false), 200)
                                  }}
                                  className={styles.textInput}
                                  placeholder="Buscar por código o descripción"
                                />
                                {isLocked && (
                                  <button
                                    type="button"
                                    className={styles.clearButton}
                                    onClick={clearActividadEconomicaSelection}
                                    title="Borrar selección"
                                    aria-label="Borrar selección"
                                  >
                                    🗑️
                                  </button>
                                )}
                              </div>
                              {!isLocked &&
                                showActividadEconomicaDropdown &&
                                actividadEconomicaFiltrada.length > 0 && (
                                  <div
                                    className={styles.autocompleteDropdown}
                                    onMouseDown={(e) => e.preventDefault()} // Prevenir blur al hacer click
                                  >
                                    {actividadEconomicaFiltrada.map((actividad, index) => (
                                      <div
                                        key={index}
                                        className={styles.autocompleteItem}
                                        onClick={() => handleActividadEconomicaSelect(actividad)}
                                      >
                                        <strong>{actividad.name}</strong> - {actividad.description}
                                      </div>
                                    ))}
                                  </div>
                                )}
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="provinciaReceptor" className={styles.label}>
                      Provincia
                    </label>
                    <select
                      id="provinciaReceptor"
                      value={provinciaReceptor}
                      onChange={(e) => setProvinciaReceptor(e.target.value)}
                      className={styles.selectInput}
                    >
                      <option value="">Seleccione una provincia</option>
                      {ubicaciones && Object.keys(ubicaciones.provincias).map((key) => (
                        <option key={key} value={key}>
                          {ubicaciones.provincias[key].nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="cantonReceptor" className={styles.label}>
                      Cantón
                    </label>
                    <select
                      id="cantonReceptor"
                      value={cantonReceptor}
                      onChange={(e) => setCantonReceptor(e.target.value)}
                      className={styles.selectInput}
                      disabled={!provinciaReceptor}
                    >
                      <option value="">Seleccione un cantón</option>
                      {Object.keys(cantonesDisponibles).map((key) => (
                        <option key={key} value={key}>
                          {cantonesDisponibles[key]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="distritoReceptor" className={styles.label}>
                      Distrito
                    </label>
                    <select
                      id="distritoReceptor"
                      value={distritoReceptor}
                      onChange={(e) => setDistritoReceptor(e.target.value)}
                      className={styles.selectInput}
                      disabled={!cantonReceptor}
                    >
                      <option value="">Seleccione un distrito</option>
                      {Object.keys(distritosDisponibles).map((key) => (
                        <option key={key} value={key}>
                          {distritosDisponibles[key]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroupFull}>
                    <label htmlFor="otrasSenasReceptor" className={styles.label}>
                      Otras señas
                    </label>
                    <input
                      type="text"
                      id="otrasSenasReceptor"
                      value={otrasSenasReceptor}
                      onChange={(e) => setOtrasSenasReceptor(e.target.value)}
                      className={styles.textInput}
                      placeholder="Ingrese otras señas"
                    />
                  </div>
                </div>
              </div>

              {/* Sección: Condición de la venta */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Condición de la venta</h3>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="condicionVenta" className={styles.label}>
                      Condición de la venta
                    </label>
                    <select
                      id="condicionVenta"
                      value={condicionVenta}
                      onChange={(e) => setCondicionVenta(e.target.value)}
                      className={styles.selectInput}
                    >
                      <option value="">Seleccione una condición</option>
                      {CONDICIONES_VENTA.map((condicion) => (
                        <option key={condicion.value} value={condicion.value}>
                          {condicion.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="especificacion" className={styles.label}>
                      Especificación
                    </label>
                    <input
                      type="text"
                      id="especificacion"
                      value={especificacion}
                      onChange={(e) => setEspecificacion(e.target.value)}
                      className={styles.textInput}
                      placeholder="Ingrese la especificación"
                      disabled={condicionVenta !== '99'}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="plazoCredito" className={styles.label}>
                      Plazo de crédito
                    </label>
                    <div className={styles.inputWithSelect}>
                      <input
                        type="text"
                        id="plazoCredito"
                        value={plazoCredito}
                        onChange={(e) => setPlazoCredito(e.target.value)}
                        className={styles.textInput}
                        placeholder="Ingrese el plazo"
                      />
                      <select
                        id="unidadPlazoCredito"
                        value={unidadPlazoCredito}
                        onChange={(e) => setUnidadPlazoCredito(e.target.value)}
                        className={styles.selectInput}
                      >
                        {UNIDADES_PLAZO.map((unidad) => (
                          <option key={unidad.value} value={unidad.value}>
                            {unidad.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección: Medios de pago */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Medios de pago</h3>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="tipoMedioPago" className={styles.label}>
                      Tipo
                    </label>
                    <select
                      id="tipoMedioPago"
                      value={nuevoMedioPago.tipoMedioPago}
                      onChange={(e) => setNuevoMedioPago(prev => ({
                        ...prev,
                        tipoMedioPago: e.target.value,
                        descripcion: e.target.value !== '99' ? '' : prev.descripcion
                      }))}
                      className={styles.selectInput}
                    >
                      <option value="">Seleccione un tipo</option>
                      {TIPOS_MEDIO_PAGO.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={`${styles.formGroup} ${styles.formGroupSpan2}`}>
                    <label htmlFor="descripcionMedioPago" className={styles.label}>
                      Descripción
                    </label>
                    <input
                      type="text"
                      id="descripcionMedioPago"
                      value={nuevoMedioPago.descripcion}
                      onChange={(e) => setNuevoMedioPago(prev => ({
                        ...prev,
                        descripcion: e.target.value
                      }))}
                      className={styles.textInput}
                      placeholder="Ingrese la descripción"
                      disabled={nuevoMedioPago.tipoMedioPago !== '99'}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="totalMedioPago" className={styles.label}>
                      Total
                    </label>
                    <input
                      type="number"
                      id="totalMedioPago"
                      value={usarTotalVenta ? totalesFinales.totalComprobante : (nuevoMedioPago.totalMedioPago || '')}
                      onChange={(e) => {
                        if (!usarTotalVenta) {
                          setNuevoMedioPago(prev => ({
                            ...prev,
                            totalMedioPago: Number(e.target.value) || 0
                          }))
                        }
                      }}
                      className={styles.textInput}
                      placeholder="Ingrese el total"
                      min="0"
                      step="0.01"
                      readOnly={usarTotalVenta}
                      disabled={usarTotalVenta}
                    />

                    {/* Checkbox Total de la venta - solo visible cuando no hay registros */}
                    {mediosPago.length === 0 && (
                      <div className={styles.checkboxGroup} style={{ marginTop: 10 }}>
                        <input
                          type="checkbox"
                          id="usarTotalVenta"
                          checked={usarTotalVenta}
                          onChange={(e) => {
                            setUsarTotalVenta(e.target.checked)
                            if (e.target.checked) {
                              setNuevoMedioPago(prev => ({
                                ...prev,
                                totalMedioPago: totalesFinales.totalComprobante
                              }))
                            }
                          }}
                        />
                        <label htmlFor="usarTotalVenta">Total de la venta</label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botón Añadir medio de pago */}
                <div className={styles.sectionActions}>
                  <button
                    type="button"
                    onClick={handleAddMedioPago}
                    className={styles.addCargoButton}
                  >
                    Añadir
                  </button>
                </div>

                {/* Tabla de medios de pago agregados */}
                {mediosPago.length > 0 && (
                  <div className={styles.otherChargesTableWrapper}>
                    <table className={styles.summaryTable}>
                      <thead>
                        <tr>
                          <th>Tipo</th>
                          <th>Descripción</th>
                          <th>Total</th>
                          <th>Total de la venta</th>
                          <th>Eliminar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mediosPago.map((medioPago) => (
                          <tr key={medioPago.id}>
                            <td>
                              {TIPOS_MEDIO_PAGO.find(t => t.value === medioPago.tipoMedioPago)?.label || medioPago.tipoMedioPago}
                            </td>
                            <td>
                              {medioPago.tipoMedioPago === '99'
                                ? medioPago.descripcion
                                : TIPOS_MEDIO_PAGO.find(t => t.value === medioPago.tipoMedioPago)?.label?.split(' - ')[1] || '-'}
                            </td>
                            <td>{Number(medioPago.totalMedioPago || 0).toFixed(2)}</td>
                            <td>{medioPago.usarTotalVenta ? 'Sí' : 'No'}</td>
                            <td>
                              <button
                                type="button"
                                onClick={() => handleRemoveMedioPago(medioPago.id)}
                                className={styles.summaryAction}
                                title="Eliminar medio de pago"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Sección: Tipo de cambio */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Tipo de cambio</h3>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="tipoMoneda" className={styles.label}>
                      Tipo de moneda
                    </label>
                    <select
                      id="tipoMoneda"
                      value={tipoMoneda}
                      onChange={(e) => setTipoMoneda(e.target.value)}
                      className={styles.selectInput}
                    >
                      {TIPOS_MONEDA.map((moneda) => (
                        <option key={moneda.value} value={moneda.value}>
                          {moneda.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="cambioMoneda" className={styles.label}>
                      Cambio de la moneda
                    </label>
                    <input
                      type="number"
                      id="cambioMoneda"
                      value={cambioMoneda}
                      onChange={(e) => setCambioMoneda(e.target.value)}
                      className={styles.textInput}
                      placeholder="Cambio de la moneda"
                      disabled={tipoMoneda === 'CRC' || loadingCambio}
                      step="any"
                    />
                    {loadingCambio && (
                      <span style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                        Cargando tipo de cambio...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sección: Detalle de la factura */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Detalle de la factura</h3>
                <div className={styles.itemsGrid}>
                  {inventarioItems.length === 0 ? (
                    <p className={styles.emptyItemsText}>
                      No hay artículos de inventario registrados para este canal.
                    </p>
                  ) : (
                    inventarioItems.map((item) => {
                      const cantidadSeleccionada = cantidadesSeleccionadas[item._id] || 0
                      // Construir la URL de la imagen igual que en InventarioModal.tsx
                      const imageUrl = item.image && item.image.trim()
                        ? `/protected/inventory-images/${channelId}/${item._id}/${item.image.trim()}`
                        : null
                      const displayTitle = (item.titulo?.trim() || item.descripcion || 'Artículo sin título').trim()
                      return (
                        <div key={item._id} className={styles.itemCard}>
                          {/* Primera fila: Imagen, Título y Descripción */}
                          <div className={styles.itemRow1}>
                            <div className={styles.itemImageWrapper}>
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={displayTitle}
                                  className={styles.itemImage}
                                  onError={(e) => {
                                    // Si la imagen falla al cargar, mostrar placeholder
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                    const placeholder = target.nextElementSibling as HTMLElement
                                    if (placeholder && placeholder.classList.contains(styles.itemImagePlaceholder)) {
                                      placeholder.style.display = 'flex'
                                    }
                                  }}
                                />
                              ) : null}
                              <div
                                className={styles.itemImagePlaceholder}
                                style={{ display: imageUrl ? 'none' : 'flex' }}
                              >
                                <span>Sin imagen</span>
                              </div>
                            </div>
                            <div className={styles.itemTextContainer}>
                              <div
                                className={styles.itemTitle}
                                title={displayTitle}
                              >
                                {displayTitle}
                              </div>
                              <div
                                className={styles.itemDescription}
                                title={item.descripcion}
                              >
                                {item.descripcion}
                              </div>
                            </div>
                          </div>
                          {/* Segunda fila: Precio y Botones */}
                          <div className={styles.itemRow2}>
                            <span className={styles.itemPrice}>
                              ₡{item.precio.toLocaleString('es-CR')}
                            </span>
                            <div className={styles.quantityControls}>
                              <button
                                type="button"
                                className={styles.quantityButton}
                                onClick={() =>
                                  handleChangeCantidad(item._id, -1, item.cantidad)
                                }
                                disabled={cantidadSeleccionada <= 0}
                              >
                                −
                              </button>
                              <span className={styles.quantityLabel}>
                                {cantidadSeleccionada}
                              </span>
                              <button
                                type="button"
                                className={styles.quantityButton}
                                onClick={() =>
                                  handleChangeCantidad(item._id, 1, item.cantidad)
                                }
                                disabled={cantidadSeleccionada >= item.cantidad}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Sección: Resumen */}
              {summaryItems.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.summaryTableWrapper}>
                    <table className={styles.summaryTable}>
                      <thead>
                        <tr>
                          <th>Eliminar</th>
                          <th>Título</th>
                          <th>Precio</th>
                          <th style={{ minWidth: '90px' }}>Cantidad</th>
                          <th>Aplicar descuento</th>
                          <th>Descuento</th>
                          <th>Aplicar impuesto</th>
                          <th>Impuesto</th>
                          <th>Aplicar exoneración</th>
                          <th>Exoneración</th>
                          <th>Monto total de la línea</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaryItems.map((item) => {
                          const cantidadSeleccionada = cantidadesSeleccionadas[item._id] || 0
                          const options = lineOptions[item._id] || getDefaultLineOption(item)
                          const total = cantidadSeleccionada * item.precio
                          const discountBase = item.montoDescuento || 0
                          const discountAmount =
                            options.applyDiscount && item.tieneDescuento
                              ? item.tipoDescuento === 'Porcentual'
                                ? (total * discountBase) / 100
                                : discountBase
                              : 0
                          const subtotal = total - discountAmount
                          const baseParaImpuesto =
                            item.baseImponible && item.baseImponible > 0 ? item.baseImponible : subtotal
                          const taxAmount =
                            options.applyTax && item.tieneImpuesto
                              ? (baseParaImpuesto * (item.tarifa || 0)) / 100
                              : 0
                          const exonerationAmount =
                            options.applyExoneration && item.tieneExoneracion && options.applyTax
                              ? (baseParaImpuesto * (item.porcentajeExoneracion || 0)) / 100
                              : 0
                          const impuestoNeto = Math.max(0, taxAmount - exonerationAmount)
                          const lineTotal = subtotal + impuestoNeto
                          const discountDisplay =
                            item.tipoDescuento === 'Porcentual'
                              ? formatPercent(discountBase)
                              : formatCurrency(discountBase)
                          const taxDisplay = formatPercent(item.tarifa || 0)
                          const exoneracionDisplay = formatPercent(item.porcentajeExoneracion || 0)

                          return (
                            <tr key={`summary-${item._id}`}>
                              <td>
                                <button
                                  type="button"
                                  className={styles.summaryAction}
                                  onClick={() => handleQuantityInputChange(item._id, 0, item.cantidad)}
                                >
                                  Eliminar
                                </button>
                              </td>
                              <td>{item.titulo || item.descripcion}</td>
                              <td>{formatCurrency(item.precio)}</td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  max={item.cantidad}
                                  value={cantidadSeleccionada}
                                  onChange={(e) =>
                                    handleQuantityInputChange(
                                      item._id,
                                      Number(e.target.value) || 0,
                                      item.cantidad
                                    )
                                  }
                                  className={styles.summaryQuantityInput}
                                />
                              </td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={options.applyDiscount}
                                  disabled={!item.tieneDescuento}
                                  onChange={(e) =>
                                    handleLineOptionChange(
                                      item._id,
                                      'applyDiscount',
                                      e.target.checked
                                    )
                                  }
                                />
                              </td>
                              <td>{discountDisplay}</td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={options.applyTax}
                                  disabled={!item.tieneImpuesto}
                                  onChange={(e) =>
                                    handleLineOptionChange(item._id, 'applyTax', e.target.checked)
                                  }
                                />
                              </td>
                              <td>{taxDisplay}</td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={options.applyExoneration}
                                  disabled={
                                    !item.tieneExoneracion ||
                                    !item.tieneImpuesto ||
                                    !options.applyTax
                                  }
                                  onChange={(e) =>
                                    handleLineOptionChange(
                                      item._id,
                                      'applyExoneration',
                                      e.target.checked
                                    )
                                  }
                                />
                              </td>
                              <td>{exoneracionDisplay}</td>
                              <td>{formatCurrency(lineTotal)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sección: Otros cargos */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Otros cargos</h3>

                {/* Todos los inputs principales en una línea */}
                <div className={styles.cargosFormRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="tipoDocumentoCargo" className={styles.label}>
                      Tipo de documento
                    </label>
                    <select
                      id="tipoDocumentoCargo"
                      value={nuevoCargo.tipoDocumento}
                      onChange={(e) =>
                        handleCargoFieldChange('tipoDocumento', e.target.value)
                      }
                      className={styles.selectInput}
                    >
                      <option value="">Seleccionar tipo</option>
                      {TIPOS_DOCUMENTO_CARGO.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="detalleOtros" className={styles.label}>
                      Detalle (Otros)
                    </label>
                    <input
                      type="text"
                      id="detalleOtros"
                      value={nuevoCargo.detalleOtros}
                      onChange={(e) =>
                        handleCargoFieldChange('detalleOtros', e.target.value)
                      }
                      disabled={nuevoCargo.tipoDocumento !== '99'}
                      className={styles.textInput}
                      placeholder={
                        nuevoCargo.tipoDocumento !== '99'
                          ? 'Solo disponible para tipo 99'
                          : 'Ingrese el detalle'
                      }
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="porcentajeCargo" className={styles.label}>
                      Porcentaje del cargo
                    </label>
                    <div className={styles.inputWithSuffix}>
                      <input
                        type="text"
                        id="porcentajeCargo"
                        value={nuevoCargo.porcentajeCargo}
                        onChange={(e) =>
                          handleCargoFieldChange('porcentajeCargo', e.target.value)
                        }
                        className={styles.textInput}
                        placeholder="0.00"
                      />
                      <span className={styles.inputSuffix}>%</span>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="montoCargo" className={styles.label}>
                      Monto del cargo
                    </label>
                    <input
                      type="text"
                      id="montoCargo"
                      value={nuevoCargo.montoCargo}
                      onChange={(e) =>
                        handleCargoFieldChange('montoCargo', e.target.value)
                      }
                      className={styles.textInput}
                      placeholder="0.00"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="detalleCargo" className={styles.label}>
                      Detalle del cargo
                    </label>
                    <input
                      type="text"
                      id="detalleCargo"
                      value={nuevoCargo.detalleCargo}
                      onChange={(e) =>
                        handleCargoFieldChange('detalleCargo', e.target.value)
                      }
                      className={styles.textInput}
                      placeholder="Detalle del cargo"
                    />
                  </div>
                </div>

                {/* Sección de tercero */}
                <div className={styles.subsubsection}>
                  <div className={styles.checkboxGroup}>
                    <input
                      type="checkbox"
                      id="esTercero"
                      checked={nuevoCargo.esTercero}
                      onChange={(e) =>
                        handleCargoFieldChange('esTercero', e.target.checked)
                      }
                    />
                    <label htmlFor="esTercero">¿Tercero?</label>
                  </div>

                  {nuevoCargo.esTercero && (
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="nombreTercero" className={styles.label}>
                          Nombre tercero
                        </label>
                        <input
                          type="text"
                          id="nombreTercero"
                          value={nuevoCargo.nombreTercero}
                          onChange={(e) =>
                            handleCargoFieldChange('nombreTercero', e.target.value)
                          }
                          className={styles.textInput}
                          placeholder="Ingrese el nombre"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="tipoTercero" className={styles.label}>
                          Tipo tercero
                        </label>
                        <select
                          id="tipoTercero"
                          value={nuevoCargo.tipoTercero}
                          onChange={(e) =>
                            handleCargoFieldChange('tipoTercero', e.target.value)
                          }
                          className={styles.selectInput}
                        >
                          <option value="">Seleccionar tipo</option>
                          {Object.entries(TIPOS_IDENTIFICACION).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="numeroIdentificacion" className={styles.label}>
                          Número identificación
                        </label>
                        <input
                          type="text"
                          id="numeroIdentificacion"
                          value={nuevoCargo.numeroIdentificacion}
                          onChange={(e) =>
                            handleCargoFieldChange(
                              'numeroIdentificacion',
                              e.target.value
                            )
                          }
                          className={styles.textInput}
                          placeholder="Ingrese el número"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Botón Añadir cargo */}
                <div className={styles.formGroup}>
                  <button
                    type="button"
                    onClick={handleAddCargo}
                    className={styles.addCargoButton}
                  >
                    Añadir cargo
                  </button>
                </div>

                {/* Tabla de cargos agregados */}
                {otrosCargos.length > 0 && (
                  <div className={styles.otherChargesTableWrapper}>
                    <table className={styles.summaryTable}>
                      <thead>
                        <tr>
                          <th>Eliminar</th>
                          <th>Tipo de documento</th>
                          <th>Detalle (Otros)</th>
                          <th>Tipo de cédula (Si hubiese)</th>
                          <th>Cédula tercero (Si hubiese)</th>
                          <th>Nombre tercero (Si hubiese)</th>
                          <th>Porcentaje del cargo</th>
                          <th>Monto del cargo</th>
                          <th>Detalle del cargo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {otrosCargos.map((cargo) => (
                          <tr key={cargo.id}>
                            <td>
                              <button
                                type="button"
                                onClick={() => handleRemoveCargo(cargo.id)}
                                className={styles.summaryAction}
                                title="Eliminar cargo"
                              >
                                Eliminar
                              </button>
                            </td>
                            <td>
                              {TIPOS_DOCUMENTO_CARGO.find(t => t.value === cargo.tipoDocumento)?.label || cargo.tipoDocumento}
                            </td>
                            <td>{cargo.detalleOtros || '-'}</td>
                            <td>{cargo.tipoTercero ? TIPOS_IDENTIFICACION[cargo.tipoTercero] || cargo.tipoTercero : '-'}</td>
                            <td>{cargo.numeroIdentificacion || '-'}</td>
                            <td>{cargo.nombreTercero || '-'}</td>
                            <td>{cargo.porcentajeCargo ? `${cargo.porcentajeCargo}%` : '-'}</td>
                            <td>{cargo.montoCargo || '-'}</td>
                            <td>{cargo.detalleCargo || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Sección: Totales */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Totales</h3>
                <div className={styles.collapsableSection}>
                  <button
                    type="button"
                    className={styles.collapseButton}
                    onClick={() => setTotalsExpanded(!totalsExpanded)}
                    aria-expanded={totalsExpanded}
                  >
                    <span className={styles.collapseButtonText}>
                      {totalsExpanded ? '▼ Ocultar totales' : '▶ Mostrar totales'}
                    </span>
                  </button>

                  {totalsExpanded && (
                    <div className={styles.totalsGrid}>
                      <div className={styles.totalItem}>
                        <label className={styles.totalLabel}>Total servicios gravados</label>
                        <span className={styles.totalValue}>{totalesFinales.totalServGravados.toFixed(2)}</span>
                      </div>
                      <div className={styles.totalItem}>
                        <label className={styles.totalLabel}>Total servicios exentos</label>
                        <span className={styles.totalValue}>{totalesFinales.totalServExentos.toFixed(2)}</span>
                      </div>
                      <div className={styles.totalItem}>
                        <label className={styles.totalLabel}>Total servicios exonerados</label>
                        <span className={styles.totalValue}>{totalesFinales.totalServExonerado.toFixed(2)}</span>
                      </div>
                      <div className={styles.totalItem}>
                        <label className={styles.totalLabel}>Total servicios no sujetos</label>
                        <span className={styles.totalValue}>{totalesFinales.totalServNoSujeto.toFixed(2)}</span>
                      </div>
                      <div className={styles.totalItem}>
                        <label className={styles.totalLabel}>Total mercancías gravadas</label>
                        <span className={styles.totalValue}>{totalesFinales.totalMercanciasGravadas.toFixed(2)}</span>
                      </div>
                      <div className={styles.totalItem}>
                        <label className={styles.totalLabel}>Total mercancías exentas</label>
                        <span className={styles.totalValue}>{totalesFinales.totalMercanciasExentas.toFixed(2)}</span>
                      </div>
                      <div className={styles.totalItem}>
                        <label className={styles.totalLabel}>Total mercancías exoneradas</label>
                        <span className={styles.totalValue}>{totalesFinales.totalMercExonerada.toFixed(2)}</span>
                      </div>
                      <div className={styles.totalItem}>
                        <label className={styles.totalLabel}>Total mercancías no sujetas</label>
                        <span className={styles.totalValue}>{totalesFinales.totalMercNoSujeta.toFixed(2)}</span>
                      </div>
                      <div className={styles.totalItem}>
                        <label className={styles.totalLabel}>Total gravado</label>
                        <span className={styles.totalValue}>{totalesFinales.totalGravado.toFixed(2)}</span>
                      </div>
                      <div className={styles.totalItem}>
                        <label className={styles.totalLabel}>Total exento</label>
                        <span className={styles.totalValue}>{totalesFinales.totalExento.toFixed(2)}</span>
                      </div>
                      <div className={styles.totalItem}>
                        <label className={styles.totalLabel}>Total exonerado</label>
                        <span className={styles.totalValue}>{totalesFinales.totalExonerado.toFixed(2)}</span>
                      </div>
                      <div className={styles.totalItem}>
                        <label className={styles.totalLabel}>Total no sujeto</label>
                        <span className={styles.totalValue}>{totalesFinales.totalNoSujeto.toFixed(2)}</span>
                      </div>
                      <div className={styles.totalItem}>
                        <label className={styles.totalLabel}>Total venta</label>
                        <span className={styles.totalValue}>{totalesFinales.totalVenta.toFixed(2)}</span>
                      </div>
                      <div className={styles.totalItem}>
                        <label className={styles.totalLabel}>Total descuentos</label>
                        <span className={styles.totalValue}>{totalesFinales.totalDescuentos.toFixed(2)}</span>
                      </div>
                      <div className={styles.totalItem}>
                        <label className={styles.totalLabel}>Total venta neta</label>
                        <span className={styles.totalValue}>{totalesFinales.totalVentaNeta.toFixed(2)}</span>
                      </div>
                      <div className={styles.totalItem}>
                        <label className={styles.totalLabel}>Total impuesto</label>
                        <span className={styles.totalValue}>{totalesFinales.totalImpuesto.toFixed(2)}</span>
                      </div>
                      <div className={styles.totalItem}>
                        <label className={styles.totalLabel}>Total otros cargos</label>
                        <span className={styles.totalValue}>{totalesFinales.totalOtrosCargos.toFixed(2)}</span>
                      </div>
                      <div className={styles.totalItem}>
                        <label className={styles.totalLabel}>Total comprobante</label>
                        <span className={styles.totalValue}>{totalesFinales.totalComprobante.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sección: Documento de referencia */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Documento de referencia</h3>

                <div className={styles.referenceFileRow}>
                  <button
                    type="button"
                    className={styles.fileSelectButton}
                    onClick={() => document.getElementById('referenceXmlInput')?.click()}
                  >
                    Añadir archivo
                  </button>
                  <div className={styles.formGroup} style={{ marginBottom: 0, flex: 1 }}>
                    <label className={styles.label}>Seleccionado</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      value={referenceFilePath || ''}
                      placeholder="No se ha seleccionado ningún archivo."
                      readOnly
                    />
                  </div>
                </div>

                <input
                  id="referenceXmlInput"
                  type="file"
                  accept=".xml,text/xml,application/xml"
                  className={styles.hiddenFileInput}
                  onChange={handleReferenceFileChange}
                />

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="referenceTipoDocumento" className={styles.label}>
                      Tipo del documento
                    </label>
                    <select
                      id="referenceTipoDocumento"
                      value={referenceTipoDocumento}
                      onChange={(e) => setReferenceTipoDocumento(e.target.value)}
                      className={styles.selectInput}
                    >
                      <option value="">Seleccionar tipo</option>
                      {TIPOS_DOCUMENTO_REFERENCIA.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Clave del documento</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      value={referenceClave || 'Desconocida'}
                      readOnly
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="referenceCodigo" className={styles.label}>
                      Código de referencia
                    </label>
                    <select
                      id="referenceCodigo"
                      value={referenceCodigo}
                      onChange={(e) => setReferenceCodigo(e.target.value)}
                      className={styles.selectInput}
                    >
                      <option value="">Seleccionar código</option>
                      {CODIGOS_REFERENCIA.map((codigo) => (
                        <option key={codigo.value} value={codigo.value}>
                          {codigo.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="referenceRazon" className={styles.label}>
                      Razón
                    </label>
                    <input
                      id="referenceRazon"
                      type="text"
                      value={referenceRazon}
                      onChange={(e) => setReferenceRazon(e.target.value)}
                      className={styles.textInput}
                      placeholder="Ingrese la razón"
                    />
                  </div>
                </div>
              </div>

              {/* Sección: Información adicional */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Información adicional</h3>
                <AdditionalInfoEditor value={additionalInfo} onChange={setAdditionalInfo} />
              </div>
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={handleClose}
            className={styles.cancelButton}
            disabled={loading || isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.saveButton}
            disabled={loading || isSubmitting}
            onClick={buildAndDownloadXml}
          >
            {isSubmitting ? (
              <>
                <span className={styles.buttonSpinner}></span>
                Procesando...
              </>
            ) : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
