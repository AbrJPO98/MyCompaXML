import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import DescripcionPersonalizada from '@/lib/models/DescripcionPersonalizada'
import { withDB, sanitizeInput, isValidObjectId } from '@/lib/dbUtils'

// Función para generar slug a partir de desc_pers
function generateSlug(text: string): string {
  if (!text) return ''
  
  return text
    .toLowerCase() // Convertir a minúsculas
    .normalize('NFD') // Normalizar caracteres Unicode
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos (acentos)
    .replace(/[^\w\s]/g, '') // Remover signos de puntuación
    .replace(/\s+/g, '') // Remover espacios
    .trim()
}

// GET /api/descripciones-personalizadas - Obtener descripciones personalizadas por channel_id
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
      const descripcion = await DescripcionPersonalizada.findOne({
        codigo: codigo,
        channel_id: new mongoose.Types.ObjectId(channelId)
      })

      return descripcion ? descripcion.toObject() : null
    }

    // Si no, devolver todas las descripciones para este canal
    const descripciones = await DescripcionPersonalizada.find({
      channel_id: new mongoose.Types.ObjectId(channelId)
    }).sort({ createdAt: -1 })

    return descripciones.map(item => item.toObject())
  })

  if (!result.success) {
    return NextResponse.json(
      { 
        error: result.error,
        message: 'Error al obtener descripciones personalizadas'
      },
      { status: 500 }
    )
  }

  if (codigo) {
    return NextResponse.json({
      success: true,
      descripcion: result.data
    })
  }

  return NextResponse.json({
    success: true,
    descripciones: result.data
  })
}

// POST /api/descripciones-personalizadas - Crear o actualizar descripción personalizada
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sanitizedData = sanitizeInput(body)
    
    const { 
      codigo,
      desc_pers,
      desc_fact,
      descripGasInv,
      bienoserv,
      categoria,
      vidaUtil,
      importado,
      act_eco,
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
      // Buscar si ya existe una descripción personalizada con el mismo código para este canal
      const existingDescripcion = await DescripcionPersonalizada.findOne({
        codigo: codigo,
        channel_id: new mongoose.Types.ObjectId(channel_id)
      })

      // Generar slug automáticamente a partir de desc_fact
      const slug = generateSlug(desc_fact || '')

      const descripcionData = {
        codigo,
        desc_pers: desc_pers || '',
        slug: slug,
        desc_fact: desc_fact || '',
        descripGasInv: descripGasInv || '',
        bienoserv: bienoserv || '',
        categoria: categoria || '',
        vidaUtil: vidaUtil || '',
        importado: importado || '',
        act_eco: act_eco || '',
        channel_id: new mongoose.Types.ObjectId(channel_id),
        updatedAt: new Date()
      }

      if (existingDescripcion) {
        // Actualizar existente
        const updatedDescripcion = await DescripcionPersonalizada.findByIdAndUpdate(
          existingDescripcion._id,
          descripcionData,
          { new: true }
        )
        return updatedDescripcion!.toObject()
      } else {
        // Crear nueva
        const newDescripcion = new DescripcionPersonalizada({
          ...descripcionData,
          createdAt: new Date()
        })

        const savedDescripcion = await newDescripcion.save()
        return savedDescripcion.toObject()
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
      message: 'Descripción personalizada guardada exitosamente',
      descripcion: result.data
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error saving descripción personalizada:', error)
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

// DELETE /api/descripciones-personalizadas - Eliminar descripción personalizada
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const channelId = searchParams.get('channelId')

  if (!id || !channelId) {
    return NextResponse.json(
      { error: 'ID y channelId son requeridos' },
      { status: 400 }
    )
  }

  if (!isValidObjectId(id) || !isValidObjectId(channelId)) {
    return NextResponse.json(
      { error: 'ID o channelId inválido' },
      { status: 400 }
    )
  }

  const result = await withDB(async () => {
    // Verificar que la descripción pertenezca al canal antes de eliminar
    const descripcion = await DescripcionPersonalizada.findOne({
      _id: new mongoose.Types.ObjectId(id),
      channel_id: new mongoose.Types.ObjectId(channelId)
    })

    if (!descripcion) {
      throw new Error('Descripción no encontrada o no pertenece a este canal')
    }

    await DescripcionPersonalizada.deleteOne({ _id: new mongoose.Types.ObjectId(id) })
    return true
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Descripción personalizada eliminada exitosamente'
  })
}


