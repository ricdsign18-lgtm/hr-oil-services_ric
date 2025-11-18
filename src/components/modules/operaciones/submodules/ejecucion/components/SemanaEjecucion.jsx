// components/ejecucion/SemanaEjecucion.jsx
import { useState } from 'react';
import { DiasEjecucion } from './DiasEjecucion';
import { MetricasSemana } from './MetricasSemana';

export const SemanaEjecucion = ({ semana, onBack }) => {
  const [vista, setVista] = useState('dias'); // 'dias' | 'metricas'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded"
          >
            ← Volver
          </button>
          <div>
            <h1 className="text-2xl font-bold">Ejecución - Semana {semana.numero_semana}</h1>
            <p className="text-gray-600">
              {new Date(semana.fecha_inicio).toLocaleDateString()} - {new Date(semana.fecha_fin).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setVista('dias')}
            className={`px-4 py-2 rounded ${
              vista === 'dias' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Días
          </button>
          <button
            onClick={() => setVista('metricas')}
            className={`px-4 py-2 rounded ${
              vista === 'metricas' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Métricas
          </button>
        </div>
      </div>

      {/* Contenido */}
      {vista === 'dias' ? (
        <DiasEjecucion semanaId={semana.id} />
      ) : (
        <MetricasSemana semana={semana} />
      )}
    </div>
  );
};