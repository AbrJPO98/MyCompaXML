import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Actividad from '@/lib/models/Actividad'
import { isValidObjectId } from '@/lib/dbUtils'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json({ 
        success: false, 
        message: 'channelId es requerido' 
      }, { status: 400 })
    }

    if (!isValidObjectId(channelId)) {
      return NextResponse.json({ 
        success: false, 
        message: 'channelId inválido' 
      }, { status: 400 })
    }

    await connectDB()

    const actividades = await Actividad.find(
      { channel_id: channelId },
    ).sort({ codigo: 1 }).lean()

    console.log('Actividades encontradas:', actividades)

    return NextResponse.json({
      success: true,
      actividades: actividades
    })

  } catch (error) {
    console.error('Error fetching actividades:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Error interno del servidor' 
    }, { status: 500 })
  }
}