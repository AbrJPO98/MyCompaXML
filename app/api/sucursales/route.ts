import { NextRequest, NextResponse } from 'next/server'
import Sucursal from '@/lib/models/Sucursal'
import { withDB, sanitizeInput } from '@/lib/dbUtils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('activityId')

    if (!activityId) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Activity ID es requerido' 
        },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      const sucursales = await Sucursal.find({ 
        activity_id: activityId 
      })
      .select('_id codigo nombre provincia canton distrito direccion')
      .sort({ codigo: 1 })

      return sucursales
    })

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          message: result.error || 'Error al cargar las sucursales'
        },
        { status: 500 }
      )
    }

    // Devolver estructura compatible con ambos usos
    return NextResponse.json({
      success: true,
      data: result.data,
      sucursales: result.data  // Para compatibilidad con channels/[channel-code]
    })

  } catch (error: any) {
    console.error('Error en GET /api/sucursales:', error)
    
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