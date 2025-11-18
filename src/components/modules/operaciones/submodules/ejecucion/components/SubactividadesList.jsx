// components/ejecucion/SubactividadesList.jsx
import { useState, useEffect } from 'react';
import { useExecution } from '../../../../../../contexts/ExecutionContext';

export const SubactividadesList = ({ actividadId }) => {
  const { subactividades, getSubactividades, completarSubactividad } = useExecution();
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (actividadId) {
      getSubactividades(actividadId);
    }
  }, [actividadId, getSubactividades]);

  const handleCompletar = async (subactividadId) => {
    setCargando(true);
    await completarSubactividad(subactividadId, 'Completada desde interfaz');
    setCargando(false);
  };

  if (subactividades.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No hay subactividades definidas
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {subactividades.map((subact) => (
        <div key={subact.id} className="flex items-center space-x-3">
          <button
            onClick={() => !subact.completada && handleCompletar(subact.id)}
            disabled={cargando || subact.completada}
            className={`w-5 h-5 rounded border flex items-center justify-center ${
              subact.completada 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'border-gray-300 hover:border-green-500'
            }`}
          >
            {subact.completada && '✓'}
          </button>
          
          <span className={`text-sm flex-1 ${
            subact.completada ? 'text-gray-500 line-through' : 'text-gray-800'
          }`}>
            {subact.descripcion}
          </span>

          {subact.fecha_completada && (
            <span className="text-xs text-gray-400">
              {new Date(subact.fecha_completada).toLocaleTimeString()}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};