import { NextRequest, NextResponse } from 'next/server'
import Channel from '@/lib/models/Channel'
import { withDB, sanitizeInput } from '@/lib/dbUtils'
import mongoose from 'mongoose'

// GET - Obtener un channel por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Validar formato de ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'ID de channel inválido' },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      const channel = await Channel.findById(id)
      
      if (!channel) {
        throw new Error('Channel no encontrado')
      }

      return channel.getPublicProfile()
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error: any) {
    console.error('Error en GET /api/channels/[id]:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un channel por ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const updateData = sanitizeInput(body)

    // Validar formato de ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'ID de channel inválido' },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      // Verificar si el channel existe
      const existingChannel = await Channel.findById(id)
      if (!existingChannel) {
        throw new Error('Channel no encontrado')
      }

      // Si se está actualizando el código, verificar que no exista otro con el mismo código
      if (updateData.code && updateData.code !== existingChannel.code) {
        const codeExists = await Channel.findOne({ 
          code: updateData.code.toUpperCase(),
          _id: { $ne: id }
        })
        if (codeExists) {
          throw new Error('Ya existe un channel con este código')
        }
      }

      // Si se está actualizando la identificación, verificar que no exista otra igual
      if ((updateData.ident || updateData.ident_type) && 
          (updateData.ident !== existingChannel.ident || updateData.ident_type !== existingChannel.ident_type)) {
        const identExists = await Channel.findOne({ 
          ident: updateData.ident || existingChannel.ident,
          ident_type: updateData.ident_type || existingChannel.ident_type,
          _id: { $ne: id }
        })
        if (identExists) {
          throw new Error('Ya existe un channel con esta identificación')
        }
      }

      // Actualizar channel
      const updatedChannel = await Channel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )

      return updatedChannel?.getPublicProfile()
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Channel actualizado exitosamente',
      data: result.data
    })

  } catch (error: any) {
    console.error('Error en PUT /api/channels/[id]:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un channel por ID (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Validar formato de ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'ID de channel inválido' },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      // Verificar si el channel existe
      const existingChannel = await Channel.findById(id)
      if (!existingChannel) {
        throw new Error('Channel no encontrado')
      }

      // Soft delete - marcar como inactivo
      const updatedChannel = await Channel.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      )

      return updatedChannel?.getPublicProfile()
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Channel eliminado exitosamente',
      data: result.data
    })

  } catch (error: any) {
    console.error('Error en DELETE /api/channels/[id]:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
} 