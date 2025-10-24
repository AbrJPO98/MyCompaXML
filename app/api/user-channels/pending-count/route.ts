import { NextRequest, NextResponse } from 'next/server'
import UserChannel from '@/lib/models/UserChannels'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json(
        { error: 'channelId es requerido' },
        { status: 400 }
      )
    }

    // Validar que channelId sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return NextResponse.json(
        { error: 'channelId no es un ObjectId válido' },
        { status: 400 }
      )
    }

    // Conectar a la base de datos
    await connectDB()

    // Buscar en la colección Users_channels
    const count = await UserChannel.countDocuments({
      channel: new mongoose.Types.ObjectId(channelId),
      isActive: false
    })

    console.log(`Canal ${channelId}: ${count} miembros pendientes`)

    return NextResponse.json({
      success: true,
      count: count
    })

  } catch (error: any) {
    console.error('Error obteniendo conteo de miembros pendientes:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Error interno del servidor',
        success: false 
      },
      { status: 500 }
    )
  }
}
