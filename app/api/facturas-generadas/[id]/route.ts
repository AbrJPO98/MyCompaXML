import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import FacturaGenerada from '@/lib/models/FacturaGenerada'

function isValidObjectId(id: string): boolean {
    return mongoose.Types.ObjectId.isValid(id) && id.length === 24
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params
        const { searchParams } = new URL(request.url)
        const channelId = searchParams.get('channelId')

        if (!id || !channelId) {
            return NextResponse.json({ success: false, error: 'id y channelId son requeridos' }, { status: 400 })
        }

        if (!isValidObjectId(id) || !isValidObjectId(channelId)) {
            return NextResponse.json({ success: false, error: 'id o channelId inválidos' }, { status: 400 })
        }

        await connectDB()

        const result = await FacturaGenerada.deleteOne({
            _id: new mongoose.Types.ObjectId(id),
            channel_id: new mongoose.Types.ObjectId(channelId)
        })

        if (!result.deletedCount) {
            return NextResponse.json({ success: false, error: 'Registro no encontrado' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error en DELETE /api/facturas-generadas/[id]:', error)
        return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
    }
}

