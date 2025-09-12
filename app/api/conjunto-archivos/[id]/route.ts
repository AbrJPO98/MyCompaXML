import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ConjuntoArchivos from '@/lib/models/ConjuntoArchivos'
import { isValidObjectId } from '@/lib/dbUtils'

// GET - Obtener conjunto de archivos por ID
export async function GET(
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

    const conjunto = await ConjuntoArchivos.findById(id).lean()

    if (!conjunto) {
      return NextResponse.json(
        { success: false, error: 'Conjunto de archivos no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: conjunto
    })
  } catch (error) {
    console.error('Error al obtener conjunto de archivos:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar conjunto de archivos por ID
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

    const conjunto = await ConjuntoArchivos.findByIdAndDelete(id)

    if (!conjunto) {
      return NextResponse.json(
        { success: false, error: 'Conjunto de archivos no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Conjunto de archivos eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error al eliminar conjunto de archivos:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
