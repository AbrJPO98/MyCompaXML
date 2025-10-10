import { NextRequest, NextResponse } from 'next/server'
import Cliente, { ICliente } from '@/lib/models/Cliente'
import { withDB, isValidObjectId } from '@/lib/dbUtils'

// GET - Obtener todos los clientes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''

    const result = await withDB(async () => {
      let query: any = {}
      
      // Filtro de búsqueda
      if (search) {
        query = {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { ident: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { name_commercial: { $regex: search, $options: 'i' } }
          ]
        }
      }

      const skip = (page - 1) * limit
      const clientes = await Cliente.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()

      const total = await Cliente.countDocuments(query)

      return {
        clientes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: result.data?.clientes || [],
      pagination: result.data?.pagination || { page: 1, limit: 50, total: 0, pages: 0 }
    })

  } catch (error: any) {
    console.error('Error en clientes GET API:', error)
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

// POST - Crear nuevo cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validaciones básicas
    if (!body.ident || !body.type_ident || !body.name) {
      return NextResponse.json(
        { success: false, message: 'Campos requeridos: ident, type_ident, name' },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      // Verificar si ya existe un cliente con la misma identificación
      const existingCliente = await Cliente.findOne({
        ident: body.ident,
        type_ident: body.type_ident
      })

      if (existingCliente) {
        throw new Error('Ya existe un cliente con esta identificación')
      }

      const cliente = new Cliente(body)
      return await cliente.save()
    })

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cliente creado exitosamente',
      data: result.data || null
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error en clientes POST API:', error)
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

// PUT - Actualizar cliente
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('id')
    const body = await request.json()

    console.log('body', body)

    if (!clienteId) {
      return NextResponse.json(
        { success: false, message: 'ID de cliente es requerido' },
        { status: 400 }
      )
    }

    if (!isValidObjectId(clienteId)) {
      return NextResponse.json(
        { success: false, message: 'Formato de ID de cliente inválido' },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      // Si se está cambiando la identificación, verificar que no exista otra igual
      if (body.ident || body.type_ident) {
        const existingCliente = await Cliente.findOne({
          _id: { $ne: clienteId },
          ident: body.ident || undefined,
          type_ident: body.type_ident || undefined
        })

        if (existingCliente) {
          throw new Error('Ya existe otro cliente con esta identificación')
        }
      }

      const updatedCliente = await Cliente.findByIdAndUpdate(
        clienteId,
        { $set: body },
        { new: true, runValidators: true }
      )

      if (!updatedCliente) {
        throw new Error('Cliente no encontrado')
      }

      return updatedCliente
    })

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cliente actualizado exitosamente',
      data: result.data || null
    })

  } catch (error: any) {
    console.error('Error en clientes PUT API:', error)
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

// DELETE - Eliminar cliente
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('id')

    if (!clienteId) {
      return NextResponse.json(
        { success: false, message: 'ID de cliente es requerido' },
        { status: 400 }
      )
    }

    if (!isValidObjectId(clienteId)) {
      return NextResponse.json(
        { success: false, message: 'Formato de ID de cliente inválido' },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      const deletedCliente = await Cliente.findByIdAndDelete(clienteId)
      
      if (!deletedCliente) {
        throw new Error('Cliente no encontrado')
      }

      return deletedCliente
    })

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cliente eliminado exitosamente'
    })

  } catch (error: any) {
    console.error('Error en clientes DELETE API:', error)
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

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Allow': 'GET, POST, PUT, DELETE, OPTIONS',
    },
  })
}
