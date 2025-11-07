import mongoose, { Document, Model, Schema } from 'mongoose'

// Interfaz para crypto_key
interface ICryptoKey {
  uuid: string
  email: string
  password: string
  pin: string
  status: 'prod' | 'sand'
  file_name: string
}

// Interfaz para el documento de Channel basada en la estructura de la imagen
export interface IChannel extends Document {
  _id: string
  code: string // Código como "E001"
  name: string // Nombre como "Edwin Contabilidad"
  ident: string // Número de identificación como "112900656"
  ident_type: string // Tipo de identificación como "01"
  phone: string // Teléfono como "84383245"
  phone_code: string // Código de teléfono como "506"
  registro_fiscal_IVA: string // Registro fiscal IVA como "112900000"
  email?: string // Email del canal
  commercial_name?: string // Nombre comercial del canal
  // Campos adicionales para funcionalidad del sistema
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
  // Métodos personalizados
  getPublicProfile(): any
  getContactInfo(): {
    phone: string
    identification: string
    fiscal: string
  },
  crypto_key?: ICryptoKey | null
}

// Schema para crypto_key
const CryptoKeySchema = new Schema({
  uuid: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  pin: { type: String, required: true },
  status: { type: String, required: true, enum: ['prod', 'sand'] },
  file_name: { type: String, required: true }
}, { _id: false })

// Schema de Channel para la colección "Channels" en la base de datos "myCompaXML"
const ChannelSchema: Schema<IChannel> = new Schema({
  code: {
    type: String,
    required: [true, 'El código es requerido'],
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  ident: {
    type: String,
    required: [true, 'El número de identificación es requerido'],
    trim: true
  },
  ident_type: {
    type: String,
    required: [true, 'El tipo de identificación es requerido'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'El teléfono es requerido'],
    trim: true
  },
  phone_code: {
    type: String,
    required: [true, 'El código de teléfono es requerido'],
    trim: true
  },
  registro_fiscal_IVA: {
    type: String,
    required: [true, 'El registro fiscal IVA es requerido'],
    trim: true
  },
  email: {
    type: String,
    required: false,
    trim: true
  },
  commercial_name: {
    type: String,
    required: false,
    trim: true
  },
  // Campos adicionales para funcionalidad del sistema
  isActive: {
    type: Boolean,
    default: true
  },
  crypto_key: {
    type: CryptoKeySchema,
    default: null
  }
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
  collection: 'Channels', // Especificar explícitamente el nombre de la colección
  strict: true,
  minimize: false // Esto asegura que se guarden objetos vacíos
})

// Índices para optimizar consultas
ChannelSchema.index({ code: 1 })
ChannelSchema.index({ ident: 1 })
ChannelSchema.index({ name: 1 })
ChannelSchema.index({ isActive: 1 })
ChannelSchema.index({ ident_type: 1 })

// Método para obtener datos públicos del channel
ChannelSchema.methods.getPublicProfile = function() {
  return this.toObject()
}

// Método para obtener información completa del contacto
ChannelSchema.methods.getContactInfo = function() {
  return {
    phone: `+${this.phone_code} ${this.phone}`,
    identification: `${this.ident_type}-${this.ident}`,
    fiscal: this.registro_fiscal_IVA
  }
}

// Verificar si el modelo ya existe antes de crear uno nuevo
// Si existe, eliminarlo primero para usar la nueva definición
if (mongoose.connection && mongoose.connection.models.Channel) {
  delete (mongoose.connection.models as any).Channel;
}
if (mongoose.models.Channel) {
  delete (mongoose.models as any).Channel;
}

const Channel: Model<IChannel> = mongoose.model<IChannel>('Channel', ChannelSchema)

export default Channel 