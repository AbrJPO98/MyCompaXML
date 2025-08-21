import { NextRequest, NextResponse } from 'next/server'
import { sanitizeInput, isValidObjectId } from '@/lib/dbUtils'
import connectDB from '@/lib/mongodb'
import Caja from '@/lib/models/Caja'

// GET /api/cajas/[id] - Obtener caja por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const { id } = params

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'ID de caja inválido' },
        { status: 400 }
      )
    }

    const caja = await Caja.findById(id)
    
    if (!caja) {
      return NextResponse.json(
        { error: 'Caja no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ caja })

  } catch (error: any) {
    console.error('Error fetching caja:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/cajas/[id] - Actualizar caja por ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const { id } = params
    const body = await request.json()

      if (!isValidObjectId(id)) {
        return NextResponse.json(
          { error: 'ID de caja inválido' },
          { status: 400 }
        )
      }

      // Verificar que la caja existe
      const cajaExistente = await Caja.findById(id)
      if (!cajaExistente) {
        return NextResponse.json(
          { error: 'Caja no encontrada' },
          { status: 404 }
        )
      }

      // Preparar datos para actualización
      const updateData: any = {}

      // Validar número si se proporciona
      if (body.numero !== undefined) {
        const numero = sanitizeInput(body.numero)
        if (!numero.trim()) {
          return NextResponse.json(
            { error: 'El número de caja no puede estar vacío' },
            { status: 400 }
          )
        }

        // Verificar que no exista otra caja con el mismo número en la misma sucursal
        const cajaConMismoNumero = await Caja.findOne({
          sucursal_id: cajaExistente.sucursal_id,
          numero,
          _id: { $ne: id }
        })

        if (cajaConMismoNumero) {
          return NextResponse.json(
            { error: 'Ya existe otra caja con este número en la sucursal' },
            { status: 400 }
          )
        }

        updateData.numero = numero
      }

      // Validar numeración_facturas si se proporciona
      if (body.numeracion_facturas && typeof body.numeracion_facturas === 'object') {
        const numeracion_facturas = { ...cajaExistente.numeracion_facturas }
        
        for (const [key, value] of Object.entries(body.numeracion_facturas)) {
          if (typeof value === 'string' && /^\d+$/.test(value)) {
            numeracion_facturas[key] = value
          }
        }
        
        updateData.numeracion_facturas = numeracion_facturas
      }

      // Actualizar la caja
      const cajaActualizada = await Caja.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )

    return NextResponse.json({
      message: 'Caja actualizada exitosamente',
      caja: cajaActualizada
    })

  } catch (error: any) {
    console.error('Error updating caja:', error)
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Datos de caja inválidos', details: error.message },
        { status: 400 }
      )
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Ya existe una caja con este número en la sucursal' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/cajas/[id] - Eliminar caja por ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const { id } = params

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'ID de caja inválido' },
        { status: 400 }
      )
    }

    const cajaEliminada = await Caja.findByIdAndDelete(id)
    
    if (!cajaEliminada) {
      return NextResponse.json(
        { error: 'Caja no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Caja eliminada exitosamente'
    })

  } catch (error: any) {
    console.error('Error deleting caja:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}