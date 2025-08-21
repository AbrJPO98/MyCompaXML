import { NextRequest, NextResponse } from 'next/server'
import User from '@/lib/models/User'
import { withDB, sanitizeInput } from '@/lib/dbUtils'
import bcrypt from 'bcryptjs'

interface LoginRequest {
  email: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { email, password } = sanitizeInput(body)

    // Validar datos de entrada
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Email y contraseña son requeridos' 
        },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Formato de email inválido' 
        },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      // Buscar usuario por email (incluyendo la contraseña para comparar)
      const user = await User.findOne({ 
        email: email.toLowerCase() 
      })
      .select('+password') // Incluir contraseña en la consulta

      if (!user) {
        throw new Error('Usuario no encontrado')
      }

      // Verificar si el usuario está activo
      if (user.isActive !== undefined && !user.isActive) {
        throw new Error('Cuenta desactivada. Contacta al administrador.')
      }

      // Verificar contraseña
      if (!user.password) {
        throw new Error('Usuario sin contraseña configurada')
      }

      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        throw new Error('Contraseña incorrecta')
      }

      // Retornar datos del usuario sin la contraseña
      const userResponse = {
        _id: user._id,
        ident: user.ident,
        type_ident: user.type_ident,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        phone_code: user.phone_code,
        // Campos adicionales para compatibilidad
        role: user.role || 'user',
        isActive: user.isActive !== undefined ? user.isActive : true,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // Campo virtual para compatibilidad
        name: `${user.first_name} ${user.last_name}`.trim()
      }

      return userResponse
    })

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          message: result.error === 'Usuario no encontrado' ? 'Email o contraseña incorrectos' : result.error
        },
        { status: 401 }
      )
    }

    // Login exitoso
    return NextResponse.json({
      success: true,
      message: 'Login exitoso',
      user: result.data
    })

  } catch (error: any) {
    console.error('Error en login:', error)
    
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    }
  )
} 