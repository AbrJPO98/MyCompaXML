import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// GET /api/ubicaciones - Obtener ubicaciones de Costa Rica
export async function GET(request: NextRequest) {
  try {
    // Leer el archivo de ubicaciones
    const filePath = path.join(process.cwd(), 'public', 'CR_ubicaciones.json')
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const ubicaciones = JSON.parse(fileContents)

    const { searchParams } = new URL(request.url)
    const provincia = searchParams.get('provincia')
    const canton = searchParams.get('canton')
    const type = searchParams.get('type')
    const id = searchParams.get('id')
    const provinciaId = searchParams.get('provinciaId')
    const cantonId = searchParams.get('cantonId')

    // Si se solicita un nombre específico por tipo e ID
    if (type && id) {
      try {
        let nombre = ''
        
        if (type === 'provincia') {
          const provinciaData = ubicaciones.provincias[id]
          nombre = provinciaData ? provinciaData.nombre : ''
        } else if (type === 'canton' && provinciaId) {
          const provinciaData = ubicaciones.provincias[provinciaId]
          if (provinciaData && provinciaData.cantones[id]) {
            nombre = provinciaData.cantones[id].nombre
          }
        } else if (type === 'distrito' && provinciaId && cantonId) {
          const provinciaData = ubicaciones.provincias[provinciaId]
          if (provinciaData && provinciaData.cantones[cantonId] && provinciaData.cantones[cantonId].distritos[id]) {
            nombre = provinciaData.cantones[cantonId].distritos[id]
          }
        }
        
        return NextResponse.json({ nombre })
      } catch (error) {
        return NextResponse.json({ error: 'Error obteniendo nombre' }, { status: 500 })
      }
    }

    // Si se solicita solo provincias
    if (!provincia) {
      const provincias = Object.entries(ubicaciones.provincias).map(([id, data]: [string, any]) => ({
        id,
        nombre: data.nombre
      }))
      
      return NextResponse.json({ provincias })
    }

    // Si se solicita cantones de una provincia específica
    if (provincia && !canton) {
      const provinciaData = ubicaciones.provincias[provincia]
      if (!provinciaData) {
        return NextResponse.json(
          { error: 'Provincia no encontrada' },
          { status: 404 }
        )
      }

      const cantones = Object.entries(provinciaData.cantones).map(([id, data]: [string, any]) => ({
        id,
        nombre: data.nombre
      }))

      return NextResponse.json({ cantones })
    }

    // Si se solicita distritos de una provincia y cantón específicos
    if (provincia && canton) {
      const provinciaData = ubicaciones.provincias[provincia]
      if (!provinciaData) {
        return NextResponse.json(
          { error: 'Provincia no encontrada' },
          { status: 404 }
        )
      }

      const cantonData = provinciaData.cantones[canton]
      if (!cantonData) {
        return NextResponse.json(
          { error: 'Cantón no encontrado' },
          { status: 404 }
        )
      }

      const distritos = Object.entries(cantonData.distritos).map(([id, nombre]: [string, any]) => ({
        id,
        nombre
      }))

      return NextResponse.json({ distritos })
    }

    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })

  } catch (error: any) {
    console.error('Error reading ubicaciones file:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: 'No se pudo cargar las ubicaciones'
      },
      { status: 500 }
    )
  }
}