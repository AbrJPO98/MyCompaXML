import mongoose, { Schema, Document } from 'mongoose'

export interface ICliente extends Document {
  ident: string
  type_ident: string
  ident_extranjero?: string
  name: string
  email?: string
  name_commercial?: string
  country_code?: string
  phone?: string
  province?: string
  canton?: string
  district?: string
  address?: string
  address_extranjero?: string
  act_ecos?: string[]  // Array de códigos de actividades económicas
  createdAt: Date
  updatedAt: Date
}

const ClienteSchema: Schema = new Schema({
  ident: {
    type: String,
    required: true,
    trim: true
  },
  type_ident: {
    type: String,
    required: true,
    enum: ['01', '02', '03', '04'], // 01=Física, 02=Jurídica, 03=DIMEX, 04=NITE
    trim: true
  },
  ident_extranjero: {
    type: String,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  name_commercial: {
    type: String,
    trim: true
  },
  country_code: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  province: {
    type: String,
    trim: true
  },
  canton: {
    type: String,
    trim: true
  },
  district: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  address_extranjero: {
    type: String,
    trim: true
  },
  act_ecos: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
})

// Índice único para evitar duplicados por identificación
ClienteSchema.index({ ident: 1, type_ident: 1 }, { unique: true })

export default mongoose.models.Cliente || mongoose.model<ICliente>('Cliente', ClienteSchema)
