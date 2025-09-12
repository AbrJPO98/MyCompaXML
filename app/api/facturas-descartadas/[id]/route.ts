import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import FacturaDescartada from '@/lib/models/FacturaDescartada'
import { isValidObjectId } from '@/lib/dbUtils'

// DELETE - Eliminar factura descartada por ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const { id } = params

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      )
    }

    const facturaDescartada = await FacturaDescartada.findByIdAndDelete(id)

    if (!facturaDescartada) {
      return NextResponse.json(
        { success: false, error: 'Factura descartada no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Factura descartada eliminada exitosamente'
    })
  } catch (error) {
    console.error('Error al eliminar factura descartada:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
