// src/pages/modules/AdministracionPage.jsx
import { Routes, Route } from "react-router-dom";
import { useProjects } from "../contexts/ProjectContext";
import ModulePage from "../components/modules/_core/ModulePage/ModulePage";
import AdministracionMain from "../components/modules/administracion/AdministracionMain";
import GastosAdminMain from "../components/modules/administracion/submodules/gastos-administrativos/GastosAdminMain";
import NominaPersonalMain from "../components/modules/administracion/submodules/gastos-administrativos/submodules/nomina-personal/NominaPersonalMain";
import RegistroPersonalMain from "../components/modules/administracion/submodules/gastos-administrativos/submodules/nomina-personal/submodules/nomina/submodules/registro-personal/RegistroPersonalMain";
import AsistenciaDiariaMain from "../components/modules/administracion/submodules/gastos-administrativos/submodules/nomina-personal/submodules/nomina/submodules/asistencia-diaria/AsistenciaDiariaMain";
import PagosNominaMain from "../components/modules/administracion/submodules/gastos-administrativos/submodules/nomina-personal/submodules/nomina/submodules/pagos-nomina/PagosNominaMain";
import ComprasFacturacionMain from "../components/modules/administracion/submodules/gastos-administrativos/submodules/compras-facturacion/ComprasFacturacionMain";
import ComprasConFacturaMain from "../components/modules/administracion/submodules/gastos-administrativos/submodules/compras-facturacion/submodules/compras-con-factura/ComprasConFacturaMain";
import ComprasSinFacturaMain from "../components/modules/administracion/submodules/gastos-administrativos/submodules/compras-facturacion/submodules/compras-sin-factura/ComprasSinFacturaMain";
import Configuraciones from "../components/modules/administracion/submodules/gastos-administrativos/submodules/compras-facturacion/components/Configuraciones";
import ContratacionesServiciosMain from "../components/modules/administracion/submodules/gastos-administrativos/submodules/contrataciones-servicios/ContratacionesServiciosMain";
// Importar los nuevos componentes de Ingresos y Comisiones
import IngresosComisionesMain from "../components/modules/administracion/submodules/ingresos-comisiones/IngresosComisionesMain";
import IngresosPagosMain from "../components/modules/administracion/submodules/ingresos-comisiones/submodules/ingresos-pagos/IngresosPagosMain";
import ComisionesMain from "../components/modules/administracion/submodules/ingresos-comisiones/submodules/comisiones/ComisionesMain";
// import GestionUsariosPage from "./GestionUsariosPage";

import { PersonalProvider } from "../contexts/PersonalContext";

const AdministracionPage = () => {
  const { selectedProject } = useProjects();
  const projectId = selectedProject?.id;
  return (
    <ModulePage moduleId="administracion" showSubRoutes={true}>
      <PersonalProvider>
        <Routes>
          <Route index element={<AdministracionMain />} />
          <Route path="gastos-administrativos" element={<GastosAdminMain />} />
          <Route
            path="gastos-administrativos/nomina-personal"
            element={<NominaPersonalMain />}
          />
          <Route
            path="gastos-administrativos/nomina-personal/registro-personal"
            element={<RegistroPersonalMain />}
          />
          <Route
            path="gastos-administrativos/nomina-personal/asistencia-diaria"
            element={<AsistenciaDiariaMain />}
          />
          <Route
            path="gastos-administrativos/nomina-personal/pagos-nomina"
            element={<PagosNominaMain />}
          />
          <Route
            path="gastos-administrativos/compra-facturacion/*"
            element={<ComprasFacturacionMain projectId={projectId} />}
          />
          <Route
            path="gastos-administrativos/compra-facturacion/compras-con-factura"
            element={<ComprasConFacturaMain projectId={projectId} />}
          />
          <Route
            path="gastos-administrativos/compra-facturacion/compras-sin-factura"
            element={<ComprasSinFacturaMain projectId={projectId} />}
          />
          <Route
            path="gastos-administrativos/compra-facturacion/configuraciones"
            element={<Configuraciones projectId={projectId} />}
          />
          <Route
            path="gastos-administrativos/contrataciones-servicios"
            element={<ContratacionesServiciosMain />}
          />
          {/* Nuevas rutas para Ingresos y Comisiones*/}
          <Route path="ingresos-comisiones" element={<IngresosComisionesMain />} />
          <Route path="ingresos-comisiones/ingresos-pagos" element={<IngresosPagosMain />} />
          <Route path="ingresos-comisiones/comisiones" element={<ComisionesMain />} />

          {/* Ruta para Gestión de Usuarios */}
          {/* <Route path="gestion-usuarios/*" element={<GestionUsariosPage />} /> */}
        </Routes>
      </PersonalProvider>
    </ModulePage>
  );
};

export default AdministracionPage;
