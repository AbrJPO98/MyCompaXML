import mongoose from 'mongoose'

const CabysSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  descripOf: {
    type: String,
    required: true,
    trim: true
  },
  bienoserv: {
    type: String,
    required: true,
    trim: true
  },
  descripGasInv: {
    type: String,
    required: true,
    trim: true
  },
  categoria: {
    type: String,
    required: true,
    trim: true
  },
  vidaUtil: {
    type: mongoose.Schema.Types.Mixed, // Puede ser número o string
    required: true
  },
  importado: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'cabys'
})

// Índices para optimizar búsquedas
CabysSchema.index({ codigo: 1 })
CabysSchema.index({ categoria: 1 })
CabysSchema.index({ bienoserv: 1 })

export default mongoose.models.Cabys || mongoose.model('Cabys', CabysSchema)