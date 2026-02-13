import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import FacturaGenerada from '@/lib/models/FacturaGenerada'

function isValidObjectId(id: string): boolean {
    return mongoose.Types.ObjectId.isValid(id) && id.length === 24
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const channelId = searchParams.get('channelId')

        if (!channelId) {
            return NextResponse.json({ success: false, error: 'channelId es requerido' }, { status: 400 })
        }

        if (!isValidObjectId(channelId)) {
            return NextResponse.json({ success: false, error: 'channelId inválido' }, { status: 400 })
        }

        await connectDB()
        const data = await FacturaGenerada.find({
            channel_id: new mongoose.Types.ObjectId(channelId)
        })
            .sort({ createdAt: -1 })
            .lean()

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Error en GET /api/facturas-generadas:', error)
        return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const channelId = String(body?.channel_id || '').trim()

        if (!channelId || !body?.clave || !body?.xml || !body?.tipo || !body?.estado) {
            return NextResponse.json(
                { success: false, error: 'Faltan campos requeridos (channel_id, clave, xml, tipo, estado)' },
                { status: 400 }
            )
        }

        if (!isValidObjectId(channelId)) {
            return NextResponse.json({ success: false, error: 'channel_id inválido' }, { status: 400 })
        }

        await connectDB()

        const created = await FacturaGenerada.create({
            ...body,
            channel_id: new mongoose.Types.ObjectId(channelId)
        })

        return NextResponse.json({ success: true, data: created }, { status: 201 })
    } catch (error: any) {
        console.error('Error en POST /api/facturas-generadas:', error)
        return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
    }
}

