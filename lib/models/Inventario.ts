import mongoose from 'mongoose'

const InventarioSchema = new mongoose.Schema({
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
  channel_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  }
}, {
  timestamps: true,
  collection: 'inventario'
})

// Índices para optimizar búsquedas
InventarioSchema.index({ channel_id: 1 })
InventarioSchema.index({ cabys: 1 })
InventarioSchema.index({ tipo: 1 })

export default mongoose.models.Inventario || mongoose.model('Inventario', InventarioSchema)