// components/modules/operaciones/submodules/ejecucion/components/SubactividadesList.jsx
import { useState, useEffect, useCallback } from 'react';
import { useExecution } from '../../../../../../contexts/ExecutionContext';

export const SubactividadesList = ({ actividadId, readOnly = false }) => {
  const { getSubactividades, toggleSubactividad, loading } = useExecution();
  const [subactividades, setSubactividades] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);



  const fetchSubactividades = useCallback(async () => {
    setLocalLoading(true);
    const data = await getSubactividades(actividadId);
    setSubactividades(data);
    setLocalLoading(false);
  }, [actividadId, getSubactividades]);

  useEffect(() => {
    fetchSubactividades();
  }, [fetchSubactividades]);

  const handleToggle = async (subactividad) => {
    try {
      // Optimistic update
      const newData = subactividades.map(s =>
        s.id === subactividad.id ? { ...s, completada: !s.completada } : s
      );
      setSubactividades(newData);

      await toggleSubactividad(subactividad.id, !subactividad.completada);
      // No need to refetch if optimistic, but good for consistency
    } catch (error) {
      console.error("Error al actualizar subactividad:", error);
      // Revert if error
      fetchSubactividades();
    }
  };

  if (localLoading && subactividades.length === 0) {
    return <p className="text-muted">Cargando tareas...</p>;
  }

  return (
    <div className="subactividades-container" style={{ marginTop: '10px' }}>
      {subactividades.length === 0 ? (
        <p className="text-muted" style={{ fontSize: '0.9rem' }}>No hay subactividades definidas.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {subactividades.map(sub => (
            <li key={sub.id} className={`subactividad-item ${sub.completada ? 'completada' : ''}`} style={{ marginBottom: '8px', padding: '8px', border: '1px solid #eee', borderRadius: '4px', backgroundColor: sub.completada ? '#f0fdf4' : 'white' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', width: '100%' }}>
                <input
                  type="checkbox"
                  checked={sub.completada}
                  onChange={() => !readOnly && handleToggle(sub)}
                  disabled={loading || readOnly}
                  style={{ width: '18px', height: '18px', accentColor: '#22c55e', cursor: readOnly ? 'not-allowed' : 'pointer' }}
                />
                <span style={{ textDecoration: sub.completada ? 'line-through' : 'none', color: sub.completada ? '#888' : '#333' }}>
                  {sub.descripcion}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};