import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import Factura from '@/lib/models/Factura'
import connectDB from '@/lib/mongodb'

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && id.length === 24
}

// DELETE /api/facturas/[id] - Eliminar factura/mensaje especial por ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    await connectDB()

    const resultado = await Factura.deleteOne({
      _id: new mongoose.Types.ObjectId(id)
    })

    if (resultado.deletedCount === 0) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Registro eliminado exitosamente' })

  } catch (error: any) {
    console.error('Error deleting factura:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
