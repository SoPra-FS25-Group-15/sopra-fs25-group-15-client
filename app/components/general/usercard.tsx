import React from "react";
import { Avatar, Card, Tag } from "antd";
import { UserOutlined } from "@ant-design/icons";

interface UserCardProps {
  username?: string;
  rank?: string;
  showPointer?: boolean;
  onClick?: () => void;
  subview?: React.ReactNode;
  minimal?: boolean;  // New prop to control minimal rendering.
}

const UserCard: React.FC<UserCardProps & React.HTMLAttributes<HTMLDivElement>> = ({
  username,
  rank,
  showPointer,
  onClick,
  subview,
  minimal = false,
  ...props
}): React.ReactElement => {
  return (
    <Card
      {...props}
      onClick={onClick}
      size="small"
      style={{
        cursor: showPointer ? "pointer" : "default",
        height: 72,
        minWidth: 72,
      }}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "center", height: "100%" }}>
        <Avatar size={42} icon={<UserOutlined />} />
        {/* Only render username and rank if not in minimal mode */}
        {!minimal && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            {username && <div>{username}</div>}
            {rank && <Tag color="purple">{rank}</Tag>}
          </div>
        )}
        {subview && subview}
      </div>
    </Card>
  );
};

export default UserCard;
