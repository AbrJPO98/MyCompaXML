'use client'
import React, { useState, useEffect } from 'react'
import styles from './NuevaFacturaModal.module.css'

interface NuevaFacturaModalProps {
  isOpen: boolean
  onClose: () => void
  channelId: string
  userId: string
}

interface InvoiceData {
  actividadEconomica: {
    _id: string
    nombre_personal: string
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

const TIPOS_DOCUMENTO = [
  { value: '01', label: '01 - Factura electrónica' },
  { value: '02', label: '02 - Nota de débito electrónica' },
  { value: '03', label: '03 - Nota de crédito electrónica' },
  { value: '04', label: '04 - Tiquete electrónico' },
  { value: '05', label: '05 - Confirmación de aceptación del comprobante electrónico' },
  { value: '06', label: '06 - Confirmación de aceptación parcial del comprobante electrónico' },
  { value: '07', label: '07 - Confirmación de rechazo del comprobante electrónico' },
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

export default function NuevaFacturaModal({ isOpen, onClose, channelId, userId }: NuevaFacturaModalProps) {
  const [tipoDocumento, setTipoDocumento] = useState('01')
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(false)
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

  useEffect(() => {
    if (isOpen) {
      loadUbicaciones()
      loadActividadesEconomicas()
      if (channelId) {
        loadClientes()
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

  const handleClose = () => {
    if (!loading) {
      setTipoDocumento('01')
      setInvoiceData(null)
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
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>📄 Nueva Factura</h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            disabled={loading}
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
                        <input
                          type="text"
                          id="actividadEconomicaReceptor"
                          value={actividadEconomicaSearch}
                          onChange={(e) => {
                            setActividadEconomicaSearch(e.target.value)
                            setActividadEconomicaSeleccionada('')
                          }}
                          onFocus={() => {
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
                        {showActividadEconomicaDropdown && actividadEconomicaFiltrada.length > 0 && (
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
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={handleClose}
            className={styles.cancelButton}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.saveButton}
            disabled={loading}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}
