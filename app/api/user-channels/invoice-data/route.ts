import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import UserChannel from '@/lib/models/UserChannels'
import Actividad from '@/lib/models/Actividad'
import Sucursal from '@/lib/models/Sucursal'
import Caja from '@/lib/models/Caja'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')
    const userId = searchParams.get('userId')

    if (!channelId || !userId) {
      return NextResponse.json(
        { error: 'channelId y userId son requeridos' },
        { status: 400 }
      )
    }

    // Validar ObjectIds
    if (!mongoose.Types.ObjectId.isValid(channelId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'channelId o userId no son ObjectIds válidos' },
        { status: 400 }
      )
    }

    // Conectar a la base de datos
    await connectDB()

    // Buscar el UserChannel del usuario en el canal
    const userChannel = await UserChannel.findOne({
      channel: new mongoose.Types.ObjectId(channelId),
      user: new mongoose.Types.ObjectId(userId)
    })
      .populate('act_eco')
      .populate('sucursal')
      .populate('caja')

    if (!userChannel) {
      return NextResponse.json(
        { error: 'No se encontró el registro de usuario en el canal' },
        { status: 404 }
      )
    }

    // Obtener datos de actividad económica
    let actividadEconomica = null
    if (userChannel.act_eco) {
      const actividad = await Actividad.findById(userChannel.act_eco)
      if (actividad) {
        actividadEconomica = {
          _id: actividad._id.toString(),
          nombre_personal: actividad.nombre_personal
        }
      }
    }

    // Obtener datos de sucursal
    let sucursal = null
    if (userChannel.sucursal) {
      const sucursalData = await Sucursal.findById(userChannel.sucursal)
      if (sucursalData) {
        sucursal = {
          _id: sucursalData._id.toString(),
          nombre: sucursalData.nombre,
          codigo: sucursalData.codigo
        }
      }
    }

    // Obtener datos de caja
    let caja = null
    if (userChannel.caja) {
      const cajaData = await Caja.findById(userChannel.caja)
      if (cajaData) {
        caja = {
          _id: cajaData._id.toString(),
          numero: cajaData.numero,
          numeracion_facturas: cajaData.numeracion_facturas || {}
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        actividadEconomica,
        sucursal,
        caja
      }
    })

  } catch (error: any) {
    console.error('Error obteniendo datos de facturación:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Error interno del servidor',
        success: false 
      },
      { status: 500 }
    )
  }
}
