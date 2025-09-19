import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const {
      first_name,
      last_name,
      type_ident,
      ident,
      email,
      phone_code,
      phone,
      password,
      isActive = false // Importante: por defecto false para nuevos registros
    } = await request.json()

    // Validar campos requeridos
    const requiredFields = {
      first_name: 'El primer nombre es requerido',
      last_name: 'Los apellidos son requeridos',
      type_ident: 'El tipo de identificación es requerido',
      ident: 'La identificación es requerida',
      email: 'El email es requerido',
      phone_code: 'El código de teléfono es requerido',
      phone: 'El teléfono es requerido',
      password: 'La contraseña es requerida'
    }

    const errors: Record<string, string> = {}

    // Verificar campos requeridos
    const requestData = {
      first_name,
      last_name,
      type_ident,
      ident,
      email,
      phone_code,
      phone,
      password
    }

    Object.entries(requiredFields).forEach(([field, message]) => {
      const value = (requestData as any)[field]
      if (!value || (typeof value === 'string' && !value.trim())) {
        errors[field] = message
      }
    })

    // Validaciones específicas
    if (first_name && first_name.length > 50) {
      errors.first_name = 'El nombre no puede exceder 50 caracteres'
    }

    if (last_name && last_name.length > 100) {
      errors.last_name = 'Los apellidos no pueden exceder 100 caracteres'
    }

    if (email) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
      if (!emailRegex.test(email)) {
        errors.email = 'Por favor ingresa un email válido'
      }
    }

    if (password && password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    if (!['01', '02', '03', '04', '##'].includes(type_ident)) {
      errors.type_ident = 'Tipo de identificación inválido'
    }

    // Si hay errores de validación, devolverlos
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error de validación', 
          errors 
        },
        { status: 400 }
      )
    }

    // Verificar si el email ya existe
    const existingUserByEmail = await User.findOne({ 
      email: email.toLowerCase().trim() 
    })

    if (existingUserByEmail) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'El email ya está registrado',
          errors: { email: 'Este email ya está en uso' }
        },
        { status: 400 }
      )
    }

    // Verificar si la identificación ya existe
    const existingUserByIdent = await User.findOne({ 
      ident: ident.trim(),
      type_ident: type_ident
    })

    if (existingUserByIdent) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'La identificación ya está registrada',
          errors: { ident: 'Esta identificación ya está en uso' }
        },
        { status: 400 }
      )
    }

    // Crear nuevo usuario
    const newUser = new User({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      type_ident: type_ident,
      ident: ident.trim(),
      email: email.toLowerCase().trim(),
      phone_code: phone_code.replace('+', ''), // Remover el símbolo + si está presente
      phone: phone.trim(),
      password: password, // Se hasheará automáticamente por el middleware pre-save
      role: 'user',
      isActive: false // Importante: establecer como false para nuevos registros
    })

    // Guardar usuario (la contraseña se hasheará automáticamente)
    await newUser.save()

    // Devolver respuesta exitosa (sin incluir la contraseña)
    const userResponse = {
      _id: newUser._id,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      email: newUser.email,
      phone: newUser.phone,
      phone_code: newUser.phone_code,
      type_ident: newUser.type_ident,
      ident: newUser.ident,
      role: newUser.role,
      isActive: newUser.isActive
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario registrado exitosamente. Cuenta pendiente de activación.',
      user: userResponse
    })

  } catch (error: any) {
    console.error('Error en registro de usuario:', error)

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
      const field = Object.keys(error.keyValue)[0]
      const fieldNames: Record<string, string> = {
        email: 'email',
        ident: 'ident'
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos duplicados',
          errors: { 
            [fieldNames[field] || field]: `Este ${field} ya está en uso` 
          }
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}
