import { useState } from "react";
import { NotificationIcon } from "../../../assets/icons/Icons.jsx";
import { NotificationPanel } from "./NotificationPanel.jsx";
import "./Notification.css";
import { useNotification } from "../../../contexts/NotificationContext.jsx";

export const Notification = () => {
  const { notifications, hasNewNotification, markAsRead } = useNotification();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleIconClick = () => {
    if (!isPanelOpen) {
      markAsRead();
    }
    setIsPanelOpen((prev) => !prev);
  };

  return (
    <>
      <button
        type="button"
        className={`btn-notifications ${hasNewNotification ? "active" : ""}`}
        onClick={handleIconClick}
      >
        <NotificationIcon />
      </button>
      {isPanelOpen && <NotificationPanel notifications={notifications} />}
    </>
  );
};
