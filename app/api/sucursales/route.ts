import { NextRequest, NextResponse } from 'next/server'
import Sucursal from '@/lib/models/Sucursal'
import { withDB, sanitizeInput, isValidObjectId } from '@/lib/dbUtils'
import mongoose from 'mongoose'

// GET /api/sucursales - Obtener sucursales de una actividad o por código
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const activityId = searchParams.get('activityId')
  const codigo = searchParams.get('codigo')
  const channelId = searchParams.get('channelId')

  // Si se busca por código
  if (codigo && channelId) {
    if (!isValidObjectId(channelId)) {
      return NextResponse.json(
        { 
          error: 'channelId inválido',
          message: 'El ID del canal no tiene un formato válido'
        },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      const sucursales = await Sucursal.find({ 
        codigo: codigo,
        activity_id: { $exists: true } // Asegurar que pertenezca a alguna actividad del canal
      })
      .populate({
        path: 'activity_id',
        match: { channel_id: new mongoose.Types.ObjectId(channelId) }
      })
      .lean()

      // Filtrar sucursales que realmente pertenecen al canal
      const filtered = sucursales.filter(s => s.activity_id !== null)
      return filtered
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ sucursales: result.data })
  }

  // Validación de activityId para búsqueda normal
  if (!activityId) {
    return NextResponse.json(
      { 
        error: 'activityId o codigo+channelId son requeridos',
        message: 'Debe proporcionar el ID de la actividad o código con channelId'
      },
      { status: 400 }
    )
  }

  if (!isValidObjectId(activityId)) {
    return NextResponse.json(
      { 
        error: 'activityId inválido',
        message: 'El ID de la actividad no tiene un formato válido'
      },
      { status: 400 }
    )
  }

  const result = await withDB(async () => {
    // Obtener sucursales de la actividad específica
    const sucursales = await Sucursal.find({ 
      activity_id: new mongoose.Types.ObjectId(activityId) 
    })
    .sort({ codigo: 1 })
    .lean()

    return { sucursales }
  })

  if (!result.success) {
    return NextResponse.json(
      { 
        error: result.error,
        message: 'Error al obtener sucursales'
      },
      { status: 500 }
    )
  }

  return NextResponse.json(result.data)
}

// POST /api/sucursales - Crear nueva sucursal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sanitizedData = sanitizeInput(body)
    
    const { 
      codigo, 
      nombre, 
      provincia, 
      canton, 
      distrito, 
      direccion, 
      activity_id 
    } = sanitizedData

    // Validaciones básicas
    if (!codigo || !nombre || !provincia || !canton || !distrito || !direccion || !activity_id) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    if (!isValidObjectId(activity_id)) {
      return NextResponse.json(
        { error: 'ID de actividad inválido' },
        { status: 400 }
      )
    }

    // Validar formato del código (3 dígitos numéricos)
    if (!/^\d{3}$/.test(codigo)) {
      return NextResponse.json(
        { error: 'El código debe ser exactamente 3 dígitos numéricos' },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      // Verificar que no exista una sucursal con el mismo código para esta actividad
      const existingSucursal = await Sucursal.findOne({
        codigo: codigo,
        activity_id: new mongoose.Types.ObjectId(activity_id)
      })

      if (existingSucursal) {
        throw new Error('Ya existe una sucursal con este código para esta actividad')
      }

      // Crear nueva sucursal
      const newSucursal = new Sucursal({
        codigo,
        nombre,
        provincia,
        canton,
        distrito,
        direccion,
        activity_id: new mongoose.Types.ObjectId(activity_id)
      })

      const savedSucursal = await newSucursal.save()
      return savedSucursal.toObject()
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Sucursal creada exitosamente',
      sucursal: result.data
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating sucursal:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error.message 
      },
      { status: 500 }
    )
  }
}