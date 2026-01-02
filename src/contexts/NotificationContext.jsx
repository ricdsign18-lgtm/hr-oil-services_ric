import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import Toast from "../components/layout/Toast/Toast";
import supabase from "../api/supaBase";
import { useAuth } from "./AuthContext";
import { useProjects } from "./ProjectContext";

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification debe ser usado dentro de un NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { userData } = useAuth();
  const { selectedProject } = useProjects();
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!userData || !selectedProject) return;

    // Buscar notificaciones dirigidas al rol del usuario O a todos los roles (*)
    // Opcionalmente podríamos añadir filtro por user_id específico si lo implementamos
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('project_id', selectedProject.id)
      .or(`role_target.eq.${userData.role},role_target.is.null`) 
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotifications(data.map(n => ({
        ...n,
        viewed: n.read // Mapear read de DB a viewed local
      })));
    }
  }, [userData, selectedProject]);

  // Cargar notificaciones iniciales y polling simple
  useEffect(() => {
    fetchNotifications();
    
    // Polling cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const hasNewNotification = useMemo(() => {
    return notifications.some(n => !n.viewed);
  }, [notifications]);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  // Función para ENVIAR una notificación (Guardar en DB)
  const sendNotification = useCallback(async ({ message, type = "info", role_target = null }) => {
    if (!selectedProject) return;

    // 1. Mostrar toast local inmediatamente (feedback)
    showToast(message, type);

    // 2. Guardar en BD para los demás
    const { error } = await supabase
      .from('notifications')
      .insert([{
        project_id: selectedProject.id,
        message,
        type,
        role_target,
        read: false,
        created_at: new Date()
      }]);
      
    if (error) {
      console.error("Error sending notification:", error);
    } else {
      // Recargar para verla reflejada si nos auto-enviamos (opcional)
      // fetchNotifications(); 
    }
  }, [selectedProject, showToast]);

  // Compatibilidad con código viejo: addNotification solo local
  const addNotification = useCallback((message, type = "info") => {
     showToast(message, type);
  }, [showToast]);

  const markAsRead = useCallback(async (notificationId) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, viewed: true } : n))
    );

    if (notificationId) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
    }
  }, []);
  
  const markAllAsRead = useCallback(async () => {
    // 1. Optimistic update local
    setNotifications(prev => prev.map(n => ({ ...n, viewed: true })));

    // 2. Obtener IDs de notificaciones no leídas que estamos viendo
    const unreadIds = notifications
      .filter(n => !n.viewed)
      .map(n => n.id);

    if (unreadIds.length > 0) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);

      if (error) {
        console.error("Error marking all as read:", error);
        // Podríamos revertir el estado local aquí si fuera crítico
      }
    }
  }, [notifications]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    notifications,
    hasNewNotification,
    addNotification, // Legacy local
    sendNotification, // Nueva persistente
    markAsRead,
    markAllAsRead,
    clearNotifications,
    showToast,
    refreshNotifications: fetchNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </NotificationContext.Provider>
  );
};
