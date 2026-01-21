// src/components/modules/contrato/submodules/valuaciones/components/ValuacionesList.jsx
import React from "react";
import { useCurrency } from "../../../../../../contexts/CurrencyContext";
import "./ValuacionesList.css";
import { useBudget } from "../../../../../../contexts/BudgetContext";
import { getMainCurrency } from "../../../../../../utils/mainCurrency";
const ValuacionesList = ({
  valuaciones,
  presupuestoData,
  onCreateValuacion,
  onViewValuacion,
  onEditValuacion,
  onDeleteValuacion,
}) => {
  //TODO: Por ahora lo que soluciona lo del formato de la moneda es que que calculamos en cada componente el valor principal de la moneda que se usa en el proyecto
  const { formatCurrency } = useCurrency();
  const { budget } = useBudget();
  const mainCurrency = getMainCurrency(budget);
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  };

  const getProgressPercentage = () => {
    if (!presupuestoData || !presupuestoData.items) return 0;

    // Calcular el subtotal del presupuesto ("Subtotal Presupuesto" = Items que aplican IVA)
    const subtotalPresupuestoBase = presupuestoData.items.reduce((sum, item) => {
      // Filtrar items que son parte del "Subtotal Presupuesto" (aplicaIVA = true)
      if (item.aplicaIVA) {
        return sum + (item.montoContrato || 0);
      }
      return sum;
    }, 0);

    // Calcular el subtotal valuado de los items base
    const subtotalValuadoBase = valuaciones.reduce((sumVal, valuacion) => {
      const sumaPartidas = valuacion.partidas?.reduce((sumPar, partida) => {
        if (partida.aplicaIVA) {
          return sumPar + (partida.montoTotal || 0);
        }
        return sumPar;
      }, 0) || 0;
      return sumVal + sumaPartidas;
    }, 0);

    return subtotalPresupuestoBase > 0
      ? (subtotalValuadoBase / subtotalPresupuestoBase) * 100
      : 0;
  };

  const getTotalPresupuesto = () => {
    if (!presupuestoData || !presupuestoData.items) return 0;
    // Retornar subtotal sin IVA para el cálculo de porcentaje
    return presupuestoData.items.reduce(
      (sum, item) => sum + (item.montoContrato || 0),
      0
    );
  };

  const getTotalValuado = () => {
    // Retornar subtotal sin IVA para el cálculo de porcentaje
    return valuaciones.reduce(
      (sum, valuacion) => sum + (valuacion.totales?.subtotal || 0),
      0
    );
  };

  const getTotalValuadoConIva = () => {
    // Para mostrar el monto total con IVA en las tarjetas
    return valuaciones.reduce(
      (sum, valuacion) => sum + (valuacion.totales?.total || 0),
      0
    );
  };

  const getTotalPartidasValuadas = () => {
    return valuaciones.reduce(
      (sum, valuacion) => sum + (valuacion.partidas?.length || 0),
      0
    );
  };

  const progressPercentage = getProgressPercentage();
  const totalPresupuestoSinIva = getTotalPresupuesto();
  const totalValuadoSinIva = getTotalValuado();
  const totalValuadoConIva = getTotalValuadoConIva();
  const totalPartidasValuadas = getTotalPartidasValuadas();

  return (
    <div className="valuaciones-list">
      <div className="list-header">
        <div className="header-content">
          <h3>Valuaciones Registradas</h3>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={onCreateValuacion}>
            ➕ Nueva Valuación
          </button>
        </div>
      </div>

      {/* Resumen general */}
      {presupuestoData && (
        <div className="resumen-general">
          <div className="resumen-cards">
            <div className="resumen-card">
              <div className="resumen-icon">📊</div>
              <div className="resumen-content">
                <div className="resumen-value">{valuaciones.length}</div>
                <div className="resumen-label">Valuaciones</div>
              </div>
            </div>
            <div className="resumen-card">
              <div className="resumen-icon">💰</div>
              <div className="resumen-content">
                <div className="resumen-value">
                  {formatCurrency(totalValuadoConIva, mainCurrency)}
                </div>
                <div className="resumen-label">Total Valuado</div>
                <div className="resumen-subtitle">
                  (Sin IVA: {formatCurrency(totalValuadoSinIva, mainCurrency)})
                </div>
              </div>
            </div>
            <div className="resumen-card">
              <div className="resumen-icon">📈</div>
              <div className="resumen-content">
                <div className="resumen-value">
                  {progressPercentage.toFixed(1)}%
                </div>
                <div className="resumen-label">Avance Global</div>
                <div className="resumen-subtitle">(Sobre Subtotal Presupuesto)</div>
              </div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="progress-section">
            <div className="progress-header">
              <span>Progreso del Contrato (Sobre Subtotal Presupuesto)</span>
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
            <div className="progress-details">
              <small>
                {formatCurrency(totalValuadoSinIva, mainCurrency)} de{" "}
                {formatCurrency(totalPresupuestoSinIva, mainCurrency)}(
                {progressPercentage.toFixed(1)}%)
              </small>
            </div>
          </div>
        </div>
      )}

      {/* Lista de valuaciones */}
      <div className="valuaciones-grid">
        {valuaciones.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h4>No hay valuaciones registradas</h4>
            <p>
              Crea la primera valuación para comenzar el control de ejecución
            </p>
            <button className="btn-primary" onClick={onCreateValuacion}>
              Crear Primera Valuación
            </button>
          </div>
        ) : (
          valuaciones.map((valuacion) => {
            const partidasConIva =
              valuacion.partidas?.filter((p) => p.aplicaIVA) || [];
            const partidasSinIva =
              valuacion.partidas?.filter((p) => !p.aplicaIVA) || [];

            return (
              <div key={valuacion.id} className="valuacion-card">
                <div className="card-header">
                  <div className="valuacion-number">
                    <h4>{valuacion.numero || "VALUACIÓN SIN NOMBRE"}</h4>
                    <span className="fecha-creacion">
                      Creada: {formatDate(valuacion.fechaCreacion)}
                    </span>
                  </div>
                  <div className="card-actions">
                    <button
                      className="btn-view"
                      onClick={() => onViewValuacion(valuacion)}
                      title="Ver detalle"
                    >
                      👁️
                    </button>
                    <button
                      className="btn-edit"
                      onClick={() => onEditValuacion(valuacion)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => onDeleteValuacion(valuacion.id)}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="card-content">
                  <div className="periodo-info">
                    <strong>Periodo:</strong>{" "}
                    {formatDate(valuacion.periodoInicio)} -{" "}
                    {formatDate(valuacion.periodoFin)}
                  </div>

                  <div className="partidas-info">
                    <span>{valuacion.partidas?.length || 0} partida(s)</span>
                    <span className="separator">•</span>
                    <span>{partidasConIva.length} con IVA</span>
                    <span className="separator">•</span>
                    <span>{partidasSinIva.length} sin IVA</span>
                  </div>

                  <div className="montos-info">
                    <div className="monto-item">
                      <span>Sub-total:</span>
                      <span>
                        {formatCurrency(
                          valuacion.totales?.subtotal || 0,
                          mainCurrency
                        )}
                      </span>
                    </div>
                    <div className="monto-item">
                      <span>IVA:</span>
                      <span>
                        {formatCurrency(
                          valuacion.totales?.iva || 0,
                          mainCurrency
                        )}
                      </span>
                    </div>
                    <div className="monto-item total">
                      <span>Total:</span>
                      <span>
                        {formatCurrency(
                          valuacion.totales?.total || 0,
                          mainCurrency
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Información adicional de partidas */}
                  {valuacion.partidas && valuacion.partidas.length > 0 && (
                    <div className="partidas-resumen">
                      <div className="partidas-list">
                        {valuacion.partidas
                          .slice(0, 3)
                          .map((partida, index) => (
                            <div key={index} className="partida-item">
                              <span className="partida-desc">
                                {partida.item} -{" "}
                                {partida.descripcion?.substring(0, 30)}...
                              </span>
                              <span className="partida-cantidad">
                                {partida.cantidadEjecutada} {partida.unidad}
                              </span>
                            </div>
                          ))}
                        {valuacion.partidas.length > 3 && (
                          <div className="partida-item more-items">
                            <span>
                              ... y {valuacion.partidas.length - 3} partidas más
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <div className="status-section">
                    <span className="status-badge">
                      {valuacion.totales?.total > 0
                        ? "✅ Completada"
                        : "📝 En Progreso"}
                    </span>
                    <span className="fecha-actualizacion">
                      Actualizado: {formatDate(valuacion.fechaCreacion)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ValuacionesList;
