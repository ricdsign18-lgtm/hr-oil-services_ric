import React, { useState, useRef, useEffect } from "react";
import { useNotification } from "../../../contexts/NotificationContext.jsx";
import { NotificationIcon } from "../../../assets/icons/Icons"; // Restauramos el icono original
import "./NotificationCenter.css";

const NotificationCenter = () => {
  const { notifications, hasNewNotification, markAsRead, markAllAsRead } =
    useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar al clickear fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const unreadCount = notifications.filter((n) => !n.viewed).length;

  return (
    <div className="notification-center" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="notification-bell-btn"
      >
        <NotificationIcon />
        {unreadCount > 0 && <span className="notification-badge" />}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4 className="notification-title">Notificaciones</h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="notification-mark-read-btn"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">No tienes notificaciones</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${
                    notif.viewed ? "read" : "unread"
                  }`}
                >
                  <div
                    className={`notification-dot ${
                      !notif.viewed ? "active" : ""
                    }`}
                  />

                  <div className="notification-content">
                    <p className="notification-message">{notif.message}</p>
                    <span className="notification-date">
                      {new Date(
                        notif.created_at || notif.timestamp || Date.now()
                      ).toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => markAsRead(notif.id)}
                    title="Descartar"
                    className="notification-dismiss-btn"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
