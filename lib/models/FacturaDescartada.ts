import mongoose, { Document, Schema } from 'mongoose'

export interface IFacturaDescartada extends Document {
  fecha: Date
  clave: string
  nombre?: string
  tipoDoc?: string
  dia?: string
  mes?: string
  anno?: string
  nombreEmisor?: string
  cedulaEmisor?: string
  nombreReceptor?: string
  cedulaReceptor?: string
  total?: string
  impuesto?: string
  xml: string
  channel_id: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const FacturaDescartadaSchema = new Schema<IFacturaDescartada>({
  fecha: {
    type: Date,
    required: [true, 'La fecha es requerida'],
    default: Date.now
  },
  clave: {
    type: String,
    required: [true, 'La clave es requerida'],
    trim: true
  },
  nombre: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  tipoDoc: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  dia: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  mes: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  anno: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  nombreEmisor: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  cedulaEmisor: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  nombreReceptor: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  cedulaReceptor: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  total: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  impuesto: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  xml: {
    type: String,
    required: [true, 'El XML es requerido']
  },
  channel_id: {
    type: Schema.Types.ObjectId,
    ref: 'Channel',
    required: [true, 'El ID del canal es requerido']
  }
}, {
  timestamps: true,
  collection: 'facturas_descartadas'
})

// Índices
FacturaDescartadaSchema.index({ channel_id: 1 })
FacturaDescartadaSchema.index({ clave: 1, channel_id: 1 }, { unique: true })
FacturaDescartadaSchema.index({ fecha: -1 })

// Eliminar el modelo del cache si existe para evitar problemas de validación
if (mongoose.models.FacturaDescartada) {
  delete mongoose.models.FacturaDescartada
}

const FacturaDescartada = mongoose.model<IFacturaDescartada>('FacturaDescartada', FacturaDescartadaSchema)

export default FacturaDescartada
