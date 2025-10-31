import { NextRequest, NextResponse } from 'next/server'
import UserChannel from '@/lib/models/UserChannels'
import { withDB, sanitizeInput, isValidObjectId } from '@/lib/dbUtils'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')
    const userId = searchParams.get('userId')

    if (!channelId || !userId) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Channel ID y User ID son requeridos' 
        },
        { status: 400 }
      )
    }

    // Validar que los IDs sean ObjectIds válidos
    if (!isValidObjectId(channelId)) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Channel ID no es un ObjectId válido' 
        },
        { status: 400 }
      )
    }

    if (!isValidObjectId(userId)) {
      return NextResponse.json(
        { 
          success: false,
          message: 'User ID no es un ObjectId válido' 
        },
        { status: 400 }
      )
    }

    console.log('Buscando posición para:', { channelId, userId })

    const result = await withDB(async () => {
      const userChannel = await UserChannel.findOne({
        channel: channelId,
        user: userId
      })
      .populate('act_eco', 'codigo nombre_personal')
      .populate('sucursal', 'codigo nombre')
      .populate('caja', 'numero')
      .lean()

      if (!userChannel) {
        throw new Error('No se encontró la relación usuario-canal')
      }

      return {
        act_eco: userChannel.act_eco,
        sucursal: userChannel.sucursal,
        caja: userChannel.caja
      }
    })

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          message: result.error || 'Error al cargar la posición actual'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error: any) {
    console.error('Error en GET /api/user-channels/current-position:', error)
    
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
