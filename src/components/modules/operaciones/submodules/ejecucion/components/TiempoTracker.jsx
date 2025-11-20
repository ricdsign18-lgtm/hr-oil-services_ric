// components/modules/operaciones/submodules/ejecucion/components/TiempoTracker.jsx
import { useState, useEffect, useCallback } from 'react';
import { useExecution } from '../../../../../../contexts/ExecutionContext';

export const TiempoTracker = ({ ejecucionActividadId }) => {
  const { getTiemposPorActividad, registrarTiempo, loading } = useExecution();
  const [tiempos, setTiempos] = useState([]);
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '',
    hora_fin: '',
    pausas: 0,
    observaciones: '',
  });

  const fetchTiempos = useCallback(async () => {
    const data = await getTiemposPorActividad(ejecucionActividadId);
    setTiempos(data);
  }, [ejecucionActividadId, getTiemposPorActividad]);

  useEffect(() => {
    fetchTiempos();
  }, [fetchTiempos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.hora_inicio || !formData.hora_fin) {
      alert("Debe ingresar hora de inicio y fin.");
      return;
    }

    // Calcular tiempo productivo en horas
    const inicio = new Date(`${formData.fecha}T${formData.hora_inicio}`);
    const fin = new Date(`${formData.fecha}T${formData.hora_fin}`);
    const diffMs = fin - inicio;
    const diffHoras = diffMs / (1000 * 60 * 60);
    const tiempoProductivo = diffHoras - (parseFloat(formData.pausas) || 0);

    if (tiempoProductivo < 0) {
      alert("El tiempo de pausa no puede ser mayor al tiempo total.");
      return;
    }

    await registrarTiempo({
      ejecucion_actividad_id: ejecucionActividadId,
      ...formData,
      tiempo_productivo: tiempoProductivo.toFixed(2),
    });

    // Limpiar formulario y recargar lista
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      hora_inicio: '',
      hora_fin: '',
      pausas: 0,
      observaciones: '',
    });
    fetchTiempos();
  };

  return (
    <div className="tiempo-tracker-container">
      <form onSubmit={handleSubmit} className="tiempo-form">
        <div className="form-grid cols-2">
          <div className="form-group">
            <label>Fecha</label>
            <input type="date" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} className="form-control" />
          </div>
        </div>
        <div className="form-grid cols-3" style={{alignItems: 'flex-end'}}>
          <div className="form-group">
            <label>Inicio</label>
            <input type="time" value={formData.hora_inicio} onChange={e => setFormData({...formData, hora_inicio: e.target.value})} className="form-control" />
          </div>
          <div className="form-group">
            <label>Fin</label>
            <input type="time" value={formData.hora_fin} onChange={e => setFormData({...formData, hora_fin: e.target.value})} className="form-control" />
          </div>
          <div className="form-group">
            <label>Pausas (hrs)</label>
            <input type="number" step="0.1" value={formData.pausas} onChange={e => setFormData({...formData, pausas: e.target.value})} className="form-control" />
          </div>
        </div>
        <div className="form-group">
          <label>Observaciones</label>
          <input type="text" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} className="form-control" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary btn-sm" style={{width: '100%', marginTop: '10px'}}>
          {loading ? 'Registrando...' : 'Registrar Tiempo'}
        </button>
      </form>

      <div className="tiempos-list">
        {tiempos.length === 0 ? (
          <p>No hay tiempos registrados.</p>
        ) : (
          tiempos.map(t => (
            <div key={t.id} className="tiempo-item">
              <p><strong>{new Date(t.fecha).toLocaleDateString()}</strong></p>
              <p>
                {t.hora_inicio} - {t.hora_fin} | 
                Pausas: {t.pausas || 0}h | 
                Productivo: <strong>{t.tiempo_productivo || 0}h</strong>
              </p>
              {t.observaciones && <p className="obs">{t.observaciones}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};