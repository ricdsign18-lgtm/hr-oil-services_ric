import React from "react";
import Modal from "../../../../../../../../../common/Modal/Modal";
import "./FacturaDetailsModal.css"; // We will create this css file or use inline styles if simple

const FacturaDetailsModal = ({ isOpen, onClose, factura, onEdit }) => {
  if (!factura) return null;

  const formatCurrency = (amount, currency = "Bs") => {
    return `${currency}. ${amount?.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}`;
  };

  const getInitials = (name) => {
    return name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase()
      : "?";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Factura"
      size="md"
    >
      <div className="factura-details-content">
        {/* Header Section */}
        <div className="details-header-section">
          <div className="provider-badge">
            <div className="provider-avatar-large">
              <span>{getInitials(factura.proveedor)}</span>
            </div>
            <div className="provider-info-large">
              <h3>{factura.proveedor}</h3>
              <span className="rif-tag">
                <i className="fa-regular fa-user"></i> {factura.tipoRif}
                {factura.rif}
              </span>
            </div>
          </div>
          <div
            className={`status-badge ${factura.status === "active" ? "active" : "deleted"}`}
          >
            {factura.status === "active" ? "ACTIVA" : "ELIMINADA"}
          </div>
        </div>

        {/* Info Grid */}
        <div className="details-grid">
          <div className="detail-group">
            <label>N° Factura</label>
            <div className="detail-value highlight">
              {factura.numeroFactura}
            </div>
          </div>
          <div className="detail-group">
            <label>N° Control</label>
            <div className="detail-value">{factura.numeroControl || "-"}</div>
          </div>
          <div className="detail-group">
            <label>Fecha Emisión</label>
            <div className="detail-value">{factura.fechaFactura}</div>
          </div>
          <div className="detail-group">
            <label>Fecha Recepción</label>
            <div className="detail-value">{factura.fechaRecibida || "-"}</div>
          </div>
        </div>

        <div className="details-section">
          <label className="section-label">Categorización</label>
          <div className="category-tags">
            <span className="cat-tag main">{factura.categoria}</span>
            {factura.subcategorias &&
              Array.isArray(factura.subcategorias) &&
              factura.subcategorias.map(
                (sub, idx) =>
                  sub && (
                    <span key={idx} className="cat-tag sub">
                      {sub}
                    </span>
                  ),
              )}
          </div>
        </div>

        <div className="details-section">
          <label className="section-label">Descripción del Servicio</label>
          <div className="description-box">
            {factura.descripcion || "Sin descripción"}
          </div>
        </div>

        {factura.observaciones && (
          <div className="details-section">
            <label className="section-label">Observaciones</label>
            <div className="description-box warning">
              {factura.observaciones}
            </div>
          </div>
        )}

        <div className="details-divider"></div>

        {/* Financials */}
        <div className="financials-grid">
          <div className="financial-row">
            <span>Base Imponible</span>
            <span>{formatCurrency(factura.baseImponible)}</span>
          </div>
          <div className="financial-row">
            <span>IVA (16%)</span>
            <span>{formatCurrency(factura.iva)}</span>
          </div>
          {factura.excento > 0 && (
            <div className="financial-row">
              <span>Exento</span>
              <span>{formatCurrency(factura.excento)}</span>
            </div>
          )}
          <div className="financial-row total">
            <span>Total a Pagar (Bs)</span>
            <span className="amount-bs">
              {formatCurrency(factura.totalPagar)}
            </span>
          </div>
          <div className="financial-row total-usd">
            <span>Equivalente ($)</span>
            <span className="amount-usd">
              $ {factura.totalPagarDolares?.toFixed(2)}
            </span>
          </div>
          <div className="financial-row rate">
            <small>Tasa de cambio: {formatCurrency(factura.tasaPago)}/$</small>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="details-footer">
          <button
            className="btn-edit-action"
            onClick={() => {
              onClose();
              onEdit(factura);
            }}
          >
            <i className="fa-solid fa-pen-to-square"></i> Editar Factura
          </button>
          <button className="btn-close-action" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default FacturaDetailsModal;
