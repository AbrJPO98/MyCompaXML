'use client'
import React, { useState, useEffect } from 'react'
import { generateSlug } from '@/lib/categorization'
import styles from './CategorizarFacturaModal.module.css'

interface LineaDetalle {
  numeroLinea?: string
  partidaArancelaria?: string
  codigoCABYS?: string
  codigoComercial?: Array<{
    tipo?: string
    codigo?: string
  }>
  cantidad?: string
  unidadMedida?: string
  tipoTransaccion?: string
  unidadMedidaComercial?: string
  detalle?: string
  numeroVINoSerie?: Array<string>
  registroMedicamento?: string
  formaFarmaceutica?: string
  detalleSurtido?: {
    lineaDetalleSurtido?: Array<{
      codigoCABYSSurtido?: string
      codigoComercialSurtido?: Array<{
        tipoSurtido?: string
        codigoSurtido?: string
      }>
      cantidadSurtido?: string
      unidadMedidaSurtido?: string
      unidadMedidaComercialSurtido?: string
      detalleSurtido?: string
      precioUnitarioSurtido?: string
      montoTotalSurtido?: string
      descuentoSurtido?: Array<{
        montoDescuentoSurtido?: string
        codigoDescuentoSurtido?: string
        descuentoSurtidoOtros?: string
      }>
      subTotalSurtido?: string
      ivaCobradoFabricaSurtido?: string
      baseImponibleSurtido?: string
      impuestoSurtido?: Array<{
        codigoImpuestoSurtido?: string
        codigoImpuestoOTROSurtido?: string
        codigoTarifaIVASurtido?: string
        tarifaSurtido?: string
        datosImpuestoEspecificoSurtido?: {
          cantidadUnidadMedidaSurtido?: string
          porcentajeSurtido?: string
          proporcionSurtido?: string
          volumenUnidadConsumoSurtido?: string
          impuestoUnidadSurtido?: string
        }
        montoImpuestoSurtido?: string
      }>
    }>
  }
  precioUnitario?: string
  montoTotal?: string
  descuento?: Array<{
    montoDescuento?: string
    codigoDescuento?: string
    codigoDescuentoOTRO?: string
    naturalezaDescuento?: string
  }>
  subTotal?: string
  ivaCobradoFabrica?: string
  baseImponible?: string
  impuesto?: Array<{
    codigo?: string
    codigoImpuestoOTRO?: string
    codigoTarifaIVA?: string
    tarifa?: string
    factorCalculoIVA?: string
    datosImpuestoEspecifico?: {
      cantidadUnidadMedida?: string
      porcentaje?: string
      proporcion?: string
      volumenUnidadConsumo?: string
      impuestoUnidad?: string
    }
    monto?: string
    montoExportacion?: string
    exoneracion?: {
      tipoDocumentoEX1?: string
      tipoDocumentoOTRO?: string
      numeroDocumento?: string
      articulo?: string
      inciso?: string
      nombreInstitucion?: string
      nombreInstitucionOtros?: string
      fechaEmisionEX?: string
      tarifaexonerada?: string
      montoExoneracion?: string
    }
  }>
  impuestoAsumidoEmisorFabrica?: string
  impuestoNeto?: string
  montoTotalLinea?: string
}

interface CategorizarFacturaModalProps {
  clave: string
  channelId: string
  onClose: () => void
}

const CategorizarFacturaModal: React.FC<CategorizarFacturaModalProps> = ({ 
  clave,
  channelId, 
  onClose 
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lineasDetalle, setLineasDetalle] = useState<LineaDetalle[]>([])
  const [categorizacionArray, setCategorizacionArray] = useState<any[]>([])

  useEffect(() => {
    fetchFacturaData()
  }, [clave, channelId])

  // Función para buscar en el array de categorización
  const findCategorizacion = (cabys: string, detalle: string): any | null => {
    if (!cabys || !detalle || categorizacionArray.length === 0) {
      return null
    }
    
    const desc_fact = generateSlug(detalle)
    return categorizacionArray.find(
      (item: any) => item.cabys === cabys && item.desc_fact === desc_fact
    ) || null
  }

  const fetchFacturaData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!clave) {
        throw new Error('Se requiere la clave de la factura para buscarla')
      }

      // Buscar factura por clave y channelId
      const url = `/api/facturas?channelId=${channelId}&clave=${encodeURIComponent(clave)}`
      console.log('🔍 Buscando factura por clave y channelId:', { clave, channelId })

      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al obtener la factura')
      }

      const data = await response.json()
      
      if (!data.success || !data.factura || !data.factura.xml) {
        throw new Error('No se encontró el XML de la factura')
      }

      // Cargar categorización si existe
      if (data.factura.categorizacion) {
        // La categorización ahora es un array directamente
        if (Array.isArray(data.factura.categorizacion)) {
          setCategorizacionArray(data.factura.categorizacion)
          console.log('✅ Categorización cargada desde BD:', data.factura.categorizacion.length, 'elementos')
        } else {
          // Compatibilidad: si viene como string (datos antiguos), intentar parsear
          try {
            const categorizacionStr = String(data.factura.categorizacion).trim()
            if (categorizacionStr && categorizacionStr !== '[]' && categorizacionStr !== 'null') {
              const categorizacionParsed = JSON.parse(categorizacionStr)
              if (Array.isArray(categorizacionParsed)) {
                setCategorizacionArray(categorizacionParsed)
                console.log('✅ Categorización cargada desde BD (parseada desde string):', categorizacionParsed.length, 'elementos')
              } else {
                console.warn('⚠️ Categorización no es un array:', typeof categorizacionParsed)
                setCategorizacionArray([])
              }
            } else {
              console.log('⚠️ Categorización está vacía o es null')
              setCategorizacionArray([])
            }
          } catch (parseError: any) {
            console.error('❌ Error parseando categorización:', parseError)
            setCategorizacionArray([])
          }
        }
      } else {
        console.log('⚠️ No se encontró categorización en la factura')
        setCategorizacionArray([])
      }

      // Decodificar XML de Base64
      const decodedXML = decodeURIComponent(escape(window.atob(data.factura.xml)))
      
      // Parsear XML y extraer LineaDetalle
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(decodedXML, 'text/xml')
      
      const lineasDetalle = extractLineasDetalle(xmlDoc)
      setLineasDetalle(lineasDetalle)

    } catch (err: any) {
      console.error('Error fetching factura data:', err)
      setError(err.message || 'Error al cargar los datos de la factura')
    } finally {
      setLoading(false)
    }
  }

  const extractLineasDetalle = (xmlDoc: Document): LineaDetalle[] => {
    const lineas: LineaDetalle[] = []
    
    // Buscar el nodo DetalleServicio
    const detalleServicio = xmlDoc.querySelector('DetalleServicio')
    if (!detalleServicio) {
      return lineas
    }

    // Obtener todos los nodos LineaDetalle
    const lineaDetalleNodes = detalleServicio.querySelectorAll('LineaDetalle')
    
    lineaDetalleNodes.forEach((lineaNode, index) => {
      const linea: LineaDetalle = {}

      // Extraer datos básicos
      linea.numeroLinea = getTextContent(lineaNode, 'NumeroLinea')
      linea.partidaArancelaria = getTextContent(lineaNode, 'PartidaArancelaria')
      linea.codigoCABYS = getTextContent(lineaNode, 'CodigoCABYS') || getTextContent(lineaNode, 'Codigo')
      linea.cantidad = getTextContent(lineaNode, 'Cantidad')
      linea.unidadMedida = getTextContent(lineaNode, 'UnidadMedida')
      linea.tipoTransaccion = getTextContent(lineaNode, 'TipoTransaccion')
      linea.unidadMedidaComercial = getTextContent(lineaNode, 'UnidadMedidaComercial')
      linea.detalle = getTextContent(lineaNode, 'Detalle')
      linea.registroMedicamento = getTextContent(lineaNode, 'RegistroMedicamento')
      linea.formaFarmaceutica = getTextContent(lineaNode, 'FormaFarmaceutica')
      linea.precioUnitario = getTextContent(lineaNode, 'PrecioUnitario')
      linea.montoTotal = getTextContent(lineaNode, 'MontoTotal')
      linea.subTotal = getTextContent(lineaNode, 'SubTotal')
      linea.ivaCobradoFabrica = getTextContent(lineaNode, 'IVACobradoFabrica')
      linea.baseImponible = getTextContent(lineaNode, 'BaseImponible')
      linea.impuestoAsumidoEmisorFabrica = getTextContent(lineaNode, 'ImpuestoAsumidoEmisorFabrica')
      linea.impuestoNeto = getTextContent(lineaNode, 'ImpuestoNeto')
      linea.montoTotalLinea = getTextContent(lineaNode, 'MontoTotalLinea')

      // Extraer códigos comerciales
      const codigoComercialNodes = lineaNode.querySelectorAll('CodigoComercial')
      if (codigoComercialNodes.length > 0) {
        linea.codigoComercial = Array.from(codigoComercialNodes).map(node => ({
          tipo: getTextContent(node, 'Tipo'),
          codigo: getTextContent(node, 'Codigo')
        }))
      }

      // Extraer números VIN o serie
      const numeroVINoSerieNodes = lineaNode.querySelectorAll('NumeroVINoSerie')
      if (numeroVINoSerieNodes.length > 0) {
        linea.numeroVINoSerie = Array.from(numeroVINoSerieNodes).map(node => node.textContent || '')
      }

      // Extraer descuentos
      const descuentoNodes = lineaNode.querySelectorAll('Descuento')
      if (descuentoNodes.length > 0) {
        linea.descuento = Array.from(descuentoNodes).map(node => ({
          montoDescuento: getTextContent(node, 'MontoDescuento'),
          codigoDescuento: getTextContent(node, 'CodigoDescuento'),
          codigoDescuentoOTRO: getTextContent(node, 'CodigoDescuentoOTRO'),
          naturalezaDescuento: getTextContent(node, 'NaturalezaDescuento')
        }))
      }

      // Extraer impuestos
      const impuestoNodes = lineaNode.querySelectorAll('Impuesto')
      if (impuestoNodes.length > 0) {
        linea.impuesto = Array.from(impuestoNodes).map(node => {
          const impuesto: any = {
            codigo: getTextContent(node, 'Codigo'),
            codigoImpuestoOTRO: getTextContent(node, 'CodigoImpuestoOTRO'),
            codigoTarifaIVA: getTextContent(node, 'CodigoTarifaIVA') || getTextContent(node, 'CodigoTarifa'),
            tarifa: getTextContent(node, 'Tarifa'),
            factorCalculoIVA: getTextContent(node, 'FactorCalculoIVA') || getTextContent(node, 'FactorIVA'),
            monto: getTextContent(node, 'Monto'),
            montoExportacion: getTextContent(node, 'MontoExportacion')
          }

          // Datos de impuesto específico
          const datosImpuestoEspecifico = node.querySelector('DatosImpuestoEspecifico')
          if (datosImpuestoEspecifico) {
            impuesto.datosImpuestoEspecifico = {
              cantidadUnidadMedida: getTextContent(datosImpuestoEspecifico, 'CantidadUnidadMedida'),
              porcentaje: getTextContent(datosImpuestoEspecifico, 'Porcentaje'),
              proporcion: getTextContent(datosImpuestoEspecifico, 'Proporcion'),
              volumenUnidadConsumo: getTextContent(datosImpuestoEspecifico, 'VolumenUnidadConsumo'),
              impuestoUnidad: getTextContent(datosImpuestoEspecifico, 'ImpuestoUnidad')
            }
          }

          // Exoneración
          const exoneracion = node.querySelector('Exoneracion')
          if (exoneracion) {
            impuesto.exoneracion = {
              tipoDocumentoEX1: getTextContent(exoneracion, 'TipoDocumentoEX1') || getTextContent(exoneracion, 'Tipodocumento'),
              tipoDocumentoOTRO: getTextContent(exoneracion, 'TipoDocumentoOTRO'),
              numeroDocumento: getTextContent(exoneracion, 'NumeroDocumento'),
              articulo: getTextContent(exoneracion, 'Articulo'),
              inciso: getTextContent(exoneracion, 'Inciso'),
              nombreInstitucion: getTextContent(exoneracion, 'NombreInstitucion'),
              nombreInstitucionOtros: getTextContent(exoneracion, 'NombreInstitucionOtros'),
              fechaEmisionEX: getTextContent(exoneracion, 'FechaEmisionEX') || getTextContent(exoneracion, 'FechaEmision'),
              tarifaexonerada: getTextContent(exoneracion, 'Tarifaexonerada') || getTextContent(exoneracion, 'PorcentajeExoneracion'),
              montoExoneracion: getTextContent(exoneracion, 'MontoExoneracion')
            }
          }

          return impuesto
        })
      }

      // Extraer detalles surtidos
      const detalleSurtidoNode = lineaNode.querySelector('DetalleSurtido')
      if (detalleSurtidoNode) {
        const lineaDetalleSurtidoNodes = detalleSurtidoNode.querySelectorAll('LineaDetalleSurtido')
        if (lineaDetalleSurtidoNodes.length > 0) {
          linea.detalleSurtido = {
            lineaDetalleSurtido: Array.from(lineaDetalleSurtidoNodes).map(node => {
              const surtido: any = {
                codigoCABYSSurtido: getTextContent(node, 'CodigoCABYSSurtido'),
                cantidadSurtido: getTextContent(node, 'CantidadSurtido'),
                unidadMedidaSurtido: getTextContent(node, 'UnidadMedidaSurtido'),
                unidadMedidaComercialSurtido: getTextContent(node, 'UnidadMedidaComercialSurtido'),
                detalleSurtido: getTextContent(node, 'DetalleSurtido'),
                precioUnitarioSurtido: getTextContent(node, 'PrecioUnitarioSurtido'),
                montoTotalSurtido: getTextContent(node, 'MontoTotalSurtido'),
                subTotalSurtido: getTextContent(node, 'SubTotalSurtido'),
                ivaCobradoFabricaSurtido: getTextContent(node, 'IVACobradoFabricaSurtido'),
                baseImponibleSurtido: getTextContent(node, 'BaseImponibleSurtido')
              }

              // Códigos comerciales surtidos
              const codigoComercialSurtidoNodes = node.querySelectorAll('CodigoComercialSurtido')
              if (codigoComercialSurtidoNodes.length > 0) {
                surtido.codigoComercialSurtido = Array.from(codigoComercialSurtidoNodes).map(ccNode => ({
                  tipoSurtido: getTextContent(ccNode, 'TipoSurtido'),
                  codigoSurtido: getTextContent(ccNode, 'CodigoSurtido')
                }))
              }

              // Descuentos surtidos
              const descuentoSurtidoNodes = node.querySelectorAll('DescuentoSurtido')
              if (descuentoSurtidoNodes.length > 0) {
                surtido.descuentoSurtido = Array.from(descuentoSurtidoNodes).map(dsNode => ({
                  montoDescuentoSurtido: getTextContent(dsNode, 'MontoDescuentoSurtido'),
                  codigoDescuentoSurtido: getTextContent(dsNode, 'CodigoDescuentoSurtido'),
                  descuentoSurtidoOtros: getTextContent(dsNode, 'DescuentoSurtidoOtros')
                }))
              }

              // Impuestos surtidos
              const impuestoSurtidoNodes = node.querySelectorAll('ImpuestoSurtido')
              if (impuestoSurtidoNodes.length > 0) {
                surtido.impuestoSurtido = Array.from(impuestoSurtidoNodes).map(isNode => {
                  const impuestoSurtido: any = {
                    codigoImpuestoSurtido: getTextContent(isNode, 'CodigoImpuestoSurtido'),
                    codigoImpuestoOTROSurtido: getTextContent(isNode, 'CodigoImpuestoOTROSurtido'),
                    codigoTarifaIVASurtido: getTextContent(isNode, 'CodigoTarifaIVASurtido'),
                    tarifaSurtido: getTextContent(isNode, 'TarifaSurtido'),
                    montoImpuestoSurtido: getTextContent(isNode, 'MontoImpuestoSurtido')
                  }

                  // Datos de impuesto específico surtido
                  const datosImpuestoEspecificoSurtido = isNode.querySelector('DatosImpuestoEspecificoSurtido')
                  if (datosImpuestoEspecificoSurtido) {
                    impuestoSurtido.datosImpuestoEspecificoSurtido = {
                      cantidadUnidadMedidaSurtido: getTextContent(datosImpuestoEspecificoSurtido, 'CantidadUnidadMedidaSurtido'),
                      porcentajeSurtido: getTextContent(datosImpuestoEspecificoSurtido, 'PorcentajeSurtido'),
                      proporcionSurtido: getTextContent(datosImpuestoEspecificoSurtido, 'ProporcionSurtido'),
                      volumenUnidadConsumoSurtido: getTextContent(datosImpuestoEspecificoSurtido, 'VolumenUnidadConsumoSurtido'),
                      impuestoUnidadSurtido: getTextContent(datosImpuestoEspecificoSurtido, 'ImpuestoUnidadSurtido')
                    }
                  }

                  return impuestoSurtido
                })
              }

              return surtido
            })
          }
        }
      }

      lineas.push(linea)
    })

    return lineas
  }

  const getTextContent = (parent: Element, selector: string): string | undefined => {
    const element = parent.querySelector(selector)
    return element?.textContent?.trim() || undefined
  }

  const renderValue = (value: any): string => {
    if (value === undefined || value === null) return '-'
    if (typeof value === 'string') return value
    if (Array.isArray(value)) {
      return value.length > 0 ? value.map(item => 
        typeof item === 'object' ? JSON.stringify(item) : String(item)
      ).join(', ') : '-'
    }
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    return String(value)
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>🏷️ Categorizar Factura - {clave}</h2>
          <button 
            onClick={onClose}
            className={styles.closeButton}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Cargando datos de la factura...</p>
            </div>
          ) : error ? (
            <div className={styles.error}>
              <p>❌ {error}</p>
            </div>
          ) : lineasDetalle.length === 0 ? (
            <div className={styles.noData}>
              <p>📄 No se encontraron líneas de detalle en esta factura</p>
            </div>
          ) : (
            <div className={styles.lineasContainer}>
              <h3>📋 Líneas de Detalle ({lineasDetalle.length})</h3>
              {lineasDetalle.map((linea, index) => (
                <div key={index} className={styles.lineaDetalle}>
                  <div className={styles.lineaHeader}>
                    <h4>Línea {index + 1}</h4>
                    {linea.numeroLinea && (
                      <span className={styles.numeroLinea}>N° {linea.numeroLinea}</span>
                    )}
                  </div>
                  
                  <div className={styles.lineaContent}>
                    {/* Campos básicos en columnas */}
                    <div className={styles.fieldGroup}>
                      <h5>📋 Información Básica</h5>
                      <div className={styles.fieldGrid}>
                        {linea.numeroLinea && (
                          <div className={styles.field}>
                            <label>🔢 Número de Línea:</label>
                            <span>{linea.numeroLinea}</span>
                          </div>
                        )}
                        {linea.partidaArancelaria && (
                          <div className={styles.field}>
                            <label>📋 Partida Arancelaria:</label>
                            <span>{linea.partidaArancelaria}</span>
                          </div>
                        )}
                        {linea.codigoCABYS && (
                          <div className={styles.field}>
                            <label>🏷️ Código CABYS:</label>
                            <span>{linea.codigoCABYS}</span>
                          </div>
                        )}
                        {linea.cantidad && (
                          <div className={styles.field}>
                            <label>📊 Cantidad:</label>
                            <span>{linea.cantidad}</span>
                          </div>
                        )}
                        {linea.unidadMedida && (
                          <div className={styles.field}>
                            <label>📏 Unidad de Medida:</label>
                            <span>{linea.unidadMedida}</span>
                          </div>
                        )}
                        {linea.tipoTransaccion && (
                          <div className={styles.field}>
                            <label>🔄 Tipo de Transacción:</label>
                            <span>{linea.tipoTransaccion}</span>
                          </div>
                        )}
                        {linea.unidadMedidaComercial && (
                          <div className={styles.field}>
                            <label>📐 Unidad de Medida Comercial:</label>
                            <span>{linea.unidadMedidaComercial}</span>
                          </div>
                        )}
                        {linea.detalle && (
                          <div className={styles.field}>
                            <label>📝 Detalle:</label>
                            <span>{linea.detalle}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Información de Categorización */}
                    {linea.codigoCABYS && linea.detalle && (() => {
                      const categoriaData = findCategorizacion(linea.codigoCABYS, linea.detalle)
                      if (categoriaData) {
                        return (
                          <div className={styles.fieldGroupCategorizacion}>
                            <h5>📊 Información de Categorización</h5>
                            <div className={styles.fieldGrid}>
                              <div className={styles.field}>
                                <label>📝 Descripción personalizada:</label>
                                <span>{categoriaData.descripPer && categoriaData.descripPer.trim() !== '' ? categoriaData.descripPer : <em>No definido</em>}</span>
                              </div>
                              <div className={styles.field}>
                                <label>🏷️ Bien o servicio:</label>
                                <span>{categoriaData.bienoserv && categoriaData.bienoserv.trim() !== '' ? categoriaData.bienoserv : <em>No definido</em>}</span>
                              </div>
                              <div className={styles.field}>
                                <label>📦 Descripción Gasto o Inventario:</label>
                                <span>{categoriaData.descripGasInv && categoriaData.descripGasInv.trim() !== '' ? categoriaData.descripGasInv : <em>No definido</em>}</span>
                              </div>
                              <div className={styles.field}>
                                <label>📁 Categoría:</label>
                                <span>{categoriaData.categoria && categoriaData.categoria.trim() !== '' ? categoriaData.categoria : <em>No definido</em>}</span>
                              </div>
                              <div className={styles.field}>
                                <label>💼 Actividad económica:</label>
                                <span>{categoriaData.actEconomica && categoriaData.actEconomica.trim() !== '' ? categoriaData.actEconomica : <em>No definido</em>}</span>
                              </div>
                              <div className={styles.field}>
                                <label>⏱️ Vida útil (Años):</label>
                                <span>{categoriaData.vidaUtil && categoriaData.vidaUtil.trim() !== '' ? categoriaData.vidaUtil : <em>No definido</em>}</span>
                              </div>
                              <div className={styles.field}>
                                <label>📥 Cantidad importada:</label>
                                <span>{categoriaData.importado && categoriaData.importado.trim() !== '' ? categoriaData.importado : <em>No definido</em>}</span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    })()}

                    {/* CodigoComercial */}
                    {linea.codigoComercial && linea.codigoComercial.length > 0 && (
                      <div className={styles.fieldGroup}>
                        <h5>🏪 CodigoComercial</h5>
                        <div className={styles.fieldGrid}>
                          {linea.codigoComercial.map((cc, ccIndex) => (
                            <div key={ccIndex} className={styles.field}>
                              <label>Código Comercial {ccIndex + 1}:</label>
                              <span>{cc.tipo} - {cc.codigo}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Información adicional */}
                    {(linea.numeroVINoSerie || linea.registroMedicamento || linea.formaFarmaceutica) && (
                      <div className={styles.fieldGroup}>
                        <h5>📋 Información Adicional</h5>
                        <div className={styles.fieldGrid}>
                          {linea.numeroVINoSerie && linea.numeroVINoSerie.length > 0 && (
                            <>
                              {linea.numeroVINoSerie.map((vin, vinIndex) => (
                                <div key={vinIndex} className={styles.field}>
                                  <label>🔢 VIN/Serie {vinIndex + 1}:</label>
                                  <span>{vin}</span>
                                </div>
                              ))}
                            </>
                          )}
                          {linea.registroMedicamento && (
                            <div className={styles.field}>
                              <label>💊 Registro de Medicamento:</label>
                              <span>{linea.registroMedicamento}</span>
                            </div>
                          )}
                          {linea.formaFarmaceutica && (
                            <div className={styles.field}>
                              <label>💉 Forma Farmacéutica:</label>
                              <span>{linea.formaFarmaceutica}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* DetalleSurtido */}
                    {linea.detalleSurtido && linea.detalleSurtido.lineaDetalleSurtido && linea.detalleSurtido.lineaDetalleSurtido.length > 0 && (
                      <div className={styles.fieldGroup}>
                        <h5>📦 DetalleSurtido</h5>
                        {linea.detalleSurtido.lineaDetalleSurtido.map((lineaSurtido, lineaIndex) => (
                          <div key={lineaIndex} className={styles.surtidoItem}>
                            <h6>LineaDetalleSurtido {lineaIndex + 1}</h6>
                            
                            {/* Información básica del surtido */}
                            <div className={styles.subFieldGroup}>
                              <h6>📋 Información Básica del Surtido</h6>
                              <div className={styles.fieldGrid}>
                                {lineaSurtido.codigoCABYSSurtido && (
                                  <div className={styles.field}>
                                    <label>🏷️ Código CABYS Surtido:</label>
                                    <span>{lineaSurtido.codigoCABYSSurtido}</span>
                                  </div>
                                )}
                                {lineaSurtido.cantidadSurtido && (
                                  <div className={styles.field}>
                                    <label>📊 Cantidad Surtido:</label>
                                    <span>{lineaSurtido.cantidadSurtido}</span>
                                  </div>
                                )}
                                {lineaSurtido.unidadMedidaSurtido && (
                                  <div className={styles.field}>
                                    <label>📏 Unidad de Medida Surtido:</label>
                                    <span>{lineaSurtido.unidadMedidaSurtido}</span>
                                  </div>
                                )}
                                {lineaSurtido.unidadMedidaComercialSurtido && (
                                  <div className={styles.field}>
                                    <label>📐 Unidad de Medida Comercial Surtido:</label>
                                    <span>{lineaSurtido.unidadMedidaComercialSurtido}</span>
                                  </div>
                                )}
                                {lineaSurtido.detalleSurtido && (
                                  <div className={styles.field}>
                                    <label>📝 Detalle Surtido:</label>
                                    <span>{lineaSurtido.detalleSurtido}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Información de Categorización Surtido */}
                            {lineaSurtido.codigoCABYSSurtido && lineaSurtido.detalleSurtido && (() => {
                              const categoriaSurtidoData = findCategorizacion(lineaSurtido.codigoCABYSSurtido, lineaSurtido.detalleSurtido)
                              if (categoriaSurtidoData) {
                                return (
                                  <div className={styles.fieldGroupCategorizacion}>
                                    <h6>📊 Información de Categorización Surtido</h6>
                                    <div className={styles.fieldGrid}>
                                      <div className={styles.field}>
                                        <label>📝 Descripción personalizada:</label>
                                        <span>{categoriaSurtidoData.descripPer && categoriaSurtidoData.descripPer.trim() !== '' ? categoriaSurtidoData.descripPer : <em>No definido</em>}</span>
                                      </div>
                                      <div className={styles.field}>
                                        <label>🏷️ Bien o servicio:</label>
                                        <span>{categoriaSurtidoData.bienoserv && categoriaSurtidoData.bienoserv.trim() !== '' ? categoriaSurtidoData.bienoserv : <em>No definido</em>}</span>
                                      </div>
                                      <div className={styles.field}>
                                        <label>📦 Descripción Gasto o Inventario:</label>
                                        <span>{categoriaSurtidoData.descripGasInv && categoriaSurtidoData.descripGasInv.trim() !== '' ? categoriaSurtidoData.descripGasInv : <em>No definido</em>}</span>
                                      </div>
                                      <div className={styles.field}>
                                        <label>📁 Categoría:</label>
                                        <span>{categoriaSurtidoData.categoria && categoriaSurtidoData.categoria.trim() !== '' ? categoriaSurtidoData.categoria : <em>No definido</em>}</span>
                                      </div>
                                      <div className={styles.field}>
                                        <label>💼 Actividad económica:</label>
                                        <span>{categoriaSurtidoData.actEconomica && categoriaSurtidoData.actEconomica.trim() !== '' ? categoriaSurtidoData.actEconomica : <em>No definido</em>}</span>
                                      </div>
                                      <div className={styles.field}>
                                        <label>⏱️ Vida útil (Años):</label>
                                        <span>{categoriaSurtidoData.vidaUtil && categoriaSurtidoData.vidaUtil.trim() !== '' ? categoriaSurtidoData.vidaUtil : <em>No definido</em>}</span>
                                      </div>
                                      <div className={styles.field}>
                                        <label>📥 Cantidad importada:</label>
                                        <span>{categoriaSurtidoData.importado && categoriaSurtidoData.importado.trim() !== '' ? categoriaSurtidoData.importado : <em>No definido</em>}</span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              }
                              return null
                            })()}

                            {/* CodigoComercialSurtido */}
                            {lineaSurtido.codigoComercialSurtido && lineaSurtido.codigoComercialSurtido.length > 0 && (
                              <div className={styles.subFieldGroup}>
                                <h6>🏪 CodigoComercialSurtido</h6>
                                <div className={styles.fieldGrid}>
                                  {lineaSurtido.codigoComercialSurtido.map((ccs, ccsIndex) => (
                                    <div key={ccsIndex} className={styles.field}>
                                      <label>Código Comercial Surtido {ccsIndex + 1}:</label>
                                      <span>{ccs.tipoSurtido} - {ccs.codigoSurtido}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Información financiera del surtido */}
                            <div className={styles.subFieldGroup}>
                              <h6>💰 Información Financiera del Surtido</h6>
                              <div className={styles.fieldGrid}>
                                {lineaSurtido.precioUnitarioSurtido && (
                                  <div className={styles.field}>
                                    <label>💰 Precio Unitario Surtido:</label>
                                    <span>₡{lineaSurtido.precioUnitarioSurtido}</span>
                                  </div>
                                )}
                                {lineaSurtido.montoTotalSurtido && (
                                  <div className={styles.field}>
                                    <label>💵 Monto Total Surtido:</label>
                                    <span>₡{lineaSurtido.montoTotalSurtido}</span>
                                  </div>
                                )}
                                {lineaSurtido.subTotalSurtido && (
                                  <div className={styles.field}>
                                    <label>📊 Sub Total Surtido:</label>
                                    <span>₡{lineaSurtido.subTotalSurtido}</span>
                                  </div>
                                )}
                                {lineaSurtido.ivaCobradoFabricaSurtido && (
                                  <div className={styles.field}>
                                    <label>🏭 IVA Cobrado Fábrica Surtido:</label>
                                    <span>₡{lineaSurtido.ivaCobradoFabricaSurtido}</span>
                                  </div>
                                )}
                                {lineaSurtido.baseImponibleSurtido && (
                                  <div className={styles.field}>
                                    <label>📈 Base Imponible Surtido:</label>
                                    <span>₡{lineaSurtido.baseImponibleSurtido}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* DescuentoSurtido */}
                            {lineaSurtido.descuentoSurtido && lineaSurtido.descuentoSurtido.length > 0 && (
                              <div className={styles.subFieldGroup}>
                                <h6>🏷️ DescuentoSurtido</h6>
                                <div className={styles.fieldGrid}>
                                  {lineaSurtido.descuentoSurtido.map((ds, dsIndex) => (
                                    <div key={dsIndex} className={styles.field}>
                                      <label>Descuento Surtido {dsIndex + 1}:</label>
                                      <span>Monto: ₡{ds.montoDescuentoSurtido || '-'} | Código: {ds.codigoDescuentoSurtido || '-'} | Otros: {ds.descuentoSurtidoOtros || '-'}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* ImpuestoSurtido */}
                            {lineaSurtido.impuestoSurtido && lineaSurtido.impuestoSurtido.length > 0 && (
                              <div className={styles.subFieldGroup}>
                                <h6>💰 ImpuestoSurtido</h6>
                                {lineaSurtido.impuestoSurtido.map((is, isIndex) => (
                                  <div key={isIndex} className={styles.impuestoItem}>
                                    <h6>Impuesto Surtido {isIndex + 1}</h6>
                                    
                                    {/* Información básica del impuesto surtido */}
                                    <div className={styles.subFieldGroup}>
                                      <h6>📋 Información Básica del Impuesto Surtido</h6>
                                      <div className={styles.fieldGrid}>
                                        {is.codigoImpuestoSurtido && (
                                          <div className={styles.field}>
                                            <label>🏷️ Código Impuesto Surtido:</label>
                                            <span>{is.codigoImpuestoSurtido}</span>
                                          </div>
                                        )}
                                        {is.codigoImpuestoOTROSurtido && (
                                          <div className={styles.field}>
                                            <label>🏷️ Código Impuesto OTRO Surtido:</label>
                                            <span>{is.codigoImpuestoOTROSurtido}</span>
                                          </div>
                                        )}
                                        {is.codigoTarifaIVASurtido && (
                                          <div className={styles.field}>
                                            <label>📊 Código Tarifa IVA Surtido:</label>
                                            <span>{is.codigoTarifaIVASurtido}</span>
                                          </div>
                                        )}
                                        {is.tarifaSurtido && (
                                          <div className={styles.field}>
                                            <label>📈 Tarifa Surtido:</label>
                                            <span>{is.tarifaSurtido}%</span>
                                          </div>
                                        )}
                                        {is.montoImpuestoSurtido && (
                                          <div className={styles.field}>
                                            <label>💰 Monto Impuesto Surtido:</label>
                                            <span>₡{is.montoImpuestoSurtido}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* DatosImpuestoEspecificoSurtido */}
                                    {is.datosImpuestoEspecificoSurtido && (
                                      <div className={styles.subFieldGroup}>
                                        <h6>📊 DatosImpuestoEspecificoSurtido</h6>
                                        <div className={styles.fieldGrid}>
                                          {is.datosImpuestoEspecificoSurtido.cantidadUnidadMedidaSurtido && (
                                            <div className={styles.field}>
                                              <label>📏 Cantidad Unidad Medida Surtido:</label>
                                              <span>{is.datosImpuestoEspecificoSurtido.cantidadUnidadMedidaSurtido}</span>
                                            </div>
                                          )}
                                          {is.datosImpuestoEspecificoSurtido.porcentajeSurtido && (
                                            <div className={styles.field}>
                                              <label>📊 Porcentaje Surtido:</label>
                                              <span>{is.datosImpuestoEspecificoSurtido.porcentajeSurtido}%</span>
                                            </div>
                                          )}
                                          {is.datosImpuestoEspecificoSurtido.proporcionSurtido && (
                                            <div className={styles.field}>
                                              <label>⚖️ Proporción Surtido:</label>
                                              <span>{is.datosImpuestoEspecificoSurtido.proporcionSurtido}</span>
                                            </div>
                                          )}
                                          {is.datosImpuestoEspecificoSurtido.volumenUnidadConsumoSurtido && (
                                            <div className={styles.field}>
                                              <label>📦 Volumen Unidad Consumo Surtido:</label>
                                              <span>{is.datosImpuestoEspecificoSurtido.volumenUnidadConsumoSurtido}</span>
                                            </div>
                                          )}
                                          {is.datosImpuestoEspecificoSurtido.impuestoUnidadSurtido && (
                                            <div className={styles.field}>
                                              <label>💰 Impuesto Unidad Surtido:</label>
                                              <span>₡{is.datosImpuestoEspecificoSurtido.impuestoUnidadSurtido}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Información financiera */}
                    {(linea.precioUnitario || linea.montoTotal || linea.subTotal || linea.ivaCobradoFabrica || linea.baseImponible || linea.impuestoAsumidoEmisorFabrica || linea.impuestoNeto || linea.montoTotalLinea) && (
                      <div className={styles.fieldGroup}>
                        <h5>💰 Información Financiera</h5>
                        <div className={styles.fieldGrid}>
                          {linea.precioUnitario && (
                            <div className={styles.field}>
                              <label>💰 Precio Unitario:</label>
                              <span>₡{linea.precioUnitario}</span>
                            </div>
                          )}
                          {linea.montoTotal && (
                            <div className={styles.field}>
                              <label>💵 Monto Total:</label>
                              <span>₡{linea.montoTotal}</span>
                            </div>
                          )}
                          {linea.subTotal && (
                            <div className={styles.field}>
                              <label>📊 Sub Total:</label>
                              <span>₡{linea.subTotal}</span>
                            </div>
                          )}
                          {linea.ivaCobradoFabrica && (
                            <div className={styles.field}>
                              <label>🏭 IVA Cobrado Fábrica:</label>
                              <span>₡{linea.ivaCobradoFabrica}</span>
                            </div>
                          )}
                          {linea.baseImponible && (
                            <div className={styles.field}>
                              <label>📈 Base Imponible:</label>
                              <span>₡{linea.baseImponible}</span>
                            </div>
                          )}
                          {linea.impuestoAsumidoEmisorFabrica && (
                            <div className={styles.field}>
                              <label>🏭 Impuesto Asumido Emisor Fábrica:</label>
                              <span>₡{linea.impuestoAsumidoEmisorFabrica}</span>
                            </div>
                          )}
                          {linea.impuestoNeto && (
                            <div className={styles.field}>
                              <label>💸 Impuesto Neto:</label>
                              <span>₡{linea.impuestoNeto}</span>
                            </div>
                          )}
                          {linea.montoTotalLinea && (
                            <div className={styles.field}>
                              <label>💯 Monto Total Línea:</label>
                              <span>₡{linea.montoTotalLinea}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Descuento */}
                    {linea.descuento && linea.descuento.length > 0 && (
                      <div className={styles.fieldGroup}>
                        <h5>🏷️ Descuento</h5>
                        <div className={styles.fieldGrid}>
                          {linea.descuento.map((desc, descIndex) => (
                            <div key={descIndex} className={styles.field}>
                              <label>Descuento {descIndex + 1}:</label>
                              <span>Monto: ₡{desc.montoDescuento || '-'} | Código: {desc.codigoDescuento || '-'} | Naturaleza: {desc.naturalezaDescuento || '-'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Impuesto */}
                    {linea.impuesto && linea.impuesto.length > 0 && (
                      <div className={styles.fieldGroup}>
                        <h5>💰 Impuesto</h5>
                        {linea.impuesto.map((imp, impIndex) => (
                          <div key={impIndex} className={styles.impuestoItem}>
                            <h6>Impuesto {impIndex + 1}</h6>
                            
                            {/* Información básica del impuesto */}
                            <div className={styles.subFieldGroup}>
                              <h6>📋 Información Básica del Impuesto</h6>
                              <div className={styles.fieldGrid}>
                                {imp.codigo && (
                                  <div className={styles.field}>
                                    <label>🏷️ Código:</label>
                                    <span>{imp.codigo}</span>
                                  </div>
                                )}
                                {imp.codigoImpuestoOTRO && (
                                  <div className={styles.field}>
                                    <label>🏷️ Código Impuesto OTRO:</label>
                                    <span>{imp.codigoImpuestoOTRO}</span>
                                  </div>
                                )}
                                {imp.codigoTarifaIVA && (
                                  <div className={styles.field}>
                                    <label>📊 Código Tarifa IVA:</label>
                                    <span>{imp.codigoTarifaIVA}</span>
                                  </div>
                                )}
                                {imp.tarifa && (
                                  <div className={styles.field}>
                                    <label>📈 Tarifa:</label>
                                    <span>{imp.tarifa}%</span>
                                  </div>
                                )}
                                {imp.factorCalculoIVA && (
                                  <div className={styles.field}>
                                    <label>🧮 Factor Cálculo IVA:</label>
                                    <span>{imp.factorCalculoIVA}</span>
                                  </div>
                                )}
                                {imp.monto && (
                                  <div className={styles.field}>
                                    <label>💰 Monto:</label>
                                    <span>₡{imp.monto}</span>
                                  </div>
                                )}
                                {imp.montoExportacion && (
                                  <div className={styles.field}>
                                    <label>🌍 Monto Exportación:</label>
                                    <span>₡{imp.montoExportacion}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* DatosImpuestoEspecifico */}
                            {imp.datosImpuestoEspecifico && (
                              <div className={styles.subFieldGroup}>
                                <h6>📊 DatosImpuestoEspecifico</h6>
                                <div className={styles.fieldGrid}>
                                  {imp.datosImpuestoEspecifico.cantidadUnidadMedida && (
                                    <div className={styles.field}>
                                      <label>📏 Cantidad Unidad Medida:</label>
                                      <span>{imp.datosImpuestoEspecifico.cantidadUnidadMedida}</span>
                                    </div>
                                  )}
                                  {imp.datosImpuestoEspecifico.porcentaje && (
                                    <div className={styles.field}>
                                      <label>📊 Porcentaje:</label>
                                      <span>{imp.datosImpuestoEspecifico.porcentaje}%</span>
                                    </div>
                                  )}
                                  {imp.datosImpuestoEspecifico.proporcion && (
                                    <div className={styles.field}>
                                      <label>⚖️ Proporción:</label>
                                      <span>{imp.datosImpuestoEspecifico.proporcion}</span>
                                    </div>
                                  )}
                                  {imp.datosImpuestoEspecifico.volumenUnidadConsumo && (
                                    <div className={styles.field}>
                                      <label>📦 Volumen Unidad Consumo:</label>
                                      <span>{imp.datosImpuestoEspecifico.volumenUnidadConsumo}</span>
                                    </div>
                                  )}
                                  {imp.datosImpuestoEspecifico.impuestoUnidad && (
                                    <div className={styles.field}>
                                      <label>💰 Impuesto Unidad:</label>
                                      <span>₡{imp.datosImpuestoEspecifico.impuestoUnidad}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Exoneracion */}
                            {imp.exoneracion && (
                              <div className={styles.subFieldGroup}>
                                <h6>🆓 Exoneracion</h6>
                                <div className={styles.fieldGrid}>
                                  {imp.exoneracion.tipoDocumentoEX1 && (
                                    <div className={styles.field}>
                                      <label>📄 Tipo Documento EX1:</label>
                                      <span>{imp.exoneracion.tipoDocumentoEX1}</span>
                                    </div>
                                  )}
                                  {imp.exoneracion.tipoDocumentoOTRO && (
                                    <div className={styles.field}>
                                      <label>📄 Tipo Documento OTRO:</label>
                                      <span>{imp.exoneracion.tipoDocumentoOTRO}</span>
                                    </div>
                                  )}
                                  {imp.exoneracion.numeroDocumento && (
                                    <div className={styles.field}>
                                      <label>🔢 Número Documento:</label>
                                      <span>{imp.exoneracion.numeroDocumento}</span>
                                    </div>
                                  )}
                                  {imp.exoneracion.articulo && (
                                    <div className={styles.field}>
                                      <label>📋 Artículo:</label>
                                      <span>{imp.exoneracion.articulo}</span>
                                    </div>
                                  )}
                                  {imp.exoneracion.inciso && (
                                    <div className={styles.field}>
                                      <label>📝 Inciso:</label>
                                      <span>{imp.exoneracion.inciso}</span>
                                    </div>
                                  )}
                                  {imp.exoneracion.nombreInstitucion && (
                                    <div className={styles.field}>
                                      <label>🏛️ Nombre Institución:</label>
                                      <span>{imp.exoneracion.nombreInstitucion}</span>
                                    </div>
                                  )}
                                  {imp.exoneracion.nombreInstitucionOtros && (
                                    <div className={styles.field}>
                                      <label>🏛️ Nombre Institución Otros:</label>
                                      <span>{imp.exoneracion.nombreInstitucionOtros}</span>
                                    </div>
                                  )}
                                  {imp.exoneracion.fechaEmisionEX && (
                                    <div className={styles.field}>
                                      <label>📅 Fecha Emisión EX:</label>
                                      <span>{imp.exoneracion.fechaEmisionEX}</span>
                                    </div>
                                  )}
                                  {imp.exoneracion.tarifaexonerada && (
                                    <div className={styles.field}>
                                      <label>📊 Tarifa Exonerada:</label>
                                      <span>{imp.exoneracion.tarifaexonerada}%</span>
                                    </div>
                                  )}
                                  {imp.exoneracion.montoExoneracion && (
                                    <div className={styles.field}>
                                      <label>💰 Monto Exoneración:</label>
                                      <span>₡{imp.exoneracion.montoExoneracion}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CategorizarFacturaModal
