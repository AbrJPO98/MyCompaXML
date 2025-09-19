import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import UserChannel from '@/lib/models/UserChannels'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID de usuario requerido' 
        },
        { status: 400 }
      )
    }

    // Obtener todos los registros de UserChannels para este usuario
    const userChannels = await UserChannel.find({ user: userId })
      .select('channel isActive')
      .lean()

    // Formatear la respuesta para facilitar el uso en el frontend
    const statuses = userChannels.map(userChannel => ({
      channelId: userChannel.channel.toString(),
      isActive: userChannel.isActive
    }))

    return NextResponse.json({
      success: true,
      statuses: statuses,
      count: statuses.length
    })

  } catch (error: any) {
    console.error('Error obteniendo estado de canales del usuario:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: 'No se pudo obtener el estado de los canales'
      },
      { status: 500 }
    )
  }
}
