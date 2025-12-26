// components/ejecucion/MetricasSemana.jsx
import { useCurrency } from '../../../../../../contexts/CurrencyContext';

export const MetricasSemana = ({ semana }) => {
  const { formatCurrency } = useCurrency();

  const montoPlanificado = semana.monto_planificado || 0;
  const montoEjecutado = semana.monto_ejecutado || 0;
  const porcentajeFinanciero = montoPlanificado > 0 ? (montoEjecutado / montoPlanificado) * 100 : 0;

  // Asumimos que podemos tener cantidad de actividades
  const totalActividades = semana.cantidad_actividades || 0;
  // No tenemos "completadas" en el objeto semana, así que omitimos esa métrica precisa o la dejamos genérica

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Resumen General */}
      <div className="bg-white rounded-lg border p-6" style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px' }}>
        <h3 className="font-semibold text-lg mb-4" style={{ fontWeight: '600', fontSize: '1.2rem', marginBottom: '16px' }}>Resumen Financiero</h3>
        <div className="space-y-3" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          <MetricaItem
            label="Monto Ejecutado"
            value={`${formatCurrency(montoEjecutado, 'USD')} / ${formatCurrency(montoPlanificado, 'USD')}`}
            porcentaje={porcentajeFinanciero}
            color={porcentajeFinanciero > 100 ? '#ef4444' : '#22c55e'}
          />

          {/* Placeholder for Activities if we had the data */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
            <span className="text-gray-600">Actividades Planificadas</span>
            <span className="font-semibold">{totalActividades}</span>
          </div>

        </div>
      </div>

      {/* Alertas y Recomendaciones */}
      <div className="bg-white rounded-lg border p-6" style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px' }}>
        <h3 className="font-semibold text-lg mb-4" style={{ fontWeight: '600', fontSize: '1.2rem', marginBottom: '16px' }}>Estado</h3>
        <div className="space-y-3 text-sm" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {porcentajeFinanciero < 50 && (
            <div style={{ color: '#d97706', backgroundColor: '#fffbeb', padding: '12px', borderRadius: '6px' }}>
              ⚠️ El avance financiero es bajo ({porcentajeFinanciero.toFixed(1)}%). Revisa el ritmo de ejecución.
            </div>
          )}

          {porcentajeFinanciero >= 50 && porcentajeFinanciero < 90 && (
            <div style={{ color: '#2563eb', backgroundColor: '#eff6ff', padding: '12px', borderRadius: '6px' }}>
              ℹ️ Ejecución en curso ({porcentajeFinanciero.toFixed(1)}%). Buen ritmo.
            </div>
          )}

          {porcentajeFinanciero > 100 && (
            <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '6px' }}>
              🚨 Has excedido el presupuesto planificado ({porcentajeFinanciero.toFixed(1)}%).
            </div>
          )}

          {porcentajeFinanciero >= 90 && porcentajeFinanciero <= 100 && (
            <div style={{ color: '#166534', backgroundColor: '#dcfce7', padding: '12px', borderRadius: '6px' }}>
              ✅ Ejecución cercana al objetivo ({porcentajeFinanciero.toFixed(1)}%).
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MetricaItem = ({ label, value, porcentaje, color = '#22c55e' }) => (
  <div>
    <div className="flex justify-between items-center mb-1" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
      <span className="text-gray-600" style={{ color: '#4b5563' }}>{label}</span>
      <span className="font-semibold" style={{ fontWeight: '600' }}>{value}</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2" style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '8px' }}>
      <div
        className="h-2 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(porcentaje, 100)}%`, backgroundColor: color, height: '100%', borderRadius: '9999px' }}
      ></div>
    </div>
  </div>
);