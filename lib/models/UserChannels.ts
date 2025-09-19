import mongoose, { Document, Model, Schema } from 'mongoose'
// Importar modelos relacionados para asegurar que estén registrados
import './User'
import './Channel'

// Interfaz para el documento de Users_channels
export interface IUserChannel extends Document {
  _id: string
  user: mongoose.Types.ObjectId // ID del usuario
  channel: mongoose.Types.ObjectId // ID del canal
  is_admin: boolean // Si el usuario es admin en este canal
  isActive: boolean // Si la relación usuario-canal está activa
  createdAt?: Date
  updatedAt?: Date
}

// Schema de Users_channels para la relación many-to-many
const UserChannelSchema: Schema<IUserChannel> = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID del usuario es requerido']
  },
  channel: {
    type: Schema.Types.ObjectId,
    ref: 'Channel',
    required: [true, 'El ID del canal es requerido']
  },
  is_admin: {
    type: Boolean,
    default: false,
    required: [true, 'El estado de administrador es requerido']
  },
  isActive: {
    type: Boolean,
    default: false, // Cambiar a false para que las nuevas solicitudes estén pendientes por defecto
    required: [true, 'El estado activo es requerido']
  }
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
  collection: 'Users_channels' // Especificar explícitamente el nombre de la colección
})

// Índices para optimizar consultas
UserChannelSchema.index({ user: 1 })
UserChannelSchema.index({ channel: 1 })
UserChannelSchema.index({ user: 1, channel: 1 }, { unique: true }) // Evitar duplicados
UserChannelSchema.index({ is_admin: 1 })
UserChannelSchema.index({ isActive: 1 })

// Métodos del schema
UserChannelSchema.methods.getPublicProfile = function() {
  const userChannelObject = this.toObject()
  return userChannelObject
}

// Verificar si el modelo ya existe antes de crear uno nuevo
const UserChannel: Model<IUserChannel> = mongoose.models.UserChannel || mongoose.model<IUserChannel>('UserChannel', UserChannelSchema)

export default UserChannel 