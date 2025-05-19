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

/**
 * UserCard component renders a user avatar along with optional additional views.
 *
 * @remarks
 * This component supports two display modes:
 * - iconOnly: Only the avatar is rendered with a customizable size.
 * - Default (non-iconOnly): A card is rendered, which includes the avatar, the username,
 *   an optional bottom subview, and an optional right subview.
 *
 * @param borderless - If true, renders the card without a border and background.
 * @param iconOnly - If true, renders only the avatar.
 * @param iconsize - Specifies the size of the avatar; can be "large" or "small".
 * @param username - The username to display. The first character of the username (uppercased)
 *                  is used as the avatar's content.
 * @param showPointer - If true, the cursor becomes a pointer over clickable elements.
 * @param onClick - Optional click event handler.
 * @param subviewBottom - An optional React node displayed below the username.
 * @param subviewRight - An optional React node displayed to the right of the avatar and username.
 * @param style - Optional inline styling applied to the Card component.
 * @param props - Additional HTML attributes extended from a span element, for integration with components like antd Popover.
 *
 * @returns A React element representing the user card in either icon-only or full card mode.
 *
 * @example
 * <UserCard username="Alice" iconOnly={false} iconsize="large" showPointer onClick={handleClick} />
 */
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
      <Flex onClick={onClick ? onClick : undefined} align="center" justify="center">
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
      <Flex gap={16} align="center" justify="space-between" style={{ height: "100%", width: "100%" }}>
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
