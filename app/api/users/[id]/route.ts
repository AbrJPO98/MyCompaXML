import { NextRequest, NextResponse } from 'next/server'
import User from '@/lib/models/User'
import { withDB, isValidObjectId } from '@/lib/dbUtils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

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
      // Buscar el usuario por ID
      const user = await User.findById(userId)
        .select('first_name last_name email ident type_ident phone phone_code createdAt updatedAt')

      if (!user) {
        throw new Error('Usuario no encontrado')
      }

      return user
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
      user: result.data
    })

  } catch (error: any) {
    console.error('Error en users API:', error)
    
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
