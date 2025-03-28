"use client";

import { Card, Flex, Popover, Tag } from "antd";
import { DollarOutlined, DownOutlined } from "@ant-design/icons";
import Menu, { MenuItem } from "@/components/general/menu";
import UserCard from "@/components/general/usercard";

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
  {
    label: "Sign out",
    onClick: handleLogout,
  },
];

function handleLogout() {
  console.log("Sign out");
}

const Header: React.FC = () => {
  return (
    <nav style={{ padding: 16 }}>
      <Card
        styles={{ body: { padding: 4, background: "#f9f9f9" } }}
        size="small"
      >
        <Flex justify="space-between" align="center">
          <Menu items={appLinks} horizontal></Menu>
          <Popover
            content={<Menu items={userLinks}></Menu>}
            trigger="hover"
            mouseLeaveDelay={0.3}
          >
            <UserCard
              username={"Username"}
              rank={"Rank"}
              subview={<DownOutlined />}
            ></UserCard>
          </Popover>
        </Flex>
      </Card>
    </nav>
  );
};

export default Header;
