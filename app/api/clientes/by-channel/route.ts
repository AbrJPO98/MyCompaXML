import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Cliente from '@/lib/models/Cliente'
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

    // Buscar clientes del canal
    const clientes = await Cliente.find({
      channel_id: new mongoose.Types.ObjectId(channelId)
    })
      .sort({ name: 1 })
      .lean()

    return NextResponse.json({
      success: true,
      data: clientes.map(cliente => ({
        _id: String(cliente._id),
        ident: cliente.ident,
        type_ident: cliente.type_ident,
        ident_extranjero: cliente.ident_extranjero,
        name: cliente.name,
        email: cliente.email,
        name_commercial: cliente.name_commercial,
        country_code: cliente.country_code,
        phone: cliente.phone,
        province: cliente.province,
        canton: cliente.canton,
        district: cliente.district,
        address: cliente.address,
        address_extranjero: cliente.address_extranjero,
        act_ecos: cliente.act_ecos || []
      }))
    })

  } catch (error: any) {
    console.error('Error obteniendo clientes del canal:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Error interno del servidor',
        success: false 
      },
      { status: 500 }
    )
  }
}
