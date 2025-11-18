// components/ejecucion/ActividadEjecucion.jsx
import { useState } from 'react';
import { useExecution } from '../../../../../../contexts/ExecutionContext';
import { useEjecucion } from '../../../../../../hooks/useEjecucion';
import { SubactividadesList } from './SubactividadesList';
import { TiempoTracker } from './TiempoTracker';

export const ActividadEjecucion = ({ actividad, expandida, onToggle }) => {
  const { iniciarEjecucionActividad } = useExecution();
  const { iniciarTimer, pausarTimer, detenerTimer, getTiempoActividad } = useEjecucion();
  const [mostrarTiempoTracker, setMostrarTiempoTracker] = useState(false);

  const tiempo = getTiempoActividad(actividad.id);
  const puedeIniciar = actividad.estado === 'pendiente';
  const enProceso = actividad.estado === 'en_proceso';

  const handleIniciar = async () => {
    await iniciarEjecucionActividad(actividad.id);
    iniciarTimer(actividad.id);
    setMostrarTiempoTracker(true);
  };

  const handleCompletar = () => {
    detenerTimer(actividad.id);
    // Aquí se marcaría la actividad como completada en la BD
  };

  return (
    <div className="bg-white border rounded-lg">
      {/* Header de la actividad */}
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h3 className="font-semibold text-lg">
                {actividad.equipos?.nombre} ({actividad.equipos?.tag_serial})
              </h3>
              <EstadoBadge estado={actividad.estado} />
            </div>
            
            <p className="text-gray-600 mt-1">
              {actividad.budget_items?.description}
            </p>
            
            <div className="flex space-x-4 text-sm text-gray-500 mt-2">
              <span>Cantidad: {actividad.cantidad} {actividad.budget_items?.unit}</span>
              <span>Monto: ${actividad.monto_total?.toLocaleString()}</span>
              {tiempo.productivo > 0 && (
                <span>Tiempo: {Math.round(tiempo.productivo / 60)}min</span>
              )}
            </div>

            {actividad.observaciones && (
              <p className="text-sm text-gray-600 mt-2">{actividad.observaciones}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {puedeIniciar && (
              <button
                onClick={handleIniciar}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Iniciar
              </button>
            )}
            
            {enProceso && (
              <>
                <button
                  onClick={() => pausarTimer(actividad.id)}
                  className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                >
                  Pausar
                </button>
                <button
                  onClick={handleCompletar}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Completar
                </button>
              </>
            )}

            <button
              onClick={onToggle}
              className="text-gray-400 hover:text-gray-600"
            >
              {expandida ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {/* Barra de progreso */}
        {actividad.avance_fisico > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${actividad.avance_fisico}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Contenido expandible */}
      {expandida && (
        <div className="border-t px-4 py-3 bg-gray-50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Subactividades */}
            <div>
              <h4 className="font-semibold mb-3">Subactividades</h4>
              <SubactividadesList actividadId={actividad.id} />
            </div>

            {/* Control de tiempos */}
            <div>
              <h4 className="font-semibold mb-3">Control de Tiempos</h4>
              <TiempoTracker 
                actividadId={actividad.id}
                visible={mostrarTiempoTracker}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EstadoBadge = ({ estado }) => (
  <span className={`px-2 py-1 rounded text-xs ${
    estado === 'completada' ? 'bg-green-100 text-green-800' :
    estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-800' :
    'bg-gray-100 text-gray-800'
  }`}>
    {estado}
  </span>
);