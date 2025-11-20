// src/components/modules/administracion/submodules/gastos-administrativos/submodules/compra-facturacion/submodules/compras-con-factura/components/FacturasList.jsx
import React, { useState, useEffect } from "react";
import supabase from "../../../../../../../../../../api/supaBase";

const FacturasList = ({ projectId, onEditFactura }) => {
  const [facturas, setFacturas] = useState([]);
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  useEffect(() => {
    cargarFacturas();
  }, [projectId]);

  const cargarFacturas = async () => {
    if (!projectId) return; // Prevent query if projectId is undefined
    try {
      const { data, error } = await supabase
        .from("facturas")
        .select("*")
        .eq("projectId", projectId)
        .neq("status", "deleted");
      if (error) throw error;
      setFacturas(data || []);
    } catch (error) {
      console.error("Error cargando facturas:", error);
    }
  };

  const facturasFiltradas = facturas.filter((factura) => {
    const cumpleProveedor =
      !filtroProveedor ||
      factura.proveedor.toLowerCase().includes(filtroProveedor.toLowerCase()) ||
      factura.rif.includes(filtroProveedor);
    const cumpleCategoria =
      !filtroCategoria || factura.categoria === filtroCategoria;
    const cumpleFechaInicio =
      !fechaInicio || factura.fechaFactura >= fechaInicio;
    const cumpleFechaFin = !fechaFin || factura.fechaFactura <= fechaFin;

    return (
      cumpleProveedor && cumpleCategoria && cumpleFechaInicio && cumpleFechaFin
    );
  });

  const categoriasUnicas = [...new Set(facturas.map((f) => f.categoria))];

  const handleDelete = async (facturaId) => {
    if (window.confirm("¿Está seguro de que desea eliminar esta factura?")) {
      try {
        const { error } = await supabase
          .from("facturas")
          .update({ status: "deleted" })
          .eq("id", facturaId);
        if (error) throw error;
        cargarFacturas(); // Recargar la lista
      } catch (error) {
        console.error("Error al eliminar factura:", error);
        alert("Error al eliminar la factura.");
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
        <div className="retenciones-detalle">
          <div className="retencion-item">
            <span className="estado-bueno">Al día</span>
          </div>
          {(retenciones.retencionIvaCobrada > 0 ||
            retenciones.retencionIslrCobrada > 0) && (
            <>
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
    } else {
      return (
        <div className="retenciones-detalle">
          <div className="retencion-item">
            <span className="estado-pendiente">Pendiente</span>
          </div>

          {/* Mostrar retenciones pendientes */}
          {retenciones.retencionIvaPendiente > 0 && (
            <div className="retencion-item">
              <small className="estado-pendiente">
                IVA: Bs {retenciones.retencionIvaPendiente.toFixed(2)}
              </small>
            </div>
          )}
          {retenciones.retencionIslrPendiente > 0 && (
            <div className="retencion-item">
              <small className="estado-pendiente">
                ISLR: Bs {retenciones.retencionIslrPendiente.toFixed(2)}
              </small>
            </div>
          )}

          {/* Mostrar retenciones ya cobradas (si las hay) */}
          {(retenciones.retencionIvaCobrada > 0 ||
            retenciones.retencionIslrCobrada > 0) && (
            <>
              <div className="retencion-item separador">
                <small className="estado-bueno">Pagado:</small>
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
    <div className="facturas-list">
      <div className="section-header">
        <h3>Lista de Facturas</h3>

        <div className="filtros">
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="filter-select"
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
            className="search-input"
          />

          <input
            type="date"
            placeholder="Fecha inicio"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="date-input"
          />

          <input
            type="date"
            placeholder="Fecha fin"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="date-input"
          />
        </div>
      </div>

      <div className="facturas-table">
        <table>
          <thead>
            <tr>
              <th>Fecha Factura</th>
              <th>Fecha Recibida</th>
              <th>Proveedor</th>
              <th>RIF</th>
              <th>N° Factura</th>
              <th>N° Control</th>
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
                <td>{factura.categoria}</td>
                <td>{factura.tasaPago?.toFixed(2) || "0.00"}</td>
                <td>{formatSubcategorias(factura)}</td>
                <td>Bs {factura.totalPagar?.toFixed(2) || "0.00"}</td>
                <td>$ {factura.totalPagarDolares?.toFixed(2) || "0.00"}</td>
                <td>Bs {factura.montoPagado?.toFixed(2) || "0.00"}</td>
                <td>$ {factura.pagadoDolares?.toFixed(2) || "0.00"}</td>
                <td>{factura.modoPago || "-"}</td>
                <td className="retenciones-cell">
                  {getEstadoRetenciones(factura)}
                </td>
                <td className="observaciones-cell">
                  {factura.observaciones ? (
                    <div className="observaciones-tooltip">
                      <span className="observaciones-icon">📝</span>
                      <div className="observaciones-content">
                        {factura.observaciones}
                      </div>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  <button
                    className="btn-edit"
                    onClick={() => onEditFactura(factura)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-delete"
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

      {facturasFiltradas.length === 0 && (
        <div className="no-data">
          <p>No se encontraron facturas registradas</p>
        </div>
      )}
    </div>
  );
};

export default FacturasList;
