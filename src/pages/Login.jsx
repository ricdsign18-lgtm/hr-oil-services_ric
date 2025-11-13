import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoginForm from "../components/auth/LoginForm/LoginForm";
import "./Login.css";

const Login = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Solo redirigir si la carga inicial ha terminado y el usuario está autenticado.
    if (!loading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // Mientras se carga la sesión o si ya está autenticado, no mostrar el formulario para evitar el parpadeo.
  if (loading || isAuthenticated) {
    return null; // O un componente de carga: <div className="login-page">Cargando...</div>
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <img
            src="/logo-hyr.png"
            alt="HR Oil Services"
            className="login-logo"
          />
          <h1>HR Oil Services</h1>
          <p>Sistema de Gestión de Proyectos</p>
        </div>

        <div className="login-card">
          <h2>Iniciar Sesión</h2>
          {/* {error && <div className="error-message">{error}</div>} */}
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Login;
