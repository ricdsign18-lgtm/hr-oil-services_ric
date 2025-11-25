// src/components/modules/administracion/submodules/gastos-administrativos/submodules/compra-facturacion/submodules/compras-sin-factura/components/CompraSinFacturaForm.jsx
import { useState, useEffect } from 'react'
import supabase from '../../../../../../../../../../api/supaBase'
import { useNotification } from '../../../../../../../../../../contexts/NotificationContext'
import FeedbackModal from '../../../../../../../../../common/FeedbackModal/FeedbackModal'
import '../ComprasSinFacturaMain.css'

const ComprasSinFacturaForm = ({ projectId, onCompraSaved, compraEdit, onCancelEdit }) => {
  const { showToast } = useNotification();
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
  
  // Modales
  const [showProveedorModal, setShowProveedorModal] = useState(false)
  const [showCategoriaModal, setShowCategoriaModal] = useState(false)
  const [showModoPagoModal, setShowModoPagoModal] = useState(false)

  const [nuevoProveedor, setNuevoProveedor] = useState({
    nombre: '',
    tipoRif: 'J-',
    rif: '',
    direccion: ''
  })
  const tiposRif = ['J-', 'V-', 'E-', 'P-', 'G-']

  const [feedback, setFeedback] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

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

  const handleCloseFeedback = () => {
    setFeedback(prev => ({ ...prev, isOpen: false }));
    if (feedback.type === 'success') {
        // If success, we might want to trigger the parent callback after closing modal
    }
  };

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
        showToast('Error al guardar la nueva categoría: ' + error.message, 'error')
      } else {
        const nuevasCategorias = [...categorias, nuevaCategoria]
        setCategorias(nuevasCategorias)
        setFormData(prev => ({ ...prev, categoria: nuevaCategoria }))
        setNuevaCategoria('')
        setShowCategoriaModal(false)
        showToast('Categoría guardada exitosamente.', 'success')
      }
    }
  }

  const agregarModoPago = async () => {
    if (nuevoModoPago && !modosPago.includes(nuevoModoPago)) {
      const { error } = await supabase.from('modos_pago').insert({ nombre: nuevoModoPago })
      if (error) {
        showToast('Error al guardar el nuevo modo de pago: ' + error.message, 'error')
      } else {
        const nuevosModosPago = [...modosPago, nuevoModoPago]
        setModosPago(nuevosModosPago)
        setFormData(prev => ({ ...prev, modoPago: nuevoModoPago }))
        setNuevoModoPago('')
        setShowModoPagoModal(false)
        showToast('Modo de pago guardado exitosamente.', 'success')
      }
    }
  }

  const agregarProveedor = async () => {
    if (!nuevoProveedor.nombre.trim() || !nuevoProveedor.rif.trim()) {
      showToast('Por favor complete nombre y RIF del proveedor', 'error')
      return
    }

    try {
      const proveedorData = {
        projectid: projectId,
        nombre: nuevoProveedor.nombre.trim(),
        tiporif: nuevoProveedor.tipoRif,
        rif: nuevoProveedor.rif.trim(),
        direccion: nuevoProveedor.direccion.trim()
      }

      const { error } = await supabase
        .from('proveedores')
        .insert([proveedorData])

      if (error) throw error

      // Reload providers
      console.log('Recargando proveedores para projectid:', projectId);
      const { data: provData, error: reloadError } = await supabase
        .from('proveedores')
        .select('*')
        .eq('projectid', projectId)
      
      if (reloadError) {
        console.error('Error recargando proveedores:', reloadError);
      } else {
        console.log('Proveedores recargados:', provData);
        if (provData) setProveedores(provData)
      }

      // Auto-fill form with new provider
      setFormData(prev => ({
        ...prev,
        proveedor: nuevoProveedor.nombre.trim(),
        tipoRif: nuevoProveedor.tipoRif,
        rif: nuevoProveedor.rif.trim(),
        direccion: nuevoProveedor.direccion.trim()
      }))

      // Reset and close modal
      setNuevoProveedor({
        nombre: '',
        tipoRif: 'J-',
        rif: '',
        direccion: ''
      })
      setShowProveedorModal(false)
      showToast('Proveedor agregado exitosamente', 'success')
    } catch (error) {
      console.error('Error adding proveedor:', error)
      showToast('Error al agregar proveedor', 'error')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
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

      setFeedback({
        isOpen: true,
        type: 'success',
        title: compraEdit ? 'Compra Actualizada' : 'Compra Guardada',
        message: compraEdit ? 'La compra ha sido actualizada exitosamente.' : 'La compra ha sido guardada exitosamente.'
      });
    } catch (error) {
      console.error('Error al guardar compra:', error)
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: `Error al guardar la compra: ${error.message}. Por favor, intente nuevamente.`
      });
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
              <div className="input-with-button">
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
                <button 
                  type="button" 
                  onClick={() => setShowCategoriaModal(true)}
                  className="btn-add-inline"
                  title="Agregar nueva categoría"
                >
                  +
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>SUBCATEGORÍAS (DESTINO DE COMPRA)</label>
              {formData.subcategorias.map((sub, index) => (
                <div key={index} className="subcategoria-input-group" style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={sub}
                    onChange={(e) => handleSubcategoriaChange(index, e.target.value)}
                    placeholder={`Subcategoría ${index + 1}`}
                    style={{ flex: 1 }}
                  />
                  {formData.subcategorias.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSubcategoria(index)}
                      className="btn-remove-subcategory"
                      title="Eliminar subcategoría"
                    >
                      -
                    </button>
                  )}
                  {index === formData.subcategorias.length - 1 && (
                    <button
                      type="button"
                      onClick={addSubcategoria}
                      className="btn-add-inline"
                      title="Añadir Subcategoría"
                    >
                      +
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="form-group">
              <label>PROVEEDOR *</label>
              <div className="input-with-button">
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
                <button 
                  type="button" 
                  onClick={() => setShowProveedorModal(true)}
                  className="btn-add-inline"
                  title="Agregar nuevo proveedor"
                >
                  +
                </button>
              </div>
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
              <div className="input-with-button">
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
                <button 
                  type="button" 
                  onClick={() => setShowModoPagoModal(true)}
                  className="btn-add-inline"
                  title="Agregar nuevo modo de pago"
                >
                  +
                </button>
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

      {/* Modal Agregar Proveedor */}
      {showProveedorModal && (
        <div className="modal-overlay" onClick={() => setShowProveedorModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Agregar Nuevo Proveedor</h3>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setShowProveedorModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>NOMBRE DEL PROVEEDOR *</label>
                <input
                  type="text"
                  value={nuevoProveedor.nombre}
                  onChange={(e) => setNuevoProveedor(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre del proveedor"
                />
              </div>
              <div className="form-group">
                <label>RIF *</label>
                <div className="rif-input">
                  <select
                    value={nuevoProveedor.tipoRif}
                    onChange={(e) => setNuevoProveedor(prev => ({ ...prev, tipoRif: e.target.value }))}
                  >
                    {tiposRif.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={nuevoProveedor.rif}
                    onChange={(e) => setNuevoProveedor(prev => ({ ...prev, rif: e.target.value }))}
                    placeholder="Número de RIF"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>DIRECCIÓN</label>
                <input
                  type="text"
                  value={nuevoProveedor.direccion}
                  onChange={(e) => setNuevoProveedor(prev => ({ ...prev, direccion: e.target.value }))}
                  placeholder="Dirección del proveedor"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-primary" 
                onClick={agregarProveedor}
              >
                Guardar Proveedor
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowProveedorModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Categoría */}
      {showCategoriaModal && (
        <div className="modal-overlay" onClick={() => setShowCategoriaModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Agregar Nueva Categoría</h3>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setShowCategoriaModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>NOMBRE DE LA CATEGORÍA *</label>
                <input
                  type="text"
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                  placeholder="Nombre de la categoría"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarCategoria())}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-primary" 
                onClick={agregarCategoria}
              >
                Guardar Categoría
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowCategoriaModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Modo de Pago */}
      {showModoPagoModal && (
        <div className="modal-overlay" onClick={() => setShowModoPagoModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Agregar Nuevo Modo de Pago</h3>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setShowModoPagoModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>NOMBRE DEL MODO DE PAGO *</label>
                <input
                  type="text"
                  value={nuevoModoPago}
                  onChange={(e) => setNuevoModoPago(e.target.value)}
                  placeholder="Ej: Zelle, Efectivo, Transferencia..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarModoPago())}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-primary" 
                onClick={agregarModoPago}
              >
                Guardar Modo de Pago
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowModoPagoModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={handleCloseFeedback}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </div>
  )
}

export default ComprasSinFacturaForm