import { NextRequest, NextResponse } from 'next/server'
import Channel from '@/lib/models/Channel'
import { withDB } from '@/lib/dbUtils'

export async function GET() {
  try {
    const result = await withDB(async () => {
      // Obtener estadísticas de channels
      const totalChannels = await Channel.countDocuments()
      const activeChannels = await Channel.countDocuments({ isActive: true })
      const inactiveChannels = await Channel.countDocuments({ isActive: false })
      
      // Obtener algunos channels de ejemplo
      const sampleChannels = await Channel.find()
        .limit(3)
        .sort({ createdAt: -1 })

      // Obtener tipos de identificación únicos
      const identTypes = await Channel.distinct('ident_type')

      return {
        statistics: {
          total: totalChannels,
          active: activeChannels,
          inactive: inactiveChannels
        },
        sampleChannels: sampleChannels.map(channel => ({
          _id: channel._id,
          code: channel.code,
          name: channel.name,
          ident: `${channel.ident_type}-${channel.ident}`,
          phone: `+${channel.phone_code} ${channel.phone}`,
          fiscal: channel.registro_fiscal_IVA,
          isActive: channel.isActive,
          contactInfo: channel.getContactInfo(),
          createdAt: channel.createdAt
        })),
        identTypes,
        testPassed: true
      }
    })

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Error al conectar con la base de datos',
          error: result.error,
          testPassed: false
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Conexión y modelo Channel funcionando correctamente',
      data: result.data,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Error en test-channels:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Error en el test de channels',
        error: error.message,
        testPassed: false
      },
      { status: 500 }
    )
  }
}

// POST - Crear un channel de prueba
export async function POST() {
  try {
    const testChannel = {
      code: `TEST${Date.now()}`,
      name: `Channel de Prueba ${new Date().toLocaleString()}`,
      ident: `${Math.floor(Math.random() * 1000000000)}`,
      ident_type: "01",
      phone: `${Math.floor(Math.random() * 100000000)}`,
      phone_code: "506",
      registro_fiscal_IVA: `${Math.floor(Math.random() * 1000000000)}`
    }

    const result = await withDB(async () => {
      const newChannel = new Channel(testChannel)
      await newChannel.save()
      return newChannel.getPublicProfile()
    })

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Error al crear channel de prueba',
          error: result.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Channel de prueba creado exitosamente',
      data: result.data,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Error al crear channel de prueba:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Error al crear channel de prueba',
        error: error.message
      },
      { status: 500 }
    )
  }
} 