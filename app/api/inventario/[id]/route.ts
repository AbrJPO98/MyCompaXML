import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import Inventario from '@/lib/models/Inventario'
import { withDB, sanitizeInput, isValidObjectId } from '@/lib/dbUtils'

// GET /api/inventario/[id] - Obtener artículo específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  if (!isValidObjectId(id)) {
    return NextResponse.json(
      { error: 'ID inválido' },
      { status: 400 }
    )
  }

  const result = await withDB(async () => {
    const inventario = await Inventario.findById(id)
    
    if (!inventario) {
      throw new Error('Artículo de inventario no encontrado')
    }

    return inventario.toObject()
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error === 'Artículo de inventario no encontrado' ? 404 : 500 }
    )
  }

  return NextResponse.json(result.data)
}

// PUT /api/inventario/[id] - Actualizar artículo
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  if (!isValidObjectId(id)) {
    return NextResponse.json(
      { error: 'ID inválido' },
      { status: 400 }
    )
  }

  try {
    const body = await request.json()
    const sanitizedData = sanitizeInput(body)
    
    const { 
      cabys, 
      descripcion, 
      tipo, 
      precio, 
      cantidad 
    } = sanitizedData

    // Validaciones básicas
    if (!cabys || !descripcion || !tipo || precio === undefined || cantidad === undefined) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
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
      const updatedInventario = await Inventario.findByIdAndUpdate(
        id,
        {
          cabys,
          descripcion,
          tipo,
          precio: precioNum,
          cantidad: cantidadNum
        },
        { new: true, runValidators: true }
      )

      if (!updatedInventario) {
        throw new Error('Artículo de inventario no encontrado')
      }

      return updatedInventario.toObject()
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Artículo de inventario no encontrado' ? 404 : 400 }
      )
    }

    return NextResponse.json({
      message: 'Artículo actualizado exitosamente',
      inventario: result.data
    })

  } catch (error: any) {
    console.error('Error updating inventario:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/inventario/[id] - Eliminar artículo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  if (!isValidObjectId(id)) {
    return NextResponse.json(
      { error: 'ID inválido' },
      { status: 400 }
    )
  }

  const result = await withDB(async () => {
    const deletedInventario = await Inventario.findByIdAndDelete(id)
    
    if (!deletedInventario) {
      throw new Error('Artículo de inventario no encontrado')
    }

    return { message: 'Artículo eliminado exitosamente' }
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error === 'Artículo de inventario no encontrado' ? 404 : 500 }
    )
  }

  return NextResponse.json(result.data)
}