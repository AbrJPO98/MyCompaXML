'use client'
import React, { useState, useEffect, useCallback } from 'react'
import CabysSelectionModal from './CabysSelectionModal'
import CabysEditModal from './CabysEditModal'
import styles from './InventarioModal.module.css'

// Constantes para opciones de selects
const UNIDADES_MEDIDA = [
  { value: 'Al', label: 'Al - Alquiler de uso habitacional' },
  { value: 'Alc', label: 'Alc - Alquiler de uso comercial' },
  { value: 'Cm', label: 'Cm - Comisiones' },
  { value: 'I', label: 'I - Intereses' },
  { value: 'Os', label: 'Os - Otro tipo de servicio' },
  { value: 'Sp', label: 'Sp - Servicios Profesionales' },
  { value: 'Spe', label: 'Spe - Servicios personales' },
  { value: 'St', label: 'St - Servicios técnicos' },
  { value: '1', label: '1 - Uno (indice de refracción)' },
  { value: '´', label: '´ - minuto' },
  { value: '´´', label: '´´ - segundo' },
  { value: '°C', label: '°C - grado Celsius' },
  { value: '1/m', label: '1/m - 1 por metro' },
  { value: 'A', label: 'A - Ampere' },
  { value: 'A/m', label: 'A/m - Ampere por metro' },
  { value: 'A/m²', label: 'A/m² - Ampere por metro cuadrado' },
  { value: 'B', label: 'B - Bel' },
  { value: 'Bq', label: 'Bq - Becquerel' },
  { value: 'C', label: 'C - Coulomb' },
  { value: 'C/kg', label: 'C/kg - Coulomb por kilogramo' },
  { value: 'C/m²', label: 'C/m² - Coulomb por metro cuadrado' },
  { value: 'C/m³', label: 'C/m³ - Coulomb por metro cúbico' },
  { value: 'cd', label: 'cd - Candela' },
  { value: 'cd/m²', label: 'cd/m² - Candela por metro cuadrado' },
  { value: 'cm', label: 'cm - Centímetro' },
  { value: 'd', label: 'd - Día' },
  { value: 'eV', label: 'eV - Electronvolt' },
  { value: 'F', label: 'F - Farad' },
  { value: 'F/m', label: 'F/m - Farad por metro' },
  { value: 'g', label: 'g - Gramo' },
  { value: 'Gal', label: 'Gal - Galón' },
  { value: 'Gy', label: 'Gy - Gray' },
  { value: 'Gy/s', label: 'Gy/s - Gray por segundo' },
  { value: 'H', label: 'H - Henry' },
  { value: 'h', label: 'h - Hora' },
  { value: 'H/m', label: 'H/m - Henry por metro' },
  { value: 'Hz', label: 'Hz - Hertz' },
  { value: 'J', label: 'J - Joule' },
  { value: 'J/(kg·K)', label: 'J/(kg·K) - Joule por kilogramo kelvin' },
  { value: 'J/(mol·K)', label: 'J/(mol·K) - Joule por mol kelvin' },
  { value: 'J/K', label: 'J/K - Joule por kelvin' },
  { value: 'J/kg', label: 'J/kg - Joule por kilogramo' },
  { value: 'J/m³', label: 'J/m³ - Joule por metro cúbico' },
  { value: 'J/mol', label: 'J/mol - Joule por mol' },
  { value: 'K', label: 'K - Kelvin' },
  { value: 'kat', label: 'kat - Katal' },
  { value: 'kat/m³', label: 'kat/m³ - Katal por metro cúbico' },
  { value: 'kg', label: 'kg - Kilogramo' },
  { value: 'kg/m³', label: 'kg/m³ - Kilogramo por metro cúbico' },
  { value: 'Km', label: 'Km - Kilometro' },
  { value: 'Kw', label: 'Kw - Kilovatios' },
  { value: 'L', label: 'L - Litro' },
  { value: 'lm', label: 'lm - Lumen' },
  { value: 'ln', label: 'ln - Pulgada' },
  { value: 'lx', label: 'lx - Lux' },
  { value: 'm', label: 'm - Metro' },
  { value: 'm/s', label: 'm/s - Metro por segundo' },
  { value: 'm/s²', label: 'm/s² - Metro por segundo cuadrado' },
  { value: 'm²', label: 'm² - Metro cuadrado' },
  { value: 'm³', label: 'm³ - Metro cúbico' },
  { value: 'min', label: 'min - Minuto' },
  { value: 'mL', label: 'mL - Mililitro' },
  { value: 'mm', label: 'mm - Milímetro' },
  { value: 'mol', label: 'mol - Mol' },
  { value: 'mol/m³', label: 'mol/m³ - Mol por metro cúbico' },
  { value: 'N', label: 'N - Newton' },
  { value: 'N/m', label: 'N/m - Newton por metro' },
  { value: 'N·m', label: 'N·m - Newton metro' },
  { value: 'Np', label: 'Np - Neper' },
  { value: 'º', label: 'º - Grado' },
  { value: 'Oz', label: 'Oz - Onzas' },
  { value: 'Pa', label: 'Pa - Pascal' },
  { value: 'Pa·s', label: 'Pa·s - Pascal segundo' },
  { value: 'rad', label: 'rad - Radián' },
  { value: 'rad/s', label: 'rad/s - Radián por segundo' },
  { value: 'rad/s²', label: 'rad/s² - Radián por segundo cuadrado' },
  { value: 's', label: 's - Segundo' },
  { value: 'S', label: 'S - Siemens' },
  { value: 'sr', label: 'sr - Estereorradián' },
  { value: 'Sv', label: 'Sv - Sievert' },
  { value: 'T', label: 'T - Tesla' },
  { value: 't', label: 't - Tonelada' },
  { value: 'u', label: 'u - Unidad de masa atómica unificada' },
  { value: 'ua', label: 'ua - Unidad astronómica' },
  { value: 'Unid', label: 'Unid - Unidad' },
  { value: 'V', label: 'V - Volt' },
  { value: 'V/m', label: 'V/m - Volt por metro' },
  { value: 'W', label: 'W - Watt' },
  { value: 'W/(m·K)', label: 'W/(m·K) - Watt por metro kevin' },
  { value: 'W/(m²·sr)', label: 'W/(m²·sr) - Watt por metro cuadrado estereorradián' },
  { value: 'W/m²', label: 'W/m² - Watt por metro cuadrado' },
  { value: 'W/sr', label: 'W/sr - Watt por estereorradián' },
  { value: 'Wb', label: 'Wb - Weber' },
  { value: 'Ω', label: 'Ω - Ohm' }
]

const TIPOS_TRANSACCION = [
  { value: '01', label: '01 - Venta Normal de Bienes y Servicios (Transacción General)' },
  { value: '02', label: '02 - Mercancia de Autoconsumo exento' },
  { value: '03', label: '03 - Mercancia de Autoconsumo gravado' },
  { value: '04', label: '04 - Servicio de Autoconsumo exento' },
  { value: '05', label: '05 - Servicio de Autoconsumo gravado' },
  { value: '06', label: '06 - Cuota de afiliación' },
  { value: '07', label: '07 - Cuota de afiliación Exenta' },
  { value: '08', label: '08 - Bienes de Capital para el emisor' },
  { value: '09', label: '09 - Bienes de Capital para el receptor.' },
  { value: '10', label: '10 - Bienes de Capital para para el emisor y el receptor.' },
  { value: '11', label: '11 - Bienes de capital de autoconsumo exento para el emisor' },
  { value: '12', label: '12 - Bienes de capital sin contraprestación a terceros exento para el emisor' },
  { value: '13', label: '13 - Sin contraprestación a terceros' }
]

const FORMAS_FARMACEUTICAS = [
  { value: '01', label: '01 - Forma farmacéutica 1' },
  { value: '02', label: '02 - Forma farmacéutica 2' },
  { value: '03', label: '03 - Forma farmacéutica 3' }
]

const CODIGOS_DESCUENTO = [
  { value: '01', label: '01 - Descuento por Regalia' },
  { value: '02', label: '02 - Descuento por Regalia IVA Cobrado al Cliente' },
  { value: '03', label: '03 - Descuento por Bonificación' },
  { value: '04', label: '04 - Descuento por volumen' },
  { value: '05', label: '05 - Descuento por Temporada (estacional)' },
  { value: '06', label: '06 - Descuento promocional' },
  { value: '07', label: '07 - Descuento Comercial' },
  { value: '08', label: '08 - Descuento por frecuencia' },
  { value: '09', label: '09 - Descuento sostenido' },
  { value: '99', label: '99 - Otros descuentos' }
]

const CODIGOS_IMPUESTO = [
  { value: '01', label: '01 - Impuesto al Valor Agregado' },
  { value: '02', label: '02 - Impuesto Selectivo de Consumo' },
  { value: '03', label: '03 - Impuesto Único a los Combustibles' },
  { value: '04', label: '04 - Impuesto específico de Bebidas Alcohólicas' },
  { value: '05', label: '05 - Impuesto Específico sobre las bebidas envasadas sin contenido alcohólico y jabones de tocador' },
  { value: '06', label: '06 - Impuesto a los Productos de Tabaco' },
  { value: '07', label: '07 - IVA (cálculo especial)' },
  { value: '08', label: '08 - IVA Régimen de Bienes Usados (Factor)' },
  { value: '12', label: '12 - Impuesto Específico al Cemento' },
  { value: '99', label: '99 - Otros' }
]

const TIPOS_TARIFA = [
  { value: '01', label: '01 - Tarifa 0% (Exento)', porcentaje: 0 },
  { value: '02', label: '02 - Tarifa reducida 1%', porcentaje: 1 },
  { value: '03', label: '03 - Tarifa reducida 2%', porcentaje: 2 },
  { value: '04', label: '04 - Tarifa reducida 4%', porcentaje: 4 },
  { value: '05', label: '05 - Transitorio 0%', porcentaje: 0 },
  { value: '06', label: '06 - Transitorio 4%', porcentaje: 4 },
  { value: '07', label: '07 - Transitorio 8%', porcentaje: 8 },
  { value: '08', label: '08 - Tarifa general 13%', porcentaje: 13 },
  { value: '09', label: '09 - Tarifa reducida 0.5%', porcentaje: 0.5 }
]

const DOCUMENTOS_EXONERACION = [
  { value: '01', label: '01 - Compras autorizadas' },
  { value: '02', label: '02 - Ventas exentas a diplomáticos' },
  { value: '03', label: '03 - Autorizado por Ley especial' },
  { value: '04', label: '04 - Exenciones Dirección General de Hacienda' },
  { value: '05', label: '05 - Transitorio V' },
  { value: '06', label: '06 - Transitorio IX' },
  { value: '07', label: '07 - Transitorio XVII' },
  { value: '99', label: '99 - Otros' }
]

const INSTITUCIONES = [
  { value: '01', label: '01 - Ministerio de Hacienda' },
  { value: '02', label: '02 - Ministerio de Relaciones Exteriores y Culto' },
  { value: '03', label: '03 - Ministerio de Agricultura y Ganadería' },
  { value: '04', label: '04 - Ministerio de Economía, Industria y Comercio' },
  { value: '05', label: '05 - Cruz Roja Costarricense' },
  { value: '06', label: '06 - Benemérito Cuerpo de Bomberos de Costa Rica' },
  { value: '07', label: '07 - Asociación Obras del Espíritu Santo' },
  { value: '08', label: '08 - Federación Cruzada Nacional de protección al Anciano (Fecrunapa)' },
  { value: '09', label: '09 - Escuela de Agricultura de la Región Húmeda (EARTH)' },
  { value: '10', label: '10 - Instituto Centroamericano de Administración de Empresas (INCAE)' },
  { value: '11', label: '11 - Junta de Protección Social (JPS)' },
  { value: '12', label: '12 - Autoridad Reguladora de los Servicios Públicos (Aresep)' },
  { value: '99', label: '99 - Otros' }
]

// Types
interface Inventario {
  _id?: string
  cabys: string
  descripcion: string
  tipo: string
  precio: number
  cantidad: number
  channel_id: string
}

interface InventarioModalProps {
  inventario?: Inventario | null
  channelId: string
  onClose: (inventarioSaved?: boolean) => void
}

const InventarioModal: React.FC<InventarioModalProps> = ({ inventario, channelId, onClose }) => {
  const isEditing = !!inventario

  // Form states
  const [formData, setFormData] = useState({
    cabys: '',
    descripcion: '',
    tipo: '',
    tipoMercancia: 'Normal',
    precio: '',
    cantidad: '',
    partidaArancelaria: '',
    codigoComercial: '',
    tipoCodigoComercial: '',
    unidadMedida: '',
    unidadMedidaComercial: '',
    tipoTransaccion: '',
    esMedicamento: false,
    registro: '',
    formaFarmaceutica: '',
    esVinSerie: false,
    numeroVinSerie: '',
    tieneDescuento: false,
    naturalezaDescuento: '',
    montoDescuento: '',
    codigoDescuento: '',
    tipoDescuento: '',
    detalleDescuento: '',
    baseImponible: '',
    tieneImpuesto: false,
    codigoImpuesto: '',
    detalleImpuesto: '',
    tipoTarifa: '',
    tarifa: '',
    esEspecifico: false,
    porcentajeEspecifico: '',
    impuestoPorUnidad: '',
    cantidadUnidadMedida: '',
    volumenPorUnidadConsumo: '',
    tieneExoneracion: false,
    documentoExoneracion: '',
    detalleExoneracion: '',
    numeroDocumentoExoneracion: '',
    articuloExoneracion: '',
    incisoExoneracion: '',
    institucionExoneracion: '',
    detalleInstitucionExoneracion: '',
    fechaAutorizacionExoneracion: '',
    porcentajeExoneracion: '',
    montoExportacion: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tiposLoading, setTiposLoading] = useState(true)
  const [tiposDisponibles, setTiposDisponibles] = useState<string[]>([])
  const [showCabysModal, setShowCabysModal] = useState(false)
  const [showCabysEditModal, setShowCabysEditModal] = useState(false)
  const [selectedCabysCodigo, setSelectedCabysCodigo] = useState<string | null>(null)
  const [selectedCabysInfo, setSelectedCabysInfo] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Initialize form data for editing
  useEffect(() => {
    if (inventario) {
      setFormData({
        cabys: inventario.cabys || '',
        descripcion: inventario.descripcion || '',
        tipo: inventario.tipo || '',
        tipoMercancia: (inventario as any).tipoMercancia || 'Normal',
        precio: inventario.precio?.toString() || '',
        cantidad: inventario.cantidad?.toString() || '',
        partidaArancelaria: (inventario as any).partidaArancelaria || '',
        codigoComercial: (inventario as any).codigoComercial || '',
        tipoCodigoComercial: (inventario as any).tipoCodigoComercial || '',
        unidadMedida: (inventario as any).unidadMedida || '',
        unidadMedidaComercial: (inventario as any).unidadMedidaComercial || '',
        tipoTransaccion: (inventario as any).tipoTransaccion || '',
        esMedicamento: (inventario as any).esMedicamento || false,
        registro: (inventario as any).registro || '',
        formaFarmaceutica: (inventario as any).formaFarmaceutica || '',
        esVinSerie: (inventario as any).esVinSerie || false,
        numeroVinSerie: (inventario as any).numeroVinSerie || '',
        tieneDescuento: (inventario as any).tieneDescuento || false,
        naturalezaDescuento: (inventario as any).naturalezaDescuento || '',
        montoDescuento: (inventario as any).montoDescuento?.toString() || '',
        codigoDescuento: (inventario as any).codigoDescuento || '',
        tipoDescuento: (inventario as any).tipoDescuento || '',
        detalleDescuento: (inventario as any).detalleDescuento || '',
        baseImponible: (inventario as any).baseImponible?.toString() || '',
        tieneImpuesto: (inventario as any).tieneImpuesto || false,
        codigoImpuesto: (inventario as any).codigoImpuesto || '',
        detalleImpuesto: (inventario as any).detalleImpuesto || '',
        tipoTarifa: (inventario as any).tipoTarifa || '',
        tarifa: (inventario as any).tarifa?.toString() || '',
        esEspecifico: (inventario as any).esEspecifico || false,
        porcentajeEspecifico: (inventario as any).porcentajeEspecifico?.toString() || '',
        impuestoPorUnidad: (inventario as any).impuestoPorUnidad?.toString() || '',
        cantidadUnidadMedida: (inventario as any).cantidadUnidadMedida?.toString() || '',
        volumenPorUnidadConsumo: (inventario as any).volumenPorUnidadConsumo?.toString() || '',
        tieneExoneracion: (inventario as any).tieneExoneracion || false,
        documentoExoneracion: (inventario as any).documentoExoneracion || '',
        detalleExoneracion: (inventario as any).detalleExoneracion || '',
        numeroDocumentoExoneracion: (inventario as any).numeroDocumentoExoneracion?.toString() || '',
        articuloExoneracion: (inventario as any).articuloExoneracion || '',
        incisoExoneracion: (inventario as any).incisoExoneracion || '',
        institucionExoneracion: (inventario as any).institucionExoneracion || '',
        detalleInstitucionExoneracion: (inventario as any).detalleInstitucionExoneracion || '',
        fechaAutorizacionExoneracion: (inventario as any).fechaAutorizacionExoneracion || '',
        porcentajeExoneracion: (inventario as any).porcentajeExoneracion?.toString() || '',
        montoExportacion: (inventario as any).montoExportacion?.toString() || ''
      })
      setSelectedCabysInfo(inventario.cabys || '')
      // Inicializar previsualización de imagen si existe
      if ((inventario as any).image) {
        setImagePreview(`/protected/inventory-images/${channelId}/${inventario._id}/${(inventario as any).image}`)
      } else {
        setImagePreview(null)
      }
      setImageFile(null)
    } else {
      setFormData({
        cabys: '',
        descripcion: '',
        tipo: '',
        tipoMercancia: 'Normal',
        precio: '',
        cantidad: '',
        partidaArancelaria: '',
        codigoComercial: '',
        tipoCodigoComercial: '',
        unidadMedida: '',
        unidadMedidaComercial: '',
        tipoTransaccion: '',
        esMedicamento: false,
        registro: '',
        formaFarmaceutica: '',
        esVinSerie: false,
        numeroVinSerie: '',
        tieneDescuento: false,
        naturalezaDescuento: '',
        montoDescuento: '',
        codigoDescuento: '',
        tipoDescuento: '',
        detalleDescuento: '',
        baseImponible: '',
        tieneImpuesto: false,
        codigoImpuesto: '',
        detalleImpuesto: '',
        tipoTarifa: '',
        tarifa: '',
        esEspecifico: false,
        porcentajeEspecifico: '',
        impuestoPorUnidad: '',
        cantidadUnidadMedida: '',
        volumenPorUnidadConsumo: '',
        tieneExoneracion: false,
        documentoExoneracion: '',
        detalleExoneracion: '',
        numeroDocumentoExoneracion: '',
        articuloExoneracion: '',
        incisoExoneracion: '',
        institucionExoneracion: '',
        detalleInstitucionExoneracion: '',
        fechaAutorizacionExoneracion: '',
        porcentajeExoneracion: '',
        montoExportacion: ''
      })
      setSelectedCabysInfo('')
      setImageFile(null)
      setImagePreview(null)
    }
  }, [inventario])

  const loadTiposDisponibles = useCallback(async () => {
    setTiposLoading(true)
    try {
      const response = await fetch(`/api/cabys-tipos?channelId=${channelId}`)
      
      if (response.ok) {
        const data = await response.json()
        setTiposDisponibles(data.tipos || [])
        console.log('Tipos cargados:', data.estadisticas)
      } else {
        console.error('Error loading tipos:', response.status)
        // Fallback a tipos básicos si falla la API
        setTiposDisponibles([
          'Producto',
          'Servicio', 
          'Materia Prima',
          'Insumo',
          'Herramienta',
          'Equipo',
          'Otro'
        ])
      }
    } catch (error) {
      console.error('Error loading tipos:', error)
      // Fallback a tipos básicos si falla la API
      setTiposDisponibles([
        'Producto',
        'Servicio',
        'Materia Prima', 
        'Insumo',
        'Herramienta',
        'Equipo',
        'Otro'
      ])
    } finally {
      setTiposLoading(false)
    }
  }, [channelId])

  // Load available tipos when modal opens
  useEffect(() => {
    loadTiposDisponibles()
  }, [channelId, loadTiposDisponibles])

  const handleCabysSelect = (cabysItem: any) => {
    setFormData(prev => ({
      ...prev,
      cabys: cabysItem.codigo,
      descripcion: cabysItem.descripOf || cabysItem.descripPer || '',
      tipo: cabysItem.bienoserv || prev.tipo
    }))
    setSelectedCabysInfo(`${cabysItem.codigo} - ${cabysItem.descripOf || cabysItem.descripPer || 'Sin descripción'}`)
    
    // Clear CABYS error if it exists
    if (errors.cabys) {
      setErrors(prev => ({
        ...prev,
        cabys: ''
      }))
    }
  }

  const handleCabysEdit = (codigo: string) => {
    setSelectedCabysCodigo(codigo)
    setShowCabysModal(false)
    setShowCabysEditModal(true)
  }

  const handleCabysEditSave = (updatedCabys: any) => {
    // Update form data with edited CABYS
    setFormData(prev => ({
      ...prev,
      cabys: updatedCabys.codigo,
      descripcion: updatedCabys.descripPer || updatedCabys.descripOf || '',
      tipo: updatedCabys.bienoserv || prev.tipo
    }))
    setSelectedCabysInfo(`${updatedCabys.codigo} - ${updatedCabys.descripPer || updatedCabys.descripOf || 'Sin descripción'}`)
    
    // Clear CABYS error if it exists
    if (errors.cabys) {
      setErrors(prev => ({
        ...prev,
        cabys: ''
      }))
    }

    // Reload tipos disponibles in case they were updated
    loadTiposDisponibles()
  }

  const handleCabysEditClose = () => {
    setShowCabysEditModal(false)
    setSelectedCabysCodigo(null)
    setShowCabysModal(true) // Return to selection modal
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  // Calcular subtotal basado en precio y descuento
  const subtotal = React.useMemo(() => {
    const precio = parseFloat(formData.precio) || 0
    const montoDescuento = parseFloat(formData.montoDescuento) || 0
    
    if (!formData.tieneDescuento || !formData.tipoDescuento) {
      return precio
    }
    
    let descuento = 0
    if (formData.tipoDescuento === 'Fijo') {
      descuento = montoDescuento
    } else if (formData.tipoDescuento === 'Porcentual') {
      descuento = (precio * montoDescuento) / 100
    }
    
    return Math.max(0, precio - descuento)
  }, [formData.precio, formData.montoDescuento, formData.tieneDescuento, formData.tipoDescuento])

  // Calcular base para impuestos (base imponible si > 0, sino subtotal)
  const baseParaImpuestos = React.useMemo(() => {
    const baseImponible = parseFloat(formData.baseImponible) || 0
    return baseImponible > 0 ? baseImponible : subtotal
  }, [formData.baseImponible, subtotal])

  // Calcular monto del impuesto
  const montoImpuesto = React.useMemo(() => {
    if (!formData.tieneImpuesto) return 0
    
    let porcentajeTarifa = 0
    
    if (formData.codigoImpuesto === '01' || formData.codigoImpuesto === '07') {
      // Usar porcentaje del tipo de tarifa
      const tipoTarifaSeleccionado = TIPOS_TARIFA.find(t => t.value === formData.tipoTarifa)
      porcentajeTarifa = tipoTarifaSeleccionado?.porcentaje || 0
    } else {
      // Usar valor de tarifa
      porcentajeTarifa = parseFloat(formData.tarifa) || 0
    }
    
    return (baseParaImpuestos * porcentajeTarifa) / 100
  }, [formData.tieneImpuesto, formData.codigoImpuesto, formData.tipoTarifa, formData.tarifa, baseParaImpuestos])

  // Calcular monto de exoneración
  const montoExoneracion = React.useMemo(() => {
    if (!formData.tieneExoneracion) return 0
    
    const porcentaje = parseFloat(formData.porcentajeExoneracion) || 0
    return (baseParaImpuestos * porcentaje) / 100
  }, [formData.tieneExoneracion, formData.porcentajeExoneracion, baseParaImpuestos])

  // Calcular impuesto asumido por emisor o fábrica
  const impuestoAsumidoEmisor = React.useMemo(() => {
    if (formData.codigoDescuento === '01' || formData.codigoDescuento === '03') {
      return Math.max(0, montoImpuesto - montoExoneracion)
    }
    return 0
  }, [formData.codigoDescuento, montoImpuesto, montoExoneracion])

  // Calcular impuesto neto
  const impuestoNeto = React.useMemo(() => {
    return Math.max(0, montoImpuesto - montoExoneracion)
  }, [montoImpuesto, montoExoneracion])

  // Calcular monto total de la línea
  const montoTotalLinea = React.useMemo(() => {
    return baseParaImpuestos + impuestoNeto
  }, [baseParaImpuestos, impuestoNeto])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validar campos requeridos
    if (!formData.cabys.trim()) {
      newErrors.cabys = 'El código CABYS es requerido'
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida'
    }

    if (!formData.tipo.trim()) {
      newErrors.tipo = 'El tipo es requerido'
    }

    if (!formData.precio.trim()) {
      newErrors.precio = 'El precio es requerido'
    } else {
      const precio = parseFloat(formData.precio)
      if (isNaN(precio) || precio < 0) {
        newErrors.precio = 'El precio debe ser un número válido mayor o igual a 0'
      }
    }

    if (!formData.cantidad.trim()) {
      newErrors.cantidad = 'La cantidad es requerida'
    } else {
      const cantidad = parseInt(formData.cantidad)
      if (isNaN(cantidad) || cantidad < 0) {
        newErrors.cantidad = 'La cantidad debe ser un número entero válido mayor o igual a 0'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setImageFile(file)
    if (file) {
      setImagePreview(URL.createObjectURL(file))
    } else {
      setImagePreview(null)
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const url = isEditing ? `/api/inventario/${inventario!._id}` : '/api/inventario'
      const method = isEditing ? 'PUT' : 'POST'
      
      // Función helper para convertir strings a números de forma segura
      const toNumber = (value: string | number, defaultValue: number = 0): number => {
        if (typeof value === 'number') return isNaN(value) ? defaultValue : value
        if (!value || value === '') return defaultValue
        const parsed = parseFloat(String(value))
        return isNaN(parsed) ? defaultValue : parsed
      }

      const toInt = (value: string | number, defaultValue: number = 0): number => {
        if (typeof value === 'number') return isNaN(value) ? defaultValue : Math.floor(value)
        if (!value || value === '') return defaultValue
        const parsed = parseInt(String(value))
        return isNaN(parsed) ? defaultValue : parsed
      }

      // Preparar el body con todos los campos correctamente convertidos
      const bodyWithNumbers: any = {
        // Campos requeridos
        cabys: formData.cabys.trim(),
        descripcion: formData.descripcion.trim(),
        tipo: formData.tipo.trim(),
        tipoMercancia: formData.tipoMercancia || 'Normal',
        precio: toNumber(formData.precio, 0),
        cantidad: toInt(formData.cantidad, 0),
        // Información para facturación
        partidaArancelaria: formData.partidaArancelaria?.trim() || '',
        codigoComercial: formData.codigoComercial?.trim() || '',
        tipoCodigoComercial: formData.tipoCodigoComercial || '',
        // Datos del producto o servicio
        unidadMedida: formData.unidadMedida?.trim() || '',
        unidadMedidaComercial: formData.unidadMedidaComercial?.trim() || '',
        tipoTransaccion: formData.tipoTransaccion || '',
        // Medicamento
        esMedicamento: Boolean(formData.esMedicamento),
        registro: formData.registro?.trim() || '',
        formaFarmaceutica: formData.formaFarmaceutica || '',
        // VIN o serie
        esVinSerie: Boolean(formData.esVinSerie),
        numeroVinSerie: formData.numeroVinSerie?.trim() || '',
        // Descuento
        tieneDescuento: Boolean(formData.tieneDescuento),
        naturalezaDescuento: formData.naturalezaDescuento?.trim() || '',
        montoDescuento: toNumber(formData.montoDescuento, 0),
        codigoDescuento: formData.codigoDescuento || '',
        tipoDescuento: formData.tipoDescuento || '',
        detalleDescuento: formData.detalleDescuento?.trim() || '',
        baseImponible: toNumber(formData.baseImponible, 0),
        // Impuesto
        tieneImpuesto: Boolean(formData.tieneImpuesto),
        codigoImpuesto: formData.codigoImpuesto || '',
        detalleImpuesto: formData.detalleImpuesto?.trim() || '',
        tipoTarifa: formData.tipoTarifa || '',
        tarifa: toNumber(formData.tarifa, 0),
        // Impuesto específico
        esEspecifico: Boolean(formData.esEspecifico),
        porcentajeEspecifico: toNumber(formData.porcentajeEspecifico, 0),
        impuestoPorUnidad: toNumber(formData.impuestoPorUnidad, 0),
        cantidadUnidadMedida: toNumber(formData.cantidadUnidadMedida, 0),
        volumenPorUnidadConsumo: toNumber(formData.volumenPorUnidadConsumo, 0),
        // Exoneración
        tieneExoneracion: Boolean(formData.tieneExoneracion),
        documentoExoneracion: formData.documentoExoneracion || '',
        detalleExoneracion: formData.detalleExoneracion?.trim() || '',
        numeroDocumentoExoneracion: toInt(formData.numeroDocumentoExoneracion, 0),
        articuloExoneracion: formData.articuloExoneracion?.trim() || '',
        incisoExoneracion: formData.incisoExoneracion?.trim() || '',
        institucionExoneracion: formData.institucionExoneracion || '',
        detalleInstitucionExoneracion: formData.detalleInstitucionExoneracion?.trim() || '',
        fechaAutorizacionExoneracion: formData.fechaAutorizacionExoneracion?.trim() || '',
        porcentajeExoneracion: toNumber(formData.porcentajeExoneracion, 0),
        montoExportacion: toNumber(formData.montoExportacion, 0)
      }

      // Agregar channel_id solo si no es edición
      if (!isEditing) {
        bodyWithNumbers.channel_id = channelId
      }

      // Log para debugging (solo en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        console.log('Enviando datos al servidor:', JSON.stringify(bodyWithNumbers, null, 2))
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyWithNumbers)
      })

      const data = await response.json()

      if (response.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Respuesta del servidor:', data)
        }

        // Si hay imagen seleccionada, subirla después de guardar el artículo
        if (imageFile) {
          const savedInventario = data.inventario
          const inventarioId = isEditing ? inventario!._id : savedInventario?._id
          const inventarioChannelId = isEditing ? channelId : savedInventario?.channel_id || channelId

          if (inventarioId && inventarioChannelId) {
            const imageFormData = new FormData()
            imageFormData.append('image', imageFile)
            imageFormData.append('channelId', inventarioChannelId)

            try {
              const imageResponse = await fetch(`/api/inventario/${inventarioId}/image`, {
                method: 'POST',
                body: imageFormData
              })

              const imageData = await imageResponse.json()

              if (!imageResponse.ok) {
                console.error('Error al subir imagen de inventario:', imageData)
                alert('El artículo se guardó, pero hubo un error al subir la imagen.')
              } else if (process.env.NODE_ENV === 'development') {
                console.log('Imagen de inventario guardada:', imageData)
              }
            } catch (imageError) {
              console.error('Error subiendo imagen de inventario:', imageError)
              alert('El artículo se guardó, pero hubo un error de conexión al subir la imagen.')
            }
          }
        }

        onClose(true)
      } else {
        console.error('Error del servidor:', data)
        alert(`Error: ${data.error || 'Error procesando el artículo'}`)
      }
    } catch (error) {
      console.error('Error saving inventario:', error)
      alert('Error de conexión. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{isEditing ? 'Editar Artículo' : 'Nuevo Artículo'}</h2>
          <button 
            onClick={() => onClose()}
            className={styles.closeButton}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className={styles.modalContent}>
          <form onSubmit={handleSubmit} className={styles.form}>

          <div className={styles.headerRow}>
            <div className={styles.headerRight}>
              <div className={styles.imageSection}>
                <label className={styles.imageLabel}>Imagen del artículo</label>
                <div className={styles.imageContainer}>
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Previsualización del artículo"
                      className={styles.imagePreview}
                    />
                  ) : (
                    <div className={styles.imagePlaceholder}>
                      <span>Sin imagen</span>
                    </div>
                  )}
                </div>
                <div className={styles.imageControls}>
                  <button
                    type="button"
                    onClick={handleBrowseClick}
                    disabled={loading}
                    className={styles.browseButton}
                  >
                    Examinar...
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={loading}
                    className={styles.hiddenFileInput}
                  />
                  {imageFile && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={loading}
                      className={styles.removeButton}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
                <div className={styles.fileName}>
                  {imageFile ? imageFile.name : 'No se ha seleccionado ningún archivo.'}
                </div>
              </div>
            </div>
            <div className={styles.headerLeft}>
              <div className={styles.formGroup}>
                <label>Tipo de mercancía</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="tipoMercancia"
                      value="Normal"
                      checked={formData.tipoMercancia === 'Normal'}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                    <span>Normal</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="tipoMercancia"
                      value="Surtido"
                      checked={formData.tipoMercancia === 'Surtido'}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                    <span>Surtido</span>
                  </label>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="cabys">Código CABYS *</label>
                  <div className={styles.cabysSelector}>
                    <button
                      type="button"
                      onClick={() => setShowCabysModal(true)}
                      className={`${styles.cabysButton} ${errors.cabys ? styles.inputError : ''}`}
                      disabled={loading}
                    >
                      {selectedCabysInfo ? (
                        <span className={styles.cabysSelected}>
                          📋 {selectedCabysInfo.length > 50 ? selectedCabysInfo.substring(0, 50) + '...' : selectedCabysInfo}
                        </span>
                      ) : (
                        <span className={styles.cabysPlaceholder}>
                          🔍 Seleccionar código CABYS
                        </span>
                      )}
                    </button>
                    {selectedCabysInfo && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, cabys: '' }))
                          setSelectedCabysInfo('')
                        }}
                        className={styles.clearButton}
                        disabled={loading}
                        title="Limpiar selección"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {errors.cabys && <span className={styles.error}>{errors.cabys}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="tipo">Tipo *</label>
                  <select
                    id="tipo"
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleInputChange}
                    className={errors.tipo ? styles.inputError : ''}
                    disabled={loading || tiposLoading}
                  >
                    <option value="">
                      {tiposLoading ? 'Cargando tipos...' : 'Seleccionar tipo'}
                    </option>
                    {tiposDisponibles.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                  {errors.tipo && <span className={styles.error}>{errors.tipo}</span>}
                  {tiposLoading && (
                    <small className={styles.loadingText}>
                      Cargando tipos desde CABYS...
                    </small>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="descripcion">Descripción *</label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  className={errors.descripcion ? styles.inputError : ''}
                  disabled={loading}
                  placeholder="Descripción detallada del artículo"
                  rows={3}
                />
                {errors.descripcion && <span className={styles.error}>{errors.descripcion}</span>}
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="precio">Precio (₡) *</label>
                  <input
                    type="number"
                    id="precio"
                    name="precio"
                    value={formData.precio}
                    onChange={handleInputChange}
                    className={errors.precio ? styles.inputError : ''}
                    disabled={loading}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  {errors.precio && <span className={styles.error}>{errors.precio}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="cantidad">Cantidad *</label>
                  <input
                    type="number"
                    id="cantidad"
                    name="cantidad"
                    value={formData.cantidad}
                    onChange={handleInputChange}
                    className={errors.cantidad ? styles.inputError : ''}
                    disabled={loading}
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                  {errors.cantidad && <span className={styles.error}>{errors.cantidad}</span>}
                </div>
              </div>
            </div>
          </div>


          {/* Sección: Información para facturación */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Información para facturación</h3>
            
            {/* Subsección: Información general */}
            <div className={styles.subsection}>
              <h4 className={styles.subsectionTitle}>Información general</h4>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="partidaArancelaria">Partida Arancelaria:</label>
                  <input
                    type="text"
                    id="partidaArancelaria"
                    name="partidaArancelaria"
                    value={formData.partidaArancelaria}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="Ingrese la partida arancelaria"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="codigoComercial">Código Comercial:</label>
                  <input
                    type="text"
                    id="codigoComercial"
                    name="codigoComercial"
                    value={formData.codigoComercial}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="Ingrese el código comercial"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="tipoCodigoComercial">Tipo de cód. Comercial:</label>
                  <select
                    id="tipoCodigoComercial"
                    name="tipoCodigoComercial"
                    value={formData.tipoCodigoComercial}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="01">01 - Código del producto del vendedor</option>
                    <option value="02">02 - Código del producto del comprador</option>
                    <option value="03">03 - Código del producto asignado por la industria</option>
                    <option value="04">04 - Código uso interno</option>
                    <option value="99">99 - Otros</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Subsección: Datos del producto o servicio */}
          <div className={styles.subsection}>
            <h4 className={styles.subsectionTitle}>Datos del producto o servicio</h4>
            
            {/* Información general */}
            <div className={styles.subsubsection}>
              <h5 className={styles.subsubsectionTitle}>Información general</h5>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="unidadMedida">Unidad medida:</label>
                  <select
                    id="unidadMedida"
                    name="unidadMedida"
                    value={formData.unidadMedida}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    <option value="">Seleccionar unidad</option>
                    {UNIDADES_MEDIDA.map((unidad) => (
                      <option key={unidad.value} value={unidad.value}>
                        {unidad.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="unidadMedidaComercial">Unidad medida comercial:</label>
                  <input
                    type="text"
                    id="unidadMedidaComercial"
                    name="unidadMedidaComercial"
                    value={formData.unidadMedidaComercial}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="Ingrese la unidad medida comercial"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="tipoTransaccion">Tipo transacción:</label>
                  <select
                    id="tipoTransaccion"
                    name="tipoTransaccion"
                    value={formData.tipoTransaccion}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    <option value="">Seleccionar tipo</option>
                    {TIPOS_TRANSACCION.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Información de medicamento */}
            <div className={styles.subsubsection}>
              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="esMedicamento"
                  name="esMedicamento"
                  checked={formData.esMedicamento}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <label htmlFor="esMedicamento">¿Medicamento?</label>
              </div>

              {formData.esMedicamento && (
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="registro">Registro:</label>
                    <input
                      type="text"
                      id="registro"
                      name="registro"
                      value={formData.registro}
                      onChange={handleInputChange}
                      disabled={loading}
                      placeholder="Ingrese el registro"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="formaFarmaceutica">Forma farmacéutica:</label>
                    <select
                      id="formaFarmaceutica"
                      name="formaFarmaceutica"
                      value={formData.formaFarmaceutica}
                      onChange={handleInputChange}
                      disabled={loading}
                    >
                      <option value="">Seleccionar forma</option>
                      {FORMAS_FARMACEUTICAS.map((forma) => (
                        <option key={forma.value} value={forma.value}>
                          {forma.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Información de VIN o serie */}
            <div className={styles.subsubsection}>
              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="esVinSerie"
                  name="esVinSerie"
                  checked={formData.esVinSerie}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <label htmlFor="esVinSerie">¿VIN o serie?</label>
              </div>

              {formData.esVinSerie && (
                <div className={styles.formGroup}>
                  <label htmlFor="numeroVinSerie">Número:</label>
                  <input
                    type="text"
                    id="numeroVinSerie"
                    name="numeroVinSerie"
                    value={formData.numeroVinSerie}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="Ingrese el número de VIN o serie"
                  />
                </div>
              )}
            </div>

            {/* Información de descuento */}
            <div className={styles.subsubsection}>
              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="tieneDescuento"
                  name="tieneDescuento"
                  checked={formData.tieneDescuento}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <label htmlFor="tieneDescuento">¿Descuento?</label>
              </div>

              {formData.tieneDescuento && (
                <>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="naturalezaDescuento">Naturaleza:</label>
                      <input
                        type="text"
                        id="naturalezaDescuento"
                        name="naturalezaDescuento"
                        value={formData.naturalezaDescuento}
                        onChange={handleInputChange}
                        disabled={loading}
                        placeholder="Ingrese la naturaleza del descuento"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="tipoDescuento">Tipo de descuento:</label>
                      <select
                        id="tipoDescuento"
                        name="tipoDescuento"
                        value={formData.tipoDescuento}
                        onChange={handleInputChange}
                        disabled={loading}
                      >
                        <option value="">Seleccionar tipo</option>
                        <option value="Fijo">Fijo</option>
                        <option value="Porcentual">Porcentual</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="montoDescuento">Monto:</label>
                      <div className={styles.inputWithIcon}>
                        <input
                          type="number"
                          id="montoDescuento"
                          name="montoDescuento"
                          value={formData.montoDescuento}
                          onChange={handleInputChange}
                          disabled={loading}
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                        <span className={styles.inputIcon}>
                          {formData.tipoDescuento === 'Porcentual' ? '%' : '₡'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="codigoDescuento">Código del descuento:</label>
                      <select
                        id="codigoDescuento"
                        name="codigoDescuento"
                        value={formData.codigoDescuento}
                        onChange={handleInputChange}
                        disabled={loading}
                      >
                        <option value="">Seleccionar código</option>
                        {CODIGOS_DESCUENTO.map((codigo) => (
                          <option key={codigo.value} value={codigo.value}>
                            {codigo.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="detalleDescuento">Detalle:</label>
                      <input
                        type="text"
                        id="detalleDescuento"
                        name="detalleDescuento"
                        value={formData.detalleDescuento}
                        onChange={handleInputChange}
                        disabled={loading || formData.codigoDescuento !== '99'}
                        placeholder={formData.codigoDescuento !== '99' ? 'Solo disponible para "Otros descuentos"' : 'Ingrese el detalle del descuento'}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Base imponible y Subtotal */}
            <div className={styles.subsubsection}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="baseImponible">Base imponible:</label>
                  <input
                    type="number"
                    id="baseImponible"
                    name="baseImponible"
                    value={formData.baseImponible}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="subtotal">Subtotal:</label>
                  <input
                    type="text"
                    id="subtotal"
                    name="subtotal"
                    value={subtotal.toFixed(2)}
                    disabled
                    readOnly
                    className={styles.infoField}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Subsección: Información del impuesto */}
          <div className={styles.subsection}>
            <h4 className={styles.subsectionTitle}>Información del impuesto</h4>
            
            {/* Información de impuesto */}
            <div className={styles.subsubsection}>
              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="tieneImpuesto"
                  name="tieneImpuesto"
                  checked={formData.tieneImpuesto}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <label htmlFor="tieneImpuesto">¿Impuesto?</label>
              </div>

              {formData.tieneImpuesto && (
                <>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="codigoImpuesto">Código:</label>
                      <select
                        id="codigoImpuesto"
                        name="codigoImpuesto"
                        value={formData.codigoImpuesto}
                        onChange={handleInputChange}
                        disabled={loading}
                      >
                        <option value="">Seleccionar código</option>
                        {CODIGOS_IMPUESTO.map((codigo) => (
                          <option key={codigo.value} value={codigo.value}>
                            {codigo.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="detalleImpuesto">Detalle:</label>
                      <input
                        type="text"
                        id="detalleImpuesto"
                        name="detalleImpuesto"
                        value={formData.detalleImpuesto}
                        onChange={handleInputChange}
                        disabled={loading || formData.codigoImpuesto !== '99'}
                        placeholder={formData.codigoImpuesto !== '99' ? 'Solo disponible para "Otros"' : 'Ingrese el detalle del impuesto'}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="tipoTarifa">Tipo Tarifa:</label>
                      <select
                        id="tipoTarifa"
                        name="tipoTarifa"
                        value={formData.tipoTarifa}
                        onChange={handleInputChange}
                        disabled={loading || (formData.codigoImpuesto !== '01' && formData.codigoImpuesto !== '07')}
                      >
                        <option value="">Seleccionar tipo</option>
                        {TIPOS_TARIFA.map((tipo) => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="tarifa">Tarifa:</label>
                      <div className={styles.inputWithIcon}>
                        <input
                          type="number"
                          id="tarifa"
                          name="tarifa"
                          value={formData.tarifa}
                          onChange={handleInputChange}
                          disabled={loading || formData.codigoImpuesto === '01' || formData.codigoImpuesto === '07'}
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                        <span className={styles.inputIcon}>%</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="montoImpuesto">Monto:</label>
                      <input
                        type="text"
                        id="montoImpuesto"
                        name="montoImpuesto"
                        value={montoImpuesto.toFixed(2)}
                        disabled
                        readOnly
                        className={styles.infoField}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Información de impuesto específico */}
            {formData.tieneImpuesto && (
              <div className={styles.subsubsection}>
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="esEspecifico"
                    name="esEspecifico"
                    checked={formData.esEspecifico}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <label htmlFor="esEspecifico">¿Específico?</label>
                </div>

                {formData.esEspecifico && (
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="porcentajeEspecifico">Porcentaje:</label>
                      <div className={styles.inputWithIcon}>
                        <input
                          type="number"
                          id="porcentajeEspecifico"
                          name="porcentajeEspecifico"
                          value={formData.porcentajeEspecifico}
                          onChange={handleInputChange}
                          disabled={loading}
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                        <span className={styles.inputIcon}>%</span>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="impuestoPorUnidad">Impuesto por Unidad:</label>
                      <input
                        type="number"
                        id="impuestoPorUnidad"
                        name="impuestoPorUnidad"
                        value={formData.impuestoPorUnidad}
                        onChange={handleInputChange}
                        disabled={loading}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="cantidadUnidadMedida">Cantidad unidad de medida:</label>
                      <input
                        type="number"
                        id="cantidadUnidadMedida"
                        name="cantidadUnidadMedida"
                        value={formData.cantidadUnidadMedida}
                        onChange={handleInputChange}
                        disabled={loading}
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                )}

                {formData.esEspecifico && (
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="volumenPorUnidadConsumo">Volumen por Unidad de consumo:</label>
                      <input
                        type="number"
                        id="volumenPorUnidadConsumo"
                        name="volumenPorUnidadConsumo"
                        value={formData.volumenPorUnidadConsumo}
                        onChange={handleInputChange}
                        disabled={loading}
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Información de exoneración */}
            {formData.tieneImpuesto && (
              <div className={styles.subsubsection}>
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="tieneExoneracion"
                    name="tieneExoneracion"
                    checked={formData.tieneExoneracion}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <label htmlFor="tieneExoneracion">¿Exoneración?</label>
                </div>

                {formData.tieneExoneracion && (
                  <>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="documentoExoneracion">Documento:</label>
                        <select
                          id="documentoExoneracion"
                          name="documentoExoneracion"
                          value={formData.documentoExoneracion}
                          onChange={handleInputChange}
                          disabled={loading}
                        >
                          <option value="">Seleccionar documento</option>
                          {DOCUMENTOS_EXONERACION.map((doc) => (
                            <option key={doc.value} value={doc.value}>
                              {doc.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="detalleExoneracion">Detalle:</label>
                        <input
                          type="text"
                          id="detalleExoneracion"
                          name="detalleExoneracion"
                          value={formData.detalleExoneracion}
                          onChange={handleInputChange}
                          disabled={loading}
                          placeholder="Ingrese el detalle"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="numeroDocumentoExoneracion">Núm. documento:</label>
                        <input
                          type="text"
                          id="numeroDocumentoExoneracion"
                          name="numeroDocumentoExoneracion"
                          value={formData.numeroDocumentoExoneracion}
                          onChange={handleInputChange}
                          disabled
                          readOnly
                          className={styles.infoField}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="articuloExoneracion">Artículo:</label>
                        <input
                          type="text"
                          id="articuloExoneracion"
                          name="articuloExoneracion"
                          value={formData.articuloExoneracion}
                          onChange={handleInputChange}
                          disabled={loading}
                          placeholder="Ingrese el artículo"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="incisoExoneracion">Inciso:</label>
                        <input
                          type="text"
                          id="incisoExoneracion"
                          name="incisoExoneracion"
                          value={formData.incisoExoneracion}
                          onChange={handleInputChange}
                          disabled={loading}
                          placeholder="Ingrese el inciso"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="institucionExoneracion">Institución:</label>
                        <select
                          id="institucionExoneracion"
                          name="institucionExoneracion"
                          value={formData.institucionExoneracion}
                          onChange={handleInputChange}
                          disabled={loading}
                        >
                          <option value="">Seleccionar institución</option>
                          {INSTITUCIONES.map((inst) => (
                            <option key={inst.value} value={inst.value}>
                              {inst.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="detalleInstitucionExoneracion">Detalle:</label>
                        <input
                          type="text"
                          id="detalleInstitucionExoneracion"
                          name="detalleInstitucionExoneracion"
                          value={formData.detalleInstitucionExoneracion}
                          onChange={handleInputChange}
                          disabled={loading}
                          placeholder="Ingrese el detalle"
                        />
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="fechaAutorizacionExoneracion">Fecha Autorización:</label>
                        <input
                          type="date"
                          id="fechaAutorizacionExoneracion"
                          name="fechaAutorizacionExoneracion"
                          value={formData.fechaAutorizacionExoneracion}
                          onChange={handleInputChange}
                          disabled={loading}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="porcentajeExoneracion">Porc. exoneración:</label>
                        <div className={styles.inputWithIcon}>
                          <input
                            type="number"
                            id="porcentajeExoneracion"
                            name="porcentajeExoneracion"
                            value={formData.porcentajeExoneracion}
                            onChange={handleInputChange}
                            disabled={loading}
                            placeholder="0"
                            min="0"
                            max="100"
                            step="0.01"
                          />
                          <span className={styles.inputIcon}>%</span>
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="montoExoneracion">Monto:</label>
                        <input
                          type="text"
                          id="montoExoneracion"
                          name="montoExoneracion"
                          value={montoExoneracion.toFixed(2)}
                          disabled
                          readOnly
                          className={styles.infoField}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Campos calculados finales */}
            <div className={styles.subsubsection}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="montoExportacion">Monto exportación:</label>
                  <input
                    type="number"
                    id="montoExportacion"
                    name="montoExportacion"
                    value={formData.montoExportacion}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="impuestoAsumidoEmisor">Impuesto asumido por emisor o fábrica:</label>
                  <input
                    type="text"
                    id="impuestoAsumidoEmisor"
                    name="impuestoAsumidoEmisor"
                    value={impuestoAsumidoEmisor.toFixed(2)}
                    disabled
                    readOnly
                    className={styles.infoField}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="impuestoNeto">Impuesto neto:</label>
                  <input
                    type="text"
                    id="impuestoNeto"
                    name="impuestoNeto"
                    value={impuestoNeto.toFixed(2)}
                    disabled
                    readOnly
                    className={styles.infoField}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="montoTotalLinea">Monto total de la línea:</label>
                  <input
                    type="text"
                    id="montoTotalLinea"
                    name="montoTotalLinea"
                    value={montoTotalLinea.toFixed(2)}
                    disabled
                    readOnly
                    className={styles.infoField}
                  />
                </div>
              </div>
            </div>
          </div>
          </form>
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => onClose()}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  {isEditing ? 'Actualizando...' : 'Guardando...'}
                </>
              ) : (
                isEditing ? 'Actualizar Artículo' : 'Guardar Artículo'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de selección de CABYS */}
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
    </div>
  )
}

export default InventarioModal