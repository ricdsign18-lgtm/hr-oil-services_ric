// src/components/modules/administracion/submodules/gastos-administrativos/submodules/compra-facturacion/submodules/compras-con-factura/components/FacturaForm.jsx
import React, { useState, useEffect, useCallback } from 'react'
import RetencionesCalculator from './RetencionesCalculator'
import supabase from '../../../../../../../../../../api/supaBase.js'

const FacturaForm = ({ projectId, onFacturaSaved, facturaEdit, onCancelEdit }) => {
  const [formData, setFormData] = useState({
    categoria: '',
    subcategorias: [''], // Changed to array
    proveedor: '',
    tipoRif: 'J-',
    rif: '',
    direccion: '',
    fechaFactura: '',
    fechaRecibida: '',
    numeroFactura: '',
    numeroControl: '',
    descripcion: '',
    excento: 0,
    baseImponible: 0,
    iva: 0,
    subTotalPagar: 0,
    tasaPago: 0,
    subTotalDolares: 0,
    retencionIva: '',
    conceptoIslr: '',
    retencionIslr: 0,
    totalPagar: 0,
    totalPagarDolares: 0,
    pagado: '',
    montoPagado: 0,
    pagadoDolares: 0,
    retencionPorCobrar: 0,
    retencionCobrada: 0,
    modoPago: '',
    obraContrato: '',
    observaciones: ''
  })

  const [categorias, setCategorias] = useState([])
  const [modosPago, setModosPago] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [availableSubcategorias, setAvailableSubcategorias] = useState([])

  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [nuevoModoPago, setNuevoModoPago] = useState('')
  const tiposRif = ['J-', 'V-', 'E-', 'P-', 'G-']

  // Cargar datos de edición si existe
  useEffect(() => {
    if (facturaEdit) {
      console.log('Cargando datos de edición:', facturaEdit)
      // Ensure subcategorias is an array when loading for edit
      setFormData({
        ...facturaEdit,
        subcategorias: Array.isArray(facturaEdit.subcategorias)
          ? facturaEdit.subcategorias
          : (facturaEdit.subcategoria ? [facturaEdit.subcategoria] : [''])
      })
    } else {
      // Resetear formulario para nueva factura
      setFormData({
        categoria: '',
        subcategorias: [''], // Changed to array
        proveedor: '',
        tipoRif: 'J-',
        rif: '',
        direccion: '',
        fechaFactura: '',
        fechaRecibida: '',
        numeroFactura: '',
        numeroControl: '',
        descripcion: '',
        excento: 0,
        baseImponible: 0,
        iva: 0,
        subTotalPagar: 0,
        tasaPago: 0,
        subTotalDolares: 0,
        retencionIva: '',
        conceptoIslr: '',
        retencionIslr: 0,
        totalPagar: 0,
        totalPagarDolares: 0,
        pagado: '',
        montoPagado: 0,
        pagadoDolares: 0,
        retencionPorCobrar: 0,
        retencionCobrada: 0,
        modoPago: '',
        obraContrato: '',
        observaciones: ''
      })
    }
  }, [facturaEdit])

  useEffect(() => {
    // Calcular IVA automáticamente (16% de la base imponible)
    const ivaCalculado = (formData.baseImponible || 0) * 0.16
    // El excento se suma al subtotal a pagar
    const subTotalPagar = (formData.baseImponible || 0) + ivaCalculado + (formData.excento || 0)
    const subTotalDolares = formData.tasaPago > 0 ? subTotalPagar / formData.tasaPago : 0

    setFormData(prev => ({
      ...prev,
      iva: ivaCalculado,
      subTotalPagar: subTotalPagar,
      subTotalDolares: subTotalDolares
    }))
  }, [formData.baseImponible, formData.excento, formData.tasaPago])

  // Cargar categorías, modos de pago y proveedores desde la BD
  useEffect(() => {
    const fetchData = async () => {
      // Cargar Categorías
      const { data: catData, error: catError } = await supabase.from('categorias_compras').select('nombre')
      if (catError) console.error('Error cargando categorías:', catError)
      else setCategorias(catData.map(c => c.nombre))

      // Cargar Modos de Pago
      const { data: modoData, error: modoError } = await supabase.from('modos_pago').select('nombre')
      if (modoError) console.error('Error cargando modos de pago:', modoError)
      else setModosPago(modoData.map(m => m.nombre))

      // Cargar Proveedores
      if (projectId) {
        const { data: provData, error: provError } = await supabase
          .from('proveedores')
          .select('*')
          .eq('projectid', projectId)

        if (provError) console.error('Error cargando proveedores:', provError)
        else setProveedores(provData)
      }

      // Cargar Subcategorías existentes
      const { data: subData, error: subError } = await supabase
        .from('facturas')
        .select('subcategorias')

      if (subError) {
        console.error('Error cargando subcategorías:', subError)
      } else if (subData) {
        const allSubs = subData.flatMap(f => f.subcategorias || [])
        const uniqueSubs = [...new Set(allSubs)].filter(Boolean).sort()
        setAvailableSubcategorias(uniqueSubs)
      }
    }
    fetchData()
  }, [projectId])

  // Cargar datos de edición si existe
  useEffect(() => {
    if (facturaEdit) {
      setFormData({
        ...facturaEdit,
        subcategorias: Array.isArray(facturaEdit.subcategorias) ? facturaEdit.subcategorias : (facturaEdit.subcategoria ? [facturaEdit.subcategoria] : [''])
      })
    }
  }, [facturaEdit])

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleProveedorChange = (e) => {
    const nombre = e.target.value
    const proveedorExistente = proveedores.find(p => p.nombre.toLowerCase() === nombre.toLowerCase())

    if (proveedorExistente) {
      setFormData(prev => ({
        ...prev,
        proveedor: proveedorExistente.nombre,
        tipoRif: proveedorExistente.tiporif,
        rif: proveedorExistente.rif,
        direccion: proveedorExistente.direccion || ''
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        proveedor: nombre
      }))
    }
  }

  const handleSubcategoriaChange = (index, value) => {
    const newSubcategorias = [...formData.subcategorias]
    newSubcategorias[index] = value
    setFormData(prev => ({ ...prev, subcategorias: newSubcategorias }))
  }

  const addSubcategoria = () => {
    setFormData(prev => ({ ...prev, subcategorias: [...prev.subcategorias, ''] }))
  }

  const removeSubcategoria = (index) => {
    const newSubcategorias = formData.subcategorias.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, subcategorias: newSubcategorias.length > 0 ? newSubcategorias : [''] }))
  }

  const agregarCategoria = async () => {
    if (nuevaCategoria && !categorias.includes(nuevaCategoria)) {
      const { error } = await supabase.from('categorias_compras').insert({ nombre: nuevaCategoria })
      if (error) {
        alert('Error al guardar la nueva categoría: ' + error.message)
      } else {
        const nuevasCategorias = [...categorias, nuevaCategoria]
        setCategorias(nuevasCategorias)
        setFormData(prev => ({ ...prev, categoria: nuevaCategoria }))
        setNuevaCategoria('')
        alert('Categoría guardada exitosamente.')
      }
    }
  }

  const agregarModoPago = async () => {
    if (nuevoModoPago && !modosPago.includes(nuevoModoPago)) {
      const { error } = await supabase.from('modos_pago').insert({ nombre: nuevoModoPago })
      if (error) {
        alert('Error al guardar el nuevo modo de pago: ' + error.message)
      } else {
        const nuevosModosPago = [...modosPago, nuevoModoPago]
        setModosPago(nuevosModosPago)
        setFormData(prev => ({ ...prev, modoPago: nuevoModoPago }))
        setNuevoModoPago('')
        alert('Modo de pago guardado exitosamente.')
      }
    }
  }

  const handleRetencionesChange = useCallback((nuevasRetenciones) => {
    console.log('Nuevas retenciones:', nuevasRetenciones)
    setFormData(prev => ({
      ...prev,
      ...nuevasRetenciones
    }))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!projectId) {
      alert('Error: No se ha seleccionado un proyecto. Por favor, regrese y seleccione un proyecto.')
      return
    }
    try {
      // Calcular nuevos totales para el proveedor
      let newTotalFacturas = 0
      let newTotalGastado = 0

      // Obtener datos actuales del proveedor si existe
      const { data: existingProv } = await supabase
        .from('proveedores')
        .select('total_facturas, total_gastado_dolares')
        .eq('projectid', projectId)
        .eq('tiporif', formData.tipoRif)
        .eq('rif', formData.rif)
        .single()

      if (existingProv) {
        newTotalFacturas = existingProv.total_facturas || 0
        newTotalGastado = existingProv.total_gastado_dolares || 0
      }

      // Si es una nueva factura (no edición), incrementar contadores
      if (!facturaEdit) {
        newTotalFacturas += 1
        newTotalGastado += (formData.subTotalDolares || 0)
      }

      // Guardar o actualizar proveedor
      const proveedorData = {
        projectid: projectId,
        nombre: formData.proveedor,
        tiporif: formData.tipoRif,
        rif: formData.rif,
        direccion: formData.direccion,
        total_facturas: newTotalFacturas,
        total_gastado_dolares: newTotalGastado,
        updatedat: new Date().toISOString()
      }

      // Upsert proveedor (inserta si no existe conflicto con projectid, tiporif, rif)
      const { error: provError } = await supabase
        .from('proveedores')
        .upsert(proveedorData, { onConflict: 'projectid, tiporif, rif' })

      if (provError) {
        console.error('Error al guardar proveedor:', provError)
      } else {
        // Recargar proveedores
        const { data: newProvs } = await supabase
          .from('proveedores')
          .select('*')
          .eq('projectid', projectId)
        if (newProvs) setProveedores(newProvs)
      }

      const cleanedFormData = { ...formData }
      // Remove id, createdAt, updatedAt, status if they are not part of the insert/update payload
      delete cleanedFormData.id
      delete cleanedFormData.createdAt
      delete cleanedFormData.updatedAt
      delete cleanedFormData.status

      let data, error

      if (facturaEdit) {
        // Modo edición
        ({ data, error } = await supabase
          .from('facturas')
          .update({ ...cleanedFormData, updatedAt: new Date().toISOString() })
          .eq('id', facturaEdit.id))
      } else {
        // Modo creación
        ({ data, error } = await supabase
          .from('facturas')
          .insert({
            ...cleanedFormData,
            projectId: projectId,
            createdAt: new Date().toISOString(),
            status: 'active'
          }))
      }

      if (error) throw error

      // Actualizar lista de subcategorías disponibles
      const nuevasSubcategorias = formData.subcategorias.filter(s => s && !availableSubcategorias.includes(s))
      if (nuevasSubcategorias.length > 0) {
        setAvailableSubcategorias(prev => [...prev, ...nuevasSubcategorias].sort())
      }

      onFacturaSaved()

      // Reset form solo si no estamos editando
      if (!facturaEdit) {
        setFormData({
          categoria: '',
          subcategorias: [''], // Reset to array
          proveedor: '',
          tipoRif: 'J-',
          rif: '',
          direccion: '',
          fechaFactura: '',
          fechaRecibida: '',
          numeroFactura: '',
          numeroControl: '',
          descripcion: '',
          excento: 0,
          baseImponible: 0,
          iva: 0,
          subTotalPagar: 0,
          tasaPago: 0,
          subTotalDolares: 0,
          retencionIva: '',
          conceptoIslr: '',
          retencionIslr: 0,
          totalPagar: 0,
          totalPagarDolares: 0,
          pagado: '',
          montoPagado: 0,
          pagadoDolares: 0,
          retencionPorCobrar: 0,
          retencionCobrada: 0,
          modoPago: '',
          obraContrato: '',
          observaciones: ''
        })
      }

      alert(facturaEdit ? 'Factura actualizada exitosamente' : 'Factura guardada exitosamente')
    } catch (error) {
      console.error('Error al guardar factura:', error)
      alert(`Error al guardar la factura: ${error.message}. Por favor, intente nuevamente.`)
    }
  }

  return (
    <div className="factura-form">
      <div className="form-header">
        <h3>{facturaEdit ? 'Editar Factura' : 'Nueva Factura'}</h3>
        {facturaEdit && (
          <button type="button" className="btn-secondary" onClick={onCancelEdit}>
            Cancelar Edición
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Información General</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>CATEGORÍA *</label>
              <div className="select-with-add">
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="add-new-input">
                  <input
                    type="text"
                    placeholder="Nueva categoría..."
                    value={nuevaCategoria}
                    onChange={(e) => setNuevaCategoria(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarCategoria())}
                  />
                  <button type="button" onClick={agregarCategoria}>+</button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>SUBCATEGORÍAS</label>
              {formData.subcategorias.map((sub, index) => (
                <div key={index} className="subcategoria-input-group">
                  <input
                    type="text"
                    value={sub}
                    onChange={(e) => handleSubcategoriaChange(index, e.target.value)}
                    placeholder={`Subcategoría ${index + 1}`}
                    list="subcategorias-list-facturas"
                    autoComplete="off"
                  />
                  {formData.subcategorias.length > 1 && (
                    <button type="button" onClick={() => removeSubcategoria(index)} className="btn-remove-subcategory">-</button>
                  )}
                </div>
              ))}
              <datalist id="subcategorias-list-facturas">
                {availableSubcategorias.map((sub, index) => (
                  <option key={index} value={sub} />
                ))}
              </datalist>
              <button type="button" onClick={addSubcategoria} className="btn-add-subcategory">+ Añadir Subcategoría</button>
            </div>

            <div className="form-group">
              <label>PROVEEDOR *</label>
              <input
                type="text"
                list="proveedores-list"
                name="proveedor"
                value={formData.proveedor}
                onChange={handleProveedorChange}
                required
                placeholder="Nombre del proveedor"
                autoComplete="off"
              />
              <datalist id="proveedores-list">
                {proveedores.map((prov, index) => (
                  <option key={index} value={prov.nombre} />
                ))}
              </datalist>
            </div>

            <div className="form-group">
              <label>RIF *</label>
              <div className="rif-input">
                <select
                  name="tipoRif"
                  value={formData.tipoRif}
                  onChange={handleInputChange}
                >
                  {tiposRif.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
                <input
                  type="text"
                  name="rif"
                  value={formData.rif}
                  onChange={handleInputChange}
                  required
                  placeholder="Número de RIF"
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label>DIRECCIÓN</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                placeholder="Dirección del proveedor"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Datos de la Factura</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>FECHA DE LA FACTURA *</label>
              <input
                type="date"
                name="fechaFactura"
                value={formData.fechaFactura}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>FECHA DE RECIBIDA</label>
              <input
                type="date"
                name="fechaRecibida"
                value={formData.fechaRecibida}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>NÚMERO DE FACTURA *</label>
              <input
                type="text"
                name="numeroFactura"
                value={formData.numeroFactura}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>NÚMERO DE CONTROL</label>
              <input
                type="text"
                name="numeroControl"
                value={formData.numeroControl}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group full-width">
              <label>DESCRIPCIÓN DE LA FACTURA</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                rows="3"
                placeholder="Descripción detallada de la factura"
              />
            </div>

            <div className="form-group full-width">
              <label>OBSERVACIONES</label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                rows="2"
                placeholder="Observaciones adicionales"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Valores de la Factura (en Bolívares)</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>EXCENTO (Bs)</label>
              <input
                type="number"
                step="0.01"
                name="excento"
                value={formData.excento}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>BASE IMPONIBLE (Bs) *</label>
              <input
                type="number"
                step="0.01"
                name="baseImponible"
                value={formData.baseImponible}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>IVA (16%) (Bs)</label>
              <div className="readonly-value">{formData.iva.toFixed(2)}</div>
            </div>

            <div className="form-group">
              <label>SUB TOTAL A PAGAR (Bs)</label>
              <div className="readonly-value">{formData.subTotalPagar.toFixed(2)}</div>
            </div>

            <div className="form-group">
              <label>TASA DE PAGO (Bs/$)</label>
              <input
                type="number"
                step="0.01"
                name="tasaPago"
                value={formData.tasaPago}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>SUB TOTAL A PAGAR ($)</label>
              <div className="readonly-value">{formData.subTotalDolares.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Componente RetencionesCalculator */}
        <RetencionesCalculator
          formData={formData}
          onRetencionesChange={handleRetencionesChange}
        />

        <div className="form-section">
          <h3>Información de Pago</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>MODO DE PAGO</label>
              <div className="select-with-add">
                <select
                  name="modoPago"
                  value={formData.modoPago}
                  onChange={handleInputChange}
                >
                  <option value="">Seleccionar modo de pago</option>
                  {modosPago.map(modo => (
                    <option key={modo} value={modo}>{modo}</option>
                  ))}
                </select>
                <div className="add-new-input">
                  <input
                    type="text"
                    placeholder="Nuevo modo de pago..."
                    value={nuevoModoPago}
                    onChange={(e) => setNuevoModoPago(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarModoPago())}
                  />
                  <button type="button" onClick={agregarModoPago}>+</button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>OBRA / CONTRATO</label>
              <input
                type="text"
                name="obraContrato"
                value={formData.obraContrato}
                onChange={handleInputChange}
                placeholder="Referencia de obra o contrato"
              />
            </div>

            <div className="form-group">
              <label>MONTO PAGADO (Bs)</label>
              <div className="readonly-value">{formData.montoPagado.toFixed(2)}</div>
            </div>

            <div className="form-group">
              <label>PAGADO EN DÓLARES ($)</label>
              <div className="readonly-value">{formData.pagadoDolares.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {facturaEdit ? 'Actualizar Factura' : 'Guardar Factura'}
          </button>
          <button type="button" className="btn-secondary" onClick={onCancelEdit}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

export default FacturaForm