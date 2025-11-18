// components/ejecucion/MetricasSemana.jsx
import { useMetricas } from '../../../../../../hooks/useMetricas';

export const MetricasSemana = ({ semana }) => {
  const { analizarTendencias } = useMetricas();

  // Datos de ejemplo para las métricas
  const metricas = {
    actividadesCompletadas: 8,
    actividadesTotales: 12,
    montoEjecutado: 45000,
    montoPlanificado: 52000,
    eficienciaPromedio: 78,
    horasProductivas: 145,
    horasPlanificadas: 180
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Resumen General */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold text-lg mb-4">Resumen de la Semana</h3>
        <div className="space-y-3">
          <MetricaItem 
            label="Actividades Completadas" 
            value={`${metricas.actividadesCompletadas}/${metricas.actividadesTotales}`}
            porcentaje={(metricas.actividadesCompletadas / metricas.actividadesTotales) * 100}
          />
          <MetricaItem 
            label="Avance Financiero" 
            value={`$${metricas.montoEjecutado.toLocaleString()}/$${metricas.montoPlanificado.toLocaleString()}`}
            porcentaje={(metricas.montoEjecutado / metricas.montoPlanificado) * 100}
          />
          <MetricaItem 
            label="Eficiencia" 
            value={`${metricas.eficienciaPromedio}%`}
            porcentaje={metricas.eficienciaPromedio}
          />
          <MetricaItem 
            label="Horas Productivas" 
            value={`${metricas.horasProductivas}h/${metricas.horasPlanificadas}h`}
            porcentaje={(metricas.horasProductivas / metricas.horasPlanificadas) * 100}
          />
        </div>
      </div>

      {/* Alertas y Recomendaciones */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold text-lg mb-4">Recomendaciones</h3>
        <div className="space-y-3 text-sm">
          {metricas.eficienciaPromedio < 80 && (
            <div className="text-orange-600 bg-orange-50 p-3 rounded">
              ⚠️ La eficiencia está por debajo del objetivo (80%). Considera revisar los procesos.
            </div>
          )}
          
          {metricas.horasProductivas < metricas.horasPlanificadas && (
            <div className="text-blue-600 bg-blue-50 p-3 rounded">
              💡 Hay {metricas.horasPlanificadas - metricas.horasProductivas}h planificadas sin ejecutar.
            </div>
          )}

          {(metricas.montoEjecutado / metricas.montoPlanificado) < 0.7 && (
            <div className="text-yellow-600 bg-yellow-50 p-3 rounded">
              📊 El avance financiero está al {((metricas.montoEjecutado / metricas.montoPlanificado) * 100).toFixed(1)}%. Revisa actividades críticas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MetricaItem = ({ label, value, porcentaje }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="bg-green-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(porcentaje, 100)}%` }}
      ></div>
    </div>
  </div>
);