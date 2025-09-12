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
    required: false, // Opcional para mensajes especiales (MensajeHacienda/MensajeReceptor)
    trim: true
  },
  path: {
    type: String,
    required: false,
    trim: true
  },
  esRespuesta: {
    type: Boolean,
    required: true,
    default: false, // false = factura normal, true = documento de respuesta
    index: true
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

// Evitar duplicidad de clave por canal y tipo de respuesta
FacturaSchema.index({ channel_id: 1, clave: 1, esRespuesta: 1 }, { unique: true })

// Limpiar el modelo del cache si existe para evitar conflictos de schema
if (mongoose.models.Factura) {
  delete mongoose.models.Factura
}

const Factura = mongoose.model('Factura', FacturaSchema)

export default Factura
