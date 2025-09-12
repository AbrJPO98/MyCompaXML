import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import FacturaDescartada from '@/lib/models/FacturaDescartada'
import { isValidObjectId } from '@/lib/dbUtils'

// GET - Obtener facturas descartadas por channel_id
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json(
        { success: false, error: 'channelId es requerido' },
        { status: 400 }
      )
    }

    if (!isValidObjectId(channelId)) {
      return NextResponse.json(
        { success: false, error: 'channelId inválido' },
        { status: 400 }
      )
    }

    const facturasDescartadas = await FacturaDescartada.find({ channel_id: channelId })
      .sort({ fecha: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      data: facturasDescartadas
    })
  } catch (error) {
    console.error('Error al obtener facturas descartadas:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva factura descartada
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    console.log('Datos recibidos en API facturas-descartadas:', body)
    
    const {
      clave,
      nombre,
      tipoDoc,
      dia,
      mes,
      anno,
      nombreEmisor,
      cedulaEmisor,
      nombreReceptor,
      cedulaReceptor,
      total,
      impuesto,
      xml,
      channel_id
    } = body

    // Validaciones - Solo campos esenciales son requeridos
    if (!clave || !xml || !channel_id) {
      return NextResponse.json(
        { success: false, error: 'Los campos clave, xml y channel_id son requeridos' },
        { status: 400 }
      )
    }

    if (!isValidObjectId(channel_id)) {
      return NextResponse.json(
        { success: false, error: 'channel_id inválido' },
        { status: 400 }
      )
    }

    // Verificar si ya existe una factura descartada con la misma clave y channel_id
    const existingFactura = await FacturaDescartada.findOne({
      clave,
      channel_id
    })

    if (existingFactura) {
      return NextResponse.json(
        { success: false, error: 'Esta factura ya está descartada' },
        { status: 409 }
      )
    }

    // Preparar datos filtrando valores undefined
    const facturaData: any = {
      fecha: new Date(),
      clave,
      xml,
      channel_id
    }

    // Solo agregar campos opcionales si tienen valor
    if (nombre !== undefined && nombre !== null) facturaData.nombre = nombre || ''
    if (tipoDoc !== undefined && tipoDoc !== null) facturaData.tipoDoc = tipoDoc || ''
    if (dia !== undefined && dia !== null) facturaData.dia = dia || ''
    if (mes !== undefined && mes !== null) facturaData.mes = mes || ''
    if (anno !== undefined && anno !== null) facturaData.anno = anno || ''
    if (nombreEmisor !== undefined && nombreEmisor !== null) facturaData.nombreEmisor = nombreEmisor || ''
    if (cedulaEmisor !== undefined && cedulaEmisor !== null) facturaData.cedulaEmisor = cedulaEmisor || ''
    if (nombreReceptor !== undefined && nombreReceptor !== null) facturaData.nombreReceptor = nombreReceptor || ''
    if (cedulaReceptor !== undefined && cedulaReceptor !== null) facturaData.cedulaReceptor = cedulaReceptor || ''
    if (total !== undefined && total !== null) facturaData.total = total || ''
    if (impuesto !== undefined && impuesto !== null) facturaData.impuesto = impuesto || ''

    console.log('Datos finales para Mongoose:', facturaData)

    const nuevaFacturaDescartada = new FacturaDescartada(facturaData)

    await nuevaFacturaDescartada.save()

    return NextResponse.json({
      success: true,
      data: nuevaFacturaDescartada
    }, { status: 201 })
  } catch (error) {
    console.error('Error al crear factura descartada:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
