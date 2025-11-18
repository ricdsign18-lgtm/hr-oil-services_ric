import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import ProjectSelection from "./pages/ProjectSelection";
import ProjectLobby from "./pages/ProjectLobby";
import LoginPage from "./pages/LoginPage";
import "./index.css";
import "./planificacion.css"
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<ProjectSelection />} />
        <Route path="/project/:projectId/*" element={<ProjectLobby />} />
      </Route>
    </Routes>
  );
}

export default App;
