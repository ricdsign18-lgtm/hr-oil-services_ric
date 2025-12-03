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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <button
              onClick={onBack}
              className="btn-secondary"
              style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>←</span> Volver
            </button>
            <h2 style={{ margin: 0 }}>Semana {semana.numero_semana}</h2>
          </div>
          <div className="ejecucion-semana-dates" style={{ marginLeft: '0', display: 'inline-block', fontSize: '0.9rem', padding: '4px 12px' }}>
            {new Date(semana.fecha_inicio).toLocaleDateString()} - {new Date(semana.fecha_fin).toLocaleDateString()}
          </div>
        </div>

        <div className="ejecucion-actions">
          <button
            onClick={() => setVista('dias')}
            className={vista === 'dias' ? "btn-primary" : "btn-secondary"}
          >
            📅 Días
          </button>
          <button
            onClick={() => setVista('metricas')}
            className={vista === 'metricas' ? "btn-primary" : "btn-secondary"}
          >
            📊 Métricas
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ flexGrow: 1 }}>
        {vista === 'dias' ? (
          <DiasEjecucion semanaId={semana.id} />
        ) : (
          <MetricasSemana semana={semana} />
        )}
      </div>
    </div>
  );
};