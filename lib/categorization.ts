/**
 * Funciones de categorización de facturas
 * Este módulo proporciona funcionalidades para generar y gestionar la categorización
 * de facturas basándose en códigos CABYS y descripciones personalizadas.
 */

/**
 * Genera un slug normalizado a partir de un texto
 * (minúsculas, sin acentos, sin espacios, sin signos de puntuación)
 */
export const generateSlug = (text: string): string => {
  if (!text) return ''
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^\w\s]/g, '')
    .trim()
}

/**
 * Valida si un valor es válido (no null, no undefined, no string vacío)
 */
export const isValidValue = (value: any): boolean => {
  return value !== null && value !== undefined && value !== '' && String(value).trim() !== ''
}

/**
 * Procesa una línea de detalle de un XML y obtiene su categorización
 */
const processLineaDetalle = async (
  lineaNode: Element,
  channelId: string,
  cabysDataJson: any
): Promise<any | null> => {
  // Buscar CodigoCABYS primero (en el nivel directo de LineaDetalle)
  // Si no existe, buscar Codigo en el mismo nivel directo (no dentro de otros nodos)
  let codigoNode: Element | null = null
  
  // Buscar CodigoCABYS en hijos directos
  for (const child of Array.from(lineaNode.children)) {
    if (child.tagName === 'CodigoCABYS') {
      codigoNode = child
      break
    }
  }
  
  // Si no se encontró CodigoCABYS, buscar Codigo en hijos directos (no dentro de CodigoComercial)
  if (!codigoNode) {
    for (const child of Array.from(lineaNode.children)) {
      if (child.tagName === 'Codigo') {
        codigoNode = child
        break
      }
    }
  }
  
  const detalleNode = lineaNode.querySelector('Detalle')
  
  if (!codigoNode || !detalleNode) {
    return null
  }

  const codigo = codigoNode.textContent?.trim() || ''
  const detalle = detalleNode.textContent?.trim() || ''
  const desc_fact = generateSlug(detalle)

  if (!codigo) {
    return null
  }

  // Inicializar variables
  let descripPer = ''
  let bienoserv = ''
  let descripGasInv = ''
  let categoria = ''
  let actEconomica = ''
  let vidaUtil = ''
  let importado = ''

  // 1. Buscar en cabys_data.json
  if (cabysDataJson && cabysDataJson.data && Array.isArray(cabysDataJson.data)) {
    const cabysItem = cabysDataJson.data.find((item: any) => item.codigo === codigo)
    if (cabysItem) {
      if (isValidValue(cabysItem.bienoserv)) bienoserv = String(cabysItem.bienoserv).trim()
      if (isValidValue(cabysItem.descripGasInv)) descripGasInv = String(cabysItem.descripGasInv).trim()
      if (isValidValue(cabysItem.categoria)) categoria = String(cabysItem.categoria).trim()
      if (isValidValue(cabysItem.vidaUtil)) vidaUtil = String(cabysItem.vidaUtil).trim()
      if (isValidValue(cabysItem.importado)) importado = String(cabysItem.importado).trim()
    }
  }

  // 2. Buscar en cabys_personales (colección)
  try {
    const cabysPersonalResponse = await fetch(`/api/cabys-personales?codigo=${codigo}&channelId=${channelId}`)
    if (cabysPersonalResponse.ok) {
      const cabysPersonalResult = await cabysPersonalResponse.json()
      if (cabysPersonalResult.success && cabysPersonalResult.cabys) {
        const cabysPersonal = cabysPersonalResult.cabys
        if (isValidValue(cabysPersonal.descripPer)) descripPer = String(cabysPersonal.descripPer).trim()
        if (isValidValue(cabysPersonal.bienoserv)) bienoserv = String(cabysPersonal.bienoserv).trim()
        if (isValidValue(cabysPersonal.descripGasInv)) descripGasInv = String(cabysPersonal.descripGasInv).trim()
        if (isValidValue(cabysPersonal.categoria)) categoria = String(cabysPersonal.categoria).trim()
        if (isValidValue(cabysPersonal.actEconomica)) actEconomica = String(cabysPersonal.actEconomica).trim()
        if (isValidValue(cabysPersonal.vidaUtil)) vidaUtil = String(cabysPersonal.vidaUtil).trim()
        if (isValidValue(cabysPersonal.importado)) importado = String(cabysPersonal.importado).trim()
      }
    }
  } catch (error) {
    console.error('Error buscando en cabys_personales:', error)
  }

  // 3. Buscar en descripcionpersonalizadas (colección) por codigo y slug
  try {
    const descripcionesResponse = await fetch(`/api/descripciones-personalizadas?channelId=${channelId}`)
    if (descripcionesResponse.ok) {
      const descripcionesResult = await descripcionesResponse.json()
      if (descripcionesResult.success && descripcionesResult.descripciones) {
        const descripcion = descripcionesResult.descripciones.find(
          (d: any) => d.codigo === codigo && d.slug === desc_fact
        )
        if (descripcion) {
          if (isValidValue(descripcion.desc_pers)) descripPer = String(descripcion.desc_pers).trim()
          if (isValidValue(descripcion.bienoserv)) bienoserv = String(descripcion.bienoserv).trim()
          if (isValidValue(descripcion.descripGasInv)) descripGasInv = String(descripcion.descripGasInv).trim()
          if (isValidValue(descripcion.categoria)) categoria = String(descripcion.categoria).trim()
          if (isValidValue(descripcion.act_eco)) actEconomica = String(descripcion.act_eco).trim()
          if (isValidValue(descripcion.vidaUtil)) vidaUtil = String(descripcion.vidaUtil).trim()
          if (isValidValue(descripcion.importado)) importado = String(descripcion.importado).trim()
        }
      }
    }
  } catch (error) {
    console.error('Error buscando en descripcionpersonalizadas:', error)
  }

  // Retornar objeto de categorización
  return {
    cabys: codigo,
    desc_fact: desc_fact,
    descripPer,
    bienoserv,
    descripGasInv,
    categoria,
    actEconomica,
    vidaUtil,
    importado
  }
}

/**
 * Función principal para generar categorización de un XML de factura
 * @param xmlText - Contenido XML de la factura
 * @param channelId - ID del canal al que pertenece la factura
 * @returns Array de objetos de categorización
 */
export const generateCategorizacion = async (xmlText: string, channelId: string): Promise<any[]> => {
  try {
    // Cargar cabys_data.json una sola vez
    let cabysDataJson = null
    try {
      const cabysResponse = await fetch('/cabys_data.json')
      if (cabysResponse.ok) {
        cabysDataJson = await cabysResponse.json()
      }
    } catch (error) {
      console.error('Error cargando cabys_data.json:', error)
    }

    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml')

    // Verificar errores de parseo
    const parserError = xmlDoc.getElementsByTagName('parsererror')[0]
    if (parserError) {
      return []
    }

    const categorizacionArray: any[] = []
    const categorizacionSet = new Set<string>() // Para evitar duplicados

    // Buscar DetalleServicio
    const detalleServicioNode = xmlDoc.querySelector('DetalleServicio')
    if (!detalleServicioNode) {
      return []
    }

    // Procesar cada LineaDetalle
    const lineaDetalleNodes = detalleServicioNode.querySelectorAll('LineaDetalle')
    for (const lineaNode of Array.from(lineaDetalleNodes)) {
      const categoriaItem = await processLineaDetalle(lineaNode, channelId, cabysDataJson)
      if (categoriaItem) {
        const key = `${categoriaItem.cabys}_${categoriaItem.desc_fact}`
        if (!categorizacionSet.has(key)) {
          categorizacionSet.add(key)
          categorizacionArray.push(categoriaItem)
        }
      }

      // Procesar DetalleSurtido -> LineaDetalleSurtido
      const detalleSurtidoContainerNode = lineaNode.querySelector('DetalleSurtido')
      if (detalleSurtidoContainerNode) {
        const lineaDetalleSurtidoNodes = detalleSurtidoContainerNode.querySelectorAll('LineaDetalleSurtido')
        for (const lineaSurtidoNode of Array.from(lineaDetalleSurtidoNodes)) {
          // Buscar CodigoCABYSSurtido y DetalleSurtido
          const codigoSurtidoNode = lineaSurtidoNode.querySelector('CodigoCABYSSurtido')
          const detalleSurtidoTextNode = lineaSurtidoNode.querySelector('DetalleSurtido')
          
          if (codigoSurtidoNode && detalleSurtidoTextNode) {
            const codigoSurtido = codigoSurtidoNode.textContent?.trim() || ''
            const detalleSurtido = detalleSurtidoTextNode.textContent?.trim() || ''
            const desc_fact_surtido = generateSlug(detalleSurtido)

            if (codigoSurtido) {
              // Inicializar variables para surtido
              let descripPer = ''
              let bienoserv = ''
              let descripGasInv = ''
              let categoria = ''
              let actEconomica = ''
              let vidaUtil = ''
              let importado = ''

              // 1. Buscar en cabys_data.json
              if (cabysDataJson && cabysDataJson.data && Array.isArray(cabysDataJson.data)) {
                const cabysItem = cabysDataJson.data.find((item: any) => item.codigo === codigoSurtido)
                if (cabysItem) {
                  if (isValidValue(cabysItem.bienoserv)) bienoserv = String(cabysItem.bienoserv).trim()
                  if (isValidValue(cabysItem.descripGasInv)) descripGasInv = String(cabysItem.descripGasInv).trim()
                  if (isValidValue(cabysItem.categoria)) categoria = String(cabysItem.categoria).trim()
                  if (isValidValue(cabysItem.vidaUtil)) vidaUtil = String(cabysItem.vidaUtil).trim()
                  if (isValidValue(cabysItem.importado)) importado = String(cabysItem.importado).trim()
                }
              }

              // 2. Buscar en cabys_personales
              try {
                const cabysPersonalResponse = await fetch(`/api/cabys-personales?codigo=${codigoSurtido}&channelId=${channelId}`)
                if (cabysPersonalResponse.ok) {
                  const cabysPersonalResult = await cabysPersonalResponse.json()
                  if (cabysPersonalResult.success && cabysPersonalResult.cabys) {
                    const cabysPersonal = cabysPersonalResult.cabys
                    if (isValidValue(cabysPersonal.descripPer)) descripPer = String(cabysPersonal.descripPer).trim()
                    if (isValidValue(cabysPersonal.bienoserv)) bienoserv = String(cabysPersonal.bienoserv).trim()
                    if (isValidValue(cabysPersonal.descripGasInv)) descripGasInv = String(cabysPersonal.descripGasInv).trim()
                    if (isValidValue(cabysPersonal.categoria)) categoria = String(cabysPersonal.categoria).trim()
                    if (isValidValue(cabysPersonal.actEconomica)) actEconomica = String(cabysPersonal.actEconomica).trim()
                    if (isValidValue(cabysPersonal.vidaUtil)) vidaUtil = String(cabysPersonal.vidaUtil).trim()
                    if (isValidValue(cabysPersonal.importado)) importado = String(cabysPersonal.importado).trim()
                  }
                }
              } catch (error) {
                console.error('Error buscando en cabys_personales (surtido):', error)
              }

              // 3. Buscar en descripcionpersonalizadas
              try {
                const descripcionesResponse = await fetch(`/api/descripciones-personalizadas?channelId=${channelId}`)
                if (descripcionesResponse.ok) {
                  const descripcionesResult = await descripcionesResponse.json()
                  if (descripcionesResult.success && descripcionesResult.descripciones) {
                    const descripcion = descripcionesResult.descripciones.find(
                      (d: any) => d.codigo === codigoSurtido && d.slug === desc_fact_surtido
                    )
                    if (descripcion) {
                      if (isValidValue(descripcion.desc_pers)) descripPer = String(descripcion.desc_pers).trim()
                      if (isValidValue(descripcion.bienoserv)) bienoserv = String(descripcion.bienoserv).trim()
                      if (isValidValue(descripcion.descripGasInv)) descripGasInv = String(descripcion.descripGasInv).trim()
                      if (isValidValue(descripcion.categoria)) categoria = String(descripcion.categoria).trim()
                      if (isValidValue(descripcion.act_eco)) actEconomica = String(descripcion.act_eco).trim()
                      if (isValidValue(descripcion.vidaUtil)) vidaUtil = String(descripcion.vidaUtil).trim()
                      if (isValidValue(descripcion.importado)) importado = String(descripcion.importado).trim()
                    }
                  }
                }
              } catch (error) {
                console.error('Error buscando en descripcionpersonalizadas (surtido):', error)
              }

              // Agregar a categorización
              const categoriaSurtidoItem = {
                cabys: codigoSurtido,
                desc_fact: desc_fact_surtido,
                descripPer,
                bienoserv,
                descripGasInv,
                categoria,
                actEconomica,
                vidaUtil,
                importado
              }

              const keySurtido = `${categoriaSurtidoItem.cabys}_${categoriaSurtidoItem.desc_fact}`
              if (!categorizacionSet.has(keySurtido)) {
                categorizacionSet.add(keySurtido)
                categorizacionArray.push(categoriaSurtidoItem)
              }
            }
          }
        }
      }
    }

    // Retornar array directamente
    return categorizacionArray
  } catch (error) {
    console.error('Error generando categorización:', error)
    return []
  }
}

