import React from "react";
import { Alert } from "antd";

/**
 * Interface for the notification properties.
 *
 * @param {AlertType} type - The type of the notification (options: `success`, `info`, `warning`, `error`).
 * @param {string} message - The main error message to be displayed.
 * @param {string} description - `Optional` An additional description of the error.
 * @param {() => void} onClose - `Optional` Callback function to be executed when the notification is closed.
 */

export interface NotificationProps {
  type: "success" | "info" | "warning" | "error";
  message: string;
  description?: string;
  onClose?: () => void;
}

/**
 * React component to display notifications using an Ant Design Alert component.
 *
 * @param {NotificationProps} props - The props object {@link NotificationProps} containing notification configuration.
 *
 * @returns {React.ReactElement} A React element representing the notification.
 */
const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  description,
  onClose,
}: NotificationProps): React.ReactElement => {
  return (
    <Alert
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
