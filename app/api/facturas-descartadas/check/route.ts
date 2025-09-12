import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import FacturaDescartada from '@/lib/models/FacturaDescartada'
import { isValidObjectId } from '@/lib/dbUtils'

// POST - Verificar si una o más claves están descartadas
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { claves, channelId } = body

    if (!claves || !Array.isArray(claves) || claves.length === 0) {
      return NextResponse.json(
        { success: false, error: 'claves es requerido y debe ser un array no vacío' },
        { status: 400 }
      )
    }

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

    // Buscar facturas descartadas que coincidan con las claves proporcionadas
    const facturasDescartadas = await FacturaDescartada.find({
      clave: { $in: claves },
      channel_id: channelId
    }).select('clave').lean()

    const clavesDescartadas = facturasDescartadas.map(factura => factura.clave)

    return NextResponse.json({
      success: true,
      data: {
        clavesDescartadas,
        clavesPermitidas: claves.filter(clave => !clavesDescartadas.includes(clave))
      }
    })
  } catch (error) {
    console.error('Error al verificar facturas descartadas:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
