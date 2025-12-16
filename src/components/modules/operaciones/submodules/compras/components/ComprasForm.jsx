import { useState, useEffect } from 'react';
import supabase from '../../../../../../api/supaBase.js';
import './ComprasForm.css';

const ComprasForm = () => {
  const [formData, setFormData] = useState({
    fecha_compra: new Date().toISOString().split('T')[0],
    nro_factura: '',
    proveedor: '',
    nombre_producto: '',
    categoria_producto: '',
    cantidad: 0,
    precio_unitario_bs: 0,
    aplica_iva: true,
    tasa_cambio_bsd: 0,
    observaciones: ''
  });

  const [totalBs, setTotalBs] = useState(0);
  const [totalUsd, setTotalUsd] = useState(0);
  const [proveedores, setProveedores] = useState([]);
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    const fetchGlobalData = async () => {
      // Fetch Proveedores (Global)
      const { data: provData, error: provError } = await supabase.from('proveedores').select('*');
      if (provError) {
        console.error('Error fetching proveedores:', provError);
      } else if (provData) {
        setProveedores(provData);
      }

      // Fetch Categorias (Global)
      const { data: catData, error: catError } = await supabase.from('categorias_compras').select('*');
      if (catError) {
        console.error('Error fetching categorias:', catError);
      } else if (catData) {
        setCategorias(catData);
      }
    };
    fetchGlobalData();
  }, []);

  useEffect(() => {
    const { cantidad, precio_unitario_bs, aplica_iva, tasa_cambio_bsd } = formData;
    const subtotal = cantidad * precio_unitario_bs;
    const iva = aplica_iva ? subtotal * 0.16 : 0;
    const total = subtotal + iva;
    setTotalBs(total);

    if (tasa_cambio_bsd > 0) {
      setTotalUsd(total / tasa_cambio_bsd);
    }
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Lógica para enviar a Supabase
    console.log({ ...formData, total_bs: totalBs, total_usd: totalUsd });
  };

  return (
    <form onSubmit={handleSubmit} className="compras-form">
      <div className="form-grid">
        <div className="form-group">
          <label>Fecha de Compra</label>
          <input type="date" name="fecha_compra" value={formData.fecha_compra} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Nro. Factura (Opcional)</label>
          <input type="text" name="nro_factura" value={formData.nro_factura} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Proveedor (Opcional)</label>
          <input 
            type="text" 
            name="proveedor" 
            value={formData.proveedor} 
            onChange={handleChange} 
            list="compras-proveedores-list"
            autoComplete="off"
            placeholder="Seleccione o escriba un proveedor"
          />
          <datalist id="compras-proveedores-list">
            {proveedores.map((p, i) => (
              <option key={i} value={p.nombre} />
            ))}
          </datalist>
        </div>
        <div className="form-group">
          <label>Nombre del Producto</label>
          <input type="text" name="nombre_producto" value={formData.nombre_producto} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Categoría del Producto</label>
          <input 
            type="text" 
            name="categoria_producto" 
            value={formData.categoria_producto} 
            onChange={handleChange} 
            required 
            list="compras-categorias-list"
            autoComplete="off"
            placeholder="Seleccione o escriba una categoría"
          />
          <datalist id="compras-categorias-list">
            {categorias.map((c, i) => (
              <option key={i} value={c.nombre} />
            ))}
          </datalist>
        </div>
        <div className="form-group">
          <label>Cantidad</label>
          <input type="number" name="cantidad" value={formData.cantidad} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Precio Unitario (Bs. sin IVA)</label>
          <input type="number" name="precio_unitario_bs" value={formData.precio_unitario_bs} onChange={handleChange} />
        </div>
        <div className="form-group iva-group">
          <label>Aplica IVA (16%)</label>
          <input type="checkbox" name="aplica_iva" checked={formData.aplica_iva} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Tasa de Cambio (Bs/USD)</label>
          <input type="number" name="tasa_cambio_bsd" value={formData.tasa_cambio_bsd} onChange={handleChange} />
        </div>
        <div className="form-group total-field">
          <label>Total en Bolívares</label>
          <input type="text" value={totalBs.toFixed(2)} readOnly />
        </div>
        <div className="form-group total-field">
          <label>Total en Dólares</label>
          <input type="text" value={totalUsd.toFixed(2)} readOnly />
        </div>
        <div className="form-group full-width">
          <label>Observaciones</label>
          <textarea name="observaciones" value={formData.observaciones} onChange={handleChange}></textarea>
        </div>
      </div>
      <button type="submit" className="submit-btn">Registrar Compra</button>
    </form>
  );
};

export default ComprasForm;
