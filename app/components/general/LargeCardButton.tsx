import React from "react";
import { Card, Typography } from "antd";

const { Title } = Typography;

export interface LargeCardButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}

const LargeCardButton: React.FC<LargeCardButtonProps> = ({
  label,
  onClick,
  disabled,
  icon
}) => {
  return (
    <Card
      hoverable={!disabled}
      onClick={!disabled ? onClick : undefined}
      style={{
        textAlign: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        padding: "2rem",
        borderRadius: 8
      }}
    >
      {icon && <div style={{ marginBottom: "0.5rem" }}>{icon}</div>}
      <Title level={2} style={{ marginBottom: 0 }}>
        {label}
      </Title>
    </Card>
  );
};

export default LargeCardButton;
