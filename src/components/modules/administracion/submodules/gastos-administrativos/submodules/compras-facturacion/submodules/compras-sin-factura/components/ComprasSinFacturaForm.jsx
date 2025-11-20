// src/components/modules/administracion/submodules/gastos-administrativos/submodules/compra-facturacion/submodules/compras-sin-factura/components/CompraSinFacturaForm.jsx
import  { useState, useEffect } from 'react'
import supabase from '../../../../../../../../../../api/supaBase'

const CompraSinFacturaForm = ({ projectId, onCompraSaved, compraEdit, onCancelEdit }) => {
  const [formData, setFormData] = useState({
    categoria: '',
    subcategorias: [''], 
    proveedor: '',
    tipoRif: 'J-',
    rif: '',
    direccion: '',
    fechaCompra: '',
    fechaRecibida: '',
    numeroNotaEntrega: '',
    descripcion: '',
    totalDolares: 0,
    tasaPago: 0,
    pagoBolivares: 0,
    modoPago: '',
    observaciones: '',
    contrato: ''
  })

  const [categorias, setCategorias] = useState([])
  const [modosPago, setModosPago] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [nuevoModoPago, setNuevoModoPago] = useState('')
  const tiposRif = ['J-', 'V-', 'E-', 'P-', 'G-']


  useEffect(() => {
    if (compraEdit) {
      console.log('Cargando datos de edición:', compraEdit)
      setFormData({
        ...compraEdit,
        subcategorias: Array.isArray(compraEdit.subcategorias)
          ? compraEdit.subcategorias
          : (compraEdit.subcategoria ? [compraEdit.subcategoria] : [''])
      })
    } else {
    
      setFormData({
        categoria: '',
        subcategorias: [''],
        proveedor: '',
        tipoRif: 'J-',
        rif: '',
        direccion: '',
        fechaCompra: '',
        fechaRecibida: '',
        numeroNotaEntrega: '',
        descripcion: '',
        totalDolares: 0,
        tasaPago: 0,
        pagoBolivares: 0,
        modoPago: '',
        observaciones: '',
        contrato: ''
      })
    }
  }, [compraEdit])

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
    }
    fetchData()
  }, [projectId])

  // Calcular total en dólares automáticamente
  useEffect(() => {
    const tasa = formData.tasaPago || 0
    const bolivares = formData.pagoBolivares || 0
    const totalDolares = tasa > 0 ? bolivares / tasa : 0
    setFormData(prev => ({
      ...prev,
      totalDolares: totalDolares
    }))
  }, [formData.pagoBolivares, formData.tasaPago])

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

  const handleSubmit = async (e) => {
    e.preventDefault()

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

      // Si es una nueva compra (no edición), incrementar contadores
      if (!compraEdit) {
        newTotalFacturas += 1
        newTotalGastado += (formData.totalDolares || 0)
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
     
      delete cleanedFormData.id
      delete cleanedFormData.createdAt
      delete cleanedFormData.updatedAt
      delete cleanedFormData.status

      let data, error

      if (compraEdit) {
      
        ({ data, error } = await supabase
          .from('compras_sin_factura')
          .update({ ...cleanedFormData, updatedAt: new Date().toISOString() })
          .eq('id', compraEdit.id))
      } else {
        // Modo creación
        ({ data, error } = await supabase
          //Aqui se insertan los datos de la compra-sin-factura
          .from('compras_sin_factura')
          .insert({
            ...cleanedFormData,
            projectId: projectId,
            createdAt: new Date().toISOString(),
            status: 'active'
          }))
      }

      if (error) throw error

      onCompraSaved()

      // Reset form solo si no estamos editando
      if (!compraEdit) {
        setFormData({
          categoria: '',
          subcategorias: [''],
          proveedor: '',
          tipoRif: 'J-',
          rif: '',
          direccion: '',
          fechaCompra: '',
          fechaRecibida: '',
          numeroNotaEntrega: '',
          descripcion: '',
          totalDolares: 0,
          tasaPago: 0,
          pagoBolivares: 0,
          modoPago: '',
          observaciones: '',
          contrato: ''
        })
      }

      alert(compraEdit ? 'Compra actualizada exitosamente' : 'Compra guardada exitosamente')
    } catch (error) {
      console.error('Error al guardar compra:', error)
      alert(`Error al guardar la compra: ${error.message}. Por favor, intente nuevamente.`)
    }
  }

  return (
    <div className="compra-sin-factura-form">
      <div className="form-header">
        <h3>{compraEdit ? 'Editar Compra' : 'Nueva Compra Sin Factura'}</h3>
        {compraEdit && (
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
              <label>SUBCATEGORÍAS (DESTINO DE COMPRA)</label>
              {formData.subcategorias.map((sub, index) => (
                <div key={index} className="subcategoria-input-group">
                  <input
                    type="text"
                    value={sub}
                    onChange={(e) => handleSubcategoriaChange(index, e.target.value)}
                    placeholder={`Subcategoría ${index + 1}`}
                  />
                  {formData.subcategorias.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSubcategoria(index)}
                      className="btn-remove-subcategory"
                    >
                      -
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addSubcategoria}
                className="btn-add-subcategory"
              >
                + Añadir Subcategoría
              </button>
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
              <label>RIF</label>
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
                  placeholder="Número de RIF (opcional)"
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
          <h3>Datos de la Compra</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>FECHA DE COMPRA *</label>
              <input
                type="date"
                name="fechaCompra"
                value={formData.fechaCompra}
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
              <label>Nº NOTA DE ENTREGA</label>
              <input
                type="text"
                name="numeroNotaEntrega"
                value={formData.numeroNotaEntrega}
                onChange={handleInputChange}
                placeholder="Número de nota de entrega"
              />
            </div>

            <div className="form-group full-width">
              <label>DESCRIPCIÓN COMPRA</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                rows="3"
                placeholder="Descripción detallada de la compra"
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
          <h3>Valores de la Compra</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>TASA DE PAGO (Bs/$)</label>
              <input
                type="number"
                step="0.01"
                name="tasaPago"
                value={formData.tasaPago}
                onChange={handleInputChange}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>PAGO EN BOLÍVARES (Bs) *</label>
              <input
                type="number"
                step="0.01"
                name="pagoBolivares"
                value={formData.pagoBolivares}
                onChange={handleInputChange}
                placeholder="0.00"
                required
              />
            </div>
            <div className="form-group">
              <label>TOTAL A PAGAR ($)</label>
              <div className="readonly-value">{formData.totalDolares.toFixed(2)}</div>
            </div>
          </div>
        </div>

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
              <label>CONTRATO</label>
              <input
                type="text"
                name="contrato"
                value={formData.contrato}
                onChange={handleInputChange}
                placeholder="Referencia de contrato"
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {compraEdit ? 'Actualizar Compra' : 'Guardar Compra'}
          </button>
          <button type="button" className="btn-secondary" onClick={onCancelEdit}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

export default CompraSinFacturaForm