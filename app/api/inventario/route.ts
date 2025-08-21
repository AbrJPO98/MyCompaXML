import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import Inventario from '@/lib/models/Inventario'
import { withDB, sanitizeInput, isValidObjectId } from '@/lib/dbUtils'

// GET /api/inventario - Obtener inventario por channel_id
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const channelId = searchParams.get('channelId')

  if (!channelId) {
    return NextResponse.json(
      { error: 'channelId es requerido' },
      { status: 400 }
    )
  }

  if (!isValidObjectId(channelId)) {
    return NextResponse.json(
      { error: 'channelId inválido' },
      { status: 400 }
    )
  }

  const result = await withDB(async () => {
    const inventario = await Inventario.find({
      channel_id: new mongoose.Types.ObjectId(channelId)
    }).sort({ createdAt: -1 })

    return inventario.map(item => item.toObject())
  })

  if (!result.success) {
    return NextResponse.json(
      { 
        error: result.error,
        message: 'Error al obtener inventario'
      },
      { status: 500 }
    )
  }

  return NextResponse.json(result.data)
}

// POST /api/inventario - Crear nuevo artículo de inventario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sanitizedData = sanitizeInput(body)
    
    const { 
      cabys, 
      descripcion, 
      tipo, 
      precio, 
      cantidad, 
      channel_id 
    } = sanitizedData

    // Validaciones básicas
    if (!cabys || !descripcion || !tipo || precio === undefined || cantidad === undefined || !channel_id) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    if (!isValidObjectId(channel_id)) {
      return NextResponse.json(
        { error: 'ID de canal inválido' },
        { status: 400 }
      )
    }

    // Validar que precio y cantidad sean números válidos
    const precioNum = parseFloat(precio)
    const cantidadNum = parseInt(cantidad)

    if (isNaN(precioNum) || precioNum < 0) {
      return NextResponse.json(
        { error: 'El precio debe ser un número válido mayor o igual a 0' },
        { status: 400 }
      )
    }

    if (isNaN(cantidadNum) || cantidadNum < 0) {
      return NextResponse.json(
        { error: 'La cantidad debe ser un número entero válido mayor o igual a 0' },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      // Crear nuevo artículo de inventario
      const newInventario = new Inventario({
        cabys,
        descripcion,
        tipo,
        precio: precioNum,
        cantidad: cantidadNum,
        channel_id: new mongoose.Types.ObjectId(channel_id)
      })

      const savedInventario = await newInventario.save()
      return savedInventario.toObject()
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Artículo de inventario creado exitosamente',
      inventario: result.data
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating inventario:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error.message 
      },
      { status: 500 }
    )
  }
}