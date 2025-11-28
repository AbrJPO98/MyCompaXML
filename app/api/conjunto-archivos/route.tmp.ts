import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ConjuntoArchivos from '@/lib/models/ConjuntoArchivos'
import { isValidObjectId } from '@/lib/dbUtils'

// GET - Obtener conjuntos de archivos por channel_id
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

    const conjuntos = await ConjuntoArchivos.find({ channel_id: channelId })
      .select('nombre fecha archivos channel_id createdAt')
      .sort({ fecha: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      data: conjuntos
    })
  } catch (error) {
    console.error('Error al obtener conjuntos de archivos:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo conjunto de archivos
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    console.log('Datos recibidos en API conjunto-archivos:', body)
    
    const { nombre, archivos, channel_id } = body

    // Validaciones
    if (!nombre || !archivos || !channel_id) {
      return NextResponse.json(
        { success: false, error: 'Los campos nombre, archivos y channel_id son requeridos' },
        { status: 400 }
      )
    }

    if (!isValidObjectId(channel_id)) {
      return NextResponse.json(
        { success: false, error: 'channel_id inválido' },
        { status: 400 }
      )
    }

    if (!Array.isArray(archivos) || archivos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Debe incluir al menos un archivo' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un conjunto con el mismo nombre y channel_id
    const existingConjunto = await ConjuntoArchivos.findOne({
      nombre,
      channel_id
    })

    if (existingConjunto) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un conjunto con este nombre' },
        { status: 409 }
      )
    }

    const nuevoConjunto = new ConjuntoArchivos({
      nombre,
      fecha: new Date(),
      archivos,
      channel_id
    })

    await nuevoConjunto.save()

    return NextResponse.json({
      success: true,
      data: nuevoConjunto
    }, { status: 201 })
  } catch (error) {
    console.error('Error al crear conjunto de archivos:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
