// components/ejecucion/EjecucionDashboard.jsx
import { useMetricas } from '../../../../../../hooks/useMetricas';
import { useProjects } from '../../../../../../contexts/ProjectContext';

export const EjecucionDashboard = ({ semanas, actividades }) => {
  const { selectedProject } = useProjects();
  const { calcularKPIs } = useMetricas();

  const kpis = calcularKPIs(selectedProject, actividades, semanas);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Ejecución del Proyecto</h1>

      {/* KPIs Principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500">Avance Físico</div>
          <div className="text-2xl font-bold text-blue-600">{kpis.avanceFisico}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${kpis.avanceFisico}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500">Avance Financiero</div>
          <div className="text-2xl font-bold text-green-600">{kpis.avanceFinanciero}%</div>
          <div className="text-sm text-gray-600">
            ${kpis.montoCompletado.toLocaleString()} / ${kpis.montoPlanificado.toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500">Eficiencia</div>
          <div className="text-2xl font-bold text-purple-600">{kpis.eficienciaGeneral}%</div>
          <div className="text-sm text-gray-600">
            {kpis.actividadesCompletadas}/{kpis.actividadesTotales} actividades
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500">Cumplimiento</div>
          <div className="text-2xl font-bold text-orange-600">{kpis.cumplimientoPlazos}%</div>
          <div className="text-sm text-gray-600">En plazo</div>
        </div>
      </div>

      {/* Alertas Activas */}
      <AlertasPanel actividades={actividades} />
    </div>
  );
};

// Componente interno para alertas
const AlertasPanel = ({ actividades }) => {
  const alertas = actividades.filter(act =>
    act.estado === 'en_proceso' &&
    (act.fecha_planificada || act.plan_dias?.fecha) &&
    new Date(act.fecha_planificada || act.plan_dias?.fecha) < new Date()
  ).slice(0, 5);

  if (alertas.length === 0) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Alertas Activas</h3>
      <div className="space-y-2">
        {alertas.map((alerta, index) => (
          <div key={index} className="text-sm text-yellow-700">
            • {alerta.equipos?.nombre}: Actividad retrasada
          </div>
        ))}
      </div>
    </div>
  );
};