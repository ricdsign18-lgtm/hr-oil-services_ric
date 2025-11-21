import { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, AlertTriangleIcon, DelateIcon } from '../../../assets/icons/Icons';
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
        return <CheckCircleIcon />;
      case 'error':
        return <XCircleIcon />;
      case 'warning':
        return <AlertTriangleIcon />;
      case 'delete':
        return <DelateIcon />;
      default:
        return <CheckCircleIcon />; // Default icon
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
