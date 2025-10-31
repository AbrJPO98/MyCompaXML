import { NextRequest, NextResponse } from 'next/server'
import Caja from '@/lib/models/Caja'
import { withDB, sanitizeInput } from '@/lib/dbUtils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sucursalId = searchParams.get('sucursalId')

    if (!sucursalId) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Sucursal ID es requerido' 
        },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      const cajas = await Caja.find({ 
        sucursal_id: sucursalId 
      })
      .select('_id numero sucursal_id numeracion_facturas')
      .sort({ numero: 1 })

      return cajas
    })

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          message: result.error || 'Error al cargar las cajas'
        },
        { status: 500 }
      )
    }

    // Devolver estructura compatible con ambos usos
    return NextResponse.json({
      success: true,
      data: result.data,
      cajas: result.data  // Para compatibilidad futura
    })

  } catch (error: any) {
    console.error('Error en GET /api/cajas:', error)
    
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