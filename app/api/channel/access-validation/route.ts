import { NextRequest, NextResponse } from 'next/server'
import Channel from '@/lib/models/Channel'
import UserChannel from '@/lib/models/UserChannels'
import User from '@/lib/models/User'
import { withDB, sanitizeInput, isValidObjectId } from '@/lib/dbUtils'

interface AccessValidationRequest {
  userId: string
  channelCode: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AccessValidationRequest = await request.json()
    const sanitizedData = sanitizeInput(body)
    
    const { userId, channelCode } = sanitizedData

    // Validar que se proporcionen ambos parámetros
    if (!userId || !channelCode) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID de usuario y código de canal son requeridos'
        },
        { status: 400 }
      )
    }

    // Validar formato del userId
    if (!isValidObjectId(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Formato de ID de usuario inválido'
        },
        { status: 400 }
      )
    }

    // Validar que el código del canal no esté vacío
    if (!channelCode.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Código de canal inválido'
        },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      console.log('API: Validating access for user:', userId, 'channel code:', channelCode)
      
      // Verificar que el usuario existe
      const user = await User.findById(userId)
      if (!user) {
        throw new Error('Usuario no encontrado')
      }

      // Buscar el canal por código
      const trimmedChannelCode = channelCode.trim()
      console.log('API: Searching for channel with code:', trimmedChannelCode)
      
      const channel = await Channel.findOne({ code: trimmedChannelCode })
      if (!channel) {
        console.log('API: No channel found with code:', trimmedChannelCode)
        throw new Error(`Canal no encontrado con código: ${trimmedChannelCode}`)
      }
      
      console.log('API: Found channel:', channel._id, channel.name)

      // Verificar si el usuario tiene acceso a este canal
      const userChannelAccess = await UserChannel.findOne({
        user: userId,
        channel: channel._id
      })

      if (!userChannelAccess) {
        throw new Error('No tienes acceso a este canal')
      }

      // Retornar información del canal y acceso del usuario
      return {
        hasAccess: true,
        isAdmin: userChannelAccess.is_admin,
        channel: {
          _id: channel._id,
          code: channel.code,
          name: channel.name,
          ident: channel.ident,
          ident_type: channel.ident_type,
          phone: channel.phone,
          phone_code: channel.phone_code,
          registro_fiscal_IVA: channel.registro_fiscal_IVA,
          isActive: channel.isActive,
          createdAt: channel.createdAt
        }
      }
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          hasAccess: false,
          message: result.error
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      ...result.data
    })

  } catch (error: any) {
    console.error('Error en channel access validation API:', error)

    return NextResponse.json(
      {
        success: false,
        hasAccess: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// Método OPTIONS para CORS (si es necesario)
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    }
  )
}