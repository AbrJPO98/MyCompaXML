'use client'
import React, { useState, useEffect, useRef } from 'react'
import styles from './AgregarProductoSurtidoModal.module.css'
import inventarioStyles from './InventarioModal.module.css'

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

export interface ProductoSurtido {
  id: string
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

interface AgregarProductoSurtidoModalProps {
  channelId: string
  onClose: () => void
  onAdd: (producto: ProductoSurtido) => void
  productosSurtidoExistentes?: ProductoSurtido[]
}

const AgregarProductoSurtidoModal: React.FC<AgregarProductoSurtidoModalProps> = ({
  channelId,
  onClose,
  onAdd,
  productosSurtidoExistentes = []
}) => {
  const [formData, setFormData] = useState({
    cabys: '',
    titulo: '',
    descripcion: '',
    tipo: '',
    precio: '',
    cantidad: '',
    codigoComercial: '',
    tipoCodigoComercial: '',
    unidadMedida: '',
    unidadMedidaComercial: '',
    tieneDescuento: false,
    tipoDescuento: '',
    montoDescuento: '',
    codigoDescuento: '',
    detalleDescuento: '',
    baseImponible: '',
    tieneImpuesto: false,
    codigoImpuesto: '',
    detalleImpuesto: '',
    tipoTarifa: '',
    tarifa: '',
    esEspecifico: false,
    cantidadUnidadMedida: '',
    porcentajeEspecifico: '',
    proporcion: '',
    volumenPorUnidadConsumo: '',
    impuestoPorUnidad: ''
  })

  const [inventarioItems, setInventarioItems] = useState<any[]>([])
  const [inventarioSearch, setInventarioSearch] = useState('')
  const [inventarioFiltrado, setInventarioFiltrado] = useState<any[]>([])
  const [showInventarioDropdown, setShowInventarioDropdown] = useState(false)
  const inventarioInputRef = useRef<HTMLInputElement>(null)

  // Cargar items de inventario
  useEffect(() => {
    if (channelId) {
      const loadInventarioItems = async () => {
        try {
          const response = await fetch(`/api/inventario?channelId=${channelId}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache'
            }
          })
          if (response.ok) {
            const data = await response.json()
            setInventarioItems(data || [])
          }
        } catch (error) {
          console.error('Error loading inventario items:', error)
          setInventarioItems([])
        }
      }
      loadInventarioItems()
    }
  }, [channelId])

  // Filtrar inventario cuando cambia la búsqueda
  useEffect(() => {
    if (inventarioSearch && inventarioItems.length > 0) {
      const searchLower = inventarioSearch.toLowerCase()
      const filtrado = inventarioItems.filter(item => {
        const cabysMatch = (item.cabys || '').toLowerCase().includes(searchLower)
        const descripcionMatch = (item.descripcion || '').toLowerCase().includes(searchLower)
        const tituloMatch = (item.titulo || '').toLowerCase().includes(searchLower)
        return cabysMatch || descripcionMatch || tituloMatch
      })
      setInventarioFiltrado(filtrado)
      setShowInventarioDropdown(filtrado.length > 0)
    } else {
      setInventarioFiltrado([])
      setShowInventarioDropdown(false)
    }
  }, [inventarioSearch, inventarioItems])

  const handleInventarioSelect = (item: any) => {
    setFormData({
      cabys: item.cabys || '',
      titulo: item.titulo || '',
      descripcion: item.descripcion || '',
      tipo: item.tipo || '',
      precio: item.precio?.toString() || '',
      cantidad: item.cantidad?.toString() || '',
      codigoComercial: item.codigoComercial || '',
      tipoCodigoComercial: item.tipoCodigoComercial || '',
      unidadMedida: item.unidadMedida || '',
      unidadMedidaComercial: item.unidadMedidaComercial || '',
      tieneDescuento: item.tieneDescuento || false,
      tipoDescuento: item.tipoDescuento || '',
      montoDescuento: item.montoDescuento?.toString() || '',
      codigoDescuento: item.codigoDescuento || '',
      detalleDescuento: item.detalleDescuento || '',
      baseImponible: item.baseImponible?.toString() || '',
      tieneImpuesto: item.tieneImpuesto || false,
      codigoImpuesto: item.codigoImpuesto || '',
      detalleImpuesto: item.detalleImpuesto || '',
      tipoTarifa: item.tipoTarifa || '',
      tarifa: item.tarifa?.toString() || '',
      esEspecifico: item.esEspecifico || false,
      cantidadUnidadMedida: item.cantidadUnidadMedida?.toString() || '',
      porcentajeEspecifico: item.porcentajeEspecifico?.toString() || '',
      proporcion: '0',
      volumenPorUnidadConsumo: item.volumenPorUnidadConsumo?.toString() || '',
      impuestoPorUnidad: item.impuestoPorUnidad?.toString() || ''
    })
    setInventarioSearch('')
    setShowInventarioDropdown(false)
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    // Validar código de descuento si se está cambiando
    if (name === 'codigoDescuento' && value !== '') {
      if (!validarCodigoDescuento(value)) {
        alert(`El código de descuento debe coincidir con el de los productos ya añadidos (${codigoDescuentoComun || 'ninguno'})`)
        return
      }
    }

    // Validar código de impuesto si se está cambiando
    if (name === 'codigoImpuesto' && value !== '') {
      if (!validarCodigoImpuesto(value)) {
        alert(`El código de impuesto debe coincidir con el de los productos ya añadidos (${codigoImpuestoComun || 'ninguno'})`)
        return
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Calcular subtotal basado en precio, descuento y cantidad
  const subtotal = React.useMemo(() => {
    const precio = parseFloat(formData.precio) || 0
    const cantidad = parseFloat(formData.cantidad) || 0
    const montoDescuento = parseFloat(formData.montoDescuento) || 0

    let precioUnitario = precio
    if (formData.tieneDescuento && formData.tipoDescuento) {
      let descuento = 0
      if (formData.tipoDescuento === 'Fijo') {
        descuento = montoDescuento
      } else if (formData.tipoDescuento === 'Porcentual') {
        descuento = (precio * montoDescuento) / 100
      }
      precioUnitario = Math.max(0, precio - descuento)
    }

    return precioUnitario * cantidad
  }, [formData.precio, formData.cantidad, formData.montoDescuento, formData.tieneDescuento, formData.tipoDescuento])

  // Calcular base para impuestos (base imponible si > 0, sino subtotal)
  const baseParaImpuestos = React.useMemo(() => {
    const baseImponible = parseFloat(formData.baseImponible) || 0
    return baseImponible > 0 ? baseImponible : subtotal
  }, [formData.baseImponible, subtotal])

  // Determinar el código de descuento común de los productos existentes
  const codigoDescuentoComun = React.useMemo(() => {
    if (productosSurtidoExistentes.length === 0) {
      return null // No hay productos, se puede seleccionar cualquier código
    }

    // Obtener códigos de descuento únicos de los productos existentes (excluyendo vacíos)
    const codigosDescuentos = productosSurtidoExistentes
      .map(p => p.codigoDescuento)
      .filter(cod => cod && cod.trim() !== '')

    if (codigosDescuentos.length === 0) {
      return null // Todos los productos existentes no tienen código de descuento
    }

    // Verificar si todos tienen el mismo código
    const primerCodigo = codigosDescuentos[0]
    const todosIguales = codigosDescuentos.every(cod => cod === primerCodigo)

    return todosIguales ? primerCodigo : null
  }, [productosSurtidoExistentes])

  // Determinar el código de impuesto común de los productos existentes
  const codigoImpuestoComun = React.useMemo(() => {
    if (productosSurtidoExistentes.length === 0) {
      return null // No hay productos, se puede seleccionar cualquier código
    }

    // Obtener códigos de impuesto únicos de los productos existentes (excluyendo vacíos)
    const codigosImpuestos = productosSurtidoExistentes
      .map(p => p.codigoImpuesto)
      .filter(cod => cod && cod.trim() !== '')

    if (codigosImpuestos.length === 0) {
      return null // Todos los productos existentes no tienen código de impuesto
    }

    // Verificar si todos tienen el mismo código
    const primerCodigo = codigosImpuestos[0]
    const todosIguales = codigosImpuestos.every(cod => cod === primerCodigo)

    return todosIguales ? primerCodigo : null
  }, [productosSurtidoExistentes])

  // Obtener códigos de descuento disponibles basados en los productos existentes
  const codigosDescuentoDisponibles = React.useMemo(() => {
    if (codigoDescuentoComun === null) {
      // Si no hay código común, se pueden seleccionar todos
      return CODIGOS_DESCUENTO
    }

    // Si hay un código común, solo se puede seleccionar ese o ninguno
    return CODIGOS_DESCUENTO.filter(cod =>
      cod.value === codigoDescuentoComun || cod.value === ''
    )
  }, [codigoDescuentoComun])

  // Obtener códigos de impuesto disponibles basados en los productos existentes
  const codigosImpuestoDisponibles = React.useMemo(() => {
    if (codigoImpuestoComun === null) {
      // Si no hay código común, se pueden seleccionar todos
      return CODIGOS_IMPUESTO
    }

    // Si hay un código común, solo se puede seleccionar ese o ninguno
    return CODIGOS_IMPUESTO.filter(cod =>
      cod.value === codigoImpuestoComun || cod.value === ''
    )
  }, [codigoImpuestoComun])

  // Validar que el código de descuento seleccionado coincida
  const validarCodigoDescuento = React.useCallback((codigoSeleccionado: string) => {
    if (codigoDescuentoComun === null) {
      return true // No hay restricción
    }

    // Si hay un código común, el seleccionado debe ser el mismo o vacío
    return codigoSeleccionado === '' || codigoSeleccionado === codigoDescuentoComun
  }, [codigoDescuentoComun])

  // Validar que el código de impuesto seleccionado coincida
  const validarCodigoImpuesto = React.useCallback((codigoSeleccionado: string) => {
    if (codigoImpuestoComun === null) {
      return true // No hay restricción
    }

    // Si hay un código común, el seleccionado debe ser el mismo o vacío
    return codigoSeleccionado === '' || codigoSeleccionado === codigoImpuestoComun
  }, [codigoImpuestoComun])

  // Ajustar Tarifa cuando el código usa porcentaje fijo del tipo de tarifa
  React.useEffect(() => {
    if (formData.codigoImpuesto === '01' || formData.codigoImpuesto === '07') {
      const tipoSeleccionado = TIPOS_TARIFA.find(t => t.value === formData.tipoTarifa)
      const porcentaje = tipoSeleccionado ? tipoSeleccionado.porcentaje : ''
      if (porcentaje !== '' && formData.tarifa !== String(porcentaje)) {
        setFormData(prev => ({
          ...prev,
          tarifa: String(porcentaje)
        }))
      }
    }
  }, [formData.codigoImpuesto, formData.tipoTarifa])

  // Ajustar código de descuento si hay un código común y el usuario activa el descuento
  React.useEffect(() => {
    if (codigoDescuentoComun && formData.codigoDescuento === '' && formData.tieneDescuento) {
      // Si hay un código común y el usuario activó el descuento, establecer el código común
      setFormData(prev => ({
        ...prev,
        codigoDescuento: codigoDescuentoComun
      }))
    }
  }, [codigoDescuentoComun, formData.tieneDescuento, formData.codigoDescuento])

  // Ajustar código de impuesto si hay un código común y el usuario no ha seleccionado ninguno
  React.useEffect(() => {
    if (codigoImpuestoComun && formData.codigoImpuesto === '' && formData.tieneImpuesto) {
      // Si hay un código común y el usuario activó el impuesto, establecer el código común
      setFormData(prev => ({
        ...prev,
        codigoImpuesto: codigoImpuestoComun
      }))
    }
  }, [codigoImpuestoComun, formData.tieneImpuesto, formData.codigoImpuesto])

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

  // Calcular impuesto asumido por emisor o fábrica (IVA Cobrado fábrica)
  const impuestoAsumidoEmisor = React.useMemo(() => {
    if (formData.codigoDescuento === '01' || formData.codigoDescuento === '03') {
      return montoImpuesto
    }
    return 0
  }, [formData.codigoDescuento, montoImpuesto])

  // Calcular impuesto neto
  const impuestoNeto = React.useMemo(() => {
    return montoImpuesto
  }, [montoImpuesto])

  // Calcular monto total de la línea
  const montoTotalLinea = React.useMemo(() => {
    return baseParaImpuestos + impuestoNeto
  }, [baseParaImpuestos, impuestoNeto])

  // Función para calcular descuento (usada al agregar)
  const calcularDescuento = () => {
    if (!formData.tieneDescuento || !formData.tipoDescuento) return 0
    const precio = parseFloat(formData.precio) || 0
    const montoDescuento = parseFloat(formData.montoDescuento) || 0

    if (formData.tipoDescuento === 'Fijo') {
      return montoDescuento
    } else if (formData.tipoDescuento === 'Porcentual') {
      return (precio * montoDescuento) / 100
    }
    return 0
  }

  // Función para calcular IVA cobrado fábrica (usada al agregar)
  const calcularIVA = () => {
    return impuestoAsumidoEmisor
  }

  const handleAgregar = () => {
    const nuevoProducto: ProductoSurtido = {
      id: Date.now().toString(),
      cabys: formData.cabys,
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      tipo: formData.tipo,
      precio: parseFloat(formData.precio) || 0,
      cantidad: parseInt(formData.cantidad) || 0,
      codigoComercial: formData.codigoComercial,
      tipoCodigoComercial: formData.tipoCodigoComercial,
      unidadMedida: formData.unidadMedida,
      unidadMedidaComercial: formData.unidadMedidaComercial,
      montoDescuento: calcularDescuento(),
      codigoDescuento: formData.codigoDescuento,
      detalleDescuento: formData.detalleDescuento,
      ivaCobradoFabrica: calcularIVA(),
      baseImponible: parseFloat(formData.baseImponible) || 0,
      codigoImpuesto: formData.codigoImpuesto,
      detalleImpuesto: formData.detalleImpuesto,
      tipoTarifa: formData.tipoTarifa,
      tarifa: parseFloat(formData.tarifa) || 0,
      cantidadUnidadMedida: parseFloat(formData.cantidadUnidadMedida) || 0,
      porcentajeEspecifico: parseFloat(formData.porcentajeEspecifico) || 0,
      proporcion: parseFloat(formData.proporcion) || 0,
      volumenPorUnidadConsumo: parseFloat(formData.volumenPorUnidadConsumo) || 0,
      impuestoPorUnidad: parseFloat(formData.impuestoPorUnidad) || 0
    }

    onAdd(nuevoProducto)

    // Limpiar formulario
    setFormData({
      cabys: '',
      titulo: '',
      descripcion: '',
      tipo: '',
      precio: '',
      cantidad: '',
      codigoComercial: '',
      tipoCodigoComercial: '',
      unidadMedida: '',
      unidadMedidaComercial: '',
      tieneDescuento: false,
      tipoDescuento: '',
      montoDescuento: '',
      codigoDescuento: '',
      detalleDescuento: '',
      baseImponible: '',
      tieneImpuesto: false,
      codigoImpuesto: '',
      detalleImpuesto: '',
      tipoTarifa: '',
      tarifa: '',
      esEspecifico: false,
      cantidadUnidadMedida: '',
      porcentajeEspecifico: '',
      proporcion: '',
      volumenPorUnidadConsumo: '',
      impuestoPorUnidad: ''
    })
    setInventarioSearch('')
    onClose()
  }

  const handleClose = () => {
    setFormData({
      cabys: '',
      titulo: '',
      descripcion: '',
      tipo: '',
      precio: '',
      cantidad: '',
      codigoComercial: '',
      tipoCodigoComercial: '',
      unidadMedida: '',
      unidadMedidaComercial: '',
      tieneDescuento: false,
      tipoDescuento: '',
      montoDescuento: '',
      codigoDescuento: '',
      detalleDescuento: '',
      baseImponible: '',
      tieneImpuesto: false,
      codigoImpuesto: '',
      detalleImpuesto: '',
      tipoTarifa: '',
      tarifa: '',
      esEspecifico: false,
      cantidadUnidadMedida: '',
      porcentajeEspecifico: '',
      proporcion: '',
      volumenPorUnidadConsumo: '',
      impuestoPorUnidad: ''
    })
    setInventarioSearch('')
    onClose()
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Agregar producto al surtido</h2>
          <button
            onClick={handleClose}
            className={styles.closeButton}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Autocomplete para buscar en Inventario */}
          <div className={styles.autocompleteContainer}>
            <label htmlFor="inventarioSearch">Buscar en inventario:</label>
            <div className={styles.autocompleteWrapper}>
              <input
                type="text"
                id="inventarioSearch"
                ref={inventarioInputRef}
                value={inventarioSearch}
                onChange={(e) => {
                  setInventarioSearch(e.target.value)
                  setFormData(prev => ({
                    ...prev,
                    cabys: '',
                    titulo: '',
                    descripcion: '',
                    tipo: '',
                    precio: '',
                    cantidad: ''
                  }))
                }}
                onFocus={() => {
                  if (inventarioSearch || inventarioItems.length > 0) {
                    setShowInventarioDropdown(true)
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowInventarioDropdown(false), 200)
                }}
                className={styles.autocompleteInput}
                placeholder="Escribe para buscar por código CABYS, título o descripción..."
                autoComplete="off"
              />

              {showInventarioDropdown && inventarioFiltrado.length > 0 && (
                <div className={styles.suggestionsList}>
                  {inventarioFiltrado.map((item, index) => (
                    <div
                      key={index}
                      className={styles.suggestionItem}
                      onClick={() => handleInventarioSelect(item)}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className={styles.suggestionName}>
                        <strong>{item.cabys}</strong> - {item.titulo || item.descripcion}
                      </div>
                      {item.descripcion && item.titulo && (
                        <div className={styles.suggestionMeta}>
                          {item.descripcion}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {showInventarioDropdown && inventarioSearch.trim() !== '' && inventarioFiltrado.length === 0 && (
                <div className={styles.suggestionsList}>
                  <div className={styles.suggestionItem}>
                    <div className={styles.suggestionName}>No se encontraron productos</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Formulario similar al principal */}
          <div className={inventarioStyles.formRow}>
            <div className={inventarioStyles.formGroup}>
              <label>Código CABYS</label>
              <input
                type="text"
                name="cabys"
                value={formData.cabys}
                onChange={handleFormChange}
                className={inventarioStyles.textInput}
                readOnly
              />
            </div>
            <div className={inventarioStyles.formGroup}>
              <label>Título</label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleFormChange}
                className={inventarioStyles.textInput}
              />
            </div>
            <div className={inventarioStyles.formGroup}>
              <label>Descripción</label>
              <input
                type="text"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleFormChange}
                className={inventarioStyles.textInput}
              />
            </div>
            <div className={inventarioStyles.formGroup}>
              <label>Tipo</label>
              <input
                type="text"
                name="tipo"
                value={formData.tipo}
                onChange={handleFormChange}
                className={inventarioStyles.textInput}
              />
            </div>
          </div>

          <div className={inventarioStyles.formRow}>
            <div className={inventarioStyles.formGroup}>
              <label>Precio</label>
              <input
                type="number"
                name="precio"
                value={formData.precio}
                onChange={handleFormChange}
                className={inventarioStyles.textInput}
                min="0"
                step="0.01"
              />
            </div>
            <div className={inventarioStyles.formGroup}>
              <label>Cantidad</label>
              <input
                type="number"
                name="cantidad"
                value={formData.cantidad}
                onChange={handleFormChange}
                className={inventarioStyles.textInput}
                min="0"
                step="1"
              />
            </div>
            <div className={inventarioStyles.formGroup}>
              <label>Código comercial</label>
              <input
                type="text"
                name="codigoComercial"
                value={formData.codigoComercial}
                onChange={handleFormChange}
                className={inventarioStyles.textInput}
              />
            </div>
            <div className={inventarioStyles.formGroup}>
              <label>Tipo código comercial</label>
              <select
                name="tipoCodigoComercial"
                value={formData.tipoCodigoComercial}
                onChange={handleFormChange}
                className={inventarioStyles.selectInput}
              >
                <option value="">Seleccionar</option>
                <option value="01">01 - Código del producto del vendedor</option>
                <option value="02">02 - Código del producto del comprador</option>
                <option value="03">03 - Código del producto asignado por la industria</option>
                <option value="04">04 - Código uso interno</option>
                <option value="99">99 - Otros</option>
              </select>
            </div>
          </div>

          <div className={inventarioStyles.formRow}>
            <div className={inventarioStyles.formGroup}>
              <label>Unidad de medida</label>
              <select
                name="unidadMedida"
                value={formData.unidadMedida}
                onChange={handleFormChange}
                className={inventarioStyles.selectInput}
              >
                <option value="">Seleccionar</option>
                {UNIDADES_MEDIDA.map((unidad) => (
                  <option key={unidad.value} value={unidad.value}>
                    {unidad.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={inventarioStyles.formGroup}>
              <label>Unidad de medida comercial</label>
              <input
                type="text"
                name="unidadMedidaComercial"
                value={formData.unidadMedidaComercial}
                onChange={handleFormChange}
                className={inventarioStyles.textInput}
              />
            </div>
          </div>

          {/* Descuento */}
          <div className={inventarioStyles.subsubsection}>
            <div className={inventarioStyles.checkboxGroup}>
              <input
                type="checkbox"
                name="tieneDescuento"
                checked={formData.tieneDescuento}
                onChange={handleFormChange}
              />
              <label>¿Descuento?</label>
            </div>

            {formData.tieneDescuento && (
              <>
                <div className={inventarioStyles.formRow}>
                  <div className={inventarioStyles.formGroup}>
                    <label>Tipo de descuento</label>
                    <select
                      name="tipoDescuento"
                      value={formData.tipoDescuento}
                      onChange={handleFormChange}
                      className={inventarioStyles.selectInput}
                    >
                      <option value="">Seleccionar</option>
                      <option value="Fijo">Fijo</option>
                      <option value="Porcentual">Porcentual</option>
                    </select>
                  </div>
                  <div className={inventarioStyles.formGroup}>
                    <label>Monto</label>
                    <div className={inventarioStyles.inputWithIcon}>
                      <input
                        type="number"
                        name="montoDescuento"
                        value={formData.montoDescuento}
                        onChange={handleFormChange}
                        className={inventarioStyles.textInput}
                        min="0"
                        step="0.01"
                      />
                      <span className={inventarioStyles.inputIcon}>
                        {formData.tipoDescuento === 'Porcentual' ? '%' : '₡'}
                      </span>
                    </div>
                  </div>
                  <div className={inventarioStyles.formGroup}>
                    <label>Código del descuento</label>
                    <select
                      name="codigoDescuento"
                      value={formData.codigoDescuento}
                      onChange={handleFormChange}
                      className={inventarioStyles.selectInput}
                      disabled={codigoDescuentoComun !== null && formData.codigoDescuento === ''}
                    >
                      <option value="">Seleccionar</option>
                      {codigosDescuentoDisponibles.map((cod) => (
                        <option key={cod.value} value={cod.value}>
                          {cod.label}
                        </option>
                      ))}
                    </select>
                    {codigoDescuentoComun && (
                      <small style={{ color: '#666', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                        Debe coincidir con el código de descuento de los productos ya añadidos: {codigoDescuentoComun}
                      </small>
                    )}
                  </div>
                  <div className={inventarioStyles.formGroup}>
                    <label>Detalle</label>
                    <input
                      type="text"
                      name="detalleDescuento"
                      value={formData.detalleDescuento}
                      onChange={handleFormChange}
                      className={inventarioStyles.textInput}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Base imponible */}
          <div className={inventarioStyles.formRow}>
            <div className={inventarioStyles.formGroup}>
              <label>Base imponible</label>
              <input
                type="number"
                name="baseImponible"
                value={formData.baseImponible}
                onChange={handleFormChange}
                className={inventarioStyles.textInput}
                min="0"
                step="0.01"
              />
            </div>

            <div className={inventarioStyles.formGroup}>
              <label>Subtotal:</label>
              <input
                type="text"
                value={subtotal.toFixed(2)}
                disabled
                readOnly
                className={inventarioStyles.infoField}
              />
            </div>
          </div>

          {/* Impuesto */}
          <div className={inventarioStyles.subsubsection}>
            <div className={inventarioStyles.checkboxGroup}>
              <input
                type="checkbox"
                name="tieneImpuesto"
                checked={formData.tieneImpuesto}
                onChange={handleFormChange}
              />
              <label>¿Impuesto?</label>
            </div>

            {formData.tieneImpuesto && (
              <>
                <div className={inventarioStyles.formRow}>
                  <div className={inventarioStyles.formGroup}>
                    <label>Código del impuesto</label>
                    <select
                      name="codigoImpuesto"
                      value={formData.codigoImpuesto}
                      onChange={handleFormChange}
                      className={inventarioStyles.selectInput}
                      disabled={codigoImpuestoComun !== null && formData.codigoImpuesto === ''}
                    >
                      <option value="">Seleccionar</option>
                      {codigosImpuestoDisponibles.map((cod) => (
                        <option key={cod.value} value={cod.value}>
                          {cod.label}
                        </option>
                      ))}
                    </select>
                    {codigoImpuestoComun && (
                      <small style={{ color: '#666', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                        Debe coincidir con el código de impuesto de los productos ya añadidos: {codigoImpuestoComun}
                      </small>
                    )}
                  </div>
                  <div className={inventarioStyles.formGroup}>
                    <label>Detalle</label>
                    <input
                      type="text"
                      name="detalleImpuesto"
                      value={formData.detalleImpuesto}
                      onChange={handleFormChange}
                      className={inventarioStyles.textInput}
                    />
                  </div>
                  <div className={inventarioStyles.formGroup}>
                    <label>Tipo tarifa</label>
                    <select
                      name="tipoTarifa"
                      value={formData.tipoTarifa}
                      onChange={handleFormChange}
                      className={inventarioStyles.selectInput}
                    >
                      <option value="">Seleccionar</option>
                      {TIPOS_TARIFA.map((tar) => (
                        <option key={tar.value} value={tar.value}>
                          {tar.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={inventarioStyles.formGroup}>
                    <label>Tarifa</label>
                    <div className={inventarioStyles.inputWithIcon}>
                      <input
                        type="number"
                        name="tarifa"
                        value={formData.tarifa}
                        onChange={handleFormChange}
                        className={inventarioStyles.textInput}
                        min="0"
                        step="0.01"
                        disabled={formData.codigoImpuesto === '01' || formData.codigoImpuesto === '07'}
                      />
                      <span className={inventarioStyles.inputIcon}>%</span>
                    </div>
                  </div>
                </div>

                {formData.tieneImpuesto && (
                  <div className={inventarioStyles.formRow}>
                    <div className={inventarioStyles.formGroup}>
                      <label>Monto:</label>
                      <input
                        type="text"
                        value={montoImpuesto.toFixed(2)}
                        disabled
                        readOnly
                        className={inventarioStyles.infoField}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Específico */}
          {formData.tieneImpuesto && (
            <div className={inventarioStyles.subsubsection}>
              <div className={inventarioStyles.checkboxGroup}>
                <input
                  type="checkbox"
                  name="esEspecifico"
                  checked={formData.esEspecifico}
                  onChange={handleFormChange}
                />
                <label>¿Es específico?</label>
              </div>

              {formData.esEspecifico && (
                <div className={inventarioStyles.formRow}>
                  <div className={inventarioStyles.formGroup}>
                    <label>Cantidad unidad de medida</label>
                    <input
                      type="number"
                      name="cantidadUnidadMedida"
                      value={formData.cantidadUnidadMedida}
                      onChange={handleFormChange}
                      className={inventarioStyles.textInput}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className={inventarioStyles.formGroup}>
                    <label>Porcentaje</label>
                    <input
                      type="number"
                      name="porcentajeEspecifico"
                      value={formData.porcentajeEspecifico}
                      onChange={handleFormChange}
                      className={inventarioStyles.textInput}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className={inventarioStyles.formGroup}>
                    <label>Proporción</label>
                    <input
                      type="number"
                      name="proporcion"
                      value={formData.proporcion}
                      onChange={handleFormChange}
                      className={inventarioStyles.textInput}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className={inventarioStyles.formGroup}>
                    <label>Volumen por unidad de consumo</label>
                    <input
                      type="number"
                      name="volumenPorUnidadConsumo"
                      value={formData.volumenPorUnidadConsumo}
                      onChange={handleFormChange}
                      className={inventarioStyles.textInput}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className={inventarioStyles.formGroup}>
                    <label>Impuesto por unidad</label>
                    <input
                      type="number"
                      name="impuestoPorUnidad"
                      value={formData.impuestoPorUnidad}
                      onChange={handleFormChange}
                      className={inventarioStyles.textInput}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Campos calculados finales */}
          <div className={inventarioStyles.subsubsection}>
            <div className={inventarioStyles.formRow}>
              <div className={inventarioStyles.formGroup}>
                <label>Impuesto asumido por emisor o fábrica:</label>
                <input
                  type="text"
                  value={impuestoAsumidoEmisor.toFixed(2)}
                  disabled
                  readOnly
                  className={inventarioStyles.infoField}
                />
              </div>

              <div className={inventarioStyles.formGroup}>
                <label>Impuesto neto:</label>
                <input
                  type="text"
                  value={impuestoNeto.toFixed(2)}
                  disabled
                  readOnly
                  className={inventarioStyles.infoField}
                />
              </div>
            </div>

            <div className={inventarioStyles.formRow}>
              <div className={inventarioStyles.formGroup}>
                <label>Monto total de la línea:</label>
                <input
                  type="text"
                  value={montoTotalLinea.toFixed(2)}
                  disabled
                  readOnly
                  className={inventarioStyles.infoField}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={handleClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.submitButton}
            onClick={handleAgregar}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}

export default AgregarProductoSurtidoModal

