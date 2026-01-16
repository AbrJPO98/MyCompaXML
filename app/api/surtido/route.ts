import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import Surtido from '@/lib/models/Surtido'
import { withDB, sanitizeInput, isValidObjectId } from '@/lib/dbUtils'

// GET /api/surtido - Obtener surtidos por channel_id
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
    const surtidos = await Surtido.find({
      channel_id: new mongoose.Types.ObjectId(channelId)
    }).sort({ createdAt: -1 })

    return surtidos.map(item => item.toObject())
  })

  if (!result.success) {
    return NextResponse.json(
      { 
        error: result.error,
        message: 'Error al obtener surtidos'
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

// POST /api/surtido - Crear nuevo surtido
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sanitizedData = sanitizeInput(body)
    
    const { 
      cabys, 
      descripcion, 
      titulo,
      tipo, 
      precio, 
      cantidad, 
      channel_id,
      detalle
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

    // Validar y convertir campos numéricos
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

    // Validar detalle si se proporciona
    let detalleArray = []
    if (detalle && Array.isArray(detalle)) {
      detalleArray = detalle.map((item: any) => ({
        cabys: String(item.cabys || '').trim(),
        titulo: String(item.titulo || '').trim(),
        descripcion: String(item.descripcion || '').trim(),
        tipo: String(item.tipo || '').trim(),
        precio: typeof item.precio === 'number' ? item.precio : parseFloat(String(item.precio || 0)),
        cantidad: typeof item.cantidad === 'number' ? item.cantidad : parseInt(String(item.cantidad || 0)),
        codigoComercial: String(item.codigoComercial || '').trim(),
        tipoCodigoComercial: String(item.tipoCodigoComercial || '').trim(),
        unidadMedida: String(item.unidadMedida || '').trim(),
        unidadMedidaComercial: String(item.unidadMedidaComercial || '').trim(),
        montoDescuento: typeof item.montoDescuento === 'number' ? item.montoDescuento : parseFloat(String(item.montoDescuento || 0)),
        codigoDescuento: String(item.codigoDescuento || '').trim(),
        detalleDescuento: String(item.detalleDescuento || '').trim(),
        ivaCobradoFabrica: typeof item.ivaCobradoFabrica === 'number' ? item.ivaCobradoFabrica : parseFloat(String(item.ivaCobradoFabrica || 0)),
        baseImponible: typeof item.baseImponible === 'number' ? item.baseImponible : parseFloat(String(item.baseImponible || 0)),
        codigoImpuesto: String(item.codigoImpuesto || '').trim(),
        detalleImpuesto: String(item.detalleImpuesto || '').trim(),
        tipoTarifa: String(item.tipoTarifa || '').trim(),
        tarifa: typeof item.tarifa === 'number' ? item.tarifa : parseFloat(String(item.tarifa || 0)),
        cantidadUnidadMedida: typeof item.cantidadUnidadMedida === 'number' ? item.cantidadUnidadMedida : parseFloat(String(item.cantidadUnidadMedida || 0)),
        porcentajeEspecifico: typeof item.porcentajeEspecifico === 'number' ? item.porcentajeEspecifico : parseFloat(String(item.porcentajeEspecifico || 0)),
        proporcion: typeof item.proporcion === 'number' ? item.proporcion : parseFloat(String(item.proporcion || 0)),
        volumenPorUnidadConsumo: typeof item.volumenPorUnidadConsumo === 'number' ? item.volumenPorUnidadConsumo : parseFloat(String(item.volumenPorUnidadConsumo || 0)),
        impuestoPorUnidad: typeof item.impuestoPorUnidad === 'number' ? item.impuestoPorUnidad : parseFloat(String(item.impuestoPorUnidad || 0))
      }))
    }

    // Preparar objeto con todos los campos
    const surtidoData: any = {
      cabys: String(cabys || '').trim(),
      descripcion: String(descripcion || '').trim(),
      titulo: String(titulo || '').trim(),
      tipo: String(tipo || '').trim(),
      precio: precioNum,
      cantidad: cantidadNum,
      channel_id: new mongoose.Types.ObjectId(channel_id),
      detalle: detalleArray
    }

    const result = await withDB(async () => {
      // Crear nuevo surtido
      const newSurtido = new Surtido(surtidoData)

      const savedSurtido = await newSurtido.save()
      const savedData = savedSurtido.toObject()
      
      // Log para debugging (solo en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        console.log('Surtido creado:', JSON.stringify(savedData, null, 2))
      }
      
      return savedData
    })

    if (!result.success) {
      console.error('Error al crear surtido:', result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Surtido creado exitosamente',
      surtido: result.data
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating surtido:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

