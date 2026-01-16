import mongoose from 'mongoose'

const SurtidoSchema = new mongoose.Schema({
  cabys: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true,
    trim: true
  },
  titulo: {
    type: String,
    trim: true,
    default: ''
  },
  tipo: {
    type: String,
    required: true,
    trim: true
  },
  precio: {
    type: Number,
    required: true,
    min: 0
  },
  cantidad: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    trim: true,
    default: ''
  },
  channel_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  },
  detalle: {
    type: [{
      cabys: { type: String, required: true, trim: true },
      titulo: { type: String, trim: true, default: '' },
      descripcion: { type: String, required: true, trim: true },
      tipo: { type: String, required: true, trim: true },
      precio: { type: Number, required: true, min: 0 },
      cantidad: { type: Number, required: true, min: 0 },
      codigoComercial: { type: String, trim: true, default: '' },
      tipoCodigoComercial: { type: String, trim: true, default: '' },
      unidadMedida: { type: String, trim: true, default: '' },
      unidadMedidaComercial: { type: String, trim: true, default: '' },
      montoDescuento: { type: Number, default: 0, min: 0 },
      codigoDescuento: { type: String, trim: true, default: '' },
      detalleDescuento: { type: String, trim: true, default: '' },
      ivaCobradoFabrica: { type: Number, default: 0, min: 0 },
      baseImponible: { type: Number, default: 0, min: 0 },
      codigoImpuesto: { type: String, trim: true, default: '' },
      detalleImpuesto: { type: String, trim: true, default: '' },
      tipoTarifa: { type: String, trim: true, default: '' },
      tarifa: { type: Number, default: 0, min: 0 },
      cantidadUnidadMedida: { type: Number, default: 0, min: 0 },
      porcentajeEspecifico: { type: Number, default: 0, min: 0 },
      proporcion: { type: Number, default: 0, min: 0 },
      volumenPorUnidadConsumo: { type: Number, default: 0, min: 0 },
      impuestoPorUnidad: { type: Number, default: 0, min: 0 }
    }],
    default: []
  }
}, {
  timestamps: true,
  collection: 'surtido',
  strict: true,
  minimize: false
})

// Índices para optimizar búsquedas
SurtidoSchema.index({ channel_id: 1 })
SurtidoSchema.index({ cabys: 1 })
SurtidoSchema.index({ tipo: 1 })

// Limpiar el modelo del cache si existe para evitar conflictos de schema
if (mongoose.models.Surtido) {
  delete mongoose.models.Surtido
}

export default mongoose.model('Surtido', SurtidoSchema)

