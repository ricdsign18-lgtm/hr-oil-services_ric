// components/planificacion/RequerimientosForm.jsx
import { useState } from 'react';
import { usePlanning } from '../../../../../../contexts/PlanningContext';
import { useValidaciones } from '../../../../../../hooks/useValidaciones';

export const RequerimientosForm = ({ semanaId, onClose }) => {
  const { crearRequerimiento } = usePlanning();
  const { validarRequerimiento } = useValidaciones();
  const [formData, setFormData] = useState({
    nombre_suministro: '',
    categoria: '',
    unidad: '',
    cantidad_requerida: '',
    precio_unitario_aprox: '',
    prioridad: 'media',
    observaciones: ''
  });
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState({});

  const montoTotal = formData.cantidad_requerida && formData.precio_unitario_aprox
    ? parseFloat(formData.cantidad_requerida) * parseFloat(formData.precio_unitario_aprox)
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!window.confirm('¿Estás seguro de crear este requerimiento?')) {
      return;
    }

    setLoading(true);

    const validacion = validarRequerimiento(formData);
    if (!validacion.valido) {
      setErrores(validacion.errores);
      setLoading(false);
      return;
    }

    try {
      await crearRequerimiento({
        ...formData,
        semana_id: semanaId,
        monto_total: montoTotal,
      });
      onClose(true); // true para indicar que se debe refrescar la lista
    } catch (error) {
      console.error('Error al crear requerimiento:', error);
      setErrores({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      {/* <h3>Nuevo Requerimiento</h3> -- Title handled by Modal */}

      <form onSubmit={handleSubmit}>
        <div className="form-grid cols-2">
          <div className="form-group">
            <label className="form-label">Nombre del Suministro *</label>
            <input
              type="text"
              value={formData.nombre_suministro}
              onChange={(e) => setFormData({ ...formData, nombre_suministro: e.target.value })}
              className="form-control"
            />
            {errores.nombreSuministro && <p className="form-error">{errores.nombreSuministro}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Categoría *</label>
            <input
              type="text"
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              className="form-control"
              placeholder="Ej: Herramientas, EPP, Materiales"
            />
            {errores.categoria && <p className="form-error">{errores.categoria}</p>}
          </div>
        </div>

        <div className="form-grid cols-3" style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label className="form-label">Unidad *</label>
            <input
              type="text"
              value={formData.unidad}
              onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
              className="form-control"
              placeholder="Ej: pza, kg, gal"
            />
            {errores.unidad && <p className="form-error">{errores.unidad}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Cantidad *</label>
            <input
              type="number"
              step="0.01"
              value={formData.cantidad_requerida}
              onChange={(e) => setFormData({ ...formData, cantidad_requerida: e.target.value })}
              className="form-control"
            />
            {errores.cantidadRequerida && <p className="form-error">{errores.cantidadRequerida}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Precio Unitario Aprox. *</label>
            <input
              type="number"
              step="0.01"
              value={formData.precio_unitario_aprox}
              onChange={(e) => setFormData({ ...formData, precio_unitario_aprox: e.target.value })}
              className="form-control"
            />
            {errores.precioUnitarioAprox && <p className="form-error">{errores.precioUnitarioAprox}</p>}
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '20px', fontWeight: 'bold' }}>Monto Total: ${montoTotal.toLocaleString()}</div>

        <div className="form-group" style={{ marginTop: '20px' }}>
          <label className="form-label">Observaciones</label>
          <textarea
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            rows="3"
            className="form-control"
          />
        </div>

        {errores.submit && (
          <p className="form-error">{errores.submit}</p>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Guardando...' : 'Guardar Requerimiento'}
          </button>
        </div>
      </form>
    </div>
  );
};