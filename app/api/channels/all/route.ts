import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Channel from '@/lib/models/Channel'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Obtener todos los canales ordenados por fecha de creación (más recientes primero)
    const channels = await Channel.find({})
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      channels: channels,
      count: channels.length
    })

  } catch (error: any) {
    console.error('Error obteniendo canales:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los canales'
      },
      { status: 500 }
    )
  }
}
