import mongoose from 'mongoose'

const CajaSchema = new mongoose.Schema({
  numero: {
    type: String,
    required: true,
    trim: true
  },
  sucursal_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Sucursal',
    index: true
  },
  numeracion_facturas: {
    type: Object,
    required: true,
    default: {
      "01": "0", // Factura electrónica
      "02": "0", // Nota de débito electrónica
      "03": "0", // Nota de crédito electrónica
      "04": "0", // Tiquete electrónico
      "05": "0", // Confirmación de aceptación del comprobante electrónico
      "06": "0", // Confirmación de aceptación parcial del comprobante electrónico
      "07": "0", // Confirmación de rechazo del comprobante electrónico
      "08": "0", // Factura electrónica de compras
      "09": "0", // Factura electrónica de exportación
      "10": "0"  // Recibo Electrónico de Pago
    }
  }
}, {
  timestamps: true
})

// Índice compuesto para asegurar que no haya números de caja duplicados por sucursal
CajaSchema.index({ sucursal_id: 1, numero: 1 }, { unique: true })

const Caja = mongoose.models.Caja || mongoose.model('Caja', CajaSchema)

export default Caja