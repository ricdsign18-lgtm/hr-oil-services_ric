import React from "react";
import { Routes, Route } from "react-router-dom";
import ModulePage from "../components/modules/_core/ModulePage/ModulePage";
import GestionUsuariosMain from "../components/modules/administracion/submodules/gestion-de-usuarios/GestionUsuariosMain";
import GestionRutasPermisos from "../components/modules/administracion/submodules/gestion-de-usuarios/GestionRutasPermisos";
import UsuariosModule from "../components/modules/administracion/submodules/gestion-de-usuarios/submodules/usuarios/UsuariosModule";

const GestionUsariosPage = () => {
  // Force HMR update
  return (
    <ModulePage
      moduleId="gestion-usuarios"
      moduleName="Gestión de Usuarios"
      showSubRoutes={true}
    >
      <Routes>
        <Route index element={<GestionUsuariosMain />} />
        <Route path="permisos" element={<UsuariosModule />} />
        <Route path="usuarios" element={<GestionRutasPermisos />} />
      </Routes>
    </ModulePage>
  );
};

export default GestionUsariosPage;
