import mongoose, { Document, Schema } from 'mongoose'

export interface ArchivoConjunto {
  clave: string
  nombre: string
  xml: string
}

export interface IConjuntoArchivos extends Document {
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
  }
}, { _id: false })

const ConjuntoArchivosSchema = new Schema<IConjuntoArchivos>({
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
      validator: function(archivos: ArchivoConjunto[]) {
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
  collection: 'conjunto_archivos'
})

// Índices
ConjuntoArchivosSchema.index({ channel_id: 1 })
ConjuntoArchivosSchema.index({ nombre: 1, channel_id: 1 }, { unique: true })
ConjuntoArchivosSchema.index({ fecha: -1 })

// Eliminar el modelo del cache si existe para evitar problemas de validación
if (mongoose.models.ConjuntoArchivos) {
  delete mongoose.models.ConjuntoArchivos
}

const ConjuntoArchivos = mongoose.model<IConjuntoArchivos>('ConjuntoArchivos', ConjuntoArchivosSchema)

export default ConjuntoArchivos
