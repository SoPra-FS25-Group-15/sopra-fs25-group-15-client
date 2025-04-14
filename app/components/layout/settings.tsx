"use client";

import React, { useState } from "react";
import { Card, Button, Typography } from "antd";
import { CloseOutlined } from "@ant-design/icons";

const { Title } = Typography;

const Settings: React.FC = () => {
  const [visible, setVisible] = useState<boolean>(true);

  const handleClose = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "40px auto",
        padding: 24,
        background: "#1f1f1f",
        borderRadius: 12,
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        color: "#fff",
      }}
    >
      <Card style={{ background: "transparent", border: "none", color: "#fff" }} styles={{ body: { padding: 0 } }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Title level={4} style={{ margin: 0, color: "#fff" }}>
            Settings
          </Title>
          <Button type="text" onClick={handleClose} icon={<CloseOutlined style={{ color: "#fff" }} />} />
        </div>
        <div style={{ color: "#ccc" }}>
          <p>This component is currently under construction.</p>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
