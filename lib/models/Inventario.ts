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
  tipoMercancia: {
    type: String,
    enum: ['Normal', 'Surtido'],
    default: 'Normal',
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
  // Imagen asociada al artículo de inventario
  image: {
    type: String,
    trim: true,
    default: ''
  },
  // Información para facturación - Información general
  partidaArancelaria: {
    type: String,
    trim: true,
    default: ''
  },
  codigoComercial: {
    type: String,
    trim: true,
    default: ''
  },
  tipoCodigoComercial: {
    type: String,
    enum: ['01', '02', '03', '04', '99', ''],
    default: ''
  },
  // Datos del producto o servicio
  unidadMedida: {
    type: String,
    trim: true,
    default: ''
  },
  unidadMedidaComercial: {
    type: String,
    trim: true,
    default: ''
  },
  tipoTransaccion: {
    type: String,
    enum: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', ''],
    default: ''
  },
  // Medicamento
  esMedicamento: {
    type: Boolean,
    default: false
  },
  registro: {
    type: String,
    trim: true,
    default: ''
  },
  formaFarmaceutica: {
    type: String,
    enum: ['01', '02', '03', ''],
    default: ''
  },
  // VIN o serie
  esVinSerie: {
    type: Boolean,
    default: false
  },
  numeroVinSerie: {
    type: String,
    trim: true,
    default: ''
  },
  // Descuento
  tieneDescuento: {
    type: Boolean,
    default: false
  },
  naturalezaDescuento: {
    type: String,
    trim: true,
    default: ''
  },
  montoDescuento: {
    type: Number,
    default: 0,
    min: 0
  },
  codigoDescuento: {
    type: String,
    enum: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '99', ''],
    default: ''
  },
  tipoDescuento: {
    type: String,
    enum: ['Fijo', 'Porcentual', ''],
    default: ''
  },
  detalleDescuento: {
    type: String,
    trim: true,
    default: ''
  },
  baseImponible: {
    type: Number,
    default: 0,
    min: 0
  },
  // Impuesto
  tieneImpuesto: {
    type: Boolean,
    default: false
  },
  codigoImpuesto: {
    type: String,
    enum: ['01', '02', '03', '04', '05', '06', '07', '08', '12', '99', ''],
    default: ''
  },
  detalleImpuesto: {
    type: String,
    trim: true,
    default: ''
  },
  tipoTarifa: {
    type: String,
    enum: ['01', '02', '03', '04', '05', '06', '07', '08', '09', ''],
    default: ''
  },
  tarifa: {
    type: Number,
    default: 0,
    min: 0
  },
  // Impuesto específico
  esEspecifico: {
    type: Boolean,
    default: false
  },
  porcentajeEspecifico: {
    type: Number,
    default: 0,
    min: 0
  },
  impuestoPorUnidad: {
    type: Number,
    default: 0,
    min: 0
  },
  cantidadUnidadMedida: {
    type: Number,
    default: 0,
    min: 0
  },
  volumenPorUnidadConsumo: {
    type: Number,
    default: 0,
    min: 0
  },
  // Exoneración
  tieneExoneracion: {
    type: Boolean,
    default: false
  },
  documentoExoneracion: {
    type: String,
    enum: ['01', '02', '03', '04', '05', '06', '07', '99', ''],
    default: ''
  },
  detalleExoneracion: {
    type: String,
    trim: true,
    default: ''
  },
  numeroDocumentoExoneracion: {
    type: Number,
    default: 0,
    min: 0
  },
  articuloExoneracion: {
    type: String,
    trim: true,
    default: ''
  },
  incisoExoneracion: {
    type: String,
    trim: true,
    default: ''
  },
  institucionExoneracion: {
    type: String,
    enum: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '99', ''],
    default: ''
  },
  detalleInstitucionExoneracion: {
    type: String,
    trim: true,
    default: ''
  },
  fechaAutorizacionExoneracion: {
    type: String,
    trim: true,
    default: ''
  },
  porcentajeExoneracion: {
    type: Number,
    default: 0,
    min: 0
  },
  montoExportacion: {
    type: Number,
    default: 0,
    min: 0
  },
  channel_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  }
}, {
  timestamps: true,
  collection: 'inventario',
  strict: true, // Asegurar que solo se guarden campos definidos en el schema
  minimize: false // Asegurar que se guarden campos vacíos
})

// Índices para optimizar búsquedas
InventarioSchema.index({ channel_id: 1 })
InventarioSchema.index({ cabys: 1 })
InventarioSchema.index({ tipo: 1 })

// Limpiar el modelo del cache si existe para evitar conflictos de schema
if (mongoose.models.Inventario) {
  delete mongoose.models.Inventario
}

export default mongoose.model('Inventario', InventarioSchema)