// components/ejecucion/SemanaEjecucion.jsx
import { useState } from 'react';
import { DiasEjecucion } from './DiasEjecucion';
import { MetricasSemana } from './MetricasSemana';

export const SemanaEjecucion = ({ semana, onBack }) => {
  const [vista, setVista] = useState('dias'); // 'dias' | 'metricas'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="ejecucion-header">
        <div className="ejecucion-semana-header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
            <button 
              onClick={onBack}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.9rem' }}
            >
              ← Volver
            </button>
            <h2 style={{ margin: 0 }}>Semana {semana.numero_semana}</h2>
          </div>
          <p className="ejecucion-semana-dates" style={{ marginLeft: '0', display: 'inline-block' }}>
            {new Date(semana.fecha_inicio).toLocaleDateString()} - {new Date(semana.fecha_fin).toLocaleDateString()}
          </p>
        </div>
        
        <div className="ejecucion-actions">
          <button
            onClick={() => setVista('dias')}
            className={vista === 'dias' ? "btn-primary" : "btn-secondary"}
          >
            Días
          </button>
          <button
            onClick={() => setVista('metricas')}
            className={vista === 'metricas' ? "btn-primary" : "btn-secondary"}
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