import mongoose, { Document, Model, Schema, Types } from 'mongoose'

// Interfaz para extras
interface IExtra {
  nombre: string
  descripcion: string
}

// Interfaz para el documento de ConfiguracionFactura
export interface IConfiguracionFactura extends Document {
  _id: string
  channel_id: Types.ObjectId
  color_pagina: string
  color_texto: string
  color_encabezado: string
  logo: string // Base64
  extras: IExtra[]
  createdAt?: Date
  updatedAt?: Date
}

// Schema para extras
const ExtraSchema = new Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String, required: true }
}, { _id: false })

// Schema de ConfiguracionFactura
const ConfiguracionFacturaSchema: Schema<IConfiguracionFactura> = new Schema({
  channel_id: {
    type: Schema.Types.ObjectId,
    ref: 'Channel',
    required: [true, 'El ID del canal es requerido'],
    unique: true,
    index: true
  },
  color_pagina: {
    type: String,
    required: [true, 'El color de página es requerido'],
    default: '#ffffff'
  },
  color_texto: {
    type: String,
    required: [true, 'El color de texto es requerido'],
    default: '#000000'
  },
  color_encabezado: {
    type: String,
    required: [true, 'El color de encabezado es requerido'],
    default: '#3b82f6'
  },
  logo: {
    type: String,
    default: ''
  },
  extras: {
    type: [ExtraSchema],
    default: []
  }
}, {
  timestamps: true,
  collection: 'configuracion_factura'
})

// Índice para búsqueda rápida por channel_id
ConfiguracionFacturaSchema.index({ channel_id: 1 })

// Verificar si el modelo ya existe antes de crear uno nuevo
if (mongoose.connection && mongoose.connection.models.ConfiguracionFactura) {
  delete (mongoose.connection.models as any).ConfiguracionFactura
}
if (mongoose.models.ConfiguracionFactura) {
  delete (mongoose.models as any).ConfiguracionFactura
}

const ConfiguracionFactura: Model<IConfiguracionFactura> = mongoose.model<IConfiguracionFactura>(
  'ConfiguracionFactura',
  ConfiguracionFacturaSchema
)

export default ConfiguracionFactura

