// export default ValuacionForm
// src/components/modules/contrato/submodules/valuaciones/components/ValuacionForm.jsx
import React, { useState, useEffect } from "react";
import { useCurrency } from "../../../../../../contexts/CurrencyContext";
import { useProjects } from "../../../../../../contexts/ProjectContext";
import { useBudget } from "../../../../../../contexts/BudgetContext"; // 1. Importar useBudget
import { useValuation } from "../../../../../../contexts/ValuationContext";
import { useNotification } from "../../../../../../contexts/NotificationContext";
import "./ValuacionForm.css";

const ValuacionForm = ({
  presupuestoData,
  valuacionEdit,
  nextValuationNumber,
  onSave,
  onCancel,
}) => {
  const { formatCurrency } = useCurrency();
  const { selectedProject } = useProjects();
  const { budget } = useBudget(); // 2. Obtener el presupuesto para sacar la moneda principal
  const { valuations } = useValuation();
  const { showToast } = useNotification();

  // 3. Determinar la moneda principal del proyecto
  const mainCurrency = budget?.monedaPrincipal || "USD";

  const [formData, setFormData] = useState({
    numero: `VALUACIÓN ${nextValuationNumber || 1}`,
    periodoInicio: "",
    periodoFin: "",
    partidas: [],
  });

  const [selectedPartida, setSelectedPartida] = useState("");
  const [cantidadEjecutada, setCantidadEjecutada] = useState("");
  const [avancePartidas, setAvancePartidas] = useState([]);

  // Cargar datos de edición y calcular avance REAL del presupuesto
  useEffect(() => {
    if (valuacionEdit) {
      setFormData(valuacionEdit);
    } else {
      // Configurar fecha de inicio basada en la última valuación del contexto
      let fechaInicio = new Date();
      if (valuations && valuations.length > 0) {
        const ultimaValuacion = [...valuations]
          .sort((a, b) => new Date(a.periodoFin) - new Date(b.periodoFin))
          .pop();
        const ultimaFechaFin = new Date(ultimaValuacion.periodoFin);
        fechaInicio = new Date(
          ultimaFechaFin.setDate(ultimaFechaFin.getDate() + 1)
        );
      }

      setFormData((prev) => ({
        ...prev,
        numero: `VALUACIÓN ${nextValuationNumber || 1}`,
        periodoInicio: fechaInicio.toISOString().split("T")[0],
        periodoFin: new Date(fechaInicio.setDate(fechaInicio.getDate() + 30))
          .toISOString()
          .split("T")[0],
      }));
    }

    // Calcular avance REAL del presupuesto
    calcularAvanceRealPresupuesto();
  }, [
    valuacionEdit,
    presupuestoData,
    nextValuationNumber,
    selectedProject,
    valuations,
  ]); // valuations se agrega como dependencia

  // AGREGAR: useEffect para recalcular cuando cambien las partidas de la valuación actual
  useEffect(() => {
    calcularAvanceRealPresupuesto();
  }, [formData.partidas]);

  // Calcular avance REAL del presupuesto (CORREGIDO)
  const calcularAvanceRealPresupuesto = () => {
    if (!presupuestoData || !presupuestoData.items) return;

    console.log("🔍 DEBUG - Valuaciones cargadas:", valuations);
    console.log("🔍 DEBUG - Project ID:", selectedProject?.id);
    console.log("🔍 DEBUG - Presupuesto items:", presupuestoData.items.length);

    // Calcular ejecución acumulada por partida (SOLO valuaciones anteriores)
    const ejecucionAcumulada = {};

    // Inicializar con datos del presupuesto
    presupuestoData.items.forEach((item) => {
      ejecucionAcumulada[item.id] = {
        ...item,
        cantidadEjecutada: 0,
        montoEjecutado: 0,
        cantidadDisponible: item.cantidad,
        montoDisponible: item.montoContrato,
      };
    });

    // Sumar ejecución de TODAS las valuaciones ANTERIORES (excluyendo la actual si estamos editando)
    valuations?.forEach((valuacion) => {
      // Si estamos editando, excluir la valuación actual para no duplicar
      if (valuacionEdit && valuacion.id === valuacionEdit.id) {
        console.log(
          "🔍 DEBUG - Excluyendo valuación actual:",
          valuacion.numero
        );
        return; // Saltar esta valuación
      }

      console.log("🔍 DEBUG - Procesando valuación:", valuacion.numero);
      valuacion.partidas?.forEach((partida) => {
        if (ejecucionAcumulada[partida.partidaId]) {
          console.log(
            `🔍 DEBUG - Sumando partida ${partida.partidaId}: ${parseFloat(
              partida.cantidadEjecutada
            )} ${partida.unidad}`
          );
          ejecucionAcumulada[partida.partidaId].cantidadEjecutada += parseFloat(
            partida.cantidadEjecutada
          );
          ejecucionAcumulada[partida.partidaId].montoEjecutado +=
            partida.montoTotal;
        }
      });
    });

    // Calcular disponibilidad REAL (sin incluir la valuación actual)
    const avance = Object.values(ejecucionAcumulada).map((partida) => {
      const porcentajeCantidad =
        partida.cantidad > 0
          ? (partida.cantidadEjecutada / partida.cantidad) * 100
          : 0;
      const porcentajeMonto =
        partida.montoContrato > 0
          ? (partida.montoEjecutado / partida.montoContrato) * 100
          : 0;

      return {
        ...partida,
        cantidadDisponible: partida.cantidad - partida.cantidadEjecutada,
        montoDisponible: partida.montoContrato - partida.montoEjecutado,
        porcentajeEjecutadoCantidad: porcentajeCantidad,
        porcentajeEjecutadoMonto: porcentajeMonto,
      };
    });

    console.log("🔍 DEBUG - Avance calculado:", avance);
    setAvancePartidas(avance);
  };

  const handleAddPartida = () => {
    if (
      !selectedPartida ||
      !cantidadEjecutada ||
      parseFloat(cantidadEjecutada) <= 0
    ) {
      showToast("Por favor selecciona una partida y ingresa una cantidad válida", "warning");
      return;
    }

    const partidaPresupuesto = presupuestoData.items.find(
      (item) => item.id === selectedPartida
    );
    if (!partidaPresupuesto) return;

    const cantidad = parseFloat(cantidadEjecutada);
    const partidaAvance = avancePartidas.find((p) => p.id === selectedPartida);

    // IMPORTANTE: Usar la cantidadDisponible que ya incluye las valuaciones anteriores
    const cantidadDisponibleReal = partidaAvance?.cantidadDisponible || 0;

    console.log("🔍 DEBUG - Validando cantidad:", {
      cantidad,
      cantidadDisponibleReal,
      partida: partidaAvance?.item,
      unidad: partidaPresupuesto.unidad,
    });

    if (cantidad > cantidadDisponibleReal) {
      showToast(
        `No hay suficiente cantidad disponible. Máximo disponible: ${cantidadDisponibleReal.toFixed(
          2
        )} ${partidaPresupuesto.unidad}`, "warning"
      );
      return;
    }

    const montoTotal = cantidad * partidaPresupuesto.precioUnitario;

    const nuevaPartida = {
      id: Date.now().toString(),
      partidaId: partidaPresupuesto.id,
      item: partidaPresupuesto.item,
      descripcion: partidaPresupuesto.descripcion,
      unidad: partidaPresupuesto.unidad,
      precioUnitario: partidaPresupuesto.precioUnitario,
      moneda: partidaPresupuesto.moneda,
      cantidadEjecutada: cantidad,
      montoTotal: montoTotal,
      aplicaIVA: partidaPresupuesto.aplicaIVA,
    };

    setFormData((prev) => ({
      ...prev,
      partidas: [...prev.partidas, nuevaPartida],
    }));

    // Resetear selección
    setSelectedPartida("");
    setCantidadEjecutada("");
  };

  const handleRemovePartida = (partidaId) => {
    setFormData((prev) => ({
      ...prev,
      partidas: prev.partidas.filter((p) => p.id !== partidaId),
    }));
  };

  const handleSave = () => {
    if (!formData.numero || !formData.periodoInicio || !formData.periodoFin) {
      showToast("Por favor completa todos los campos obligatorios", "warning");
      return;
    }

    if (formData.partidas.length === 0) {
      showToast("Debes agregar al menos una partida ejecutada", "warning");
      return;
    }

    // Calcular totales
    const subtotal = formData.partidas.reduce(
      (sum, partida) => sum + partida.montoTotal,
      0
    );
    const partidasConIva = formData.partidas.filter((p) => p.aplicaIVA);
    const iva = partidasConIva.reduce(
      (sum, partida) => sum + partida.montoTotal * 0.16,
      0
    );
    const total = subtotal + iva;

    const valuacionCompleta = {
      ...formData,
      totales: {
        subtotal,
        iva,
        total,
        cantidadPartidas: formData.partidas.length,
        // AGREGADO: Guardar la moneda de la valuación.
        // Asumimos que es la moneda de la primera partida.
        currency: formData.partidas[0]?.moneda || "USD",
      },
      fechaCreacion: valuacionEdit?.fechaCreacion || new Date().toISOString(),
      projectId: selectedProject?.id, // CORREGIDO: usar selectedProject.id
    };

    onSave(valuacionCompleta);
  };

  // Calcular totales en tiempo real
  const subtotal = formData.partidas.reduce(
    (sum, partida) => sum + partida.montoTotal,
    0
  );
  const partidasConIva = formData.partidas.filter((p) => p.aplicaIVA);
  const iva = partidasConIva.reduce(
    (sum, partida) => sum + partida.montoTotal * 0.16,
    0
  );
  const total = subtotal + iva;

  // Partidas disponibles (basado en el avance REAL)
  const partidasDisponibles = avancePartidas.filter(
    (partida) => partida.cantidadDisponible > 0
  );

  // Calcular totales del avance
  const getTotalEjecutado = () => {
    return avancePartidas.reduce(
      (total, partida) => total + partida.montoEjecutado,
      0
    );
  };

  const getTotalPresupuestado = () => {
    return avancePartidas.reduce(
      (total, partida) => total + partida.montoContrato,
      0
    );
  };

  const getPorcentajeTotal = () => {
    const totalPresupuestado = getTotalPresupuestado();
    return totalPresupuestado > 0
      ? (getTotalEjecutado() / totalPresupuestado) * 100
      : 0;
  };

  return (
    <div className="valuacion-form">
      <div className="form-header">
        <h3>{valuacionEdit ? "Editar Valuación" : "Nueva Valuación"}</h3>
        <div className="header-actions">
          <button className="btn-outline" onClick={onCancel}>
            ← Volver
          </button>
        </div>
      </div>

      {/* Información básica de la valuación */}
      <div className="basic-info-section">
        <h4>Información de la Valuación</h4>
        <div className="form-row">
          <div className="form-group">
            <label>Valuación N° *</label>
            <input
              type="text"
              value={formData.numero}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, numero: e.target.value }))
              }
              placeholder="Ej: VALUACIÓN 1"
              required
            />
          </div>
          <div className="form-group">
            <label>Periodo de Ejecución - Inicio *</label>
            <input
              type="date"
              value={formData.periodoInicio}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  periodoInicio: e.target.value,
                }))
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Periodo de Ejecución - Fin *</label>
            <input
              type="date"
              value={formData.periodoFin}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, periodoFin: e.target.value }))
              }
              required
            />
          </div>
        </div>
      </div>

      {/* TABLA de Avance REAL */}
      {avancePartidas.length > 0 && (
        <div className="avance-presupuesto-section">
          <div className="avance-header">
            <h4>Avance del Presupuesto (Ejecución Real Acumulada)</h4>
            <div className="avance-total">
              <span className="avance-label">Avance Global:</span>
              <span className="avance-value">
                {getPorcentajeTotal().toFixed(1)}%
              </span>
              <span className="avance-monto">
                {formatCurrency(getTotalEjecutado(), "USD")} de{" "}
                {formatCurrency(getTotalPresupuestado(), "USD")}
              </span>
            </div>
          </div>

          <div className="avance-table">
            <table>
              <thead>
                <tr>
                  <th className="col-item">ITEM</th>
                  <th className="col-descripcion">DESCRIPCIÓN</th>
                  <th className="col-unidad">UNIDAD</th>
                  <th className="col-presupuestado">PRESUPUESTADO</th>
                  <th className="col-ejecutado">EJECUTADO</th>
                  <th className="col-disponible">DISPONIBLE</th>
                  <th className="col-porcentaje">% AVANCE</th>
                </tr>
              </thead>
              <tbody>
                {avancePartidas.map((partida) => (
                  <tr
                    key={partida.id}
                    className={
                      partida.cantidadDisponible <= 0 ? "completada" : ""
                    }
                  >
                    <td className="col-item">{partida.item}</td>
                    <td className="col-descripcion">{partida.descripcion}</td>
                    <td className="col-unidad">{partida.unidad}</td>
                    <td className="col-presupuestado">
                      <div>
                        {partida.cantidad.toLocaleString("es-VE")}{" "}
                        {partida.unidad}
                      </div>
                      <div className="monto">
                        {formatCurrency(partida.montoContrato, partida.moneda)}
                      </div>
                    </td>
                    <td className="col-ejecutado">
                      <div>
                        {partida.cantidadEjecutada.toLocaleString("es-VE")}{" "}
                        {partida.unidad}
                      </div>
                      <div className="monto">
                        {formatCurrency(partida.montoEjecutado, partida.moneda)}
                      </div>
                    </td>
                    <td className="col-disponible">
                      <div>
                        {partida.cantidadDisponible.toLocaleString("es-VE")}{" "}
                        {partida.unidad}
                      </div>
                      <div className="monto">
                        {formatCurrency(
                          partida.montoDisponible,
                          partida.moneda
                        )}
                      </div>
                    </td>
                    <td className="col-porcentaje">
                      <div className="progress-container">
                        <div
                          className="progress-bar-avance"
                          style={{
                            width: `${Math.min(
                              partida.porcentajeEjecutadoCantidad,
                              100
                            )}%`,
                          }}
                        ></div>
                        <span className="progress-text">
                          {partida.porcentajeEjecutadoCantidad.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Agregar partidas - usando disponibilidad REAL */}
      <div className="add-partida-section">
        <h4>Agregar Partidas Ejecutadas</h4>
        <div className="add-partida-form">
          <div className="form-row">
            <div className="form-group">
              <label>Seleccionar Partida</label>
              <select
                value={selectedPartida}
                onChange={(e) => {
                  setSelectedPartida(e.target.value);
                  setCantidadEjecutada("");
                }}
                disabled={partidasDisponibles.length === 0}
              >
                <option value="">Seleccionar partida...</option>
                {partidasDisponibles.map((partida) => (
                  <option key={partida.id} value={partida.id}>
                    {partida.item} - {partida.descripcion.substring(0, 50)}...
                    {` (Disponible: ${partida.cantidadDisponible.toFixed(2)} ${
                      partida.unidad
                    })`}
                  </option>
                ))}
              </select>
              {partidasDisponibles.length === 0 && (
                <small>No hay partidas disponibles para agregar</small>
              )}
            </div>

            <div className="form-group">
              <label>Cantidad Ejecutada</label>
              <input
                type="number"
                value={cantidadEjecutada}
                onChange={(e) => setCantidadEjecutada(e.target.value)}
                min="0.01"
                step="0.01"
                placeholder="0.00"
                disabled={!selectedPartida}
              />
              {selectedPartida && (
                <small>
                  Máximo disponible:{" "}
                  {avancePartidas
                    .find((p) => p.id === selectedPartida)
                    ?.cantidadDisponible.toFixed(2) || 0}{" "}
                  {avancePartidas.find((p) => p.id === selectedPartida)?.unidad}
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Acción</label>
              <button
                className="btn-primary"
                onClick={handleAddPartida}
                disabled={!selectedPartida || !cantidadEjecutada}
              >
                ➕ Agregar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de partidas agregadas */}
      {formData.partidas.length > 0 && (
        <div className="partidas-list-section">
          <h4>Partidas de la Valuación Actual ({formData.partidas.length})</h4>
          <div className="partidas-table">
            <table>
              <thead>
                <tr>
                  <th>ITEM</th>
                  <th>DESCRIPCIÓN</th>
                  <th>UNIDAD</th>
                  <th>CANTIDAD</th>
                  <th>PRECIO UNITARIO</th>
                  <th>MONTO TOTAL</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {formData.partidas.map((partida) => (
                  <tr key={partida.id}>
                    <td className="col-item">{partida.item}</td>
                    <td className="col-descripcion">{partida.descripcion}</td>
                    <td className="col-unidad">{partida.unidad}</td>
                    <td className="col-cantidad">
                      {partida.cantidadEjecutada}
                    </td>
                    <td className="col-precio">
                      {formatCurrency(partida.precioUnitario, partida.moneda)}
                    </td>
                    <td className="col-monto">
                      <strong>
                        {formatCurrency(partida.montoTotal, partida.moneda)}
                      </strong>
                    </td>
                    <td className="col-acciones">
                      <button
                        className="btn-delete"
                        onClick={() => handleRemovePartida(partida.id)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resumen de totales */}
          <div className="resumen-valuacion">
            <div className="resumen-grid">
              <div className="resumen-item">
                <span className="resumen-label">SUB-TOTAL</span>
                {/* CORREGIDO: Usar la moneda principal del proyecto */}
                <span className="resumen-value">
                  {formatCurrency(subtotal, mainCurrency)}
                </span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">16% IVA</span>
                <span className="resumen-value">
                  {/* CORREGIDO: Usar la moneda principal del proyecto */}
                  {formatCurrency(iva, mainCurrency)}
                </span>
              </div>
              <div className="resumen-item total">
                <span className="resumen-label">TOTAL VALUADO</span>
                <span className="resumen-value">
                  {/* CORREGIDO: Usar la moneda principal del proyecto */}
                  {formatCurrency(total, mainCurrency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Acciones finales */}
      <div className="form-actions">
        <button
          className="btn-primary large"
          onClick={handleSave}
          disabled={formData.partidas.length === 0}
        >
          💾 {valuacionEdit ? "Actualizar Valuación" : "Cargar Valuación"}
        </button>
        <button className="btn-outline" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default ValuacionForm;
