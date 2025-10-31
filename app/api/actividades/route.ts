import { NextRequest, NextResponse } from 'next/server'
import Actividad from '@/lib/models/Actividad'
import { withDB, sanitizeInput } from '@/lib/dbUtils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Channel ID es requerido' 
        },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      const actividades = await Actividad.find({ 
        channel_id: channelId 
      })
      .select('_id codigo nombre_personal nombre_original tipo estado')
      .sort({ codigo: 1 })

      return actividades
    })

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          message: result.error || 'Error al cargar las actividades'
        },
        { status: 500 }
      )
    }

    // Devolver estructura compatible con ambos usos
    return NextResponse.json({
      success: true,
      data: result.data,        // Para PosicionModal
      actividades: result.data  // Para channels/[channel-code]
    })

  } catch (error: any) {
    console.error('Error en GET /api/actividades:', error)
    
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