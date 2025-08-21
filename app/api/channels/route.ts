import { NextRequest, NextResponse } from 'next/server'
import Channel from '@/lib/models/Channel'
import { withDB, sanitizeInput } from '@/lib/dbUtils'

// GET - Obtener todos los channels
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')

    const result = await withDB(async () => {
      // Construir filtro de búsqueda
      let filter: any = {}
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { ident: { $regex: search, $options: 'i' } }
        ]
      }

      if (isActive !== null && isActive !== undefined) {
        filter.isActive = isActive === 'true'
      }

      // Calcular skip para paginación
      const skip = (page - 1) * limit

      // Ejecutar consulta con paginación
      const [channels, total] = await Promise.all([
        Channel.find(filter)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        Channel.countDocuments(filter)
      ])

      return {
        channels,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error: any) {
    console.error('Error en GET /api/channels:', error)
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

// POST - Crear un nuevo channel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const channelData = sanitizeInput(body)

    // Validaciones básicas
    const requiredFields = ['code', 'name', 'ident', 'ident_type', 'phone', 'phone_code', 'registro_fiscal_IVA']
    for (const field of requiredFields) {
      if (!channelData[field]) {
        return NextResponse.json(
          { 
            success: false, 
            message: `El campo ${field} es requerido` 
          },
          { status: 400 }
        )
      }
    }

    const result = await withDB(async () => {
      // Verificar si ya existe un channel con el mismo código
      const existingChannel = await Channel.findOne({ 
        code: channelData.code.toUpperCase() 
      })
      
      if (existingChannel) {
        throw new Error('Ya existe un channel con este código')
      }

      // Verificar si ya existe un channel con la misma identificación
      const existingIdent = await Channel.findOne({ 
        ident: channelData.ident,
        ident_type: channelData.ident_type 
      })
      
      if (existingIdent) {
        throw new Error('Ya existe un channel con esta identificación')
      }

      // Crear nuevo channel
      const newChannel = new Channel(channelData)
      await newChannel.save()

      return newChannel.getPublicProfile()
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Channel creado exitosamente',
      data: result.data
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error en POST /api/channels:', error)
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