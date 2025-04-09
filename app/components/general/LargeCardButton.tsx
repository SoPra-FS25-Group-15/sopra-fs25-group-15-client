import React from "react";
import { Card, Typography } from "antd";

const { Title } = Typography;

export interface LargeCardButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

const LargeCardButton: React.FC<LargeCardButtonProps> = ({
  label,
  onClick,
  disabled,
  icon,
  style
}) => {
  // Default style for the card with Flexbox centering
  const defaultStyle: React.CSSProperties = {
    textAlign: "center",
    cursor: disabled ? "not-allowed" : "pointer",
    padding: "2rem",
    borderRadius: 8,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  };

  return (
    <Card
      hoverable={!disabled}
      onClick={!disabled ? onClick : undefined}
      style={{ ...defaultStyle, ...style }}
    >
      {icon && (
        <div
          style={{
            marginBottom: "0.5rem",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%"
          }}
        >
          {icon}
        </div>
      )}
      <Title level={2} style={{ marginBottom: 0 }}>
        {label}
      </Title>
    </Card>
  );
};

export default LargeCardButton;
