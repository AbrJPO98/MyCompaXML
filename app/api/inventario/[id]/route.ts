import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import Inventario from '@/lib/models/Inventario'
import { withDB, sanitizeInput, isValidObjectId } from '@/lib/dbUtils'

// GET /api/inventario/[id] - Obtener artículo específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  if (!isValidObjectId(id)) {
    return NextResponse.json(
      { error: 'ID inválido' },
      { status: 400 }
    )
  }

  const result = await withDB(async () => {
    const inventario = await Inventario.findById(id)

    if (!inventario) {
      throw new Error('Artículo de inventario no encontrado')
    }

    return inventario.toObject()
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error === 'Artículo de inventario no encontrado' ? 404 : 500 }
    )
  }

  return NextResponse.json(result.data)
}

// PUT /api/inventario/[id] - Actualizar artículo
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  if (!isValidObjectId(id)) {
    return NextResponse.json(
      { error: 'ID inválido' },
      { status: 400 }
    )
  }

  try {
    const body = await request.json()

    // Log para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('Body recibido en PUT:', JSON.stringify(body, null, 2))
    }

    const sanitizedData = sanitizeInput(body)

    // Log para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('Datos sanitizados:', JSON.stringify(sanitizedData, null, 2))
    }

    const {
      cabys,
      descripcion,
      titulo,
      tipo,
      tipoMercancia,
      precio,
      cantidad,
      // Información para facturación - Información general
      partidaArancelaria,
      codigoComercial,
      tipoCodigoComercial,
      // Datos del producto o servicio
      unidadMedida,
      unidadMedidaComercial,
      tipoTransaccion,
      // Medicamento
      esMedicamento,
      registro,
      formaFarmaceutica,
      // VIN o serie
      esVinSerie,
      numeroVinSerie,
      // Descuento
      tieneDescuento,
      naturalezaDescuento,
      montoDescuento,
      codigoDescuento,
      tipoDescuento,
      detalleDescuento,
      baseImponible,
      // Impuesto
      tieneImpuesto,
      codigoImpuesto,
      detalleImpuesto,
      tipoTarifa,
      tipoTarifaGeneral,
      tarifa,
      factorCalculoIVA,
      // Impuesto específico
      esEspecifico,
      porcentajeEspecifico,
      impuestoPorUnidad,
      cantidadUnidadMedida,
      volumenPorUnidadConsumo,
      proporcion,
      // Exoneración
      tieneExoneracion,
      documentoExoneracion,
      detalleExoneracion,
      numeroDocumentoExoneracion,
      articuloExoneracion,
      incisoExoneracion,
      institucionExoneracion,
      detalleInstitucionExoneracion,
      fechaAutorizacionExoneracion,
      porcentajeExoneracion,
      montoExportacion,
      detalleSurtido
    } = sanitizedData

    // Validaciones básicas de campos requeridos
    if (!cabys || !descripcion || !tipo || precio === undefined || cantidad === undefined) {
      return NextResponse.json(
        { error: 'Todos los campos requeridos deben ser proporcionados (cabys, descripcion, tipo, precio, cantidad)' },
        { status: 400 }
      )
    }

    // Validar y convertir campos numéricos (pueden venir como número o string)
    const precioNum = typeof precio === 'number' ? precio : parseFloat(String(precio || 0))
    const cantidadNum = typeof cantidad === 'number' ? cantidad : parseInt(String(cantidad || 0))

    if (isNaN(precioNum) || precioNum < 0) {
      return NextResponse.json(
        { error: 'El precio debe ser un número válido mayor o igual a 0' },
        { status: 400 }
      )
    }

    if (isNaN(cantidadNum) || cantidadNum < 0) {
      return NextResponse.json(
        { error: 'La cantidad debe ser un número entero válido mayor o igual a 0' },
        { status: 400 }
      )
    }

    // Función helper para convertir valores numéricos de forma segura
    const toNumber = (value: any, defaultValue: number = 0): number => {
      if (typeof value === 'number') return isNaN(value) ? defaultValue : value
      if (value === null || value === undefined || value === '') return defaultValue
      const parsed = parseFloat(String(value))
      return isNaN(parsed) ? defaultValue : parsed
    }

    const toInt = (value: any, defaultValue: number = 0): number => {
      if (typeof value === 'number') return isNaN(value) ? defaultValue : Math.floor(value)
      if (value === null || value === undefined || value === '') return defaultValue
      const parsed = parseInt(String(value))
      return isNaN(parsed) ? defaultValue : parsed
    }

    // Preparar objeto con todos los campos para actualizar
    const updateData: any = {
      cabys: String(cabys || '').trim(),
      descripcion: String(descripcion || '').trim(),
      titulo: String(titulo || '').trim(),
      tipo: String(tipo || '').trim(),
      tipoMercancia: tipoMercancia || 'Normal',
      precio: precioNum,
      cantidad: cantidadNum,
      // Información para facturación
      partidaArancelaria: String(partidaArancelaria || '').trim(),
      codigoComercial: String(codigoComercial || '').trim(),
      tipoCodigoComercial: tipoCodigoComercial || '',
      // Datos del producto o servicio
      unidadMedida: String(unidadMedida || '').trim(),
      unidadMedidaComercial: String(unidadMedidaComercial || '').trim(),
      tipoTransaccion: tipoTransaccion || '',
      // Medicamento
      esMedicamento: Boolean(esMedicamento),
      registro: String(registro || '').trim(),
      formaFarmaceutica: formaFarmaceutica || '',
      // VIN o serie
      esVinSerie: Boolean(esVinSerie),
      numeroVinSerie: String(numeroVinSerie || '').trim(),
      // Descuento
      tieneDescuento: Boolean(tieneDescuento),
      naturalezaDescuento: String(naturalezaDescuento || '').trim(),
      montoDescuento: toNumber(montoDescuento, 0),
      codigoDescuento: codigoDescuento || '',
      tipoDescuento: tipoDescuento || '',
      detalleDescuento: String(detalleDescuento || '').trim(),
      baseImponible: toNumber(baseImponible, 0),
      // Impuesto
      tieneImpuesto: Boolean(tieneImpuesto),
      codigoImpuesto: codigoImpuesto || '',
      detalleImpuesto: String(detalleImpuesto || '').trim(),
      tipoTarifa: tipoTarifa || '',
      tipoTarifaGeneral: tipoTarifaGeneral || tipoTarifa || '',
      tarifa: toNumber(tarifa, 0),
      factorCalculoIVA: toNumber(factorCalculoIVA, 0),
      // Impuesto específico
      esEspecifico: Boolean(esEspecifico),
      porcentajeEspecifico: toNumber(porcentajeEspecifico, 0),
      impuestoPorUnidad: toNumber(impuestoPorUnidad, 0),
      cantidadUnidadMedida: toNumber(cantidadUnidadMedida, 0),
      volumenPorUnidadConsumo: toNumber(volumenPorUnidadConsumo, 0),
      proporcion: toNumber(proporcion, 0),
      // Exoneración
      tieneExoneracion: Boolean(tieneExoneracion),
      documentoExoneracion: documentoExoneracion || '',
      detalleExoneracion: String(detalleExoneracion || '').trim(),
      numeroDocumentoExoneracion: toInt(numeroDocumentoExoneracion, 0),
      articuloExoneracion: String(articuloExoneracion || '').trim(),
      incisoExoneracion: String(incisoExoneracion || '').trim(),
      institucionExoneracion: institucionExoneracion || '',
      detalleInstitucionExoneracion: String(detalleInstitucionExoneracion || '').trim(),
      fechaAutorizacionExoneracion: String(fechaAutorizacionExoneracion || '').trim(),
      porcentajeExoneracion: toNumber(porcentajeExoneracion, 0),
      montoExportacion: toNumber(montoExportacion, 0)
    }

    // Agregar detalleSurtido si se proporciona
    if (detalleSurtido && Array.isArray(detalleSurtido)) {
      updateData.detalleSurtido = detalleSurtido.map((item: any) => ({
        cabys: String(item.cabys || '').trim(),
        titulo: String(item.titulo || '').trim(),
        descripcion: String(item.descripcion || '').trim(),
        tipo: String(item.tipo || '').trim(),
        precio: typeof item.precio === 'number' ? item.precio : parseFloat(String(item.precio || 0)),
        cantidad: typeof item.cantidad === 'number' ? item.cantidad : parseInt(String(item.cantidad || 0)),
        codigoComercial: String(item.codigoComercial || '').trim(),
        tipoCodigoComercial: String(item.tipoCodigoComercial || '').trim(),
        unidadMedida: String(item.unidadMedida || '').trim(),
        unidadMedidaComercial: String(item.unidadMedidaComercial || '').trim(),
        montoDescuento: typeof item.montoDescuento === 'number' ? item.montoDescuento : parseFloat(String(item.montoDescuento || 0)),
        codigoDescuento: String(item.codigoDescuento || '').trim(),
        detalleDescuento: String(item.detalleDescuento || '').trim(),
        ivaCobradoFabrica: typeof item.ivaCobradoFabrica === 'number' ? item.ivaCobradoFabrica : parseFloat(String(item.ivaCobradoFabrica || 0)),
        baseImponible: typeof item.baseImponible === 'number' ? item.baseImponible : parseFloat(String(item.baseImponible || 0)),
        codigoImpuesto: String(item.codigoImpuesto || '').trim(),
        detalleImpuesto: String(item.detalleImpuesto || '').trim(),
        tipoTarifa: String(item.tipoTarifa || '').trim(),
        tarifa: typeof item.tarifa === 'number' ? item.tarifa : parseFloat(String(item.tarifa || 0)),
        cantidadUnidadMedida: typeof item.cantidadUnidadMedida === 'number' ? item.cantidadUnidadMedida : parseFloat(String(item.cantidadUnidadMedida || 0)),
        porcentajeEspecifico: typeof item.porcentajeEspecifico === 'number' ? item.porcentajeEspecifico : parseFloat(String(item.porcentajeEspecifico || 0)),
        proporcion: typeof item.proporcion === 'number' ? item.proporcion : parseFloat(String(item.proporcion || 0)),
        volumenPorUnidadConsumo: typeof item.volumenPorUnidadConsumo === 'number' ? item.volumenPorUnidadConsumo : parseFloat(String(item.volumenPorUnidadConsumo || 0)),
        impuestoPorUnidad: typeof item.impuestoPorUnidad === 'number' ? item.impuestoPorUnidad : parseFloat(String(item.impuestoPorUnidad || 0))
      }))
    }

    // Log para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('Datos preparados para actualizar:', JSON.stringify(updateData, null, 2))
    }

    const result = await withDB(async () => {
      // Verificar que el documento existe
      const existingInventario = await Inventario.findById(id)

      if (!existingInventario) {
        throw new Error('Artículo de inventario no encontrado')
      }

      // Usar findByIdAndUpdate con $set para asegurar que todos los campos se actualicen
      // Esto es más confiable que Object.assign o set() cuando hay campos nuevos
      const updatedInventario = await Inventario.findByIdAndUpdate(
        id,
        { $set: updateData },
        {
          new: true,
          runValidators: true,
          setDefaultsOnInsert: false,
          overwrite: false
        }
      )

      if (!updatedInventario) {
        throw new Error('Error al actualizar el artículo')
      }

      const updatedData = updatedInventario.toObject()

      // Log para debugging (solo en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        console.log('Inventario actualizado:', JSON.stringify(updatedData, null, 2))
      }

      return updatedData
    })

    if (!result.success) {
      console.error('Error al actualizar inventario:', result.error)
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Artículo de inventario no encontrado' ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Artículo actualizado exitosamente',
      inventario: result.data
    })

  } catch (error: any) {
    console.error('Error updating inventario:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error.message
      },
      { status: 500 }
    )
  }
}

// DELETE /api/inventario/[id] - Eliminar artículo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  if (!isValidObjectId(id)) {
    return NextResponse.json(
      { error: 'ID inválido' },
      { status: 400 }
    )
  }

  const result = await withDB(async () => {
    const deletedInventario = await Inventario.findByIdAndDelete(id)

    if (!deletedInventario) {
      throw new Error('Artículo de inventario no encontrado')
    }

    return { message: 'Artículo eliminado exitosamente' }
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error === 'Artículo de inventario no encontrado' ? 404 : 500 }
    )
  }

  return NextResponse.json(result.data)
}