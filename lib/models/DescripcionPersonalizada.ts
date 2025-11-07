import mongoose from 'mongoose'

const descripcionPersonalizadaSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true
  },
  desc_pers: {
    type: String,
    default: ''
  },
  slug: {
    type: String,
    default: ''
  },
  desc_fact: {
    type: String,
    default: ''
  },
  descripGasInv: {
    type: String,
    default: ''
  },
  bienoserv: {
    type: String,
    default: ''
  },
  categoria: {
    type: String,
    default: ''
  },
  vidaUtil: {
    type: String,
    default: ''
  },
  importado: {
    type: String,
    default: ''
  },
  act_eco: {
    type: String,
    default: ''
  },
  channel_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Índice compuesto para evitar duplicados (código + channel_id)
descripcionPersonalizadaSchema.index({ codigo: 1, channel_id: 1 }, { unique: true })

// Eliminar el modelo si ya está registrado (para hot reload)
if (mongoose.models.DescripcionPersonalizada) {
  delete mongoose.models.DescripcionPersonalizada
}

const DescripcionPersonalizada = mongoose.model('DescripcionPersonalizada', descripcionPersonalizadaSchema)

export default DescripcionPersonalizada


