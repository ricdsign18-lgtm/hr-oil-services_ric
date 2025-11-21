import { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return console.log("success");
      case 'error':
        return console.log("error");
      case 'warning':
        return console.log("warning");
      default:
        return console.log("info");
    }
  };

  return (
    <div className={`toast toast--${type}`}>
      <div className="toast__icon">
        {getIcon()}
      </div>
      <p className="toast__message">{message}</p>
      <button className="toast__close" onClick={onClose}>
        ×
      </button>
    </div>
  );
};

export default Toast;
