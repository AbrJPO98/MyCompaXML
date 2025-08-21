import mongoose from 'mongoose'

const FacturaSchema = new mongoose.Schema({
  clave: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  xml: {
    type: String,
    required: true
  },
  emision: {
    type: String,
    required: true,
    trim: true
  },
  path: {
    type: String,
    required: false,
    trim: true
  },
  channel_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'facturas'
})

// Evitar duplicidad de clave por canal
FacturaSchema.index({ channel_id: 1, clave: 1 }, { unique: true })

const Factura = mongoose.models.Factura || mongoose.model('Factura', FacturaSchema)

export default Factura
