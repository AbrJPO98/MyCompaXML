import { NextRequest, NextResponse } from 'next/server'
import { sanitizeInput, isValidObjectId } from '@/lib/dbUtils'
import connectDB from '@/lib/mongodb'
import Caja from '@/lib/models/Caja'

// GET /api/cajas - Obtener cajas por sucursal
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const sucursalId = searchParams.get('sucursalId')

    if (!sucursalId) {
      return NextResponse.json(
        { error: 'El ID de la sucursal es requerido' },
        { status: 400 }
      )
    }

    if (!isValidObjectId(sucursalId)) {
      return NextResponse.json(
        { error: 'ID de sucursal inválido' },
        { status: 400 }
      )
    }

    const cajas = await Caja.find({ sucursal_id: sucursalId }).sort({ numero: 1 })

    return NextResponse.json({ cajas })

  } catch (error: any) {
    console.error('Error fetching cajas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/cajas - Crear nueva caja
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/cajas - Iniciando creación de caja')
    await connectDB()
    console.log('🔗 Conexión a base de datos establecida')
    
    const body = await request.json()
    console.log('📦 Datos recibidos:', JSON.stringify(body, null, 2))
    
    // Validar campos requeridos
    if (!body.numero || !body.sucursal_id) {
      console.log('❌ Faltan campos requeridos')
      return NextResponse.json(
        { error: 'Número y sucursal_id son requeridos' },
        { status: 400 }
      )
    }

      if (!isValidObjectId(body.sucursal_id)) {
        return NextResponse.json(
          { error: 'ID de sucursal inválido' },
          { status: 400 }
        )
      }

      // Sanitizar inputs
      const numero = sanitizeInput(body.numero)
      const sucursal_id = sanitizeInput(body.sucursal_id)

      if (!numero.trim()) {
        return NextResponse.json(
          { error: 'El número de caja no puede estar vacío' },
          { status: 400 }
        )
      }

      // Verificar si ya existe una caja con el mismo número en la sucursal
      const existingCaja = await Caja.findOne({ sucursal_id, numero })
      if (existingCaja) {
        return NextResponse.json(
          { error: 'Ya existe una caja con este número en la sucursal' },
          { status: 400 }
        )
      }

      // Validar y preparar numeración_facturas
      let numeracion_facturas = {
        "01": "0", // Factura electrónica
        "02": "0", // Nota de débito electrónica
        "03": "0", // Nota de crédito electrónica
        "04": "0", // Tiquete electrónico
        "05": "0", // Confirmación de aceptación del comprobante electrónico
        "06": "0", // Confirmación de aceptación parcial del comprobante electrónico
        "07": "0", // Confirmación de rechazo del comprobante electrónico
        "08": "0", // Factura electrónica de compras
        "09": "0", // Factura electrónica de exportación
        "10": "0"  // Recibo Electrónico de Pago
      }

      if (body.numeracion_facturas && typeof body.numeracion_facturas === 'object') {
        // Validar que todos los valores sean strings numéricos
        for (const [key, value] of Object.entries(body.numeracion_facturas)) {
          if (typeof value === 'string' && /^\d+$/.test(value)) {
            numeracion_facturas[key as keyof typeof numeracion_facturas] = value
          }
        }
      }

      // Crear la caja
      console.log('🏗️ Creando nueva caja con datos:', { numero, sucursal_id, numeracion_facturas })
      const nuevaCaja = new Caja({
        numero,
        sucursal_id,
        numeracion_facturas
      })

      console.log('💾 Guardando caja en la base de datos...')
      await nuevaCaja.save()
      console.log('✅ Caja guardada exitosamente:', nuevaCaja._id)

      return NextResponse.json(
        { 
          message: 'Caja creada exitosamente',
          caja: nuevaCaja
        },
        { status: 201 }
      )

  } catch (error: any) {
    console.error('❌ Error creating caja:', error)
    
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