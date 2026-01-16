import mongoose from 'mongoose'

const ProductosSurtidoSchema = new mongoose.Schema({
  surtido_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Surtido',
    required: true
  },
  producto_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventario',
    required: true
  }
}, {
  timestamps: true,
  collection: 'productos_surtido',
  strict: true,
  minimize: false
})

// Índices para optimizar búsquedas
ProductosSurtidoSchema.index({ surtido_id: 1 })
ProductosSurtidoSchema.index({ producto_id: 1 })
ProductosSurtidoSchema.index({ surtido_id: 1, producto_id: 1 }, { unique: true })

// Limpiar el modelo del cache si existe para evitar conflictos de schema
if (mongoose.models.Productos_surtido) {
  delete mongoose.models.Productos_surtido
}

export default mongoose.model('Productos_surtido', ProductosSurtidoSchema)

