import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import Inventario from '@/lib/models/Inventario'
import { withDB, sanitizeInput, isValidObjectId } from '@/lib/dbUtils'

// GET /api/inventario - Obtener inventario por channel_id
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const channelId = searchParams.get('channelId')

  if (!channelId) {
    return NextResponse.json(
      { error: 'channelId es requerido' },
      { status: 400 }
    )
  }

  if (!isValidObjectId(channelId)) {
    return NextResponse.json(
      { error: 'channelId inválido' },
      { status: 400 }
    )
  }

  const result = await withDB(async () => {
    const inventario = await Inventario.find({
      channel_id: new mongoose.Types.ObjectId(channelId)
    }).sort({ createdAt: -1 })

    return inventario.map(item => item.toObject())
  })

  if (!result.success) {
    return NextResponse.json(
      { 
        error: result.error,
        message: 'Error al obtener inventario'
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  }

  return NextResponse.json(result.data, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}

// POST /api/inventario - Crear nuevo artículo de inventario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sanitizedData = sanitizeInput(body)
    
    const { 
      cabys, 
      descripcion, 
      titulo,
      tipo, 
      tipoMercancia,
      precio, 
      cantidad, 
      channel_id,
      // Información para facturación - Información general
      partidaArancelaria,
      codigoComercial,
      tipoCodigoComercial,
      // Datos del producto o servicio
      unidadMedida,
      unidadMedidaComercial,
      tipoTransaccion,
      // Medicamento
      esMedicamento,
      registro,
      formaFarmaceutica,
      // VIN o serie
      esVinSerie,
      numeroVinSerie,
      // Descuento
      tieneDescuento,
      naturalezaDescuento,
      montoDescuento,
      codigoDescuento,
      tipoDescuento,
      detalleDescuento,
      baseImponible,
      // Impuesto
      tieneImpuesto,
      codigoImpuesto,
      detalleImpuesto,
      tipoTarifa,
      tarifa,
      // Impuesto específico
      esEspecifico,
      porcentajeEspecifico,
      impuestoPorUnidad,
      cantidadUnidadMedida,
      volumenPorUnidadConsumo,
      // Exoneración
      tieneExoneracion,
      documentoExoneracion,
      detalleExoneracion,
      numeroDocumentoExoneracion,
      articuloExoneracion,
      incisoExoneracion,
      institucionExoneracion,
      detalleInstitucionExoneracion,
      fechaAutorizacionExoneracion,
      porcentajeExoneracion,
      montoExportacion
    } = sanitizedData

    // Validaciones básicas de campos requeridos
    if (!cabys || !descripcion || !tipo || precio === undefined || cantidad === undefined || !channel_id) {
      return NextResponse.json(
        { error: 'Todos los campos requeridos deben ser proporcionados (cabys, descripcion, tipo, precio, cantidad, channel_id)' },
        { status: 400 }
      )
    }

    if (!isValidObjectId(channel_id)) {
      return NextResponse.json(
        { error: 'ID de canal inválido' },
        { status: 400 }
      )
    }

    // Validar y convertir campos numéricos (pueden venir como número o string)
    const precioNum = typeof precio === 'number' ? precio : parseFloat(String(precio || 0))
    const cantidadNum = typeof cantidad === 'number' ? cantidad : parseInt(String(cantidad || 0))

    if (isNaN(precioNum) || precioNum < 0) {
      return NextResponse.json(
        { error: 'El precio debe ser un número válido mayor o igual a 0' },
        { status: 400 }
      )
    }

    if (isNaN(cantidadNum) || cantidadNum < 0) {
      return NextResponse.json(
        { error: 'La cantidad debe ser un número entero válido mayor o igual a 0' },
        { status: 400 }
      )
    }

    // Función helper para convertir valores numéricos de forma segura
    const toNumber = (value: any, defaultValue: number = 0): number => {
      if (typeof value === 'number') return isNaN(value) ? defaultValue : value
      if (value === null || value === undefined || value === '') return defaultValue
      const parsed = parseFloat(String(value))
      return isNaN(parsed) ? defaultValue : parsed
    }

    const toInt = (value: any, defaultValue: number = 0): number => {
      if (typeof value === 'number') return isNaN(value) ? defaultValue : Math.floor(value)
      if (value === null || value === undefined || value === '') return defaultValue
      const parsed = parseInt(String(value))
      return isNaN(parsed) ? defaultValue : parsed
    }

    // Preparar objeto con todos los campos
    const inventarioData: any = {
      cabys: String(cabys || '').trim(),
      descripcion: String(descripcion || '').trim(),
      titulo: String(titulo || '').trim(),
      tipo: String(tipo || '').trim(),
      tipoMercancia: tipoMercancia || 'Normal',
      precio: precioNum,
      cantidad: cantidadNum,
      channel_id: new mongoose.Types.ObjectId(channel_id),
      // Información para facturación
      partidaArancelaria: String(partidaArancelaria || '').trim(),
      codigoComercial: String(codigoComercial || '').trim(),
      tipoCodigoComercial: tipoCodigoComercial || '',
      // Datos del producto o servicio
      unidadMedida: String(unidadMedida || '').trim(),
      unidadMedidaComercial: String(unidadMedidaComercial || '').trim(),
      tipoTransaccion: tipoTransaccion || '',
      // Medicamento
      esMedicamento: Boolean(esMedicamento),
      registro: String(registro || '').trim(),
      formaFarmaceutica: formaFarmaceutica || '',
      // VIN o serie
      esVinSerie: Boolean(esVinSerie),
      numeroVinSerie: String(numeroVinSerie || '').trim(),
      // Descuento
      tieneDescuento: Boolean(tieneDescuento),
      naturalezaDescuento: String(naturalezaDescuento || '').trim(),
      montoDescuento: toNumber(montoDescuento, 0),
      codigoDescuento: codigoDescuento || '',
      tipoDescuento: tipoDescuento || '',
      detalleDescuento: String(detalleDescuento || '').trim(),
      baseImponible: toNumber(baseImponible, 0),
      // Impuesto
      tieneImpuesto: Boolean(tieneImpuesto),
      codigoImpuesto: codigoImpuesto || '',
      detalleImpuesto: String(detalleImpuesto || '').trim(),
      tipoTarifa: tipoTarifa || '',
      tarifa: toNumber(tarifa, 0),
      // Impuesto específico
      esEspecifico: Boolean(esEspecifico),
      porcentajeEspecifico: toNumber(porcentajeEspecifico, 0),
      impuestoPorUnidad: toNumber(impuestoPorUnidad, 0),
      cantidadUnidadMedida: toNumber(cantidadUnidadMedida, 0),
      volumenPorUnidadConsumo: toNumber(volumenPorUnidadConsumo, 0),
      // Exoneración
      tieneExoneracion: Boolean(tieneExoneracion),
      documentoExoneracion: documentoExoneracion || '',
      detalleExoneracion: String(detalleExoneracion || '').trim(),
      numeroDocumentoExoneracion: toInt(numeroDocumentoExoneracion, 0),
      articuloExoneracion: String(articuloExoneracion || '').trim(),
      incisoExoneracion: String(incisoExoneracion || '').trim(),
      institucionExoneracion: institucionExoneracion || '',
      detalleInstitucionExoneracion: String(detalleInstitucionExoneracion || '').trim(),
      fechaAutorizacionExoneracion: String(fechaAutorizacionExoneracion || '').trim(),
      porcentajeExoneracion: toNumber(porcentajeExoneracion, 0),
      montoExportacion: toNumber(montoExportacion, 0)
    }

    const result = await withDB(async () => {
      // Crear nuevo artículo de inventario
      const newInventario = new Inventario(inventarioData)

      const savedInventario = await newInventario.save()
      const savedData = savedInventario.toObject()
      
      // Log para debugging (solo en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        console.log('Inventario creado:', JSON.stringify(savedData, null, 2))
      }
      
      return savedData
    })

    if (!result.success) {
      console.error('Error al crear inventario:', result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Artículo de inventario creado exitosamente',
      inventario: result.data
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating inventario:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error.message 
      },
      { status: 500 }
    )
  }
}