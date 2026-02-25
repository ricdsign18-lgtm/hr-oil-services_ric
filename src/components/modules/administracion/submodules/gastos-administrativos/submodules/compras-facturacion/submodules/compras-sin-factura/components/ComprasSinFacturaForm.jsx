import { useState, useEffect } from 'react'
import supabase from '../../../../../../../../../../api/supaBase'
import { useNotification } from '../../../../../../../../../../contexts/NotificationContext'
import FeedbackModal from '../../../../../../../../../common/FeedbackModal/FeedbackModal'
import MultiBancoModal from '../../../components/MultiBancoModal';
import { AddIcon, DelateIcon, XIcon } from '../../../../../../../../../../assets/icons/Icons'

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
    totalDolares: '',
    tasaPago: '',
    pagoBolivares: '',
    modoPago: '',
    observaciones: '',
    contrato: ''
  })

  const [categorias, setCategorias] = useState([])
  const [modosPago, setModosPago] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [valuaciones, setValuaciones] = useState([])
  const [availableSubcategorias, setAvailableSubcategorias] = useState([])
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [nuevoModoPago, setNuevoModoPago] = useState('')
  const [showCategoriaModal, setShowCategoriaModal] = useState(false)
  const [showModoPagoModal, setShowModoPagoModal] = useState(false)
  const [showMultiBancoModal, setShowMultiBancoModal] = useState(false)
  const [showProveedorModal, setShowProveedorModal] = useState(false)

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
      setFormData({
        categoria: '',

        proveedor: '',
        tipoRif: 'J-',
        rif: '',
        direccion: '',
        fechaCompra: '',
        fechaRecibida: '',
        numeroNotaEntrega: '',
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
        totalDolares: '',
        tasaPago: '',
        pagoBolivares: '',
        modoPago: '',
        observaciones: '',
        contrato: ''
      })
    }
  }, [compraEdit])

  // Cargar categorías, modos de pago, proveedores y subcategorías desde la BD
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

      // Cargar Valuaciones
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

      // Cargar Subcategorías desde la tabla subcategorias_compras
      const { data: subData, error: subError } = await supabase
        .from('subcategorias_compras')
        .select('nombre')
        .order('nombre', { ascending: true })

      if (subError) {
        console.error('Error cargando subcategorías:', subError)
      } else if (subData) {
        setAvailableSubcategorias(subData.map(s => s.nombre))
      }
    }
    fetchData()
  }, [projectId])

  // Calcular total en dólares automáticamente
  useEffect(() => {
    const tasa = parseFloat(formData.tasaPago) || 0
    const bolivares = parseFloat(formData.pagoBolivares) || 0
    const totalDolares = tasa > 0 ? bolivares / tasa : ''
    setFormData(prev => ({
      ...prev,
      totalDolares: totalDolares
    }))
  }, [formData.pagoBolivares, formData.tasaPago])

  const handleCloseFeedback = () => {
    setFeedback(prev => ({ ...prev, isOpen: false }));
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    // Allow empty string for number inputs to show placeholder
    let newValue = value
    if (type === 'number') {
      newValue = value === '' ? '' : parseFloat(value)
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validación de Tasa de Pago
    if (!formData.tasaPago || formData.tasaPago <= 0) {
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Tasa de Pago Requerida',
        message: 'Debe ingresar una Tasa de Pago válida mayor a cero (0) para poder procesar la compra.'
      });
      return;
    }

    try {
      // 1. Guardar nuevas subcategorías si existen
      const nuevasSubcategorias = formData.subcategorias.filter(sub => sub && sub.trim() !== '' && !availableSubcategorias.includes(sub));

      if (nuevasSubcategorias.length > 0) {
        // Eliminar duplicados en las nuevas subcategorías
        const uniqueNuevas = [...new Set(nuevasSubcategorias)];

        const subcategoriasInsert = uniqueNuevas.map(nombre => ({
          nombre: nombre,
        }));

        const { error: subInsertError } = await supabase
          .from('subcategorias_compras')
          .insert(subcategoriasInsert);

        if (subInsertError) {
          console.error('Error al guardar nuevas subcategorías:', subInsertError);
          showToast(`Error al guardar subcategorías: ${subInsertError.message}`, 'error');
        } else {
          setAvailableSubcategorias(prev => [...prev, ...uniqueNuevas].sort());
        }
      }

      // Calcular nuevos totales para el proveedor
      let newTotalFacturas = 0
      let newTotalGastado = 0
      let existingProvId = null;

      // Obtener datos actuales del proveedor si existe (GLOBAL)
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
        // Si no hay RIF, buscamos por Nombre exacto para evitar colisión
        existingProvQuery = existingProvQuery
          .eq('nombre', formData.proveedor)
      }

      const { data: existingProv } = await existingProvQuery

      if (existingProv) {
        existingProvId = existingProv.id;
        newTotalFacturas = existingProv.total_facturas || 0
        newTotalGastado = existingProv.total_gastado_dolares || 0
      }

      // Si es una nueva compra (no edición), incrementar contadores
      if (!compraEdit) {
        newTotalFacturas += 1
        newTotalGastado += (formData.totalDolares || 0)
      }

      // Datos del proveedor
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

      let provError;

      if (existingProvId) {
        // Actualizar existente (GLOBAL)
        ({ error: provError } = await supabase
          .from('proveedores')
          .update(proveedorData)
          .eq('id', existingProvId));
      } else {
        // Insertar nuevo
        ({ error: provError } = await supabase
          .from('proveedores')
          .insert(proveedorData));
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

      const cleanedFormData = {
        ...formData,
        totalDolares: formData.totalDolares === '' ? 0 : formData.totalDolares,
        tasaPago: formData.tasaPago === '' ? 0 : formData.tasaPago,
        pagoBolivares: formData.pagoBolivares === '' ? 0 : formData.pagoBolivares
      }

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
          totalDolares: '',
          tasaPago: '',
          pagoBolivares: '',
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
    <div className="csf-form-card">
      <div className="csf-form-header">
        <h3>{compraEdit ? 'Editar Compra' : 'Nueva Compra Sin Factura'}</h3>
        {compraEdit && (
          <button type="button" className="btn-secondary" onClick={onCancelEdit}>
            Cancelar Edición
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="csf-form-section">
          <h3>Información General</h3>
          <div className="csf-form-grid">
            <div className="csf-form-group">
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

            <div className="csf-form-group">
              <label>CATEGORÍA *</label>
              <div className="csf-input-group">
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
                  <AddIcon fill="white" style={{ width: '20px', height: '20px' }} />
                </button>
              </div>
            </div>

            <div className="csf-form-group">
              <label>SUBCATEGORÍAS (DESTINO DE COMPRA)</label>
              {formData.subcategorias.map((sub, index) => (
                <div key={index} className="csf-input-group">
                  <input
                    type="text"
                    value={sub}
                    onChange={(e) => handleSubcategoriaChange(index, e.target.value)}
                    placeholder={`Subcategoría ${index + 1}`}
                    list="subcategorias-list"
                  />
                  {formData.subcategorias.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSubcategoria(index)}
                      className="btn-remove-subcategory"
                      title="Eliminar subcategoría"
                    >
                      <DelateIcon fill="var(--danger-color)" style={{ width: '20px', height: '20px' }} />
                    </button>
                  )}
                  {index === formData.subcategorias.length - 1 && (
                    <button
                      type="button"
                      onClick={addSubcategoria}
                      className="btn-add-inline"
                      title="Añadir Subcategoría"
                    >
                      <AddIcon fill="white" style={{ width: '20px', height: '20px' }} />
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

            <div className="csf-form-group">
              <label>PROVEEDOR *</label>
              <div className="csf-input-group">
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
                <button
                  type="button"
                  onClick={() => setShowProveedorModal(true)}
                  className="btn-add-inline"
                  title="Agregar nuevo proveedor"
                >
                  <AddIcon fill="white" style={{ width: '20px', height: '20px' }} />
                </button>
              </div>
              <datalist id="proveedores-list">
                {proveedores.map((prov, index) => (
                  <option key={index} value={prov.nombre} />
                ))}
              </datalist>
            </div>

            <div className="csf-form-group">
              <label>RIF</label>
              <div className="csf-rif-input">
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

            <div className="csf-form-group full-width">
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

        <div className="csf-form-section">
          <h3>Datos de la Compra</h3>
          <div className="csf-form-grid">
            <div className="csf-form-group">
              <label>FECHA DE COMPRA *</label>
              <input
                type="date"
                name="fechaCompra"
                value={formData.fechaCompra}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="csf-form-group">
              <label>FECHA DE RECIBIDA</label>
              <input
                type="date"
                name="fechaRecibida"
                value={formData.fechaRecibida}
                onChange={handleInputChange}
              />
            </div>

            <div className="csf-form-group">
              <label>Nº NOTA DE ENTREGA</label>
              <input
                type="text"
                name="numeroNotaEntrega"
                value={formData.numeroNotaEntrega}
                onChange={handleInputChange}
                placeholder="Número de nota de entrega"
              />
            </div>

            <div className="csf-form-group full-width">
              <label>DESCRIPCIÓN COMPRA</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                rows="3"
                placeholder="Descripción detallada de la compra"
              />
            </div>

            <div className="csf-form-group full-width">
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

        <div className="csf-form-section">
          <h3>Valores de la Compra</h3>
          <div className="csf-form-grid">
            <div className="csf-form-group">
              <label>TASA DE PAGO (Bs/$) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="tasaPago"
                value={formData.tasaPago}
                onChange={handleInputChange}
                placeholder="0.00"
                required
              />
            </div>

            <div className="csf-form-group">
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
            <div className="csf-form-group">
              <label>TOTAL A PAGAR ($)</label>
              <div className="readonly-value">{(typeof formData.totalDolares === 'number' ? formData.totalDolares : 0).toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="csf-form-section">
          <h3>Información de Pago</h3>
          <div className="csf-form-grid">
            <div className="csf-form-group">
              <label>MODO DE PAGO</label>
              <div className="csf-input-with-button">
                <select
                  name="modoPago"
                  value={formData.modoPago.startsWith('Multi-Banco') ? 'Multi-Banco' : formData.modoPago}
                  onChange={handleModoPagoChange}
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
                  className="btn-add-inline"
                  title="Agregar nuevo modo de pago"
                >
                  <AddIcon fill="white" style={{ width: '20px', height: '20px' }} />
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

            <div className="csf-form-group">
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

        <div className="csf-form-actions">
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
                <XIcon style={{ width: '20px', height: '20px' }} />
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
              <button type="button" className="btn-secondary" onClick={() => setShowProveedorModal(false)}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" onClick={agregarProveedor}>
                Guardar Proveedor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Categoría */}
      {showCategoriaModal && (
        <div className="modal-overlay" onClick={() => setShowCategoriaModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Agregar Nueva Categoría</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowCategoriaModal(false)}
              >
                <XIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>NOMBRE DE LA CATEGORÍA</label>
                <input
                  type="text"
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                  placeholder="Escriba el nombre de la nueva categoría"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowCategoriaModal(false)}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" onClick={agregarCategoria}>
                Guardar Categoría
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Modo de Pago */}
      {showModoPagoModal && (
        <div className="modal-overlay" onClick={() => setShowModoPagoModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Agregar Modo de Pago</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowModoPagoModal(false)}
              >
                <XIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>NOMBRE DEL MODO DE PAGO</label>
                <input
                  type="text"
                  value={nuevoModoPago}
                  onChange={(e) => setNuevoModoPago(e.target.value)}
                  placeholder="Escriba el nombre del nuevo modo de pago"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowModoPagoModal(false)}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" onClick={agregarModoPago}>
                Guardar Modo de Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Multi-Banco */}
      <MultiBancoModal
        isOpen={showMultiBancoModal}
        onClose={() => setShowMultiBancoModal(false)}
        onConfirm={handleMultiBancoConfirm}
        totalAmount={formData.pagoBolivares}
        currentMode={formData.modoPago}
      />

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