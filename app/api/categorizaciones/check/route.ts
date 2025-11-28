import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Categorizacion from '@/lib/models/Categorizacion'
import mongoose from 'mongoose'

/**
 * POST - Verificar si las claves están en alguna categorización del canal
 */
export async function POST(request: NextRequest) {
  try {
    const { claves, channelId } = await request.json()

    if (!claves || !Array.isArray(claves)) {
      return NextResponse.json(
        { success: false, error: 'claves debe ser un array' },
        { status: 400 }
      )
    }

    if (!channelId) {
      return NextResponse.json(
        { success: false, error: 'channelId es requerido' },
        { status: 400 }
      )
    }

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return NextResponse.json(
        { success: false, error: 'channelId inválido' },
        { status: 400 }
      )
    }

    await connectDB()

    // Buscar todas las categorizaciones del canal
    const categorizaciones = await Categorizacion.find({
      channel_id: new mongoose.Types.ObjectId(channelId)
    }).select('archivos').lean()

    // Extraer todas las claves de las categorizaciones
    const clavesEnCategorizaciones = new Set<string>()
    
    categorizaciones.forEach((categorizacion: any) => {
      if (categorizacion.archivos && Array.isArray(categorizacion.archivos)) {
        categorizacion.archivos.forEach((archivo: any) => {
          if (archivo.clave) {
            clavesEnCategorizaciones.add(archivo.clave)
          }
        })
      }
    })

    // Filtrar las claves que están en categorizaciones
    const clavesEncontradas = claves.filter((clave: string) => 
      clavesEnCategorizaciones.has(clave)
    )

    return NextResponse.json({
      success: true,
      data: {
        clavesEnCategorizaciones: clavesEncontradas
      }
    })

  } catch (error: any) {
    console.error('Error verificando claves en categorizaciones:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

