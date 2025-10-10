import { NextRequest, NextResponse } from 'next/server'
import Actividad from '@/lib/models/Actividad'
import { withDB } from '@/lib/dbUtils'
import mongoose from 'mongoose'

// Función para validar ObjectId
function isValidObjectId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false
  }
  return mongoose.Types.ObjectId.isValid(id) && id.length === 24
}

// Interfaces para la respuesta de Hacienda
interface ActividadHacienda {
  codigo: string
  descripcion: string
  tipo: string
  estado: string
  ciiu3: Ciiu3[]
}

interface Ciiu3 {
  codigo: string
  descripcion: string
}

interface HaciendaResponse {
  actividades?: ActividadHacienda[]
  // Otros campos que pueda tener la respuesta
  [key: string]: any
}

// POST /api/actividades/sync-hacienda - Sincronizar actividades desde Hacienda
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { channelId, identificacion } = body

    // Validaciones
    if (!channelId || !identificacion) {
      return NextResponse.json(
        { error: 'channelId e identificacion son requeridos' },
        { status: 400 }
      )
    }

    if (!isValidObjectId(channelId)) {
      return NextResponse.json(
        { error: 'channelId inválido' },
        { status: 400 }
      )
    }

    // Hacer llamada a la API de Hacienda
    const haciendaUrl = `https://api.hacienda.go.cr/fe/ae?identificacion=${identificacion}`
    
    console.log(`🔄 Sincronizando actividades desde Hacienda para cédula: ${identificacion}`)
    
    let haciendaResponse: HaciendaResponse
    try {
      const response = await fetch(haciendaUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MyCompaXML/1.0'
        }
      })

      if (!response.ok) {
        throw new Error(`Error en API de Hacienda: ${response.status} ${response.statusText}`)
      }

      haciendaResponse = await response.json()
      console.log('📋 Respuesta de Hacienda recibida')
      
    } catch (error) {
      console.error('❌ Error llamando API de Hacienda:', error)
      return NextResponse.json(
        { 
          error: 'Error al consultar API de Hacienda',
          details: error instanceof Error ? error.message : 'Error desconocido'
        },
        { status: 500 }
      )
    }

    // Verificar estructura de respuesta
    if (!haciendaResponse.actividades || !Array.isArray(haciendaResponse.actividades)) {
      console.log('⚠️ Respuesta de Hacienda no tiene estructura esperada:', haciendaResponse)
      return NextResponse.json(
        { 
          error: 'La respuesta de Hacienda no tiene la estructura esperada',
          response: haciendaResponse
        },
        { status: 400 }
      )
    }

    const actividadesHacienda = haciendaResponse.actividades

    if (actividadesHacienda.length === 0) {
      return NextResponse.json({
        message: 'No se encontraron actividades en Hacienda',
        synchronized: 0,
        updated: 0
      })
    }

    // Procesar actividades y guardar en la base de datos
    const result = await withDB(async () => {
      let synchronized = 0
      let updated = 0
      const errors: string[] = []

      for (const actividadHacienda of actividadesHacienda) {
        try {
          // Validar datos requeridos
          if (!actividadHacienda.ciiu3[0].codigo || !actividadHacienda.ciiu3[0].descripcion) {
            console.log(`⚠️ Actividad sin datos requeridos:`, actividadHacienda)
            continue
          }

          // Buscar si ya existe una actividad con el mismo código en el canal
          const existingActividad = await Actividad.findOne({
            codigo: actividadHacienda.ciiu3[0].codigo,
            channel_id: new mongoose.Types.ObjectId(channelId)
          })

          if (existingActividad) {
            // Actualizar actividad existente (solo campos de Hacienda, no el nombre_personal)
            await Actividad.findByIdAndUpdate(
              existingActividad._id,
              {
                nombre_original: actividadHacienda.ciiu3[0].descripcion,
                tipo: actividadHacienda.tipo || 'S',
                estado: actividadHacienda.estado || 'A'
              },
              { runValidators: true }
            )
            updated++
            console.log(`✅ Actividad actualizada: ${actividadHacienda.ciiu3[0].codigo}`)
          } else {
            // Crear nueva actividad
            const newActividad = new Actividad({
              codigo: actividadHacienda.ciiu3[0].codigo,
              nombre_personal: actividadHacienda.ciiu3[0].descripcion, // Inicialmente igual a la descripción
              nombre_original: actividadHacienda.descripcion,
              tipo: actividadHacienda.tipo || 'S',
              estado: actividadHacienda.estado || 'A',
              channel_id: new mongoose.Types.ObjectId(channelId)
            })

            await newActividad.save()
            synchronized++
          }
        } catch (error) {
          const errorMsg = `Error procesando actividad ${actividadHacienda.ciiu3[0].codigo}: ${error instanceof Error ? error.message : 'Error desconocido'}`
          console.error(`❌ ${errorMsg}`)
          errors.push(errorMsg)
        }
      }

      return {
        synchronized,
        updated,
        total: actividadesHacienda.length,
        errors: errors.length > 0 ? errors : undefined
      }
    })

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Error procesando datos' },
        { status: 500 }
      )
    }

    console.log(`🎉 Sincronización completada: ${result.data.synchronized} nuevas, ${result.data.updated} actualizadas`)

    return NextResponse.json({
      message: 'Sincronización completada exitosamente',
      ...result.data
    })

  } catch (error: any) {
    console.error('❌ Error en sincronización:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error.message
      },
      { status: 500 }
    )
  }
} 