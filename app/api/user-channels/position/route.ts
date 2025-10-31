import { NextRequest, NextResponse } from 'next/server'
import UserChannel from '@/lib/models/UserChannels'
import { withDB, sanitizeInput } from '@/lib/dbUtils'

interface UpdatePositionRequest {
  channelId: string
  userId: string
  act_eco: string
  sucursal: string
  caja: string
}

export async function PUT(request: NextRequest) {
  try {
    const body: UpdatePositionRequest = await request.json()
    const { channelId, userId, act_eco, sucursal, caja } = sanitizeInput(body)

    // Validar datos de entrada
    if (!channelId || !userId || !act_eco || !sucursal || !caja) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Todos los campos son requeridos' 
        },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      // Buscar y actualizar el registro de Users_channels
      const userChannel = await UserChannel.findOneAndUpdate(
        { 
          channel: channelId,
          user: userId
        },
        {
          act_eco: act_eco,
          sucursal: sucursal,
          caja: caja
        },
        { 
          new: true,
          runValidators: true
        }
      )

      if (!userChannel) {
        throw new Error('No se encontró la relación usuario-canal')
      }

      return userChannel
    })

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          message: result.error || 'Error al actualizar la posición'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Posición actualizada exitosamente',
      data: result.data
    })

  } catch (error: any) {
    console.error('Error en PUT /api/user-channels/position:', error)
    
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
