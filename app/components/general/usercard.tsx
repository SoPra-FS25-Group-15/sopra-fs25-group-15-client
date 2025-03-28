import React from "react";
import { Avatar, Card, Flex, Tag } from "antd";
import { UserOutlined } from "@ant-design/icons";

/**
 * Represents the properties for the UserCard component.
 *
 * @property username - The username to be displayed by the UserCard.
 * @property rank - The rank associated with the user.
 * @property subview - `Optional` A React node for rendering any additional subview content, ex. a button that shows more options.
 */
interface UserCardProps {
  username: string;
  rank: string;
  subview?: React.ReactNode;
}

/**
 * A reusable card component that displays a user's information.
 *
 * This component renders a card with a default avatar (for now), username, and rank.
 * It also supports an optional subview element that can be rendered alongside the main user information.
 *
 * @property username - The username to be displayed by the UserCard.
 * @property rank - The rank associated with the user.
 * @property subview - `Optional` A React node for rendering any additional subview content, ex. a button that shows more options.
 *
 * @returns A React element representing the user card.
 */
const UserCard: React.FC<
  UserCardProps & React.HTMLAttributes<HTMLSpanElement> // Extend the props for the component to work with antd <Popover>
> = ({ username, rank, subview, ...props }): React.ReactElement => {
  return (
    <Card {...props} size="small" hoverable>
      <Flex gap={32} align="center">
        <Flex gap={16}>
          <Avatar size={42} icon={<UserOutlined />} />
          <Flex vertical align="start">
            <p>{username}</p>
            <Tag color="purple">{rank}</Tag>
          </Flex>
        </Flex>
        {subview ? subview : ""}
      </Flex>
    </Card>
  );
};

export default UserCard;
