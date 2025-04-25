import React, { useState } from "react";
import { Alert } from "antd";

export interface NotificationProps {
  type: "success" | "info" | "warning" | "error";
  message: string;
  description?: string;
  onClose?: () => void;
}

const enterAnimation: React.CSSProperties = {
  opacity: 1.0,
};
const exitAnimation: React.CSSProperties = {
  opacity: 0.0,
};

const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  description,
  onClose,
}: NotificationProps): React.ReactElement | null => {
  const [animation, setAnimation] = useState<React.CSSProperties | null>(null);

  React.useEffect(() => {
    setAnimation(enterAnimation);
    const timer = setTimeout(() => {
      setAnimation(exitAnimation);
      if (onClose) {
        setTimeout(() => onClose(), 300);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [message, description, onClose]);

  return (
    <Alert
      style={{
        transition: "opacity 0.3s ease-in-out",
        opacity: 0.0,
        ...animation,
      }}
      type={type}
      message={message}
      description={description}
      onClose={onClose}
      closable
      showIcon
    />
  );
};

export default Notification;
