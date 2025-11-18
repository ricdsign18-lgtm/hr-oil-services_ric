// components/ejecucion/SemanasEjecucion.jsx
export const SemanasEjecucion = ({ semanas, onSelectSemana }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {semanas.map((semana) => (
        <div 
          key={semana.id}
          className="bg-white rounded-lg border p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onSelectSemana(semana)}
        >
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-lg">Semana {semana.numero_semana}</h3>
            <EstadoBadge estado={semana.estado} />
          </div>
          
          <div className="text-sm text-gray-600 mb-3">
            {new Date(semana.fecha_inicio).toLocaleDateString()} - {new Date(semana.fecha_fin).toLocaleDateString()}
          </div>

          <div className="space-y-2">
            <MetricaRow 
              label="Avance Físico" 
              valor={semana.avance_fisico || 0} 
              tipo="porcentaje" 
            />
            <MetricaRow 
              label="Actividades" 
              valor={`${semana.actividades_completadas || 0}/${semana.cantidad_actividades || 0}`} 
            />
            <MetricaRow 
              label="Monto Ejecutado" 
              valor={semana.monto_ejecutado || 0} 
              tipo="moneda" 
            />
          </div>

          <div className="mt-3 pt-3 border-t">
            <button className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium">
              Ver Detalles →
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Componentes internos
const EstadoBadge = ({ estado }) => (
  <span className={`px-2 py-1 rounded text-xs ${
    estado === 'completada' ? 'bg-green-100 text-green-800' :
    estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-800' :
    'bg-gray-100 text-gray-800'
  }`}>
    {estado}
  </span>
);

const MetricaRow = ({ label, valor, tipo = 'text' }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-gray-600">{label}</span>
    <span className="font-semibold">
      {tipo === 'porcentaje' ? `${valor}%` :
       tipo === 'moneda' ? `$${valor.toLocaleString()}` : valor}
    </span>
  </div>
);