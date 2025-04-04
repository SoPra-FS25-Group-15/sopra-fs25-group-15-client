import React from "react";
import { Card, Typography } from "antd";

const { Title } = Typography;

export interface LargeCardButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const LargeCardButton: React.FC<LargeCardButtonProps> = ({ label, onClick, disabled }) => {
  return (
    <Card
      hoverable={!disabled}
      onClick={!disabled ? onClick : undefined}
      style={{
        textAlign: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        padding: "2rem",
        borderRadius: 8,
      }}
    >
      <Title level={2} style={{ marginBottom: 0 }}>
        {label}
      </Title>
    </Card>
  );
};

export default LargeCardButton;
