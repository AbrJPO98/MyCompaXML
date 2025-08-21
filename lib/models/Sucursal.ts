import mongoose, { Schema, Document, Model } from 'mongoose'

// Interface para el documento de Sucursal
export interface ISucursal extends Document {
  codigo: string
  nombre: string
  provincia: string
  canton: string
  distrito: string
  direccion: string
  activity_id: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// Schema de Sucursal
const SucursalSchema = new Schema<ISucursal>({
  codigo: {
    type: String,
    required: [true, 'El código es requerido'],
    trim: true,
    maxlength: [3, 'El código no puede tener más de 3 caracteres'],
    validate: {
      validator: function(v: string) {
        return /^\d{3}$/.test(v)
      },
      message: 'El código debe ser exactamente 3 dígitos numéricos'
    }
  },
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [200, 'El nombre no puede tener más de 200 caracteres']
  },
  provincia: {
    type: String,
    required: [true, 'La provincia es requerida'],
    trim: true
  },
  canton: {
    type: String,
    required: [true, 'El cantón es requerido'],
    trim: true
  },
  distrito: {
    type: String,
    required: [true, 'El distrito es requerido'],
    trim: true
  },
  direccion: {
    type: String,
    required: [true, 'La dirección es requerida'],
    trim: true,
    maxlength: [500, 'La dirección no puede tener más de 500 caracteres']
  },
  activity_id: {
    type: Schema.Types.ObjectId,
    required: [true, 'El ID de la actividad es requerido'],
    ref: 'Actividad'
  }
}, {
  timestamps: true,
  collection: 'sucursales'
})

// Índices para mejorar el rendimiento
SucursalSchema.index({ activity_id: 1 })
SucursalSchema.index({ codigo: 1, activity_id: 1 }, { unique: true })

// Middleware para validar que el código sea único por actividad
SucursalSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('codigo')) {
    const existingSucursal = await mongoose.models.Sucursal.findOne({
      codigo: this.codigo,
      activity_id: this.activity_id,
      _id: { $ne: this._id }
    })
    
    if (existingSucursal) {
      const error = new Error('Ya existe una sucursal con este código para esta actividad')
      return next(error)
    }
  }
  next()
})

// Crear el modelo
const Sucursal: Model<ISucursal> = mongoose.models.Sucursal || mongoose.model<ISucursal>('Sucursal', SucursalSchema)

export default Sucursal