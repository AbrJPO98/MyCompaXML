import mongoose, { Document, Schema } from 'mongoose'

export interface ArchivoConjuntoCategorizacionItem {
  cabys: string
  desc_fact: string
  descripPer: string
  bienoserv: string
  descripGasInv: string
  categoria: string
  actEconomica: string
  vidaUtil: string
  importado: string
  otras_ventas_sin_iva_con_derecho_credito_pleno?: {
    total_ventas_exentas: number
    total_ventas_exonerados: number
    total_ventas_no_sujetas: number
  },
  otras_ventas_sin_iva_sin_derecho_credito?: {
    total_ventas_exentas: number
    total_ventas_exonerados: number
    total_ventas_no_sujetas: number
  }
}

export interface ArchivoConjunto {
  clave: string
  nombre: string
  xml: string
  // Resultado de la categorización asociado a esta factura (mismo formato que en Factura.categorizacion)
  categorizacion?: ArchivoConjuntoCategorizacionItem[]
}

export interface ICategorizacion extends Document {
  nombre: string
  fecha: Date
  archivos: ArchivoConjunto[]
  channel_id: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ArchivoConjuntoSchema = new Schema({
  clave: {
    type: String,
    required: [true, 'La clave es requerida'],
    trim: true
  },
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  xml: {
    type: String,
    required: [true, 'El XML es requerido']
  },
  categorizacion: {
    type: [{
      cabys: { type: String, trim: true },
      desc_fact: { type: String, trim: true },
      descripPer: { type: String, trim: true },
      bienoserv: { type: String, trim: true },
      descripGasInv: { type: String, trim: true },
      categoria: { type: String, trim: true },
      actEconomica: { type: String, trim: true },
      vidaUtil: { type: String, trim: true },
      importado: { type: String, trim: true },
      otras_ventas_sin_iva_con_derecho_credito_pleno: {
        type: {
          total_ventas_exentas: { type: Number, default: 0 },
          total_ventas_exonerados: { type: Number, default: 0 },
          total_ventas_no_sujetas: { type: Number, default: 0 }
        },
        required: false
      },
      otras_ventas_sin_iva_sin_derecho_credito: {
        type: {
          total_ventas_exentas: { type: Number, default: 0 },
          total_ventas_exonerados: { type: Number, default: 0 },
          total_ventas_no_sujetas: { type: Number, default: 0 }
        },
        required: false
      }
    }],
    required: false,
    default: []
  }
}, { _id: false })

const CategorizacionSchema = new Schema<ICategorizacion>({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [200, 'El nombre no puede exceder 200 caracteres']
  },
  fecha: {
    type: Date,
    required: [true, 'La fecha es requerida'],
    default: Date.now
  },
  archivos: {
    type: [ArchivoConjuntoSchema],
    required: [true, 'Los archivos son requeridos'],
    validate: {
      validator: function (archivos: ArchivoConjunto[]) {
        return archivos && archivos.length > 0
      },
      message: 'Debe incluir al menos un archivo'
    }
  },
  channel_id: {
    type: Schema.Types.ObjectId,
    ref: 'Channel',
    required: [true, 'El ID del canal es requerido']
  }
}, {
  timestamps: true,
  // Usar una colección específica para las categorizaciones
  collection: 'categorizaciones'
})

// Índices
CategorizacionSchema.index({ channel_id: 1 })
CategorizacionSchema.index({ nombre: 1, channel_id: 1 }, { unique: true })
CategorizacionSchema.index({ fecha: -1 })

// Eliminar el modelo del cache si existe para evitar problemas de validación
if (mongoose.models.Categorizacion) {
  delete mongoose.models.Categorizacion
}

const Categorizacion = mongoose.model<ICategorizacion>('Categorizacion', CategorizacionSchema)

export default Categorizacion


