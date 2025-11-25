// src/components/modules/administracion/submodules/gastos-administrativos/submodules/compra-facturacion/submodules/compras-con-factura/components/FacturaForm.jsx
import React, { useState, useEffect, useCallback } from 'react'
import RetencionesCalculator from './RetencionesCalculator'
import supabase from '../../../../../../../../../../api/supaBase.js'
import { useNotification } from '../../../../../../../../../../contexts/NotificationContext'
import FeedbackModal from '../../../../../../../../../common/FeedbackModal/FeedbackModal'
import '../ComprasConFacturaMain.css'

const FacturaForm = ({ projectId, onFacturaSaved, facturaEdit, onCancelEdit }) => {
  const { showToast } = useNotification();
  const [formData, setFormData] = useState({
    categoria: '',
    subcategorias: [''],
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

  // Cargar datos de edición si existe
  useEffect(() => {
    if (facturaEdit) {
      console.log('Cargando datos de edición:', facturaEdit)
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
        subcategorias: [''],
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
    }
    fetchData()
  }, [projectId])

  const handleCloseFeedback = () => {
    setFeedback(prev => ({ ...prev, isOpen: false }));
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
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Error de Proyecto',
        message: 'No se ha seleccionado un proyecto. Por favor, regrese y seleccione un proyecto.'
      });
      return
    }
    try {
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

      onFacturaSaved()

      // Reset form solo si no estamos editando
      if (!facturaEdit) {
        setFormData({
          categoria: '',
          subcategorias: [''],
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

      setFeedback({
        isOpen: true,
        type: 'success',
        title: facturaEdit ? 'Factura Actualizada' : 'Factura Guardada',
        message: facturaEdit ? 'La factura ha sido actualizada exitosamente.' : 'La factura ha sido guardada exitosamente.'
      });
    } catch (error) {
      console.error('Error al guardar factura:', error)
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: `Error al guardar la factura: ${error.message}. Por favor, intente nuevamente.`
      });
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
              <label>SUBCATEGORÍAS</label>
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

export default FacturaForm