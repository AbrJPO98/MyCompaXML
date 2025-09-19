import mongoose, { Document, Model, Schema } from 'mongoose'

// Interfaz para el documento de Usuario
export interface IUser extends Document {
  _id: string
  password?: string
  ident: string // Número de identificación como "112900656"
  type_ident: string // Tipo de identificación como "01"
  first_name: string // Nombre como "Edwin"
  last_name: string // Apellidos como "David Monge Marin"
  email: string
  phone: string // Teléfono como "84383245"
  phone_code: string // Código de teléfono como "506"
  // Campos adicionales para compatibilidad
  role?: 'user' | 'admin'
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

// Schema de Usuario para la colección "Users" en la base de datos "myCompaXML"
const UserSchema: Schema<IUser> = new Schema({
  password: {
    type: String,
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false // No incluir la contraseña por defecto en las consultas
  },
  ident: {
    type: String,
    required: [true, 'El número de identificación es requerido'],
    trim: true
  },
  type_ident: {
    type: String,
    required: [true, 'El tipo de identificación es requerido'],
    trim: true
  },
  first_name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [50, 'El nombre no puede exceder 50 caracteres']
  },
  last_name: {
    type: String,
    required: [true, 'Los apellidos son requeridos'],
    trim: true,
    maxlength: [100, 'Los apellidos no pueden exceder 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor ingresa un email válido'
    ]
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
  // Campos adicionales para compatibilidad con el sistema actual
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: false // Nuevos usuarios inactivos por defecto
  }
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
  collection: 'Users' // Especificar explícitamente el nombre de la colección
})

// Índices para optimizar consultas
UserSchema.index({ email: 1 })
UserSchema.index({ ident: 1 })
UserSchema.index({ role: 1 })
UserSchema.index({ isActive: 1 })

// Middleware pre-save para hashear contraseña
UserSchema.pre('save', async function(next) {
  // Solo hashear la contraseña si ha sido modificada (o es nueva)
  if (!this.isModified('password')) return next()
  
  try {
    const bcrypt = require('bcryptjs')
    const salt = await bcrypt.genSalt(12)
    if (this.password) {
      this.password = await bcrypt.hash(this.password, salt)
    }
    next()
  } catch (error: any) {
    next(error)
  }
})

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false
  const bcrypt = require('bcryptjs')
  return bcrypt.compare(candidatePassword, this.password)
}

// Método para obtener datos públicos del usuario
UserSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject()
  delete userObject.password
  return userObject
}

// Método para obtener el nombre completo
UserSchema.methods.getFullName = function() {
  return `${this.first_name} ${this.last_name}`.trim()
}

// Verificar si el modelo ya existe antes de crear uno nuevo
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User 