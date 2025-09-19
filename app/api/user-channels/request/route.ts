import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import UserChannel from '@/lib/models/UserChannels'
import User from '@/lib/models/User'
import Channel from '@/lib/models/Channel'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { userId, channelId, is_admin = false, isActive = false } = await request.json()

    // Validar campos requeridos
    if (!userId || !channelId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID de usuario y canal son requeridos' 
        },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Usuario no encontrado' 
        },
        { status: 404 }
      )
    }

    // Verificar que el canal existe
    const channel = await Channel.findById(channelId)
    if (!channel) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Canal no encontrado' 
        },
        { status: 404 }
      )
    }

    // Verificar si ya existe una relación entre el usuario y el canal
    const existingUserChannel = await UserChannel.findOne({
      user: userId,
      channel: channelId
    })

    if (existingUserChannel) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ya existe una solicitud para este canal',
          message: 'El usuario ya tiene una relación con este canal'
        },
        { status: 409 }
      )
    }

    // Crear nueva relación usuario-canal
    console.log('Creating UserChannel with:', {
      user: userId,
      channel: channelId,
      is_admin: is_admin,
      isActive: isActive
    })

    const newUserChannel = new UserChannel({
      user: userId,
      channel: channelId,
      is_admin: is_admin,
      isActive: isActive // false por defecto (pendiente de aprobación)
    })

    console.log('UserChannel before save:', newUserChannel.toObject())
    
    await newUserChannel.save()
    
    console.log('UserChannel after save:', newUserChannel.toObject())

    // Poblar los datos para la respuesta
    const populatedUserChannel = await UserChannel.findById(newUserChannel._id)
      .select('user channel is_admin isActive createdAt updatedAt')
      .populate('user', 'first_name last_name email')
      .populate('channel', 'name code ident')
      .lean()
      
    console.log('Populated UserChannel:', populatedUserChannel)

    return NextResponse.json({
      success: true,
      message: 'Solicitud de acceso creada exitosamente',
      userChannel: populatedUserChannel
    })

  } catch (error: any) {
    console.error('Error creando solicitud de acceso:', error)
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const validationErrors: Record<string, string> = {}
      
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message
      })

      return NextResponse.json(
        { 
          success: false, 
          error: 'Error de validación',
          errors: validationErrors 
        },
        { status: 400 }
      )
    }

    // Manejar errores de duplicación de MongoDB
    if (error.code === 11000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ya existe una solicitud para este canal'
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: 'No se pudo crear la solicitud de acceso'
      },
      { status: 500 }
    )
  }
}
