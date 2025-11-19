//
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { useState, useEffect } from "react";
import supabase from "../api/supaBase";
import bcrypt from "bcryptjs";
export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Estado para la carga inicial
  const navigate = useNavigate();

  // Efecto para verificar la sesión al cargar la aplicación
  useEffect(() => {
    const checkUserSession = () => {
      const userJson = localStorage.getItem("hr_oil_user");
      if (userJson) {
        const user = JSON.parse(userJson);
        setUserData(user);
        setIsAuthenticated(true);
      }
      setLoading(false); // Termina la carga
    };
    checkUserSession();
  }, []);

  const handleLogin = async (credentials) => {
    console.log("Datos de login:", credentials);

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", credentials.userName)
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

      localStorage.setItem("hr_oil_user", JSON.stringify(data)); // Guardar usuario en localStorage
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

  // Función ASÍNCRONA para verificar permisos desde la base de datos
  const hasPermission = async (module, action = "read") => {
    if (!userData || !userData.id) {
      console.error("Usuario no autenticado");
      return false;
    }

    try {
      // Si el usuario es admin, tiene todos los permisos
      if (userData.role === "admin") {
        return true;
      }

      // Consultar permisos desde la base de datos
      const { data: permissions, error } = await supabase
        .from("permissions")
        .select("can_read, can_write, can_delete")
        .eq("user_id", userData.id)
        .single();

      if (error) {
        console.error("Error al cargar permisos:", error);
        return hasPermissionSync(module, action);
      }

      if (!permissions) {
        console.warn("No se encontraron permisos para el usuario");
        return hasPermissionSync(module, action);
      }

      // Mapear acciones a columnas de la base de datos
      const actionMap = {
        read: "can_read",
        write: "can_write",
        delete: "can_delete",
      };

      const column = actionMap[action];

      if (column === undefined) {
        console.error("Acción no válida:", action);
        return false;
      }

      return permissions[column] || false;
    } catch (error) {
      console.error("Error verificando permisos:", error);
      return hasPermissionSync(module, action);
    }
  };

  // Función SÍNCRONA para componentes que no pueden ser async
  const hasPermissionSync = (module, action = "read") => {
    if (!userData || !userData.role) {
      console.error("Usuario no autenticado o sin rol");
      return false;
    }

    // Admin tiene todos los permisos
    if (userData.role === "admin") return true;

    // Mapeo básico de roles a permisos (como fallback cuando no hay permisos en BD)
    const rolePermissions = {
      editor: {
        resumen: ["read", "write"],
        administracion: ["read", "write"],
      },
      viewer: {
        resumen: ["read"],
        administracion: ["read"],
      },
    };

    // Para roles que no están en el mapeo, permitir lectura básica
    const defaultPermissions = ["resumen", "administracion"];

    if (userData.role === "editor" || userData.role === "viewer") {
      const permissions = rolePermissions[userData.role];
      return permissions?.[module]?.includes(action) || false;
    }

    // Para otros roles no definidos, permitir solo lectura en módulos básicos
    if (defaultPermissions.includes(module)) {
      return action === "read";
    }

    return false;
  };

  const logout = () => {
    setUserData(null);
    setIsAuthenticated(false);
    localStorage.removeItem("hr_oil_user");
    localStorage.removeItem("hr_oil_selected_project");
    localStorage.removeItem("hr_oil_selected_project_id");
    navigate("/login");
  };

  // Función para verificar si el usuario está autenticado (útil para ProtectedRoute)
  const checkAuth = () => {
    return isAuthenticated && userData.id;
  };

  // No renderizar children hasta que se verifique la sesión
  if (loading) {
    return <div>Cargando sesión...</div>; // O un componente de Spinner/Loading
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userData,
        handleLogin,
        // registerUser,
        loading,
        hasPermission, // versión async - para uso con useEffect
        hasPermissionSync, // versión síncrona - para uso inmediato
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
