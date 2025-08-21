import { NextRequest, NextResponse } from 'next/server'
import Actividad from '@/lib/models/Actividad'
import { withDB, sanitizeInput } from '@/lib/dbUtils'
import mongoose from 'mongoose'

// Función para validar ObjectId
function isValidObjectId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false
  }
  return mongoose.Types.ObjectId.isValid(id) && id.length === 24
}

// GET /api/actividades/[id] - Obtener actividad por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const channelId = searchParams.get('channelId')

  if (!channelId) {
    return NextResponse.json(
      { error: 'channelId es requerido' },
      { status: 401 }
    )
  }

  if (!isValidObjectId(channelId)) {
    return NextResponse.json(
      { error: 'channelId inválido' },
      { status: 400 }
    )
  }

  if (!isValidObjectId(params.id)) {
    return NextResponse.json(
      { error: 'ID de actividad inválido' },
      { status: 400 }
    )
  }

  const result = await withDB(async () => {
    const actividad = await Actividad.findOne({
      _id: params.id,
      channel_id: new mongoose.Types.ObjectId(channelId) // Solo actividades del mismo canal
    }).lean()

    if (!actividad) {
      throw new Error('Actividad no encontrada')
    }

    return actividad
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 404 }
    )
  }

  return NextResponse.json({ actividad: result.data })
}

// PUT /api/actividades/[id] - Actualizar actividad
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const sanitizedData = sanitizeInput(body)
    
    // Remover campos que no se deben actualizar
    delete sanitizedData._id
    delete sanitizedData.channel_id // No permitir cambio de canal
    delete sanitizedData.nombre_original // No editable
    delete sanitizedData.tipo // No editable
    delete sanitizedData.estado // No editable

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json(
        { error: 'channelId es requerido' },
        { status: 401 }
      )
    }

    if (!isValidObjectId(channelId)) {
      return NextResponse.json(
        { error: 'channelId inválido' },
        { status: 400 }
      )
    }

    if (!isValidObjectId(params.id)) {
      return NextResponse.json(
        { error: 'ID de actividad inválido' },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      // Verificar que la actividad existe y pertenece al canal
      const existingActividad = await Actividad.findOne({
        _id: params.id,
        channel_id: new mongoose.Types.ObjectId(channelId)
      })

      if (!existingActividad) {
        throw new Error('Actividad no encontrada')
      }

      // Verificar unicidad de código (excluyendo la actividad actual)
      if (sanitizedData.codigo) {
        const duplicateActividad = await Actividad.findOne({
          codigo: sanitizedData.codigo,
          channel_id: new mongoose.Types.ObjectId(channelId),
          _id: { $ne: params.id }
        })
        
        if (duplicateActividad) {
          throw new Error('Ya existe otra actividad con este código en el canal')
        }
      }

      // Actualizar actividad
      const updatedActividad = await Actividad.findByIdAndUpdate(
        params.id,
        sanitizedData,
        { new: true, runValidators: true }
      ).lean()

      return updatedActividad
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Actividad actualizada exitosamente',
      actividad: result.data
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 400 }
    )
  }
}

// DELETE /api/actividades/[id] - Eliminar actividad
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const channelId = searchParams.get('channelId')

  if (!channelId) {
    return NextResponse.json(
      { error: 'channelId es requerido' },
      { status: 401 }
    )
  }

  if (!isValidObjectId(channelId)) {
    return NextResponse.json(
      { error: 'channelId inválido' },
      { status: 400 }
    )
  }

  if (!isValidObjectId(params.id)) {
    return NextResponse.json(
      { error: 'ID de actividad inválido' },
      { status: 400 }
    )
  }

  const result = await withDB(async () => {
    // Verificar que la actividad existe y pertenece al canal
    const actividad = await Actividad.findOne({
      _id: params.id,
      channel_id: new mongoose.Types.ObjectId(channelId)
    })

    if (!actividad) {
      throw new Error('Actividad no encontrada')
    }

    // Eliminar actividad
    await Actividad.findByIdAndDelete(params.id)
    
    return { 
      deletedId: params.id,
      deletedActividad: `${actividad.codigo} - ${actividad.nombre_personal}` 
    }
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 404 }
    )
  }

  return NextResponse.json({
    message: 'Actividad eliminada exitosamente',
    data: result.data
  })
} 