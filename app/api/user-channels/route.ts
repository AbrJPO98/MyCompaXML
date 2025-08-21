import { NextRequest, NextResponse } from 'next/server'
import UserChannel from '@/lib/models/UserChannels'
import Channel from '@/lib/models/Channel'
import User from '@/lib/models/User'
import { withDB, sanitizeInput, isValidObjectId } from '@/lib/dbUtils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Validar que se proporcione userId
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          message: 'ID de usuario es requerido' 
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

    const result = await withDB(async () => {
      // Buscar todos los canales asociados al usuario
      const userChannels = await UserChannel.find({ user: userId })
        .populate('channel', 'code name ident ident_type phone phone_code registro_fiscal_IVA isActive createdAt')
        .populate('user', 'first_name last_name email')
        .sort({ createdAt: -1 })

      // Transformar los datos para la respuesta
      const channelsData = userChannels.map(userChannel => ({
        _id: userChannel._id,
        user_id: userChannel.user,
        channel_id: userChannel.channel,
        is_admin: userChannel.is_admin,
        createdAt: userChannel.createdAt,
        updatedAt: userChannel.updatedAt,
        // Información del canal
        channel: userChannel.channel ? {
          _id: (userChannel.channel as any)?._id,
          code: (userChannel.channel as any)?.code,
          name: (userChannel.channel as any)?.name,
          ident: (userChannel.channel as any)?.ident,
          ident_type: (userChannel.channel as any)?.ident_type,
          phone: (userChannel.channel as any)?.phone,
          phone_code: (userChannel.channel as any)?.phone_code,
          registro_fiscal_IVA: (userChannel.channel as any)?.registro_fiscal_IVA,
          isActive: (userChannel.channel as any)?.isActive,
          createdAt: (userChannel.channel as any)?.createdAt
        } : null
      }))

      return channelsData
    })

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          message: result.error 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      channels: result.data || [],
      total: result.data?.length || 0
    })

  } catch (error: any) {
    console.error('Error en user-channels API:', error)
    
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

// Método OPTIONS para CORS (si es necesario)
export async function OPTIONS() {
  return NextResponse.json(
    {},
    { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    }
  )
} 