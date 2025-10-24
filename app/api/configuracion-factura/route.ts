import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ConfiguracionFactura from '@/lib/models/ConfiguracionFactura'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json(
        { error: 'El ID del canal es requerido' },
        { status: 400 }
      )
    }

    // Validar que el channelId sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return NextResponse.json(
        { error: 'El ID del canal no es válido' },
        { status: 400 }
      )
    }

    await connectDB()

    const configuracion = await ConfiguracionFactura.findOne({ 
      channel_id: new mongoose.Types.ObjectId(channelId) 
    })

    if (!configuracion) {
      return NextResponse.json({
        success: true,
        hasConfig: false,
        data: null
      })
    }

    return NextResponse.json({
      success: true,
      hasConfig: true,
      data: {
        color_pagina: configuracion.color_pagina,
        color_texto: configuracion.color_texto,
        color_encabezado: configuracion.color_encabezado,
        logo: configuracion.logo,
        extras: configuracion.extras
      }
    })

  } catch (error: any) {
    console.error('Error en GET /api/configuracion-factura:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener la configuración' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      channelId,
      color_pagina,
      color_texto,
      color_encabezado,
      logo,
      extras
    } = body

    // Validar campos requeridos
    if (!channelId) {
      return NextResponse.json(
        { error: 'El ID del canal es requerido' },
        { status: 400 }
      )
    }

    // Validar que el channelId sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return NextResponse.json(
        { error: 'El ID del canal no es válido' },
        { status: 400 }
      )
    }

    if (!color_pagina || !color_texto || !color_encabezado) {
      return NextResponse.json(
        { error: 'Los colores son requeridos' },
        { status: 400 }
      )
    }

    console.log('=== Guardando configuración de factura ===')
    console.log('Channel ID:', channelId)
    console.log('Colores:', { color_pagina, color_texto, color_encabezado })
    console.log('Tiene logo:', !!logo)
    console.log('Número de extras:', extras?.length || 0)

    await connectDB()

    const channelObjectId = new mongoose.Types.ObjectId(channelId)

    // Buscar si ya existe una configuración para este canal
    let configuracion = await ConfiguracionFactura.findOne({ channel_id: channelObjectId })

    if (configuracion) {
      // Actualizar configuración existente
      configuracion.color_pagina = color_pagina
      configuracion.color_texto = color_texto
      configuracion.color_encabezado = color_encabezado
      configuracion.logo = logo || ''
      configuracion.extras = extras || []

      await configuracion.save()
      console.log('✅ Configuración actualizada exitosamente')
    } else {
      // Crear nueva configuración
      configuracion = new ConfiguracionFactura({
        channel_id: channelObjectId,
        color_pagina: color_pagina,
        color_texto: color_texto,
        color_encabezado: color_encabezado,
        logo: logo || '',
        extras: extras || []
      })

      await configuracion.save()
      console.log('✅ Configuración creada exitosamente')
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada exitosamente',
      data: {
        color_pagina: configuracion.color_pagina,
        color_texto: configuracion.color_texto,
        color_encabezado: configuracion.color_encabezado,
        logo: configuracion.logo,
        extras: configuracion.extras
      }
    })

  } catch (error: any) {
    console.error('Error en POST /api/configuracion-factura:', error)
    return NextResponse.json(
      { error: error.message || 'Error al guardar la configuración' },
      { status: 500 }
    )
  }
}

