import { NextRequest, NextResponse } from 'next/server'
import User from '@/lib/models/User'
import Channel from '@/lib/models/Channel'
import UserChannel from '@/lib/models/UserChannels'
import { withDB } from '@/lib/dbUtils'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  try {
    const result = await withDB(async () => {
      // Verificar conteos
      const userCount = await User.countDocuments()
      const channelCount = await Channel.countDocuments()
      const userChannelCount = await UserChannel.countDocuments()

      console.log('Conteos:', { userCount, channelCount, userChannelCount })

      if (userChannelCount > 0) {
        return {
          message: 'Ya existen registros en Users_channels',
          counts: { userCount, channelCount, userChannelCount }
        }
      }

      if (userCount === 0 || channelCount === 0) {
        return {
          error: 'Necesitas usuarios y canales primero',
          counts: { userCount, channelCount, userChannelCount }
        }
      }

      // Obtener algunos usuarios y canales
      const users = await User.find().limit(3)
      const channels = await Channel.find().limit(2)

      const testData = []

      // Crear relaciones de prueba
      for (let i = 0; i < users.length; i++) {
        const user = users[i]
        const channel = channels[i % channels.length] // Rotar canales
        const isAdmin = i === 0 // Primer usuario es admin

        testData.push({
          user: user._id,
          channel: channel._id,
          is_admin: isAdmin
        })
      }

      // Insertar datos
      const created = await UserChannel.insertMany(testData)

      return {
        message: 'Datos de prueba creados exitosamente',
        created: created.length,
        data: created.map(item => ({
          user: item.user,
          channel: item.channel,
          is_admin: item.is_admin
        }))
      }
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      ...result.data
    })

  } catch (error: any) {
    console.error('Error en populate-test-data:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const result = await withDB(async () => {
      // Solo verificar conteos
      const userCount = await User.countDocuments()
      const channelCount = await Channel.countDocuments()
      const userChannelCount = await UserChannel.countDocuments()

      // Mostrar algunos registros si existen
      let sampleRecords: any[] = []
      if (userChannelCount > 0) {
        sampleRecords = await UserChannel.find()
          .populate('user', 'first_name last_name email')
          .populate('channel', 'name code')
          .limit(5)
      }

      return {
        counts: { userCount, channelCount, userChannelCount },
        sampleRecords: sampleRecords.map(record => ({
          id: record._id,
          user: record.user,
          channel: record.channel,
          is_admin: record.is_admin,
          createdAt: record.createdAt
        }))
      }
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      ...result.data
    })

  } catch (error: any) {
    console.error('Error en debug GET:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
} 