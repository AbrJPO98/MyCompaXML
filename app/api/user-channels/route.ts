import { NextRequest, NextResponse } from 'next/server'
import UserChannel from '@/lib/models/UserChannels'
import Channel from '@/lib/models/Channel'
import User from '@/lib/models/User'
import Actividad from '@/lib/models/Actividad'
import Sucursal from '@/lib/models/Sucursal'
import Caja from '@/lib/models/Caja'
import { withDB, sanitizeInput, isValidObjectId } from '@/lib/dbUtils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const channelId = searchParams.get('channelId')
    const isActive = searchParams.get('isActive')

    // Validar que se proporcione al menos uno de los parámetros
    if (!userId && !channelId) {
      return NextResponse.json(
        { 
          success: false,
          message: 'ID de usuario o ID de canal es requerido' 
        },
        { status: 400 }
      )
    }

    // Validar formato de los IDs si se proporcionan
    if (userId && !isValidObjectId(userId)) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Formato de ID de usuario inválido' 
        },
        { status: 400 }
      )
    }

    if (channelId && !isValidObjectId(channelId)) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Formato de ID de canal inválido' 
        },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      // Construir query según los parámetros proporcionados
      let query: any = {}
      if (userId) query.user = userId
      if (channelId) query.channel = channelId
      if (isActive !== null) query.isActive = isActive === 'true'

      // Buscar user-channels según los criterios
      const userChannels = await UserChannel.find(query)
        .populate('channel', 'code name ident ident_type phone phone_code registro_fiscal_IVA email commercial_name isActive createdAt')
        .populate('user', 'first_name last_name email ident type_ident phone phone_code')
        .populate('act_eco', 'codigo nombre_personal')
        .populate('sucursal', 'codigo nombre')
        .populate('caja', 'numero')
        .sort({ createdAt: -1 })

      // Transformar los datos para la respuesta
      const channelsData = userChannels.map(userChannel => ({
        _id: userChannel._id,
        user: userChannel.user,
        channel: userChannel.channel,
        is_admin: userChannel.is_admin,
        isActive: userChannel.isActive,
        createdAt: userChannel.createdAt,
        updatedAt: userChannel.updatedAt,
        // Campos de posición
        act_eco: userChannel.act_eco,
        sucursal: userChannel.sucursal,
        caja: userChannel.caja,
        // Información del canal (si existe)
        channelInfo: userChannel.channel ? {
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
        } : null,
        // Información del usuario (si existe)
        userInfo: userChannel.user ? {
          _id: (userChannel.user as any)?._id,
          name: `${(userChannel.user as any)?.first_name || ''} ${(userChannel.user as any)?.last_name || ''}`.trim(),
          email: (userChannel.user as any)?.email,
          ident: (userChannel.user as any)?.ident,
          type_ident: (userChannel.user as any)?.type_ident,
          phone: (userChannel.user as any)?.phone,
          phone_code: (userChannel.user as any)?.phone_code
        } : null,
        // Información de posición (si existe)
        positionInfo: {
          actividad: userChannel.act_eco ? {
            _id: (userChannel.act_eco as any)?._id,
            codigo: (userChannel.act_eco as any)?.codigo,
            nombre: (userChannel.act_eco as any)?.nombre_personal
          } : null,
          sucursal: userChannel.sucursal ? {
            _id: (userChannel.sucursal as any)?._id,
            codigo: (userChannel.sucursal as any)?.codigo,
            nombre: (userChannel.sucursal as any)?.nombre
          } : null,
          caja: userChannel.caja ? {
            _id: (userChannel.caja as any)?._id,
            numero: (userChannel.caja as any)?.numero
          } : null
        }
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
      data: result.data || [],
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

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userChannelId = searchParams.get('id')
    const body = await request.json()

    // Validar que se proporcione userChannelId
    if (!userChannelId) {
      return NextResponse.json(
        { 
          success: false,
          message: 'ID de user-channel es requerido' 
        },
        { status: 400 }
      )
    }

    // Validar formato del userChannelId
    if (!isValidObjectId(userChannelId)) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Formato de ID de user-channel inválido' 
        },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      // Actualizar el user-channel
      const updatedUserChannel = await UserChannel.findByIdAndUpdate(
        userChannelId,
        { $set: body },
        { new: true }
      )
      
      if (!updatedUserChannel) {
        throw new Error('User-channel no encontrado')
      }

      return updatedUserChannel
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
      message: 'User-channel actualizado exitosamente',
      data: result.data
    })

  } catch (error: any) {
    console.error('Error en user-channels PUT API:', error)
    
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userChannelId = searchParams.get('id')

    // Validar que se proporcione userChannelId
    if (!userChannelId) {
      return NextResponse.json(
        { 
          success: false,
          message: 'ID de user-channel es requerido' 
        },
        { status: 400 }
      )
    }

    // Validar formato del userChannelId
    if (!isValidObjectId(userChannelId)) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Formato de ID de user-channel inválido' 
        },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      // Buscar y eliminar el user-channel
      const deletedUserChannel = await UserChannel.findByIdAndDelete(userChannelId)
      
      if (!deletedUserChannel) {
        throw new Error('User-channel no encontrado')
      }

      return { deleted: true, id: userChannelId }
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
      message: 'Miembro eliminado del canal exitosamente',
      data: result.data
    })

  } catch (error: any) {
    console.error('Error en user-channels DELETE API:', error)
    
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
        'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    }
  )
} 