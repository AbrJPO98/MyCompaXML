import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import CabysPersonales from '@/lib/models/CabysPersonales'
import { isValidObjectId } from '@/lib/dbUtils'

interface CabysItem {
  codigo: string
  descripOf: string
  bienoserv: string
  descripPer: string
  descripGasInv: string
  categoria: string
  actEconomica: string
  vidaUtil: string | number
  importado: string
}

// GET /api/cabys-selection - Obtener datos de CABYS con paginación
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const channelId = searchParams.get('channelId')
  const mode = searchParams.get('mode') // 'personales' o 'completo'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '25')
  const search = searchParams.get('search') || ''

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

  if (!['personales', 'completo'].includes(mode || '')) {
    return NextResponse.json(
      { error: 'mode debe ser "personales" o "completo"' },
      { status: 400 }
    )
  }

  try {
    await connectDB()

    if (mode === 'personales') {
      // Modalidad: CABYS Utilizados (solo de base de datos)
      const query: any = {
        channel_id: new mongoose.Types.ObjectId(channelId)
      }

      // Agregar filtro de búsqueda si existe
      if (search) {
        query.$or = [
          { codigo: { $regex: search, $options: 'i' } },
          { descripOf: { $regex: search, $options: 'i' } },
          { descripPer: { $regex: search, $options: 'i' } },
          { categoria: { $regex: search, $options: 'i' } }
        ]
      }

      const skip = (page - 1) * limit
      
      const [cabysPersonales, total] = await Promise.all([
        CabysPersonales.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        CabysPersonales.countDocuments(query)
      ])

      const formattedData = cabysPersonales.map(item => ({
        codigo: item.codigo,
        descripOf: item.descripOf,
        bienoserv: item.bienoserv,
        descripPer: item.descripPer || '-',
        descripGasInv: item.descripGasInv || '-',
        categoria: item.categoria,
        actEconomica: item.actEconomica || '-',
        vidaUtil: item.vidaUtil || '-',
        importado: item.importado || '-'
      }))

      return NextResponse.json({
        data: formattedData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        mode: 'personales'
      })

    } else {
      // Modalidad: Catálogo Completo (combinado con prioridad a BD)
      
      // 1. Obtener CABYS personales para crear Map de exclusión
      const cabysPersonales = await CabysPersonales.find({
        channel_id: new mongoose.Types.ObjectId(channelId)
      }).lean()

      const cabysPersonalesMap = new Map()
      const cabysPersonalesData: CabysItem[] = []

      cabysPersonales.forEach(item => {
        cabysPersonalesMap.set(item.codigo, true)
        cabysPersonalesData.push({
          codigo: item.codigo,
          descripOf: item.descripOf,
          bienoserv: item.bienoserv,
          descripPer: item.descripPer || '-',
          descripGasInv: item.descripGasInv || '-',
          categoria: item.categoria,
          actEconomica: item.actEconomica || '-',
          vidaUtil: item.vidaUtil || '-',
          importado: item.importado || '-'
        })
      })

      // 2. Leer archivo JSON
      const jsonPath = join(process.cwd(), 'public', 'cabys_data.json')
      const fileContent = readFileSync(jsonPath, 'utf8')
      const cabysData = JSON.parse(fileContent)

      // 3. Combinar datos priorizando BD
      const combinedData: CabysItem[] = [...cabysPersonalesData]

      if (cabysData.data && Array.isArray(cabysData.data)) {
        cabysData.data.forEach((item: any) => {
          // Solo agregar si no existe en BD
          if (!cabysPersonalesMap.has(item.codigo)) {
            combinedData.push({
              codigo: item.codigo || '-',
              descripOf: item.descripOf || '-',
              bienoserv: item.bienoserv || '-',
              descripPer: '-', // No existe en JSON
              descripGasInv: item.descripGasInv || '-',
              categoria: item.categoria || '-',
              actEconomica: '-', // No existe en JSON  
              vidaUtil: item.vidaUtil || '-',
              importado: item.importado || '-'
            })
          }
        })
      }

      // 4. Filtrar por búsqueda si existe
      let filteredData = combinedData
      if (search) {
        const searchLower = search.toLowerCase()
        filteredData = combinedData.filter(item =>
          item.codigo.toLowerCase().includes(searchLower) ||
          item.descripOf.toLowerCase().includes(searchLower) ||
          item.descripPer.toLowerCase().includes(searchLower) ||
          item.categoria.toLowerCase().includes(searchLower)
        )
      }

      // 5. Aplicar paginación
      const total = filteredData.length
      const skip = (page - 1) * limit
      const paginatedData = filteredData.slice(skip, skip + limit)

      return NextResponse.json({
        data: paginatedData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        mode: 'completo',
        stats: {
          totalPersonales: cabysPersonalesData.length,
          totalJSON: combinedData.length - cabysPersonalesData.length,
          totalCombined: combinedData.length
        }
      })
    }

  } catch (error: any) {
    console.error('Error obteniendo datos CABYS:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error.message 
      },
      { status: 500 }
    )
  }
}