import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import CabysPersonales from '@/lib/models/CabysPersonales'
import { withDB, sanitizeInput, isValidObjectId } from '@/lib/dbUtils'

// GET /api/cabys-personales - Obtener CABYS personales por channel_id
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const channelId = searchParams.get('channelId')
  const codigo = searchParams.get('codigo')

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

  const result = await withDB(async () => {
    // Si se especifica un código, buscar solo ese
    if (codigo) {
      const cabysPersonal = await CabysPersonales.findOne({
        codigo: codigo,
        channel_id: new mongoose.Types.ObjectId(channelId)
      })

      return cabysPersonal ? cabysPersonal.toObject() : null
    }

    // Si no, devolver todos
    const cabysPersonales = await CabysPersonales.find({
      channel_id: new mongoose.Types.ObjectId(channelId)
    }).sort({ createdAt: -1 })

    return cabysPersonales.map(item => item.toObject())
  })

  if (!result.success) {
    return NextResponse.json(
      { 
        error: result.error,
        message: 'Error al obtener CABYS personales'
      },
      { status: 500 }
    )
  }

  if (codigo) {
    return NextResponse.json({
      success: true,
      cabys: result.data
    })
  }

  return NextResponse.json(result.data)
}

// POST /api/cabys-personales - Crear o actualizar CABYS personal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sanitizedData = sanitizeInput(body)
    
    const { 
      codigo, 
      descripOf,
      bienoserv, 
      descripPer,
      descripGasInv,
      categoria, 
      actEconomica,
      vidaUtil,
      importado,
      channel_id 
    } = sanitizedData

    // Validaciones básicas
    if (!codigo || !channel_id) {
      return NextResponse.json(
        { error: 'Código y channel_id son requeridos' },
        { status: 400 }
      )
    }

    if (!isValidObjectId(channel_id)) {
      return NextResponse.json(
        { error: 'ID de canal inválido' },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      // Buscar si ya existe un CABYS personal con el mismo código para este canal
      const existingCabys = await CabysPersonales.findOne({
        codigo: codigo,
        channel_id: new mongoose.Types.ObjectId(channel_id)
      })

      const cabysData = {
        codigo,
        descripOf: descripOf || '',
        bienoserv: bienoserv || '',
        descripPer: descripPer || '',
        descripGasInv: descripGasInv || '',
        categoria: categoria || '',
        actEconomica: actEconomica || '',
        vidaUtil: vidaUtil || '',
        importado: importado || '',
        channel_id: new mongoose.Types.ObjectId(channel_id),
        updatedAt: new Date()
      }

      if (existingCabys) {
        // Actualizar existente
        const updatedCabys = await CabysPersonales.findByIdAndUpdate(
          existingCabys._id,
          cabysData,
          { new: true }
        )
        return updatedCabys!.toObject()
      } else {
        // Crear nuevo
        const newCabysPersonal = new CabysPersonales({
          ...cabysData,
          createdAt: new Date()
        })

        const savedCabysPersonal = await newCabysPersonal.save()
        return savedCabysPersonal.toObject()
      }
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'CABYS personal guardado exitosamente',
      cabysPersonal: result.data
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error saving CABYS personal:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        message: error.message 
      },
      { status: 500 }
    )
  }
}