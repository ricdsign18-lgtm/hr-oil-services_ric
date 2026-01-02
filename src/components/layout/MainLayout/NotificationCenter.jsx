import React, { useState, useRef, useEffect } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { NotificationIcon } from "../../../assets/icons/Icons"; // Restauramos el icono original


const NotificationCenter = () => {
  const { notifications, hasNewNotification, markAsRead, markAllAsRead } = useNotification();
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

  const unreadCount = notifications.filter(n => !n.viewed).length;

  return (
    <div className="notification-center" ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="notification-bell-btn"
        style={{ 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer', 
          position: 'relative',
          color: '#64748b',
          padding: '8px'
        }}
      >
        <NotificationIcon />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: '#ef4444',
            borderRadius: '50%',
            width: '8px',
            height: '8px',
          }} />
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown" style={{
          position: 'absolute',
          right: '0',
          top: '100%',
          width: '320px',
          backgroundColor: 'white',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          borderRadius: '0.5rem',
          zIndex: 50,
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Notificaciones</h4>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                style={{ fontSize: '11px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Marcar todas leídas
              </button>
            )}
          </div>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                No tienes notificaciones
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} style={{ 
                  padding: '12px', 
                  borderBottom: '1px solid #f1f5f9',
                  backgroundColor: notif.viewed ? 'white' : '#f8fafc',
                  display: 'flex',
                  gap: '10px'
                }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: notif.viewed ? 'transparent' : '#3b82f6',
                    marginTop: '6px',
                    flexShrink: 0
                  }} />
                  
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#334155' }}>{notif.message}</p>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {new Date(notif.created_at || notif.timestamp || Date.now()).toLocaleString()}
                    </span>
                  </div>

                  <button 
                    onClick={() => markAsRead(notif.id)}
                    title="Descartar"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '16px',
                      alignSelf: 'flex-start',
                      padding: '0 4px'
                    }}
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
