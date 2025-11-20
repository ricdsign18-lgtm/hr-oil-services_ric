import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoginForm from "../components/auth/LoginForm/LoginForm";
import "./LoginPage.css";

const Login = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading || isAuthenticated) {
    return null;
  }

  return (
    <section className="login-page">
      <article className="login-container">
        <div className="login-header">
          <img
            src="/logo-hyr.png"
            alt="HR Oil Services"
            className="login-logo"
          />
          <h1>H&R Oil Services C.A.</h1>
          <p>Sistema de Gestión de Proyectos</p>
        </div>

        <div className="login-card">
          <h2>Iniciar Sesión</h2>
          <LoginForm />
        </div>
      </article>
    </section>
  );
};

export default Login;
