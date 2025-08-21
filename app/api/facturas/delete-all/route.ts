import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Factura from '@/lib/models/Factura'
import { isValidObjectId } from '@/lib/dbUtils'

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { channelId } = body

    if (!channelId) {
      return NextResponse.json({ 
        success: false, 
        message: 'channelId es requerido' 
      }, { status: 400 })
    }

    if (!isValidObjectId(channelId)) {
      return NextResponse.json({ 
        success: false, 
        message: 'channelId inválido' 
      }, { status: 400 })
    }

    await connectDB()

    // Eliminar todas las facturas del canal especificado
    const deleteResult = await Factura.deleteMany({
      channel_id: channelId
    })

    return NextResponse.json({
      success: true,
      message: 'Facturas eliminadas exitosamente',
      deletedCount: deleteResult.deletedCount
    })

  } catch (error) {
    console.error('Error deleting all facturas:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
