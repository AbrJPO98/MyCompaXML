import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import Factura from '@/lib/models/Factura'
import connectDB from '@/lib/mongodb'

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && id.length === 24
}

// GET /api/facturas?channelId=...&esRespuesta=true&special=true&clave=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const channelId = searchParams.get('channelId')
  const esRespuesta = searchParams.get('esRespuesta')
  const special = searchParams.get('special') === 'true' // Mantener por compatibilidad
  const clave = searchParams.get('clave') // Nuevo parámetro para consulta por clave

  if (!channelId) {
    return NextResponse.json({ success: false, error: 'channelId es requerido' }, { status: 400 })
  }

  if (!isValidObjectId(channelId)) {
    return NextResponse.json({ success: false, error: 'channelId inválido' }, { status: 400 })
  }

  try {
    await connectDB()
    
    let query: any = { channel_id: new mongoose.Types.ObjectId(channelId) }
    
    // Si se especifica una clave, buscar solo esa factura
    if (clave) {
      query.clave = clave
    } else {
      // Lógica de filtrado normal solo si no se especifica clave
      if (esRespuesta !== null) {
        // Filtrar por el nuevo campo esRespuesta
        query.esRespuesta = esRespuesta === 'true'
      } else if (special) {
        // Mantener compatibilidad: mensajes especiales sin campo 'emision'
        query.emision = { $exists: false }
      } else {
        // Facturas normales: por defecto mostrar solo facturas (esRespuesta = false)
        query.esRespuesta = false
      }
    }
    
    if (clave) {
      // Consulta individual por clave
      const factura = await Factura.findOne(query).lean()
      
      if (!factura) {
        return NextResponse.json({ success: false, error: 'Factura no encontrada' }, { status: 404 })
      }
      
      return NextResponse.json({ success: true, factura: factura })
    } else {
      // Consulta múltiple (comportamiento original)
      const facturas = await Factura.find(query)
        .sort(query.esRespuesta ? { createdAt: -1 } : { emision: -1, createdAt: -1 })
        .lean()

      return NextResponse.json({ success: true, data: facturas })
    }
  } catch (error: any) {
    console.error('Error loading facturas:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST /api/facturas - Crear una o varias facturas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const facturas = Array.isArray(body) ? body : [body]

    if (facturas.length === 0) {
      return NextResponse.json({ error: 'No se enviaron facturas' }, { status: 400 })
    }

    // Validar estructura básica
    for (const factura of facturas) {
      if (!factura.clave || !factura.xml || !factura.channel_id) {
        return NextResponse.json({ error: 'Faltan campos requeridos en alguna factura (clave, xml, channel_id)' }, { status: 400 })
      }
      // emision es opcional para mensajes especiales (MensajeHacienda/MensajeReceptor)
      if (!isValidObjectId(factura.channel_id)) {
        return NextResponse.json({ error: 'channel_id inválido' }, { status: 400 })
      }
    }

    await connectDB()

    const resultados = []
    const duplicados = []

    for (const facturaData of facturas) {
      try {
        const facturaObject: any = {
          clave: facturaData.clave,
          xml: facturaData.xml,
          path: facturaData.path || '',
          channel_id: new mongoose.Types.ObjectId(facturaData.channel_id),
          esRespuesta: facturaData.esRespuesta || false // Por defecto false si no se especifica
        }

        // Solo agregar emision si existe (para facturas normales)
        if (facturaData.emision) {
          facturaObject.emision = facturaData.emision
        }

        const nuevaFactura = new Factura(facturaObject)
        await nuevaFactura.save()
        resultados.push(nuevaFactura)
      } catch (error: any) {
        if (error.code === 11000) {
          // Duplicado - ignorar
          duplicados.push(facturaData.clave)
        } else {
          throw error
        }
      }
    }

    return NextResponse.json({ 
      message: `${resultados.length} facturas procesadas`,
      insertadas: resultados.length,
      duplicados: duplicados.length,
      clavesDuplicadas: duplicados
    })

  } catch (error: any) {
    console.error('Error creating facturas:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE /api/facturas?channelId=...&clave=...
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')
    const clave = searchParams.get('clave')

    if (!channelId || !clave) {
      return NextResponse.json({ error: 'channelId y clave son requeridos' }, { status: 400 })
    }

    if (!isValidObjectId(channelId)) {
      return NextResponse.json({ error: 'channelId inválido' }, { status: 400 })
    }

    await connectDB()

    const resultado = await Factura.deleteOne({
      channel_id: new mongoose.Types.ObjectId(channelId),
      clave: clave
    })

    if (resultado.deletedCount === 0) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Factura eliminada exitosamente' })

  } catch (error: any) {
    console.error('Error deleting factura:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
