import mongoose, { Document, Model, Schema } from 'mongoose'
// Importar modelos relacionados para asegurar que estén registrados
import './User'
import './Channel'
import './Actividad'
import './Sucursal'
import './Caja'

// Interfaz para el documento de Users_channels
export interface IUserChannel extends Document {
  _id: string
  user: mongoose.Types.ObjectId // ID del usuario
  channel: mongoose.Types.ObjectId // ID del canal
  is_admin: boolean // Si el usuario es admin en este canal
  isActive: boolean // Si la relación usuario-canal está activa
  act_eco?: mongoose.Types.ObjectId // ID de la actividad económica (opcional)
  sucursal?: mongoose.Types.ObjectId // ID de la sucursal (opcional)
  caja?: mongoose.Types.ObjectId // ID de la caja (opcional)
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
  },
  act_eco: {
    type: Schema.Types.ObjectId,
    ref: 'Actividad',
    required: false
  },
  sucursal: {
    type: Schema.Types.ObjectId,
    ref: 'Sucursal',
    required: false
  },
  caja: {
    type: Schema.Types.ObjectId,
    ref: 'Caja',
    required: false
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

// Limpiar el modelo existente si existe para evitar conflictos
if (mongoose.models.UserChannel) {
  delete mongoose.models.UserChannel
}

// Crear el modelo
const UserChannel: Model<IUserChannel> = mongoose.model<IUserChannel>('UserChannel', UserChannelSchema)

export default UserChannel 