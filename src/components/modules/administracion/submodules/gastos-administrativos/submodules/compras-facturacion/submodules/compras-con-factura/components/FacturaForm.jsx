// src/components/modules/administracion/submodules/gastos-administrativos/submodules/compra-facturacion/submodules/compras-con-factura/components/FacturaForm.jsx
import React, { useState, useEffect, useCallback } from 'react'
import RetencionesCalculator from './RetencionesCalculator'
import MultiBancoModal from '../../../components/MultiBancoModal'
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
    observaciones: '',
    valuacion: ''
  })

  const [categorias, setCategorias] = useState([])
  const [modosPago, setModosPago] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [valuaciones, setValuaciones] = useState([])
  const [availableSubcategorias, setAvailableSubcategorias] = useState([])

  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [nuevoModoPago, setNuevoModoPago] = useState('')

  // Modales
  const [isProveedorModalOpen, setIsProveedorModalOpen] = useState(false)
  const [showCategoriaModal, setShowCategoriaModal] = useState(false)
  const [showModoPagoModal, setShowModoPagoModal] = useState(false)
  const [showMultiBancoModal, setShowMultiBancoModal] = useState(false)
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
        observaciones: '',
        valuacion: ''
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

      // Cargar Proveedores (Global)
      const { data: provData, error: provError } = await supabase
        .from('proveedores')
        .select('*')

      if (provError) console.error('Error cargando proveedores:', provError)
      else setProveedores(provData)

      if (projectId) {
        // Cargar Valuaciones
        const { data: valData, error: valError } = await supabase
          .from('valuations')
          .select('valuation_number')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })

        if (valError) console.error('Error cargando valuaciones:', valError)
        else setValuaciones(valData.map(v => v.valuation_number))
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
  const handleModoPagoChange = (e) => {
    const value = e.target.value
    if (value === 'Multi-Banco') {
      setShowMultiBancoModal(true)
    } else {
      setFormData(prev => ({ ...prev, modoPago: value }))
    }
  }
  const handleMultiBancoConfirm = (multiBancoText) => {
    setFormData(prev => ({ ...prev, modoPago: multiBancoText }))
    setShowMultiBancoModal(false)
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
    if (nuevoProveedor.nombre) {
      const { data, error } = await supabase
        .from('proveedores')
        .insert({
          projectid: projectId,
          nombre: nuevoProveedor.nombre,
          tiporif: nuevoProveedor.tipoRif,
          rif: nuevoProveedor.rif,
          direccion: nuevoProveedor.direccion,
          total_facturas: 0,
          total_gastado_dolares: 0
        })
        .select()

      if (error) {
        showToast('Error al guardar el nuevo proveedor: ' + error.message, 'error')
      } else {
        const newProv = data[0]
        setProveedores(prev => [...prev, newProv])
        setFormData(prev => ({
          ...prev,
          proveedor: newProv.nombre,
          tipoRif: newProv.tiporif,
          rif: newProv.rif,
          direccion: newProv.direccion || ''
        }))
        setNuevoProveedor({
          nombre: '',
          tipoRif: 'J-',
          rif: '',
          direccion: ''
        })
        setShowProveedorModal(false)
        showToast('Proveedor guardado exitosamente.', 'success')
      }
    } else {
      showToast('El nombre del proveedor es obligatorio.', 'error')
    }
  }

  const handleRetencionesChange = (data) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

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
      // Calcular nuevos totales para el proveedor
      // Obtener datos actuales del proveedor si existe (Búsqueda GLOBAL por RIF)
      let existingProvQuery = supabase
        .from('proveedores')
        .select('id, total_facturas, total_gastado_dolares')
        .limit(1)
        .maybeSingle()

      // Si tenemos RIF, buscamos por RIF (prioridad)
      if (formData.rif && formData.rif.trim()) {
        existingProvQuery = existingProvQuery
          .eq('tiporif', formData.tipoRif)
          .eq('rif', formData.rif)
      } else {
        // Si no hay RIF, buscamos por Nombre exacto para evitar colisión de "sin rif"
        existingProvQuery = existingProvQuery
          .eq('nombre', formData.proveedor)
      }

      const { data: existingProv } = await existingProvQuery

      let newTotalFacturas = 0
      let newTotalGastado = 0
      let existingProvId = null

      if (existingProv) {
        existingProvId = existingProv.id
        newTotalFacturas = existingProv.total_facturas || 0
        newTotalGastado = existingProv.total_gastado_dolares || 0
      }

      // Si es una nueva factura (no edición), incrementar contadores
      if (!facturaEdit) {
        newTotalFacturas += 1
        newTotalGastado += (formData.subTotalDolares || 0)
      }

      const proveedorData = {
        nombre: formData.proveedor,
        tiporif: formData.tipoRif,
        rif: formData.rif,
        direccion: formData.direccion,
        total_facturas: newTotalFacturas,
        total_gastado_dolares: newTotalGastado,
        updatedat: new Date().toISOString()
      }

      // Si no existe, agregamos el projectId para la creación
      if (!existingProvId) {
        proveedorData.projectid = projectId
      }

      let provError

      if (existingProvId) {
        // ACTUALIZAR proveedor existente (GLOBAL)
        const { error } = await supabase
          .from('proveedores')
          .update(proveedorData)
          .eq('id', existingProvId)
        provError = error
      } else {
        // INSERTAR nuevo proveedor (con projectId actual)
        const { error } = await supabase
          .from('proveedores')
          .insert(proveedorData)
        provError = error
      }

      if (provError) {
        console.error('Error al guardar proveedor:', provError)
      } else {
        // Recargar proveedores (Global)
        const { data: newProvs } = await supabase
          .from('proveedores')
          .select('*')
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
          observaciones: '',
          valuacion: ''
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
    <div className="ccf-factura-form" id="factura-form-dark-mode" >
      <div className="ccf-form-header">
        <h3>{facturaEdit ? 'Editar Factura' : 'Nueva Factura'}</h3>
        {facturaEdit && (
          <button type="button" className="ccf-btn-secondary" onClick={onCancelEdit}>
            Cancelar Edición
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="ccf-form-section">
          <h3>Información General</h3>
          <div className="ccf-form-grid">
            <div className="ccf-form-group">
              <label>VALUACIÓN ASOCIADA</label>
              <input
                type="text"
                name="valuacion"
                value={formData.valuacion || ''}
                onChange={handleInputChange}
                list="valuaciones-list"
                placeholder="Seleccionar o escribir valuación"
              />
              <datalist id="valuaciones-list">
                {valuaciones.map((val, index) => (
                  <option key={index} value={val} />
                ))}
              </datalist>
            </div>

            <div className="ccf-form-group">
              <label>CATEGORÍA *</label>
              <div className="ccf-input-with-button">
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
                  className="ccf-btn-add-inline"
                  title="Agregar nueva categoría"
                >
                  +
                </button>
              </div>
            </div>

            <div className="ccf-form-group">
              <label>SUBCATEGORÍAS</label>
              {formData.subcategorias.map((sub, index) => (
                <div key={index} className="ccf-subcategoria-input-group" style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={sub}
                    onChange={(e) => handleSubcategoriaChange(index, e.target.value)}
                    placeholder={`Subcategoría ${index + 1}`}
                    list="subcategorias-list"
                    style={{ flex: 1 }}
                  />
                  {formData.subcategorias.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSubcategoria(index)}
                      className="ccf-btn-remove-subcategory"
                      title="Eliminar subcategoría"
                    >
                      -
                    </button>
                  )}
                  {index === formData.subcategorias.length - 1 && (
                    <button
                      type="button"
                      onClick={addSubcategoria}
                      className="ccf-btn-add-inline"
                      title="Añadir Subcategoría"
                    >
                      +
                    </button>
                  )}
                </div>
              ))}
              <datalist id="subcategorias-list">
                {availableSubcategorias.map((sub, index) => (
                  <option key={index} value={sub} />
                ))}
              </datalist>
            </div>

            <div className="ccf-form-group">
              <label>PROVEEDOR *</label>
              <div className="ccf-input-with-button">
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
                  onClick={() => setIsProveedorModalOpen(true)}
                  className="ccf-btn-add-inline"
                  title="Agregar nuevo proveedor"
                >
                  +
                </button>
              </div>
            </div>

            <div className="ccf-form-group">
              <label>RIF *</label>
              <div className="ccf-rif-input">
                <select
                  name="tipoRif"
                  value={formData.tipoRif}
                  onChange={handleInputChange}
                >
                  <option value="J-">J-</option>
                  <option value="V-">V-</option>
                  <option value="G-">G-</option>
                  <option value="E-">E-</option>
                  <option value="P-">P-</option>
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

            <div className="ccf-form-group full-width">
              <label>DIRECCIÓN</label>
              <textarea
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                className="direccion-input"
                placeholder="Dirección fiscal del proveedor"
              />
            </div>
          </div>
        </div>

        <div className="ccf-form-section">
          <h3>Datos de la Factura</h3>
          <div className="ccf-form-grid">
            <div className="ccf-form-group">
              <label>FECHA DE LA FACTURA *</label>
              <input
                type="date"
                name="fechaFactura"
                value={formData.fechaFactura}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="ccf-form-group">
              <label>FECHA DE RECIBIDA</label>
              <input
                type="date"
                name="fechaRecibida"
                value={formData.fechaRecibida}
                onChange={handleInputChange}
              />
            </div>

            <div className="ccf-form-group">
              <label>NÚMERO DE FACTURA *</label>
              <input
                type="text"
                name="numeroFactura"
                value={formData.numeroFactura}
                onChange={handleInputChange}
                required
                placeholder="Ej: 000123"
              />
            </div>

            <div className="ccf-form-group">
              <label>NÚMERO DE CONTROL</label>
              <input
                type="text"
                name="numeroControl"
                value={formData.numeroControl}
                onChange={handleInputChange}
                placeholder="Ej: 00-00123456"
              />
            </div>

            <div className="ccf-form-group full-width">
              <label>DESCRIPCIÓN DE LA FACTURA</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                rows="3"
                placeholder="Descripción detallada de la factura"
              />
            </div>

            <div className="ccf-form-group full-width">
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

        <div className="ccf-form-section">
          <h3>Valores de la Factura (en Bolívares)</h3>
          <div className="ccf-form-grid">
            <div className="ccf-form-group">
              <label>EXCENTO (Bs)</label>
              <input
                type="number"
                step="0.01"
                name="excento"
                value={formData.excento}
                onChange={handleInputChange}
              />
            </div>

            <div className="ccf-form-group">
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

            <div className="ccf-form-group">
              <label>IVA (16%) (Bs)</label>
              <div className="ccf-readonly-value">{formData.iva.toFixed(2)}</div>
            </div>

            <div className="ccf-form-group">
              <label>SUB TOTAL A PAGAR (Bs)</label>
              <div className="ccf-readonly-value">{formData.subTotalPagar.toFixed(2)}</div>
            </div>

            <div className="ccf-form-group">
              <label>TASA DE PAGO (Bs/$)</label>
              <input
                type="number"
                step="0.01"
                name="tasaPago"
                value={formData.tasaPago}
                onChange={handleInputChange}
              />
            </div>

            <div className="ccf-form-group">
              <label>SUB TOTAL A PAGAR ($)</label>
              <div className="ccf-readonly-value">{formData.subTotalDolares.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Componente RetencionesCalculator */}
        <RetencionesCalculator
          formData={formData}
          onRetencionesChange={handleRetencionesChange}
        />

        <div className="ccf-form-section">
          <h3>Información de Pago</h3>
          <div className="ccf-form-grid">
            <div className="ccf-form-group">
              <label>MODO DE PAGO</label>
              <div className="ccf-input-with-button">
                <select
                  name="modoPago"
                  value={formData.modoPago.startsWith('Multi-Banco') ? 'Multi-Banco' : formData.modoPago}
                  onChange={handleModoPagoChange}
                  className="modo-pago-select"
                >
                  <option value="">Seleccionar modo de pago</option>
                  <option value="Multi-Banco" style={{ backgroundColor: '#d4edda', color: '#155724', fontWeight: '600' }}>
                    Multi-Banco
                  </option>
                  {modosPago.map(modo => (
                    <option key={modo} value={modo}>{modo}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowModoPagoModal(true)}
                  className="ccf-btn-add-inline"
                  title="Agregar nuevo modo de pago"
                >
                  +
                </button>
              </div>
              {/* Vista previa de Multi-Banco */}
              {formData.modoPago && formData.modoPago.startsWith('Multi-Banco') && (
                <div className="multi-banco-preview" style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #e9ecef', fontSize: '0.9em' }}>
                  <strong style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Detalle de Pago:</strong>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {formData.modoPago.replace('Multi-Banco: ', '').split(', ').map((item, index) => (
                      <li key={index} style={{ marginBottom: '3px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{item.split(': ')[0]}</span>
                        <span style={{ fontWeight: '600' }}>{item.split(': ')[1]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="ccf-form-group">
              <label>OBRA / CONTRATO</label>
              <input
                type="text"
                name="obraContrato"
                value={formData.obraContrato}
                onChange={handleInputChange}
                placeholder="Referencia de obra o contrato"
              />
            </div>

            <div className="ccf-form-group">
              <label>MONTO PAGADO (Bs)</label>
              <div className="ccf-readonly-value">{formData.montoPagado.toFixed(2)}</div>
            </div>

            <div className="ccf-form-group">
              <label>PAGADO EN DÓLARES ($)</label>
              <div className="ccf-readonly-value">{formData.pagadoDolares.toFixed(2)}</div>
            </div>

            <div className="ccf-form-group">
              <label>VALUACIÓN</label>
              <input
                type="text"
                name="valuacion"
                value={formData.valuacion || ''}
                onChange={handleInputChange}
                placeholder="N° de Valuación"
              />
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
      {isProveedorModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProveedorModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Agregar Nuevo Proveedor</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setIsProveedorModalOpen(false)}
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
                onClick={() => setIsProveedorModalOpen(false)}
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
      {
        showModoPagoModal && (
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
        )
      }

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={handleCloseFeedback}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
      {/* Modal Multi-Banco */}
      <MultiBancoModal
        isOpen={showMultiBancoModal}
        onClose={() => setShowMultiBancoModal(false)}
        onConfirm={handleMultiBancoConfirm}
        montoTotal={formData.montoPagado}
        montoLabel="Monto Pagado"
      />
    </div >
  )
}

export default FacturaForm