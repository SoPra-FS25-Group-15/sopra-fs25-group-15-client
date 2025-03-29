import React from "react";
import { Avatar, Card, Flex, Tag } from "antd";
import { UserOutlined } from "@ant-design/icons";

/**
 * Properties for the UserCard component.
 *
 * @property username - `Optional` The user's display name.
 * @property rank - `Optional` The rank of the user.
 * @property showPointer - `Optional` Determines if the cursor should change to a pointer on hover.
 * @property onClick - `Optional` Callback fired when the card is clicked.
 * @property subview - `Optional` React node rendered alongside the main user details.
 */
interface UserCardProps {
  username?: string;
  rank?: string;
  showPointer?: boolean;
  onClick?: () => void;
  subview?: React.ReactNode;
}

/**
 * UserCard component.
 *
 * This component renders a compact card displaying a user's avatar, username, and rank.
 * It supports additional clickable functionality and an optional subview, rendered to the right of the user details.
 * The card can be styled to change the cursor to a pointer when hovered over.
 * Leave the username and rank fields unset to render only the avatar.
 *
 * @property username - `Optional` The user's display name.
 * @property rank - `Optional` The rank of the user.
 * @property showPointer - `Optional` Determines if the cursor should change to a pointer on hover.
 * @property onClick - `Optional` Callback fired when the card is clicked.
 * @property subview - `Optional` React node rendered alongside the main user details.
 *
 * @returns A React element representing the user card.
 */
const UserCard: React.FC<
  UserCardProps & React.HTMLAttributes<HTMLSpanElement> // Extend the props for the component to work with antd <Popover>
> = ({
  username,
  rank,
  showPointer,
  onClick,
  subview,
  ...props
}): React.ReactElement => {
  return (
    <Card
      {...props}
      onClick={onClick ? onClick : undefined}
      size="small"
      styles={{
        body: {
          height: 72,
          minWidth: 72,
          cursor: showPointer ? "pointer" : "default",
        },
      }}
    >
      <Flex gap={32} align="center" justify="center" style={{ height: "100%" }}>
        <Flex gap={16}>
          <Avatar size={42} icon={<UserOutlined />} />
          <Flex vertical align="start">
            {username && <p>{username}</p>}
            {rank && <Tag color="purple">{rank}</Tag>}
          </Flex>
        </Flex>
        {subview ? subview : ""}
      </Flex>
    </Card>
  );
};

export default UserCard;
