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
    equipo_nombre: '',
    equipo_id: '',
    tipo_equipo: '',
    partida_id: '',
    cantidad: 1,
    observaciones: '',
    subactividades: [''] // Inicializar con un campo vacío
  });
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState({});
  const [partidaSearch, setPartidaSearch] = useState('');

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
        subactividades: (actividadAEditar.subactividades && actividadAEditar.subactividades.length > 0)
          ? actividadAEditar.subactividades
          : [''],
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

  // Filtrar partidas
  const partidasFiltradas = budget?.items?.filter(item => {
    const searchLower = partidaSearch.toLowerCase();
    return (
      item.item.toLowerCase().includes(searchLower) ||
      item.descripcion.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleEquipoChange = (e) => {
    const nombre = e.target.value;
    setFormData(prev => ({ ...prev, equipo_nombre: nombre, equipo_id: '', tipo_equipo: '' }));

    const equipoEncontrado = equipos.find(
      eq => eq.nombre.toLowerCase() === nombre.toLowerCase() ||
        eq.tag_serial.toLowerCase() === nombre.toLowerCase()
    );

    if (equipoEncontrado) {
      setFormData(prev => ({
        ...prev,
        equipo_id: equipoEncontrado.id,
        tipo_equipo: equipoEncontrado.tipo_equipo
      }));
    }
  };

  // Manejo de subactividades dinámicas
  const handleSubactividadChange = (index, value) => {
    const newSubactividades = [...formData.subactividades];
    newSubactividades[index] = value;
    setFormData({ ...formData, subactividades: newSubactividades });
  };

  const addSubactividad = () => {
    setFormData({ ...formData, subactividades: [...formData.subactividades, ''] });
  };

  const removeSubactividad = (index) => {
    const newSubactividades = formData.subactividades.filter((_, i) => i !== index);
    setFormData({ ...formData, subactividades: newSubactividades });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Confirmación antes de procesar
    if (!window.confirm(isEditMode ? '¿Estás seguro de actualizar esta actividad?' : '¿Estás seguro de crear esta actividad?')) {
      return;
    }

    setLoading(true);

    try {
      let equipoIdFinal = formData.equipo_id;

      if (!equipoIdFinal && formData.equipo_nombre.trim()) {
        const nuevoEquipo = await crearEquipo(
          formData.equipo_nombre.trim(),
          formData.tipo_equipo.trim() || 'No especificado'
        );
        equipoIdFinal = nuevoEquipo.id;
      }

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

      // Filtrar subactividades vacías
      const subactividadesArray = formData.subactividades.filter(s => s.trim() !== '');

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
      {/* <h3>{isEditMode ? 'Editar Actividad' : 'Nueva Actividad'}</h3> -- Title handled by Modal */}

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
              disabled={!!formData.equipo_id}
            />
          </div>
        </div>

        {/* Partida con Buscador */}
        <div className="form-group" style={{ marginTop: '20px' }}>
          <label className="form-label">Partida Presupuestaria *</label>
          <input
            type="text"
            placeholder="Buscar partida por nombre o código..."
            className="form-control"
            style={{ marginBottom: '5px' }}
            value={partidaSearch}
            onChange={(e) => setPartidaSearch(e.target.value)}
          />
          <select
            value={formData.partida_id}
            onChange={(e) => setFormData({ ...formData, partida_id: e.target.value })}
            className="form-control"
            size={5} // Mostrar varias opciones para facilitar la selección
          >
            <option value="">Seleccionar partida</option>
            {partidasFiltradas.map(item => (
              <option key={item.id} value={item.id} data-moneda={item.moneda}>
                {item.item} - {item.descripcion} (${item.precioUnitario?.toLocaleString()}/{item.unidad})
              </option>
            ))}
          </select>
          {partidasFiltradas.length === 0 && <p className="text-muted" style={{ fontSize: '0.8rem' }}>No se encontraron partidas</p>}
          {errores.partida && <p className="form-error">{errores.partida}</p>}
        </div>

        {/* Cantidad y Monto */}
        <div className="form-grid cols-2" style={{ marginTop: '20px' }}>
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

        {/* Subactividades Dinámicas */}
        <div className="form-group" style={{ marginTop: '20px' }}>
          <label className="form-label">Subactividades</label>
          {formData.subactividades.map((sub, index) => (
            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                value={sub}
                onChange={(e) => handleSubactividadChange(index, e.target.value)}
                className="form-control"
                placeholder={`Subactividad ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => removeSubactividad(index)}
                className="btn-secondary"
                style={{ padding: '0 10px', color: '#d32f2f', borderColor: '#d32f2f' }}
                title="Eliminar subactividad"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSubactividad}
            className="btn-secondary"
            style={{ fontSize: '0.9rem', width: '100%' }}
          >
            + Agregar Subactividad
          </button>
        </div>


        {/* Observaciones */}
        <div className="form-group" style={{ marginTop: '20px' }}>
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