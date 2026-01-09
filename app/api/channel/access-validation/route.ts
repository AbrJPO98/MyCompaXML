import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import Channel from '@/lib/models/Channel'
import UserChannel from '@/lib/models/UserChannels'
import User from '@/lib/models/User'
import Roles, { ROLE_PERMISSION_NAMES } from '@/lib/models/Roles'
import { withDB, sanitizeInput, isValidObjectId } from '@/lib/dbUtils'

interface AccessValidationRequest {
  userId: string
  channelCode: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AccessValidationRequest = await request.json()
    const sanitizedData = sanitizeInput(body)
    
    const { userId, channelCode, checkPerm, perm } = sanitizedData

    // Validar que se proporcionen ambos parámetros
    if (!userId || !channelCode || !perm) {
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

      const channelObjectId = new mongoose.Types.ObjectId(String(channel._id))

      // Verificar si el usuario tiene acceso a este canal e incluir todos los campos
      const userChannelAccess = await UserChannel.findOne({
        user: userId,
        channel: channelObjectId as any
      })

      if (!userChannelAccess) {
        throw new Error('No tienes acceso a este canal')
      }

      const copyUserChannelAccess = userChannelAccess.toObject()
      
      if (!copyUserChannelAccess.isActive) {
        throw new Error('Tu solicitud de acceso a este canal está inactiva o no ha sido aprobada')
      }

      if (checkPerm) {
        if (!copyUserChannelAccess.role?._id) {
          throw new Error('No tienes un rol asignado en este canal')
        }

        const role = await Roles.findById(copyUserChannelAccess.role?._id)

        // roles es un array de objetos cuyos elementos son { nombre: string }
        if (!role?.permisos.some((p: any) => p.nombre === perm)) {
          throw new Error('No tienes permisos para esta acción')
        }
      }

      // Lazy seed / migración: si no hay rol asignado, crear roles por defecto y asignar
      const raw = await UserChannel.collection.findOne(
        { _id: new mongoose.Types.ObjectId(String(userChannelAccess._id)) } as any,
        { projection: { role: 1, is_admin: 1, channel: 1 } as any }
      )

      if (!raw?.role) {
        // Crear roles por defecto si no existen
        let adminRole = await Roles.findOne({ channel_id: channelObjectId as any, nombre: 'Administrador' })
        let memberRole = await Roles.findOne({ channel_id: channelObjectId as any, nombre: 'Miembro' })

        if (!adminRole || !memberRole) {
          const existing = await Roles.find({ channel_id: channelObjectId as any }).lean()
          if (existing.length === 0) {
            await Roles.create([
              {
                nombre: 'Administrador',
                channel_id: channelObjectId as any,
                deletable: true,
                permisos: ROLE_PERMISSION_NAMES.map((n) => ({ nombre: n }))
              },
              {
                nombre: 'Miembro',
                channel_id: channelObjectId as any,
                deletable: true,
                permisos: []
              }
            ])
          }
          adminRole = await Roles.findOne({ channel_id: channelObjectId as any, nombre: 'Administrador' })
          memberRole = await Roles.findOne({ channel_id: channelObjectId as any, nombre: 'Miembro' })
        }

        const legacyIsAdmin = Boolean((raw as any)?.is_admin)
        const roleToAssign = legacyIsAdmin ? adminRole : memberRole
        if (roleToAssign?._id) {
          await UserChannel.findByIdAndUpdate(userChannelAccess._id, { $set: { role: roleToAssign._id } })
          ;(userChannelAccess as any).role = roleToAssign._id
        }
      }

      await userChannelAccess.populate('role', 'nombre permisos channel_id')

      const roleObj: any = (userChannelAccess as any).role
      const permisos: string[] = Array.isArray(roleObj?.permisos) ? roleObj.permisos.map((p: any) => p?.nombre).filter(Boolean) : []
      const isAdminByRole = permisos.includes('Usuarios') || permisos.includes('Roles') || permisos.includes('Canal')

      // Retornar información del canal y acceso del usuario
      return {
        hasAccess: true,
        isAdmin: isAdminByRole,
        permisos: permisos,
        channel: {
          _id: channel._id,
          code: channel.code,
          name: channel.name,
          ident: channel.ident,
          ident_type: channel.ident_type,
          phone: channel.phone,
          phone_code: channel.phone_code,
          registro_fiscal_IVA: channel.registro_fiscal_IVA,
          email: channel.email,
          commercial_name: channel.commercial_name,
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