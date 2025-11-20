// components/modules/operaciones/submodules/ejecucion/components/SubactividadesList.jsx
import { useState, useEffect, useCallback } from 'react';
import { useExecution } from '../../../../../../contexts/ExecutionContext';

export const SubactividadesList = ({ ejecucionActividadId }) => {
  const { getSubactividades, toggleSubactividad, loading } = useExecution();
  const [subactividades, setSubactividades] = useState([]);

  const fetchSubactividades = useCallback(async () => {
    const data = await getSubactividades(ejecucionActividadId);
    setSubactividades(data);
  }, [ejecucionActividadId, getSubactividades]);

  useEffect(() => {
    fetchSubactividades();
  }, [fetchSubactividades]);

  const handleToggle = async (subactividad) => {
    try {
      await toggleSubactividad(subactividad.id, !subactividad.completada);
      // Refrescar la lista para mostrar el cambio
      fetchSubactividades();
    } catch (error) {
      console.error("Error al actualizar subactividad:", error);
    }
  };

  if (loading && subactividades.length === 0) {
    return <p>Cargando subactividades...</p>;
  }

  return (
    <div className="subactividades-container">
      {subactividades.length === 0 ? (
        <p>No hay subactividades definidas.</p>
      ) : (
        <ul>
          {subactividades.map(sub => (
            <li key={sub.id} className={`subactividad-item ${sub.completada ? 'completada' : ''}`}>
              <label>
                <input 
                  type="checkbox" 
                  checked={sub.completada}
                  onChange={() => handleToggle(sub)}
                  disabled={loading}
                />
                <span>{sub.descripcion}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};