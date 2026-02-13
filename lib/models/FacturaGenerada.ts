import mongoose from 'mongoose'

const FacturaGeneradaSchema = new mongoose.Schema({
    clave: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    tipo_factura: {
        type: String,
        required: true,
        trim: true
    },
    sucursal: {
        type: String,
        required: false,
        trim: true,
        default: ''
    },
    actividad_economica: {
        type: String,
        required: false,
        trim: true,
        default: ''
    },
    nombre_emisor: {
        type: String,
        required: true,
        trim: true
    },
    cedula_receptor: {
        type: String,
        required: false,
        trim: true,
        default: ''
    },
    nombre_receptor: {
        type: String,
        required: false,
        trim: true,
        default: ''
    },
    fecha: {
        type: String,
        required: true,
        trim: true
    },
    hora: {
        type: String,
        required: true,
        trim: true
    },
    total_factura: {
        type: Number,
        required: true,
        default: 0
    },
    total_impuesto: {
        type: Number,
        required: true,
        default: 0
    },
    estado: {
        type: String,
        required: true,
        trim: true,
        enum: ['pendiente', 'rechazado', 'aprobado'],
        default: 'pendiente',
        index: true
    },
    xml: {
        type: String,
        required: true
    },
    tipo: {
        type: String,
        required: true,
        trim: true,
        enum: ['stag', 'prod'],
        index: true
    },
    channel_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel',
        required: true,
        index: true
    }
}, {
    timestamps: true,
    collection: 'facturas_generadas'
})

FacturaGeneradaSchema.index({ channel_id: 1, createdAt: -1 })

if (mongoose.models.FacturaGenerada) {
    delete mongoose.models.FacturaGenerada
}

const FacturaGenerada = mongoose.model('FacturaGenerada', FacturaGeneradaSchema)

export default FacturaGenerada

