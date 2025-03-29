"use client";

import { Button, Card, Flex, Popover, Tag } from "antd";
import { DollarOutlined, DownOutlined } from "@ant-design/icons";
import Menu, { MenuItem } from "@/components/general/menu";
import UserCard from "@/components/general/usercard";
import useLocalStorage from "@/hooks/useLocalStorage";

const appLinks: MenuItem[] = [
  {
    label: "Home",
    link: "/",
  },
  {
    label: "Play Casual",
    link: "/casual",
  },
  {
    label: "Play Competitive",
    link: "/competitive",
  },
  {
    label: "Leaderboard",
    link: "/leaderboard",
  },
  {
    label: "Game Rules",
    link: "/rules",
  },
  {
    label: "Store",
    link: "/store",
    subview: (
      <Tag icon={<DollarOutlined />} color="gold">
        1000
      </Tag>
    ),
  },
];

const userLinks: MenuItem[] = [
  {
    label: "Profile",
    link: "/profile",
  },
  {
    label: "Achievements",
    link: "/achivements",
  },
  {
    label: "Game History",
    link: "/history",
  },
  {
    label: "Settings",
    link: "/settings",
  },
];

const Profile: React.FC = () => {
  const { value: token, clear: clearToken } = useLocalStorage<string>(
    "token",
    ""
  );

  function handleLogout() {
    clearToken();
  }

  // User is logged in
  if (token) {
    return (
      <Popover
        content={
          <Menu
            items={[...userLinks, { label: "Sign out", onClick: handleLogout }]}
          ></Menu>
        }
        trigger="hover"
        mouseLeaveDelay={0.3}
      >
        <UserCard
          username={"Username"}
          rank={"Rank"}
          showPointer
          subview={<DownOutlined />}
        ></UserCard>
      </Popover>
    );
  } else {
    // User is not logged in
    return (
      <Flex
        align="center"
        justify="center"
        gap={8}
        style={{ height: 72, paddingRight: 16 }}
      >
        <Button type="primary" href="/register">
          Register
        </Button>
        <Button type="default" href="/login">
          Login
        </Button>
      </Flex>
    );
  }
};

const Header: React.FC = () => {
  return (
    <nav style={{ padding: 16 }}>
      <Card
        styles={{ body: { padding: 4, background: "#f9f9f9" } }}
        size="small"
      >
        <Flex justify="space-between" align="center">
          <Menu items={appLinks} horizontal></Menu>
          <Profile></Profile>
        </Flex>
      </Card>
    </nav>
  );
};

export default Header;
