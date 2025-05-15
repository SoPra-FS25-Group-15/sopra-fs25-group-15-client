"use client";

import React from "react";
import { Button, Card } from "antd";
import { useRouter } from "next/navigation";

const Leaderboard: React.FC = () => {
  const router = useRouter();

  const handleHomeClick = () => {
    router.push("/");
  };

  return (
    <div
      style={{
        padding: "2em",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card title="Leaderboard" style={{ textAlign: "center", maxWidth: "500px", width: "100%" }}>
        <p style={{ fontSize: "1.25rem", color: "#ccc" }}>
          This page is currently under construction. Please check back later!
        </p>
        <Button type="primary" onClick={handleHomeClick}>
          Home
        </Button>
      </Card>
    </div>
  );
};

export default Leaderboard;
