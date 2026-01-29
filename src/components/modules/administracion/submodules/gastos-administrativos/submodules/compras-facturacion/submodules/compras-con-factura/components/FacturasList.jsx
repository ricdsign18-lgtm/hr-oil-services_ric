import React, { useState, useEffect } from "react";
import supabase from "../../../../../../../../../../api/supaBase";
import { useNotification } from "../../../../../../../../../../contexts/NotificationContext";
import FeedbackModal from "../../../../../../../../../common/FeedbackModal/FeedbackModal";
import { ClipBoardIcon, SackDollarIcon } from '../../../../../../../../../../assets/icons/Icons'
const FacturasList = ({ projectId, onEditFactura, parentFilters, onCategoriesLoaded }) => {
  const { showToast } = useNotification();
  const [facturas, setFacturas] = useState([]);
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [feedback, setFeedback] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatCurrencyBs = (amount) => {
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "VES",
    }).format(amount);
  };

  const cargarFacturas = async () => {
    try {
      const { data, error } = await supabase
        .from("facturas")
        .select("*")
        .eq("projectId", projectId)
        .neq("status", "deleted");
      if (error) throw error;
      setFacturas(data || []);

      // Populate parent categories if callback provided
      if (data && onCategoriesLoaded) {
        const uniqueCats = [...new Set(data.map((f) => f.categoria))];
        onCategoriesLoaded(uniqueCats);
      }
    } catch (error) {
      console.error("Error cargando facturas:", error);
    }
  };

  useEffect(() => {
    if (projectId) {
      cargarFacturas();
    }
  }, [projectId]);

  const facturasFiltradas = facturas.filter((factura) => {
    // Use parent filters if provided, otherwise use local state
    const activeFilters = parentFilters || {
      filtroCategoria,
      filtroProveedor,
      fechaInicio,
      fechaFin
    };

    const { filtroCategoria: cat, filtroProveedor: prov, fechaInicio: start, fechaFin: end } = activeFilters;

    const cumpleProveedor =
      !prov ||
      factura.proveedor.toLowerCase().includes(prov.toLowerCase()) ||
      factura.rif.includes(prov);
    const cumpleCategoria =
      !cat || factura.categoria === cat;
    const cumpleFechaInicio =
      !start || factura.fechaFactura >= start;
    const cumpleFechaFin =
      !end || factura.fechaFactura <= end;

    return (
      cumpleProveedor && cumpleCategoria && cumpleFechaInicio && cumpleFechaFin
    );
  });

  const categoriasUnicas = [...new Set(facturas.map((f) => f.categoria))];

  const handleCloseFeedback = () => {
    setFeedback(prev => ({ ...prev, isOpen: false }));
  };

  const handleDelete = async (facturaId) => {
    if (window.confirm("¿Está seguro de que desea eliminar esta factura?")) {
      try {
        const { error } = await supabase
          .from("facturas")
          .update({ status: "deleted" })
          .eq("id", facturaId);
        if (error) throw error;
        cargarFacturas(); // Recargar la lista
        setFeedback({
          isOpen: true,
          type: 'success',
          title: 'Factura Eliminada',
          message: 'La factura ha sido eliminada exitosamente.'
        });
      } catch (error) {
        console.error("Error al eliminar factura:", error);
        setFeedback({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: 'Error al eliminar la factura.'
        });
      }
    }
  };

  // Función para formatear subcategorías
  const formatSubcategorias = (factura) => {
    if (Array.isArray(factura.subcategorias)) {
      const subcategoriasFiltradas = factura.subcategorias.filter(
        (sub) => sub && sub.trim() !== ""
      );
      return subcategoriasFiltradas.length > 0
        ? subcategoriasFiltradas.join(", ")
        : "-";
    }
    return factura.subcategoria || "-";
  };

  // Función corregida para calcular retenciones - usa los campos específicos de la factura
  const calcularRetenciones = (factura) => {
    // Usar los campos específicos que ya vienen calculados en la factura
    const retencionIvaPendiente = factura.retencionIvaPendiente || 0;
    const retencionIslrPendiente = factura.retencionIslrPendiente || 0;
    const retencionIvaCobrada = factura.retencionIvaCobrada || 0;
    const retencionIslrCobrada = factura.retencionIslrCobrada || 0;

    return {
      retencionIvaPendiente,
      retencionIslrPendiente,
      retencionIvaCobrada,
      retencionIslrCobrada,
      totalPendiente: retencionIvaPendiente + retencionIslrPendiente,
      totalCobrado: retencionIvaCobrada + retencionIslrCobrada,
    };
  };

  const getEstadoRetenciones = (factura) => {
    const retenciones = calcularRetenciones(factura);

    if (retenciones.totalPendiente === 0) {
      return (
        <div className="ccf-retenciones-detalle">
          <div className="ccf-retencion-item">
            <span className="ccf-estado-bueno">Al día</span>
          </div>
          {(retenciones.retencionIvaCobrada > 0 ||
            retenciones.retencionIslrCobrada > 0) && (
              <>
                {retenciones.retencionIvaCobrada > 0 && (
                  <div className="ccf-retencion-item">
                    <small className="ccf-estado-bueno">
                      IVA: Bs {retenciones.retencionIvaCobrada.toFixed(2)}
                    </small>
                  </div>
                )}
                {retenciones.retencionIslrCobrada > 0 && (
                  <div className="ccf-retencion-item">
                    <small className="ccf-estado-bueno">
                      ISLR: Bs {retenciones.retencionIslrCobrada.toFixed(2)}
                    </small>
                  </div>
                )}
              </>
            )}
        </div>
      );
    } else {
      return (
        <div className="ccf-retenciones-detalle">
          <div className="ccf-retencion-item">
            <span className="ccf-estado-pendiente">Pendiente</span>
          </div>

          {/* Mostrar retenciones pendientes */}
          {retenciones.retencionIvaPendiente > 0 && (
            <div className="ccf-retencion-item">
              <small className="ccf-estado-pendiente">
                IVA: Bs {retenciones.retencionIvaPendiente.toFixed(2)}
              </small>
            </div>
          )}
          {retenciones.retencionIslrPendiente > 0 && (
            <div className="ccf-retencion-item">
              <small className="ccf-estado-pendiente">
                ISLR: Bs {retenciones.retencionIslrPendiente.toFixed(2)}
              </small>
            </div>
          )}

          {/* Mostrar retenciones ya cobradas (si las hay) */}
          {(retenciones.retencionIvaCobrada > 0 ||
            retenciones.retencionIslrCobrada > 0) && (
              <>
                <div className="ccf-retencion-item ccf-separador">
                  <small className="ccf-estado-bueno">Pagado:</small>
                </div>
                {retenciones.retencionIvaCobrada > 0 && (
                  <div className="retencion-item">
                    <small className="estado-bueno">
                      IVA: Bs {retenciones.retencionIvaCobrada.toFixed(2)}
                    </small>
                  </div>
                )}
                {retenciones.retencionIslrCobrada > 0 && (
                  <div className="retencion-item">
                    <small className="estado-bueno">
                      ISLR: Bs {retenciones.retencionIslrCobrada.toFixed(2)}
                    </small>
                  </div>
                )}
              </>
            )}
        </div>
      );
    }
  };

  return (
    <div className="ccf-facturas-list">
      <div className="ccf-section-header">
        <h3>Lista de Facturas</h3>

        {!parentFilters && (
          <div className="filtros">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="ccf-filter-select"
            >
              <option value="">Todas las categorías</option>
              {categoriasUnicas.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Buscar por proveedor o RIF..."
              value={filtroProveedor}
              onChange={(e) => setFiltroProveedor(e.target.value)}
              className="ccf-search-input"
            />
            <label htmlFor="fechaInicio" style={{ color: 'red' }}>Desde</label>
            <input
              type="date"
              placeholder="Fecha inicio"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="ccf-date-input"
            />
            <label htmlFor="fechaFin" style={{ color: 'red' }}>Hasta</label>
            <input
              type="date"
              placeholder="Fecha fin"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="ccf-date-input"
            />
          </div>
        )}
      </div>

      {facturasFiltradas.length === 0 ? (
        <div className="no-data">
          <p>No hay facturas para mostrar</p>
        </div>
      ) : (
        <>
          <div className="list-summary-card">
            <div className="list-card-icon-wrapper">
              <SackDollarIcon />
              <span className="list-card-label">TOTAL DÓLARES</span>
            </div>
            <strong className="list-card-value">
              $ {facturasFiltradas.reduce((sum, item) => sum + (item.totalPagarDolares || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>

          <div className="ccf-facturas-table">
            {/* Mobile View - Cards */}
            <div className="mobile-facturas-list">
              {facturasFiltradas.map((factura) => {
                const initials = factura.proveedor
                  ? factura.proveedor.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
                  : "?";

                return (
                  <div className="mobile-factura-card" key={factura.id}>
                    {/* Header */}
                    <div className="card-header-dark">
                      <div className="provider-avatar">
                        <span>{initials}</span>
                      </div>
                      <div className="provider-info">
                        <h4>{factura.proveedor}</h4>
                        <span className="provider-rif">
                          <i className="fa-regular fa-user"></i> {factura.tipoRif}{factura.rif}
                        </span>
                      </div>
                      <div className="valuacion-tag">
                        {factura.valuacion || 'SIN VALUACIÓN'}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="card-body-white">
                      <div className="status-row">
                        <div className="date-info">
                          <i className="fa-regular fa-calendar"></i>
                          <div className="date-text">
                            <span className="label">FECHA</span>
                            <span className="value">{factura.fechaFactura}</span>
                          </div>
                        </div>
                        <span className="category-pill">
                          <i className="fa-solid fa-truck-fast"></i> {factura.categoria}
                        </span>
                      </div>

                      <div className="details-box">
                        <div className="details-header">
                          <i className="fa-regular fa-file-lines"></i> DETALLE DEL SERVICIO
                        </div>
                        <p className="details-text">
                          {factura.descripcion || "Sin descripción"}
                        </p>
                        <div className="subcategory-text">
                          Subcategoría: <strong>{formatSubcategorias(factura)}</strong>
                        </div>
                      </div>

                      <div className="card-footer-row">
                        <div className="rate-info">
                          <span className="label">TARIFA / UNITARIO</span>
                          <span className="value">Bs. {factura.tasaPago?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</span>
                        </div>
                        <div className="total-box-green">
                          <span className="label">TOTAL A PAGAR</span>
                          <span className="value">
                            Bs. {factura.totalPagar?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                          </span>
                        </div>
                      </div>

                      <div className="card-actions-bottom">
                        <button className="btn-details-link" onClick={() => onEditFactura(factura)}>
                          Ver detalles completos <i className="fa-solid fa-chevron-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View - Table */}
            <div className="desktop-facturas-table">
              <table>
                <thead>
                  <tr>
                    <th>Fecha Factura</th>
                    <th>Fecha Recibida</th>
                    <th>Proveedor</th>
                    <th>RIF</th>
                    <th>N° Factura</th>
                    <th>N° Control</th>
                    <th>Descripción</th>
                    <th>Categoría</th>
                    <th>Tasa de Pago (Bs/$)</th>
                    <th>Subcategorías</th>
                    <th>Total a Pagar (Bs)</th>
                    <th>Total a Pagar ($)</th>
                    <th>Pagado (Bs)</th>
                    <th>Pagado ($)</th>
                    <th>Método Pago</th>
                    <th>Retenciones</th>
                    <th>Observaciones</th>
                    <th>Valuación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {facturasFiltradas.map((factura, index) => (
                    <tr key={factura.id}>
                      <td>{factura.fechaFactura}</td>
                      <td>{factura.fechaRecibida || "-"}</td>
                      <td>{factura.proveedor}</td>
                      <td>
                        {factura.tipoRif}
                        {factura.rif}
                      </td>
                      <td>{factura.numeroFactura}</td>
                      <td>{factura.numeroControl || "-"}</td>
                      <td>{factura.descripcion || "-"}</td>
                      <td>{factura.categoria}</td>
                      <td>{factura.tasaPago?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</td>
                      <td>{formatSubcategorias(factura)}</td>
                      <td>Bs {factura.totalPagar?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</td>
                      <td>$ {factura.totalPagarDolares?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</td>
                      <td>Bs {factura.montoPagado?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</td>
                      <td>$ {factura.pagadoDolares?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</td>
                      <td>{factura.modoPago || "-"}</td>
                      <td className="ccf-retenciones-cell">
                        {getEstadoRetenciones(factura)}
                      </td>
                      <td className="ccf-observaciones-cell">
                        {factura.observaciones ? (
                          <div className="ccf-observaciones-tooltip">
                            <span className="ccf-observaciones-icon">📝</span>
                            <div className="ccf-observaciones-content">
                              {factura.observaciones}
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{factura.valuacion || '-'}</td>
                      <td>
                        <button
                          className="ccf-btn-edit"
                          onClick={() => onEditFactura(factura)}
                        >
                          Editar
                        </button>
                        <button
                          className="ccf-btn-delete"
                          onClick={() => handleDelete(factura.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={handleCloseFeedback}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </div>
  );
};

export default FacturasList;
