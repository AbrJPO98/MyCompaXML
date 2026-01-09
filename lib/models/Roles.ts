import mongoose, { Document, Model, Schema } from 'mongoose'
import './Channel'

export const ROLE_PERMISSION_NAMES = [
  'Usuarios',
  'Roles',
  'Canal',
  'Actividades económicas',
  'Sucursales',
  'Inventario',
  'Gestor de facturas',
  'Contabilidad',
  'Clientes',
  'Facturador'
] as const

export type RolePermissionName = (typeof ROLE_PERMISSION_NAMES)[number]

export interface IRolePermission {
  nombre: RolePermissionName
}

export interface IRole extends Document {
  _id: string
  nombre: string
  permisos: IRolePermission[]
  deletable: boolean
  channel_id: mongoose.Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

const RolePermissionSchema = new Schema<IRolePermission>(
  {
    nombre: {
      type: String,
      enum: ROLE_PERMISSION_NAMES,
      required: true
    }
  },
  { _id: false }
)

const RoleSchema: Schema<IRole> = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del rol es requerido'],
      trim: true
    },
    permisos: {
      type: [RolePermissionSchema],
      default: []
    },
    deletable: {
      type: Boolean,
      default: true
    },
    channel_id: {
      type: Schema.Types.ObjectId,
      ref: 'Channel',
      required: [true, 'El channel_id es requerido']
    }
  },
  {
    timestamps: true,
    collection: 'roles',
    strict: true,
    minimize: false
  }
)

RoleSchema.index({ channel_id: 1 })
RoleSchema.index({ channel_id: 1, nombre: 1 }, { unique: true })

if (mongoose.models.Roles) {
  delete (mongoose.models as any).Roles
}

const Roles: Model<IRole> = mongoose.model<IRole>('Roles', RoleSchema)

export default Roles


