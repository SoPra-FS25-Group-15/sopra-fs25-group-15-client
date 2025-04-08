"use client";

import Menu, { MenuItem } from "@/components/general/menu";
import UserCard from "@/components/general/usercard";
import { useGlobalUser } from "@/contexts/globalUser";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { DollarOutlined, DownOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Popover, Tag } from "antd";
import Link from "next/link";
import { useEffect } from "react";

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
  const { clear: clearToken } = useLocalStorage<User | null>("user", null);
  const { user } = useGlobalUser();

  function handleLogout() {
    clearToken();
  }

  useEffect(() => {}, [user]); // rerenders the component when user in localStorage changes

  // User is logged in
  if (user) {
    return (
      <Popover
        content={<Menu items={[...userLinks, { label: "Sign out", onClick: handleLogout }]}></Menu>}
        trigger="hover"
        mouseLeaveDelay={0.3}
      >
        <UserCard
          username={user.username ?? "username"}
          rank={user.mmr ? `${user.mmr} MMR` : "0 MMR"}
          showPointer
          subview={<DownOutlined />}
        ></UserCard>
      </Popover>
    );
  } else {
    // User is not logged in
    return (
      <Flex align="center" justify="center" gap={8} style={{ height: 72, paddingRight: 16 }}>
        <Link href="/register">
          <Button type="primary">Register</Button>
        </Link>
        <Link href="/login">
          <Button type="default">Login</Button>
        </Link>
      </Flex>
    );
  }
};

const Header: React.FC = () => {
  const { user } = useGlobalUser();
  useEffect(() => {}, [user]); // rerenders the component when user in localStorage changes

  return (
    <nav style={{ width: "100%", flex: 1, marginBottom: 8 }}>
      <Card styles={{ body: { padding: 4 } }} size="small">
        <Flex justify="space-between" align="center">
          <Menu
            items={[
              ...appLinks,
              {
                label: "Store",
                link: "/store",
                subview: user ? (
                  <Tag icon={<DollarOutlined />} color="gold">
                    {user.points ?? "0"}
                  </Tag>
                ) : undefined,
              },
            ]}
            horizontal
          ></Menu>
          <Profile></Profile>
        </Flex>
      </Card>
    </nav>
  );
};

export default Header;
