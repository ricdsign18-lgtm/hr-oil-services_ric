import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import Toast from "../components/layout/Toast/Toast";

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification debe ser usado dentro de un NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);

  const hasNewNotification = useMemo(() => {
    return notifications.some(n => !n.viewed);
  }, [notifications]);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  const addNotification = useCallback((message, type = "info") => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date(),
      viewed: false,
    };

    setNotifications((prev) => [newNotification, ...prev]);
    // Automatically show toast for new notifications
    showToast(message, type);
  }, [showToast]);

  const markAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, viewed: true }))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    notifications,
    hasNewNotification,
    addNotification,
    markAsRead,
    clearNotifications,
    showToast, // Export showToast for direct usage if needed
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
