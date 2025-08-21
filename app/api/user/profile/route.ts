import { NextRequest, NextResponse } from 'next/server'
import User from '@/lib/models/User'
import { withDB, sanitizeInput, isValidObjectId } from '@/lib/dbUtils'

interface UpdateUserRequest {
  userId: string
  ident: string
  type_ident: string
  first_name: string
  last_name: string
  email: string
  phone: string
  phone_code: string
}

export async function PUT(request: NextRequest) {
  try {
    const body: UpdateUserRequest = await request.json()
    const sanitizedData = sanitizeInput(body)
    
    const { userId, ident, type_ident, first_name, last_name, email, phone, phone_code } = sanitizedData

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

    // Validaciones básicas
    const errors: Record<string, string> = {}

    if (!first_name?.trim()) {
      errors.first_name = 'El nombre es requerido'
    }

    if (!last_name?.trim()) {
      errors.last_name = 'Los apellidos son requeridos'
    }

    if (!ident?.trim()) {
      errors.ident = 'La identificación es requerida'
    }

    if (!email?.trim()) {
      errors.email = 'El email es requerido'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        errors.email = 'Formato de email inválido'
      }
    }

    if (!phone?.trim()) {
      errors.phone = 'El teléfono es requerido'
    }

    if (!phone_code?.trim()) {
      errors.phone_code = 'El código de teléfono es requerido'
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Datos inválidos',
          errors 
        },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      // Verificar que el usuario existe
      const existingUser = await User.findById(userId)
      if (!existingUser) {
        throw new Error('Usuario no encontrado')
      }

      // Verificar si email ya existe en otro usuario
      if (email !== existingUser.email) {
        const emailExists = await User.findOne({ 
          email: email.toLowerCase(),
          _id: { $ne: userId }
        })
        if (emailExists) {
          throw new Error('EMAIL_EXISTS')
        }
      }

      // Verificar si identificación ya existe en otro usuario
      if (ident !== existingUser.ident) {
        const identExists = await User.findOne({ 
          ident: ident,
          _id: { $ne: userId }
        })
        if (identExists) {
          throw new Error('IDENT_EXISTS')
        }
      }

      // Actualizar usuario
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          ident: ident.trim(),
          type_ident: type_ident,
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          phone_code: phone_code.trim()
        },
        { 
          new: true,
          runValidators: true
        }
      ).select('-password')

      if (!updatedUser) {
        throw new Error('Error actualizando usuario')
      }

      return {
        user: {
          _id: updatedUser._id,
          ident: updatedUser.ident,
          type_ident: updatedUser.type_ident,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          phone_code: updatedUser.phone_code,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
          name: `${updatedUser.first_name} ${updatedUser.last_name}`.trim()
        }
      }
    })

    if (!result.success) {
      const error = result.error
      
      if (error === 'EMAIL_EXISTS') {
        return NextResponse.json(
          { 
            success: false,
            message: 'El email ya está en uso',
            errors: { email: 'Este email ya está registrado por otro usuario' }
          },
          { status: 400 }
        )
      }

      if (error === 'IDENT_EXISTS') {
        return NextResponse.json(
          { 
            success: false,
            message: 'La identificación ya está en uso',
            errors: { ident: 'Esta identificación ya está registrada por otro usuario' }
          },
          { status: 400 }
        )
      }

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
      message: 'Usuario actualizado exitosamente',
      user: result.data?.user || null
    })

  } catch (error: any) {
    console.error('Error en user profile API:', error)
    
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
        'Access-Control-Allow-Methods': 'PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    }
  )
} 