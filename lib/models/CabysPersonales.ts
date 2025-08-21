import mongoose from 'mongoose'

const CabysPersonalesSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
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
  descripPer: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  descripGasInv: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  categoria: {
    type: String,
    required: true,
    trim: true
  },
  actEconomica: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  vidaUtil: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
    default: ''
  },
  importado: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  channel_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  }
}, {
  timestamps: true,
  collection: 'cabys_personales'
})

// Índices para optimizar búsquedas
CabysPersonalesSchema.index({ channel_id: 1 })
CabysPersonalesSchema.index({ codigo: 1 })
CabysPersonalesSchema.index({ channel_id: 1, codigo: 1 }, { unique: true })

export default mongoose.models.CabysPersonales || mongoose.model('CabysPersonales', CabysPersonalesSchema)