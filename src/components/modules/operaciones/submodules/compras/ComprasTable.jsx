// src/components/modules/operaciones/submodules/compras/ComprasTable.jsx
import React from 'react';
import './ComprasTable.css';

const ComprasTable = ({ compras, onEdit }) => {
  return (
    <div className="compras-table-container">
      <h3>Historial de Compras</h3>
      {compras.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--gray-400)' }}>
          No hay compras registradas
        </div>
      ) : (
        <table className="compras-table">
          <thead>
            <tr>
              <th>Fecha Compra</th>
              <th>Producto</th>
              <th>Unidad</th>
              <th>Cantidad</th>
              <th>Precio Unit.</th>
              <th>Total Bs.</th>
              <th>Total $</th>
              <th>Registrado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {compras.map(compra => (
              <tr key={compra.id}>
                <td>{new Date(compra.fecha_compra.replace(/-/g, '/')).toLocaleDateString()}</td>
                <td>{compra.nombre_producto}</td>
                <td>{compra.unidad}</td>
                <td>{compra.cantidad}</td>
                <td>{compra.precio_unitario}</td>
                <td>{compra.total_bs}</td>
                <td>{compra.total_usd}</td>
                <td>{new Date(compra.created_at).toLocaleString()}</td>
                <td>
                  <button onClick={() => onEdit(compra)} className="btn-edit">
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ComprasTable;
