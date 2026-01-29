// components/planificacion/ActividadForm.jsx
import { useState, useEffect, useMemo } from 'react';
import { usePlanning } from '../../../../../../contexts/PlanningContext';
import { useBudget } from '../../../../../../contexts/BudgetContext';
import { useCurrency } from '../../../../../../contexts/CurrencyContext';
import { usePersonal } from '../../../../../../contexts/PersonalContext';
import { useProjects } from '../../../../../../contexts/ProjectContext';
import { calculateDailyLaborCost } from '../../../../../../utils/payrollCalculator';

export const ActividadForm = ({ diaId, diaFecha, actividadAEditar, onClose, onSuccess }) => {
  const { crearActividadPlanificada, updateActividad, getDisponibilidadPartida } = usePlanning();
  const { budget } = useBudget();
  const { convertToUSD, formatCurrency } = useCurrency();
  const { getEmployeesByProject } = usePersonal();
  const { selectedProject } = useProjects();

  const [formData, setFormData] = useState({
    descripcion: '',
    partida_id: '',
    unidad_medida: '',
    cantidad_programada: '',
    precio_unitario: '',
    subactividades: [''],
    personal_ids: [] // Array of selected employee IDs
  });

  const [partidaSearch, setPartidaSearch] = useState('');
  const [employees, setEmployees] = useState([]);
  const [availableUnits, setAvailableUnits] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [errores, setErrores] = useState({});
  const [basePrice, setBasePrice] = useState(0);
  const [includeLaborCost, setIncludeLaborCost] = useState(false);

  const isEditMode = !!actividadAEditar;

  // Cargar empleados
  useEffect(() => {
    const loadEmployees = async () => {
      setLoadingEmployees(true);
      const data = await getEmployeesByProject(selectedProject?.id);
      setEmployees(data || []);
      setLoadingEmployees(false);
    };
    if (selectedProject?.id) {
      loadEmployees();
    }
  }, [selectedProject, getEmployeesByProject]);

  // Cargar datos en edición
  useEffect(() => {
    if (isEditMode && actividadAEditar) {
      // En modo edición, necesitamos cargar las subactividades y personal si vienen de la DB
      // Pero ActividadForm recibe un objeto plano de la tabla principal
      // Es posible que necesitemos hacer fetch de los detalles si no vienen incluidos
      // Por ahora asumo que actividadAEditar viene "enriquecido" desde DiaPlanning
      // Si no, habría que ajustar DiaPlanning para incluir subactividades y personal

      setFormData({
        descripcion: actividadAEditar.descripcion || '',
        partida_id: actividadAEditar.partida_id || '',
        unidad_medida: actividadAEditar.unidad_medida || '',
        cantidad_programada: actividadAEditar.cantidad_programada || '',
        precio_unitario: actividadAEditar.precio_unitario || '',
        subactividades: actividadAEditar.subactividades?.map(s => s.descripcion) || [''],
        personal_ids: actividadAEditar.personal?.map(p => p.personal_id) || []
      });
      // Set base price from current or try to find it? 
      // Safe to assume current price is base if we don't know better? 
      // Actually getting it from partida again is safer if we want to "reset" it, but for edit mode let's trust existing.
      setBasePrice(actividadAEditar.precio_unitario || 0);

      // Cargar disponibilidad inicial para validación visual (sumando lo propio para no marcar error)
      if (actividadAEditar.partida_id) {
        checkAvailability(actividadAEditar.partida_id, parseFloat(actividadAEditar.cantidad_programada));
      }
    }
  }, [actividadAEditar, isEditMode]);

  const checkAvailability = async (partidaId, currentOwnAmount = 0) => {
    // Obtenemos lo disponible REAL (Total - Usado por TODOS)
    const available = await getDisponibilidadPartida(partidaId);
    // Si estamos editando, "disponible" incluye lo que ya usamos nosotros, así que lo sumamos para ver el techo real
    setAvailableUnits(available + currentOwnAmount);
  };

  // Manejo de Partida
  const handlePartidaChange = async (itemId) => {
    const item = budget?.items?.find(i => i.id === itemId);
    if (item) {
      // Convert price to USD standard
      const priceUSD = convertToUSD(item.precioUnitario, item.moneda);

      setFormData(prev => ({
        ...prev,
        partida_id: itemId,
        unidad_medida: item.unidad,
        precio_unitario: priceUSD,
        // Mantener nombre_partida para optimización si se desea
      }));
      setBasePrice(priceUSD);

      await checkAvailability(itemId, isEditMode ? parseFloat(actividadAEditar.cantidad_programada) : 0);
    } else {
      setAvailableUnits(null);
    }
  };

  // Filtrar partidas
  const partidasFiltradas = useMemo(() => {
    if (!budget?.items) return [];
    const searchLower = partidaSearch.toLowerCase();
    return budget.items.filter(item =>
      item.item.toLowerCase().includes(searchLower) ||
      item.descripcion.toLowerCase().includes(searchLower)
    );
  }, [budget, partidaSearch]);

  // Cálculos de montos
  const cantidad = parseFloat(formData.cantidad_programada) || 0;
  const precio = parseFloat(formData.precio_unitario) || 0;
  const montoTotal = cantidad * precio;

  // Calculo Costo Mano Obra
  const laborCostTotal = useMemo(() => {
    if (!employees.length || !formData.personal_ids.length) return 0;

    // Si no hay fecha, usar fecha actual como fallback para cálculo mensual
    const dateToUse = diaFecha ? String(diaFecha).split('T')[0] : new Date().toISOString().split('T')[0];

    return formData.personal_ids.reduce((sum, pid) => {
      const emp = employees.find(e => e.id === pid);
      if (!emp) return sum;
      return sum + calculateDailyLaborCost(emp, dateToUse);
    }, 0);
  }, [employees, formData.personal_ids, diaFecha]);

  // Effect to update unit price if labor included
  useEffect(() => {
    if (includeLaborCost) {
      if (cantidad > 0) {
        const laborPerUnit = laborCostTotal / cantidad;
        const newPrice = basePrice + laborPerUnit;
        setFormData(prev => ({ ...prev, precio_unitario: parseFloat(newPrice.toFixed(4)) }));
      }
    } else {
      // Revert to base price if unchecked
      // Only if we haven't manually changed partida (basePrice tracks that)
      setFormData(prev => ({ ...prev, precio_unitario: basePrice }));
    }
  }, [includeLaborCost, laborCostTotal, cantidad, basePrice]);

  // Subactividades
  const handleSubactividadChange = (index, value) => {
    const newSubs = [...formData.subactividades];
    newSubs[index] = value;
    setFormData(prev => ({ ...prev, subactividades: newSubs }));
  };

  const addSubactividad = () => {
    setFormData(prev => ({ ...prev, subactividades: [...prev.subactividades, ''] }));
  };

  const removeSubactividad = (index) => {
    setFormData(prev => ({
      ...prev,
      subactividades: prev.subactividades.filter((_, i) => i !== index)
    }));
  };

  // Personal
  const togglePersonal = (empId) => {
    setFormData(prev => {
      const exists = prev.personal_ids.includes(empId);
      if (exists) {
        return { ...prev, personal_ids: prev.personal_ids.filter(id => id !== empId) };
      } else {
        return { ...prev, personal_ids: [...prev.personal_ids, empId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrores({});

    if (!formData.descripcion) {
      setErrores(prev => ({ ...prev, descripcion: 'La descripción es obligatoria' }));
      return;
    }
    if (!formData.partida_id) {
      setErrores(prev => ({ ...prev, partida: 'Debe seleccionar una partida' }));
      return;
    }
    if (cantidad <= 0) {
      setErrores(prev => ({ ...prev, cantidad: 'La cantidad debe ser mayor a 0' }));
      return;
    }
    if (availableUnits !== null && cantidad > availableUnits) {
      if (!window.confirm(`La cantidad ingresada (${cantidad}) excede la disponibilidad presupuestaria calculada (${availableUnits.toFixed(2)}). ¿Desea continuar de todos modos?`)) {
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        dia_id: diaId,
        descripcion: formData.descripcion,
        partida_id: formData.partida_id,
        nombre_partida: budget?.items?.find(i => i.id === formData.partida_id)?.descripcion || '',
        unidad_medida: formData.unidad_medida,
        cantidad_programada: cantidad,
        precio_unitario: precio,
        monto_programado: montoTotal,
        // Subactividades y personal se procesan en el context si es creación
        subactividades: formData.subactividades.filter(s => s.trim()).map(s => ({ descripcion: s })),
        personal: formData.personal_ids.map(pid => {
          const emp = employees.find(e => e.id === pid);
          return { id: pid, nombre: `${emp?.nombre} ${emp?.apellido}`, rol: emp?.cargo };
        })
      };

      if (isEditMode) {
        await updateActividad(actividadAEditar.id, payload);
      } else {
        await crearActividadPlanificada(payload);
      }

      onSuccess();
    } catch (error) {
      console.error("Error submit form:", error);
      setErrores({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>

        {/* Actividad General */}
        <div className="form-group">
          <label className="form-label">Actividad General (Descripción) *</label>
          <textarea
            className="form-control"
            value={formData.descripcion}
            onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Descripción detallada de la actividad"
            rows="2"
            autoFocus
          />
          {errores.descripcion && <p className="form-error">{errores.descripcion}</p>}
        </div>

        {/* Partida Presupuestaria */}
        <div className="form-group" style={{ marginTop: '15px' }}>
          <label className="form-label">Partida Asociada *</label>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar partida..."
            value={partidaSearch}
            onChange={e => setPartidaSearch(e.target.value)}
            style={{ marginBottom: '5px' }}
          />
          <select
            className="form-control"
            value={formData.partida_id}
            onChange={e => handlePartidaChange(e.target.value)}
            size={4}
            style={{ overflowY: 'auto' }}
          >
            <option value="">-- Seleccione Partida --</option>
            {partidasFiltradas.map(item => (
              <option key={item.id} value={item.id}>
                {item.item} - {item.descripcion}
              </option>
            ))}
          </select>
          {errores.partida && <p className="form-error">{errores.partida}</p>}
        </div>

        {/* Unidades y Montos */}
        <div className="form-grid cols-2" style={{ marginTop: '15px' }}>
          <div className="form-group">
            <label className="form-label">Unidades a Ejecutar ({formData.unidad_medida || '-'}) *</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              value={formData.cantidad_programada}
              onChange={e => setFormData({ ...formData, cantidad_programada: e.target.value })}
            />
            {availableUnits !== null && (
              <small className={`availability-text ${cantidad > availableUnits ? 'text-danger' : 'text-success'}`} style={{ display: 'block', marginTop: '4px' }}>
                Disponible: {availableUnits.toFixed(2)} {formData.unidad_medida}
              </small>
            )}
            {errores.cantidad && <p className="form-error">{errores.cantidad}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Monto Total Estimado</label>
            <div className="form-control-static" style={{ backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
              {formatCurrency(montoTotal, 'USD')}
            </div>
            <small className="text-muted">Calculado: {formData.cantidad_programada || 0} x {formatCurrency(precio, 'USD')}</small>
          </div>
        </div>

        {/* Subactividades */}
        <div className="form-group" style={{ marginTop: '20px' }}>
          <label className="form-label">Subactividades a Realizar</label>
          <div className="subactividades-list" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
            {formData.subactividades.map((sub, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <span style={{ paddingTop: '8px', color: '#888' }}>{idx + 1}.</span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Desglose de actividad..."
                  value={sub}
                  onChange={e => handleSubactividadChange(idx, e.target.value)}
                />
                <button type="button" className="btn-icon" onClick={() => removeSubactividad(idx)} title="Eliminar">✕</button>
              </div>
            ))}
            <button type="button" className="btn-secondary btn-sm" onClick={addSubactividad} style={{ marginTop: '5px' }}>+ Agregar Subactividad</button>
          </div>
        </div>

        {/* Personal Involucrado */}
        <div className="form-group" style={{ marginTop: '20px' }}>
          <label className="form-label">Personal Involucrado</label>
          {loadingEmployees ? <p>Cargando personal...</p> : (
            <div className="personal-selection-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', maxHeight: '150px', overflowY: 'auto', border: '1px solid #eee', padding: '10px' }}>
              {employees.map(emp => (
                <label key={emp.id} className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.personal_ids.includes(emp.id)}
                    onChange={() => togglePersonal(emp.id)}
                  />
                  <span>{emp.nombre} {emp.apellido} <small style={{ color: '#888' }}>({emp.cargo})</small></span>
                </label>
              ))}
            </div>
          )}

          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Costo Estimado de Nómina (Diario):</strong>
              <span>{formatCurrency(laborCostTotal, 'USD')}</span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeLaborCost}
                onChange={e => setIncludeLaborCost(e.target.checked)}
                disabled={laborCostTotal === 0 || cantidad <= 0}
              />
              <span>Incluir costo de nómina en el precio unitario de la actividad</span>
            </label>
            {includeLaborCost && (
              <div style={{ marginTop: '5px', fontSize: '0.85rem', color: '#666' }}>
                <em>(+ {formatCurrency(cantidad > 0 ? laborCostTotal / cantidad : 0, 'USD')} por unidad)</em>
              </div>
            )}
          </div>
        </div>

        {errores.submit && <div className="form-error global">{errores.submit}</div>}

        <div className="form-actions" style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : (isEditMode ? 'Actualizar Actividad' : 'Guardar Actividad')}
          </button>
        </div>

      </form>
    </div>
  );
};