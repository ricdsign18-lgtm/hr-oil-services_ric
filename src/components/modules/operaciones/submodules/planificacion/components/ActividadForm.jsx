// components/planificacion/ActividadForm.jsx
import { useState, useEffect } from 'react';
import { usePlanning } from '../../../../../../contexts/PlanningContext';
import { useBudget } from '../../../../../../contexts/BudgetContext';
import { useCurrency } from '../../../../../../contexts/CurrencyContext';
import { useValidaciones } from '../../../../../../hooks/useValidaciones';

export const ActividadForm = ({ diaId, actividadAEditar, onClose, onSuccess }) => {
  const { crearActividadPlanificada, updateActividad, equipos, crearEquipo } = usePlanning();
  const { budget } = useBudget();
  const { convertToUSD, formatCurrency } = useCurrency();
  const { validarActividad } = useValidaciones();
  
  const [formData, setFormData] = useState({
    equipo_nombre: '', // Campo para el input de texto
    equipo_id: '',
    tipo_equipo: '',
    partida_id: '',
    cantidad: 1,
    observaciones: '',
    subactividades: '' // Nuevo campo para el textarea
  });
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState({});

  const isEditMode = !!actividadAEditar;

  useEffect(() => {
    if (isEditMode) {
      const equipo = equipos.find(eq => eq.id === actividadAEditar.equipo_id);
      setFormData({
        equipo_nombre: equipo?.nombre || '',
        equipo_id: actividadAEditar.equipo_id,
        tipo_equipo: equipo?.tipo_equipo || '',
        partida_id: actividadAEditar.partida_id,
        cantidad: actividadAEditar.cantidad,
        observaciones: actividadAEditar.observaciones || '',
        // Las subactividades se guardan como array, las convertimos a string para el textarea
        subactividades: (actividadAEditar.subactividades || []).join('\n'),
      });
    }
  }, [actividadAEditar, isEditMode, equipos]);

  // Calcular monto total automáticamente
  const partidaSeleccionada = budget?.items?.find(item => item.id === formData.partida_id);  
  const precioUnitarioOriginal = partidaSeleccionada?.precioUnitario || 0;
  const monedaOriginal = partidaSeleccionada?.moneda || 'USD';

  const precioUnitarioUSD = convertToUSD(precioUnitarioOriginal, monedaOriginal);
  const montoTotalUSD = precioUnitarioUSD * (formData.cantidad || 0);

  const montoTotalOriginal = precioUnitarioOriginal * (formData.cantidad || 0);
  const displayMontoTotal = monedaOriginal !== 'USD' 
    ? `${formatCurrency(montoTotalOriginal, monedaOriginal)} (${formatCurrency(montoTotalUSD, 'USD')})`
    : formatCurrency(montoTotalUSD, 'USD');



  const handleEquipoChange = (e) => {
    const nombre = e.target.value;
    // Resetear campos relacionados al escribir
    setFormData(prev => ({ ...prev, equipo_nombre: nombre, equipo_id: '', tipo_equipo: '' }));

    // Intentar encontrar el equipo por nombre o tag
    const equipoEncontrado = equipos.find(
      eq => eq.nombre.toLowerCase() === nombre.toLowerCase() || 
            eq.tag_serial.toLowerCase() === nombre.toLowerCase()
    );

    if (equipoEncontrado) {
      setFormData(prev => ({ 
        ...prev, 
        equipo_id: equipoEncontrado.id,
        tipo_equipo: equipoEncontrado.tipo_equipo // Rellenar tipo de equipo
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let equipoIdFinal = formData.equipo_id;

      // 1. Si no hay ID de equipo pero sí un nombre, crear el equipo
      if (!equipoIdFinal && formData.equipo_nombre.trim()) {
        const nuevoEquipo = await crearEquipo(
          formData.equipo_nombre.trim(),
          formData.tipo_equipo.trim() || 'No especificado' // Usar el tipo ingresado o un default
        );
        equipoIdFinal = nuevoEquipo.id;
      }

      // 2. Validar los datos (ahora con el equipoId asegurado)
      const datosParaValidar = {
        ...formData,
        equipo_id: equipoIdFinal,
        precioUnitario: partidaSeleccionada?.precioUnitario,
      };

      const validacion = validarActividad(datosParaValidar);
      if (!validacion.valido) {
        setErrores(validacion.errores);
        setLoading(false);
        return;
      }

      // Convertir subactividades de string a array JSON
      const subactividadesArray = formData.subactividades.split('\n').filter(line => line.trim() !== '');

      // 3. Crear la actividad planificada
      const actividadPayload = {
        equipo_id: equipoIdFinal,
        partida_id: formData.partida_id,
        cantidad: parseFloat(formData.cantidad),
        precio_unitario: precioUnitarioUSD,
        monto_total: montoTotalUSD,
        observaciones: formData.observaciones,
        subactividades: subactividadesArray,
      };

      if (isEditMode) {
        await updateActividad(actividadAEditar.id, actividadPayload);
      } else {
        await crearActividadPlanificada({
          ...actividadPayload,
          dia_id: diaId,
        });
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error creando actividad:', error);
      setErrores({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h3>{isEditMode ? 'Editar Actividad' : 'Nueva Actividad'}</h3>
      
      <form onSubmit={handleSubmit}>
        {/* Equipo y Tipo de Equipo */}
        <div className="form-grid cols-2">
          <div className="form-group">
            <label className="form-label">Equipo *</label>
            <input
              type="text"
              list="equipos-list"
              value={formData.equipo_nombre}
              onChange={handleEquipoChange}
              placeholder="Escribe o selecciona un equipo"
              className="form-control"
            />
            <datalist id="equipos-list">
              {equipos.map(equipo => (
                <option key={equipo.id} value={equipo.nombre}>
                  {equipo.tag_serial}
                </option>
              ))}
            </datalist>
            {errores.equipo && <p className="form-error">{errores.equipo}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Tipo de Equipo *</label>
            <input
              type="text"
              value={formData.tipo_equipo}
              onChange={(e) => setFormData({ ...formData, tipo_equipo: e.target.value })}
              placeholder="Ej: Camioneta, Grúa, etc."
              className="form-control"
              disabled={!!formData.equipo_id} // Deshabilitado si el equipo ya existe
            />
          </div>
        </div>

        {/* Partida */}
        <div className="form-group" style={{marginTop: '20px'}}>
          <label className="form-label">Partida Presupuestaria *</label>
          <select
            value={formData.partida_id}
            onChange={(e) => setFormData({ ...formData, partida_id: e.target.value })}
            className="form-control"
          >
            <option value="">Seleccionar partida</option>
            {budget?.items?.map(item => (
              <option key={item.id} value={item.id} data-moneda={item.moneda}>
                {item.item} - {item.descripcion} (${item.precioUnitario?.toLocaleString()}/{item.unidad})
              </option>
            ))}
          </select>
          {errores.partida && <p className="form-error">{errores.partida}</p>}
        </div>

        {/* Cantidad y Monto */}
        <div className="form-grid cols-2" style={{marginTop: '20px'}}>
          <div className="form-group">
            <label className="form-label">Cantidad *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.cantidad}
              onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
              className="form-control"
            />
            {errores.cantidad && <p className="form-error">{errores.cantidad}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Monto Total</label>
            <div className="form-control-static">
              {displayMontoTotal}
            </div>
          </div>
        </div>

        {/* Subactividades */}
        <div className="form-group" style={{marginTop: '20px'}}>
          <label className="form-label">Subactividades (una por línea)</label>
          <textarea
            value={formData.subactividades}
            onChange={(e) => setFormData({ ...formData, subactividades: e.target.value })}
            rows="4"
            className="form-control"
            placeholder="Ej: Inspección de frenos&#10;Cambio de aceite&#10;Revisión de neumáticos"
          />
        </div>


        {/* Observaciones */}
        <div className="form-group" style={{marginTop: '20px'}}>
          <label className="form-label">Observaciones</label>
          <textarea
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            rows="3"
            className="form-control"
          />
        </div>

        {/* Errores y Acciones */}
        {errores.submit && (
          <p className="form-error">{errores.submit}</p>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (isEditMode ? 'Actualizando...' : 'Guardando...') : (isEditMode ? 'Actualizar Actividad' : 'Guardar Actividad')}
          </button>
        </div>
      </form>
    </div>
  );
};