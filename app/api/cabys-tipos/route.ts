import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import CabysPersonales from '@/lib/models/CabysPersonales'
import { isValidObjectId } from '@/lib/dbUtils'

// GET /api/cabys-tipos - Obtener tipos únicos de bienoserv combinando JSON y BD
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const channelId = searchParams.get('channelId')

  if (!channelId) {
    return NextResponse.json(
      { error: 'channelId es requerido' },
      { status: 400 }
    )
  }

  if (!isValidObjectId(channelId)) {
    return NextResponse.json(
      { error: 'channelId inválido' },
      { status: 400 }
    )
  }

  try {
    // Conectar a la base de datos
    await connectDB()

    // 1. Obtener datos personalizados de la base de datos
    const cabysPersonales = await CabysPersonales.find({
      channel_id: new mongoose.Types.ObjectId(channelId)
    }).select('codigo bienoserv')

    console.log(`Encontrados ${cabysPersonales.length} registros personalizados`)

    // Crear un Map para acceso rápido a los datos personalizados por código
    const cabysPersonalesMap = new Map()
    cabysPersonales.forEach(item => {
      cabysPersonalesMap.set(item.codigo, item.bienoserv)
    })

    // 2. Leer el archivo JSON
    const jsonPath = join(process.cwd(), 'public', 'cabys_data.json')
    const fileContent = readFileSync(jsonPath, 'utf8')
    const cabysData = JSON.parse(fileContent)

    console.log(`Archivo JSON contiene ${cabysData.data?.length || 0} registros`)

    // 3. Combinar datos priorizando la base de datos
    const tiposSet = new Set<string>()

    // Primero agregar todos los tipos de la base de datos
    cabysPersonales.forEach(item => {
      if (item.bienoserv && item.bienoserv.trim()) {
        tiposSet.add(item.bienoserv.trim())
      }
    })

    // Luego agregar tipos del JSON, pero solo si el código no existe en la BD
    if (cabysData.data && Array.isArray(cabysData.data)) {
      cabysData.data.forEach((item: any) => {
        if (item.codigo && item.bienoserv) {
          // Solo agregar si no hay versión personalizada en la BD
          if (!cabysPersonalesMap.has(item.codigo)) {
            const tipo = item.bienoserv.trim()
            if (tipo) {
              tiposSet.add(tipo)
            }
          }
        }
      })
    }

    // Convertir Set a array y ordenar
    const tipos = Array.from(tiposSet).sort()

    console.log(`Total de tipos únicos encontrados: ${tipos.length}`)
    console.log('Primeros 10 tipos:', tipos.slice(0, 10))

    return NextResponse.json({
      tipos,
      estadisticas: {
        totalTipos: tipos.length,
        tiposPersonalizados: cabysPersonales.length,
        tiposDelJSON: tipos.length - new Set(cabysPersonales.map(item => item.bienoserv)).size
      }
    })

  } catch (error: any) {
    console.error('Error obteniendo tipos CABYS:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error.message 
      },
      { status: 500 }
    )
  }
}