import { NextRequest, NextResponse } from 'next/server'
import Sucursal from '@/lib/models/Sucursal'
import { withDB, sanitizeInput, isValidObjectId } from '@/lib/dbUtils'
import mongoose from 'mongoose'

// GET /api/sucursales/[id] - Obtener sucursal por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isValidObjectId(params.id)) {
    return NextResponse.json(
      { error: 'ID de sucursal inválido' },
      { status: 400 }
    )
  }

  const result = await withDB(async () => {
    const sucursal = await Sucursal.findById(params.id).lean()

    if (!sucursal) {
      throw new Error('Sucursal no encontrada')
    }

    return sucursal
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 404 }
    )
  }

  return NextResponse.json({ sucursal: result.data })
}

// PUT /api/sucursales/[id] - Actualizar sucursal
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isValidObjectId(params.id)) {
    return NextResponse.json(
      { error: 'ID de sucursal inválido' },
      { status: 400 }
    )
  }

  try {
    const body = await request.json()
    const sanitizedData = sanitizeInput(body)
    
    const { 
      codigo, 
      nombre, 
      provincia, 
      canton, 
      distrito, 
      direccion 
    } = sanitizedData

    // Validaciones básicas
    if (!codigo || !nombre || !provincia || !canton || !distrito || !direccion) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
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
      // Verificar que la sucursal existe
      const existingSucursal = await Sucursal.findById(params.id)
      if (!existingSucursal) {
        throw new Error('Sucursal no encontrada')
      }

      // Verificar que no exista otra sucursal con el mismo código para la misma actividad
      const duplicateCheck = await Sucursal.findOne({
        codigo: codigo,
        activity_id: existingSucursal.activity_id,
        _id: { $ne: params.id }
      })

      if (duplicateCheck) {
        throw new Error('Ya existe otra sucursal con este código para esta actividad')
      }

      // Actualizar sucursal
      const updatedSucursal = await Sucursal.findByIdAndUpdate(
        params.id,
        {
          codigo,
          nombre,
          provincia,
          canton,
          distrito,
          direccion
        },
        { 
          new: true, 
          runValidators: true 
        }
      ).lean()

      return updatedSucursal
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Sucursal actualizada exitosamente',
      sucursal: result.data
    })

  } catch (error: any) {
    console.error('Error updating sucursal:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/sucursales/[id] - Eliminar sucursal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isValidObjectId(params.id)) {
    return NextResponse.json(
      { error: 'ID de sucursal inválido' },
      { status: 400 }
    )
  }

  const result = await withDB(async () => {
    const deletedSucursal = await Sucursal.findByIdAndDelete(params.id).lean()

    if (!deletedSucursal) {
      throw new Error('Sucursal no encontrada')
    }

    return deletedSucursal
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 404 }
    )
  }

  return NextResponse.json({
    message: 'Sucursal eliminada exitosamente'
  })
}