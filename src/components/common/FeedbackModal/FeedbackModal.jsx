import Modal from '../Modal/Modal';
import { CheckCircleIcon, XCircleIcon, AlertTriangleIcon } from '../../../assets/icons/Icons';
import './FeedbackModal.css';

const FeedbackModal = ({ isOpen, onClose, type = 'success', title, message, onConfirm }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="feedback-icon feedback-icon--success" />;
      case 'error':
        return <XCircleIcon className="feedback-icon feedback-icon--error" />;
      case 'warning':
        return <AlertTriangleIcon className="feedback-icon feedback-icon--warning" />;
      default:
        return null;
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="feedback-modal-content">
        <div className="feedback-icon-container">
          {getIcon()}
        </div>
        <h3 className="feedback-title">{title}</h3>
        <p className="feedback-message">{message}</p>
        <button className="feedback-button" onClick={handleConfirm}>
          Entendido
        </button>
      </div>
    </Modal>
  );
};

export default FeedbackModal;
