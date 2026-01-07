// components/ejecucion/SemanaEjecucion.jsx
import { useState, useEffect } from 'react';
import { useExecution } from '../../../../../../contexts/ExecutionContext';
import Modal from '../../../../../common/Modal/Modal';
import { DiasEjecucion } from './DiasEjecucion';
import { MetricasSemana } from './MetricasSemana';

export const SemanaEjecucion = ({ semana, onBack }) => {
  const [vista, setVista] = useState('dias'); // 'dias' | 'metricas'
  const [showReporteSemana, setShowReporteSemana] = useState(false);

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
            onClick={() => setShowReporteSemana(true)}
            className="btn-info"
            style={{ marginRight: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none' }}
          >
            📋 Reporte Semanal
          </button>
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

      {/* Weekly Report Modal */}
      <WeeklyReportModal
        isOpen={showReporteSemana}
        onClose={() => setShowReporteSemana(false)}
        semanaId={semana.id}
      />
    </div>
  );
};

// Subcomponent: Weekly Report Modal
const WeeklyReportModal = ({ isOpen, onClose, semanaId }) => {
  const [reports, setReports] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const { getReportesSemana } = useExecution();

  useEffect(() => {
    if (isOpen && semanaId) {
      setLoadingReport(true);
      getReportesSemana(semanaId).then(data => {
        setReports(data || []);
        setLoadingReport(false);
      });
    }
  }, [isOpen, semanaId, getReportesSemana]);

  // Grouping Logic
  // 1. Group by Activity ID
  const groupedReports = reports.reduce((acc, report) => {
    const actId = report.actividad_id;
    if (!acc[actId]) {
      acc[actId] = {
        nombre: report.nombre_actividad,
        partida: report.nombre_partida,
        items: []
      };
    }
    acc[actId].items.push(report);
    return acc;
  }, {});

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reporte Semanal de Ejecución">
      <div style={{ padding: '20px' }}>
        {loadingReport ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Cargando reportes de la semana...</div>
        ) : Object.keys(groupedReports).length > 0 ? (
          <div className="reports-stack" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            {Object.values(groupedReports).map((group, idx) => (
              <div key={idx} className="activity-group">
                {/* Activity Header */}
                <div style={{
                  backgroundColor: '#f1f5f9',
                  padding: '10px 15px',
                  borderRadius: '8px 8px 0 0',
                  border: '1px solid #e2e8f0',
                  borderBottom: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#334155', fontSize: '1rem' }}>{group.nombre}</h4>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{group.partida}</span>
                  </div>
                  <span style={{ backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', color: '#475569' }}>
                    {group.items.length} Reportes
                  </span>
                </div>

                {/* Reports List */}
                <div style={{
                  border: '1px solid #e2e8f0',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  padding: '15px',
                  backgroundColor: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px'
                }}>
                  {group.items.map((report) => (
                    <div key={report.id} className="report-item-compact" style={{ borderBottom: '1px dashed #cbd5e1', paddingBottom: '15px', marginBottom: '5px' }}>

                      {/* Sub-Header: Type & Date */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{
                          backgroundColor: report.tipo_accion === 'replanificacion' ? '#fff7ed' : (report.tipo_accion === 'avance_diario' ? '#eff6ff' : '#f0fdf4'),
                          color: report.tipo_accion === 'replanificacion' ? '#c2410c' : (report.tipo_accion === 'avance_diario' ? '#1d4ed8' : '#15803d'),
                          padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase'
                        }}>
                          {report.tipo_accion?.replace('_', ' ') || 'REPORTE'}
                        </span>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {new Date(report.fecha_reporte).toLocaleString()} • Por: {report.usuario_reporta}
                        </div>
                      </div>

                      {/* Content */}
                      <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#334155' }}>
                        {report.descripcion_trabajo}
                      </p>

                      {/* Metrics Line */}
                      <div style={{ fontSize: '0.85rem', display: 'flex', gap: '15px', color: '#475569' }}>
                        <span>Ejec: <strong style={{ color: '#22c55e' }}>{report.cantidades_ejecutadas}</strong></span>
                        {report.cantidades_pendientes > 0 && <span>Pend: <strong style={{ color: '#ea580c' }}>{report.cantidades_pendientes}</strong></span>}
                      </div>

                      {/* Note */}
                      {report.justificacion && (
                        <div style={{ marginTop: '5px', fontSize: '0.85rem', color: '#be123c', fontStyle: 'italic' }}>
                          Nota: {report.justificacion}
                        </div>
                      )}

                      {/* Materials Used Section */}
                      {report.detalles?.materiales && report.detalles.materiales.length > 0 && (
                        <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#f0f9ff', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                          <small style={{ fontWeight: 600, color: '#0369a1', display: 'block', marginBottom: '2px' }}>📦 Materiales:</small>
                          <ul style={{ margin: 0, paddingLeft: '15px', fontSize: '0.8rem' }}>
                            {report.detalles.materiales.map((mat, idx) => (
                              <li key={idx} style={{ color: '#0c4a6e' }}>
                                {mat.nombre}: <strong>{mat.cantidad} {mat.unidad}</strong>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            <p>No hay reportes registrados en esta semana.</p>
          </div>
        )}
      </div>
    </Modal>
  );
};