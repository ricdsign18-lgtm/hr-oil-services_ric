//
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { useState, useEffect } from "react";
import supabase from "../api/supaBase";
import bcrypt from "bcryptjs";
import { ROLES } from "../config/permissions"; // Importamos la configuración global de permisos
export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Efecto para verificar la sesión al cargar la aplicación
  useEffect(() => {
    const checkUserSession = async () => {
      const userJson = localStorage.getItem("hr_oil_user");
      
      if (userJson) {
        try {
          const localUser = JSON.parse(userJson);
          
          // VALIDACIÓN DE SEGURIDAD:
          // No confiamos ciegamente en localStorage. Verificamos contra la BD.
          if (localUser && localUser.username) {
            const { data: dbUser, error } = await supabase
              .from("users")
              .select("*")
              .eq("username", localUser.username)
              .single();

            if (!error && dbUser) {
              // Si el usuario existe y es válido, actualizamos el estado con la verdad de la BD
              // Esto sobrescribe cualquier manipulación local del rol
              setUserData(dbUser);
              setIsAuthenticated(true);
              // Actualizamos localStorage con la data fresca (opcional, pero bueno para consistencia)
              localStorage.setItem("hr_oil_user", JSON.stringify(dbUser));
            } else {
              // Si falla la validación (usuario borrado o datos corruptos), cerramos sesión
              console.warn("Sesión inválida o expirada");
              logout();
            }
          }
        } catch (error) {
          console.error("Error validando sesión:", error);
          logout();
        }
      }
      setLoading(false);
    };

    checkUserSession();
  }, []);

  const handleLogin = async (credentials) => {
    console.log("Datos de login:", credentials);

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", credentials.userName) // Case sensitive check might be needed depending on DB collation
        .single();

      if (error || !data) {
        alert("Este usuario no está registrado");
        return;
      }
      const isMatch = await bcrypt.compare(credentials.password, data.password);
      if (!isMatch) {
        alert("Contraseña incorrecta");
        return;
      }

      // Actualizar last_login
      const { error: updateError } = await supabase
        .from("users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", data.id);
        
      if (updateError) {
        console.error("Error actualizando last_login:", updateError);
      } else {
        // Actualizar el dato local también para consistencia inmediata
        data.last_login = new Date().toISOString();
      }

      localStorage.setItem("hr_oil_user", JSON.stringify(data));
      setUserData(data);
      setIsAuthenticated(true);
      console.log("Usuario autenticado:", data);
      navigate("/");
      alert(`Bienvenido ${data.username}`);
    } catch (error) {
      console.error("Error en login:", error);
      alert("Error al iniciar sesión");
    }
  };

  /**
   * Sistema Centralizado de Permisos
   * Verifica si el usuario actual tiene acceso al módulo solicitado.
   */
  const hasPermission = (targetModule) => {
    // 1. Validar que tengamos datos de usuario seguros
    if (!userData || !userData.role) return false;

    // 2. Obtener configuración del rol desde el archivo central
    const userRoleConfig = ROLES[userData.role];
    
    // Si el rol no está definido en nuestra config, denegar acceso (Fail Safe)
    if (!userRoleConfig) {
      console.warn(`Rol desconocido: ${userData.role}`);
      return false;
    }

    // 3. Acceso Total (Director General, Admin Legacy)
    if (userRoleConfig.scope === "*") return true;

    // 4. Validación de Scope (Alcance del Módulo)
    // El "Jefe" tiene acceso total a su módulo asignado
    if (userRoleConfig.scope === targetModule) return true;
    
    // 5. Permisos transversales (Todos pueden ver el resumen/dashboard)
    if (targetModule === 'resumen') return true;

    // 6. Acceso a Solicitudes (Solo Jefes y Directores)
    if (targetModule === 'solicitudes' && userRoleConfig.level >= 50) return true;

    // Por defecto, denegar
    return false;
  };

  // Mantenemos alias para compatibilidad si algún componente usa hasPermissionSync
  const hasPermissionSync = hasPermission;

  const logout = () => {
    setUserData(null);
    setIsAuthenticated(false);
    localStorage.removeItem("hr_oil_user");
    localStorage.removeItem("hr_oil_selected_project");
    localStorage.removeItem("hr_oil_selected_project_id");
    navigate("/login");
  };

  const checkAuth = () => {
    return isAuthenticated && userData?.id;
  };

  if (loading) {
    return <div>Cargando sesión...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userData,
        handleLogin,
        loading,
        hasPermission,
        hasPermissionSync,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
