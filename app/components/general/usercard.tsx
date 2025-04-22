import { purple } from "@ant-design/colors";
import { Avatar, Card, Flex } from "antd";
import React from "react";

interface UserCardProps {
  borderless?: boolean;
  iconOnly?: boolean;
  iconsize?: "large" | "small";
  username?: string;
  showPointer?: boolean;
  onClick?: () => void;
  subviewBottom?: React.ReactNode;
  subviewRight?: React.ReactNode;
  style?: React.CSSProperties;
}

const UserCard: React.FC<
  UserCardProps & React.HTMLAttributes<HTMLSpanElement> // Extend the props for the component to work with antd <Popover> and other components
> = ({
  borderless = false,
  iconOnly = false,
  iconsize = "large",
  username,
  showPointer,
  onClick,
  subviewBottom,
  subviewRight,
  style,
  ...props
}): React.ReactElement => {
  if (iconOnly) {
    return (
      <Flex
        onClick={onClick ? onClick : undefined}
        style={{ width: "100%", height: "100%" }}
        align="center"
        justify="center"
      >
        <Avatar
          size={iconsize == "large" ? 48 : 28}
          style={{
            flexShrink: 0,
            verticalAlign: "middle",
            backgroundColor: purple[2],
            color: purple[5],
            fontWeight: 500,
            fontSize: iconsize == "large" ? 20 : 14,
            cursor: showPointer ? "pointer" : "default",
            userSelect: "none",
          }}
        >
          {username ? username.charAt(0).toUpperCase() : "?"}
        </Avatar>
      </Flex>
    );
  }
  return (
    <Card
      {...props}
      onClick={onClick ? onClick : undefined}
      style={{
        width: "100%",
        border: borderless ? "none" : "1px solid rgba(255, 255, 255, 0.2)",
        background: borderless ? "transparent" : "#222",
        ...style,
      }}
      styles={{
        body: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          padding: borderless ? 0 : "12px 16px",
          cursor: showPointer ? "pointer" : "default",
        },
      }}
    >
      <Flex gap={32} align="center" justify="space-between" style={{ height: "100%", width: "100%" }}>
        <Flex gap={iconsize == "large" ? 16 : 8} align="center">
          <Avatar
            size={iconsize == "large" ? 42 : 28}
            style={{
              flexShrink: 0,
              verticalAlign: "middle",
              backgroundColor: purple[2],
              color: purple[5],
              fontWeight: 500,
              fontSize: iconsize == "large" ? 20 : 14,
              userSelect: "none",
            }}
          >
            {username ? username.charAt(0).toUpperCase() : "?"}
          </Avatar>
          <Flex vertical gap={4} style={{ lineHeight: "100%" }}>
            {username && <p style={{ fontWeight: "700" }}>{username}</p>}
            {subviewBottom ? subviewBottom : undefined}
          </Flex>
        </Flex>
        {subviewRight ? subviewRight : undefined}
      </Flex>
    </Card>
  );
};

export default UserCard;
