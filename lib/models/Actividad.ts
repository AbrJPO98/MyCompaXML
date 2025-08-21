import mongoose, { Document, Model, Schema } from 'mongoose'

// Interfaz para el documento de Actividad
export interface IActividad extends Document {
  _id: string
  codigo: string // Código de la actividad
  nombre_personal: string // Nombre personalizado por el usuario
  nombre_original: string // Nombre original (por defecto "Actividad personalizada")
  tipo: string // Tipo (por defecto "S")
  estado: string // Estado (por defecto "A")
  channel_id: mongoose.Types.ObjectId // ID del channel asociado
  createdAt?: Date
  updatedAt?: Date
}

// Schema de Actividad para la colección "Actividades"
const ActividadSchema: Schema<IActividad> = new Schema({
  codigo: {
    type: String,
    required: [true, 'El código es requerido'],
    trim: true,
    maxlength: [20, 'El código no puede exceder 20 caracteres']
  },
  nombre_personal: {
    type: String,
    required: [true, 'El nombre personal es requerido'],
    trim: true,
    maxlength: [200, 'El nombre personal no puede exceder 200 caracteres']
  },
  nombre_original: {
    type: String,
    required: [true, 'El nombre original es requerido'],
    trim: true,
    default: 'Actividad personalizada'
  },
  tipo: {
    type: String,
    required: [true, 'El tipo es requerido'],
    trim: true,
    default: 'S'
  },
  estado: {
    type: String,
    required: [true, 'El estado es requerido'],
    trim: true,
    default: 'A'
  },
  channel_id: {
    type: Schema.Types.ObjectId,
    ref: 'Channel',
    required: [true, 'El channel_id es requerido']
  }
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
  collection: 'Actividades' // Especificar explícitamente el nombre de la colección
})

// Índices para optimizar consultas
ActividadSchema.index({ channel_id: 1 })
ActividadSchema.index({ codigo: 1, channel_id: 1 }) // Código único por canal
ActividadSchema.index({ estado: 1 })
ActividadSchema.index({ tipo: 1 })

// Validación de unicidad de código por canal
ActividadSchema.index(
  { codigo: 1, channel_id: 1 }, 
  { unique: true, name: 'codigo_channel_unique' }
)

// Método para obtener datos públicos de la actividad
ActividadSchema.methods.getPublicProfile = function() {
  return this.toObject()
}

// Verificar si el modelo ya existe antes de crear uno nuevo
const Actividad: Model<IActividad> = mongoose.models.Actividad || mongoose.model<IActividad>('Actividad', ActividadSchema)

export default Actividad 