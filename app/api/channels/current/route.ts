import { NextRequest, NextResponse } from 'next/server'
import Channel from '@/lib/models/Channel'
import { withDB, sanitizeInput } from '@/lib/dbUtils'
import mongoose from 'mongoose'

// Función para validar ObjectId
function isValidObjectId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false
  }
  return mongoose.Types.ObjectId.isValid(id) && id.length === 24
}

// GET /api/channels/current - Obtener información del canal actual
export async function GET(request: NextRequest) {
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

  const result = await withDB(async () => {
    const channel = await Channel.findOne({
      _id: new mongoose.Types.ObjectId(channelId),
      isActive: true
    }).lean()

    if (!channel) {
      throw new Error('Canal no encontrado o inactivo')
    }

    return channel
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 404 }
    )
  }

  return NextResponse.json({ channel: result.data })
}

// PUT /api/channels/current - Actualizar información del canal actual
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const sanitizedData = sanitizeInput(body)
    
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

    // Remover campos que no se deben actualizar
    delete sanitizedData._id
    delete sanitizedData.code // El código no se puede editar
    delete sanitizedData.isActive // Solo admin puede cambiar estado
    delete sanitizedData.createdAt
    delete sanitizedData.updatedAt

    const result = await withDB(async () => {
      // Verificar que el canal existe y está activo
      const existingChannel = await Channel.findOne({
        _id: new mongoose.Types.ObjectId(channelId),
        isActive: true
      })

      if (!existingChannel) {
        throw new Error('Canal no encontrado o inactivo')
      }

      // Verificar unicidad de ident si se está cambiando
      if (sanitizedData.ident && sanitizedData.ident !== existingChannel.ident) {
        const duplicateChannel = await Channel.findOne({
          ident: sanitizedData.ident,
          _id: { $ne: channelId }
        })

        if (duplicateChannel) {
          throw new Error('Ya existe otro canal con esta identificación')
        }
      }

      // Actualizar canal
      const updatedChannel = await Channel.findByIdAndUpdate(
        channelId,
        sanitizedData,
        { new: true, runValidators: true }
      ).lean()

      return updatedChannel
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Canal actualizado exitosamente',
      channel: result.data
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 400 }
    )
  }
} 