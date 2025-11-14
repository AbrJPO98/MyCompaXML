import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Factura from '@/lib/models/Factura'
import mongoose from 'mongoose'

/**
 * PUT - Actualizar la categorización de una factura
 */
export async function PUT(request: NextRequest) {
  try {
    const { clave, channelId, categorizacion } = await request.json()

    if (!clave || !channelId || categorizacion === undefined) {
      return NextResponse.json(
        { success: false, message: 'Clave, channelId y categorizacion son requeridos' },
        { status: 400 }
      )
    }

    // Validar que categorizacion sea un array
    if (!Array.isArray(categorizacion)) {
      return NextResponse.json(
        { success: false, message: 'categorizacion debe ser un array' },
        { status: 400 }
      )
    }

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return NextResponse.json(
        { success: false, message: 'channelId inválido' },
        { status: 400 }
      )
    }

    await connectDB()

    const updatedFactura = await Factura.findOneAndUpdate(
      { clave: clave, channel_id: channelId },
      { categorizacion: categorizacion },
      { new: true, runValidators: true }
    )

    if (!updatedFactura) {
      return NextResponse.json(
        { success: false, message: 'Factura no encontrada o no pertenece al canal' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Categorización actualizada exitosamente',
      factura: updatedFactura
    })

  } catch (error: any) {
    console.error('Error en PUT /api/facturas/categorizar:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor', error: error.message },
      { status: 500 }
    )
  }
}

