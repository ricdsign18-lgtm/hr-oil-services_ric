// src/components/modules/contrato/submodules/presupuesto/components/ResumenPresupuesto.jsx
import { useCurrency } from "../../../../../../contexts/CurrencyContext";
import { calculateBudgetSummary } from "../../../../../../utils/calculations";

import "./ResumenPresupuesto.css";

const ResumenPresupuesto = ({ totales }) => {
  const { customRates, convertToUSD, formatCurrency } = useCurrency();

  const {
    mainCurrency,
    subtotalConIVA_Main,
    subtotalSinIVA_Main,
    ivaCalculado_Main,
    totalGeneral_Main,
    subtotalConIVA_USD,
    subtotalSinIVA_USD,
    ivaCalculado_USD,
    totalGeneral_USD,
    itemsConIva,
    itemsSinIva,
  } = calculateBudgetSummary(totales, convertToUSD, customRates);

  return (
    <div className="resumen-presupuesto">
      <div className="resumen-header">
        <h4>Resumen del Presupuesto</h4>
        <div className="currency-indicator">
          <div className="currency-badge">Moneda Principal: {mainCurrency}</div>
        </div>
      </div>

      <div className="resumen-grid">
        <div className="resumen-card subtotal-con-iva">
          <div className="resumen-icon">📊</div>
          <div className="resumen-content">
            <div className="resumen-label">Subtotal Presupuesto</div>
            <div className="resumen-value">
              {formatCurrency(subtotalConIVA_Main, mainCurrency)}
            </div>
            <div className="resumen-conversion">
              ≈ {formatCurrency(subtotalConIVA_USD, "USD")}
            </div>
            <div className="resumen-desc">
              {itemsConIva || 0} ítem(s) gravables
            </div>
          </div>
        </div>

        <div className="resumen-card subtotal-sin-iva">
          <div className="resumen-icon">📈</div>
          <div className="resumen-content">
            <div className="resumen-label">Subtotal Gastos Reembolsables</div>
            <div className="resumen-value">
              {formatCurrency(subtotalSinIVA_Main, mainCurrency)}
            </div>
            <div className="resumen-conversion">
              ≈ {formatCurrency(subtotalSinIVA_USD, "USD")}
            </div>
            <div className="resumen-desc">
              {itemsSinIva || 0} ítem(s) exentos
            </div>
          </div>
        </div>

        <div className="resumen-card iva">
          <div className="resumen-icon">🧾</div>
          <div className="resumen-content">
            <div className="resumen-label">IVA (16%)</div>
            <div className="resumen-value">
              {formatCurrency(ivaCalculado_Main, mainCurrency)}
            </div>
            <div className="resumen-conversion">
              ≈ {formatCurrency(ivaCalculado_USD, "USD")}
            </div>
            <div className="resumen-desc">
              Sobre {itemsConIva || 0} ítem(s)
            </div>
          </div>
        </div>

        <div className="resumen-card total">
          <div className="resumen-icon">💰</div>
          <div className="resumen-content">
            <div className="resumen-label">Total General</div>
            <div className="resumen-value">
              {formatCurrency(totalGeneral_Main, mainCurrency)}
            </div>
            <div className="resumen-conversion">
              ≈ {formatCurrency(totalGeneral_USD, "USD")}
            </div>
            <div className="resumen-desc">Monto total del contrato</div>
          </div>
        </div>
      </div>

      {/* Desglose detallado */}
      <div className="desglose-detallado">
        <h5>Desglose Detallado</h5>
        <div className="desglose-grid">
          <div className="desglose-item">
            <span className="desglose-label">
              Subtotal ítems con IVA ({itemsConIva || 0} ítems):
            </span>
            <span className="desglose-value">
              {formatCurrency(subtotalConIVA_Main, mainCurrency)}
            </span>
          </div>
          <div className="desglose-item">
            <span className="desglose-label">
              Subtotal ítems sin IVA ({itemsSinIva || 0} ítems):
            </span>
            <span className="desglose-value">
              {formatCurrency(subtotalSinIVA_Main, mainCurrency)}
            </span>
          </div>
          <div className="desglose-item subtotal-total">
            <span className="desglose-label">Subtotal General:</span>
            <span className="desglose-value">
              {formatCurrency(
                subtotalConIVA_Main + subtotalSinIVA_Main,
                mainCurrency
              )}
            </span>
          </div>
          <div className="desglose-item">
            <span className="desglose-label">IVA aplicable (16%):</span>
            <span className="desglose-value">
              {formatCurrency(ivaCalculado_Main, mainCurrency)}
            </span>
          </div>
          <div className="desglose-item total-item">
            <span className="desglose-label">TOTAL DEL CONTRATO:</span>
            <span className="desglose-value">
              {formatCurrency(totalGeneral_Main, mainCurrency)}
            </span>
          </div>
        </div>
      </div>

      {/* Conversión a USD */}
      <div className="conversion-usd">
        <h6>Equivalente en Dólares Americanos (USD)</h6>
        <div className="conversion-grid">
          <div className="conversion-item">
            <span>Subtotal con IVA:</span>
            <span>{formatCurrency(subtotalConIVA_USD, "USD")}</span>
          </div>
          <div className="conversion-item">
            <span>Subtotal sin IVA:</span>
            <span>{formatCurrency(subtotalSinIVA_USD, "USD")}</span>
          </div>
          <div className="conversion-item">
            <span>IVA (16%):</span>
            <span>{formatCurrency(ivaCalculado_USD, "USD")}</span>
          </div>
          <div className="conversion-item total">
            <span>TOTAL USD:</span>
            <span>{formatCurrency(totalGeneral_USD, "USD")}</span>
          </div>
        </div>
      </div>

      {/* Tasas de cambio aplicadas */}
      <div className="tasas-info">
        <small>
          💱 <strong>Tasas aplicadas:</strong> 1 USD ={" "}
          {customRates?.EUR || 0.85844} EUR | 1 USD = {customRates?.BS || 36.5}{" "}
          BS
        </small>
      </div>

      {/* Estadísticas adicionales */}
      <div className="estadisticas-adicionales">
        <div className="estadistica">
          <div className="estadistica-icon">📋</div>
          <div className="estadistica-content">
            <div className="estadistica-number">
              {(itemsConIva || 0) + (itemsSinIva || 0)}
            </div>
            <div className="estadistica-label">Total Ítems</div>
          </div>
        </div>

        <div className="estadistica">
          <div className="estadistica-icon">✅</div>
          <div className="estadistica-content">
            <div className="estadistica-number">{itemsConIva || 0}</div>
            <div className="estadistica-label">Con IVA</div>
          </div>
        </div>

        <div className="estadistica">
          <div className="estadistica-icon">⭕</div>
          <div className="estadistica-content">
            <div className="estadistica-number">{itemsSinIva || 0}</div>
            <div className="estadistica-label">Sin IVA</div>
          </div>
        </div>

        <div className="estadistica">
          <div className="estadistica-icon">💱</div>
          <div className="estadistica-content">
            <div className="estadistica-number">{mainCurrency}</div>
            <div className="estadistica-label">Moneda Principal</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumenPresupuesto;
