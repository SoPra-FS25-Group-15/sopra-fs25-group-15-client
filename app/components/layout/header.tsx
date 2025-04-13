"use client";

import React, { useState, useEffect } from "react";
import Menu, { MenuItem } from "@/components/general/menu";
import UserCard from "@/components/general/usercard";
import { useGlobalUser } from "@/contexts/globalUser";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { DollarOutlined, DownOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Popover, Tag, Modal } from "antd";
import Link from "next/link";

// 1) Import the profile component that fetches from localStorage itself
import UserProfile from "@/components/layout/user"; // your code above

//
// App-level links for the main nav
//
const appLinks: MenuItem[] = [
  { label: "Home", link: "/" },
  { label: "Play Casual", link: "/casual" },
  { label: "Play Competitive", link: "/competitive" },
  { label: "Leaderboard", link: "/leaderboard" },
  { label: "Game Rules", link: "/rules" },
];

//
// For the user menu links, we no longer include `link: "/profile"`
// because we want to show the local UserProfile in a modal.
//
const userMenu = (
  handleShowProfile: () => void,
  handleLogout: () => void
): MenuItem[] => [
  {
    label: "Profile",
    onClick: handleShowProfile, // Open the UserProfile modal
  },
  { label: "Achievements", link: "/achivements" },
  { label: "Game History", link: "/history" },
  { label: "Settings", link: "/settings" },
  { label: "Sign out", onClick: handleLogout },
];

//
// This subcomponent handles the "logged in user" header area,
// including the popover + "sign out" and "profile" actions.
//
const ProfileSection: React.FC = () => {
  const { clear: clearToken } = useLocalStorage<User | null>("user", null);
  const { user } = useGlobalUser();

  // State for opening/closing the UserProfile modal
  const [showProfile, setShowProfile] = useState(false);

  function handleShowProfile() {
    setShowProfile(true);
  }
  function handleCloseProfile() {
    setShowProfile(false);
  }

  function handleLogout() {
    clearToken();
    // Optionally refresh or redirect
  }

  // Rerender whenever user changes
  useEffect(() => {}, [user]);

  // Logged-in case:
  if (user) {
    return (
      <>
        <Popover
          content={<Menu items={userMenu(handleShowProfile, handleLogout)} />}
          trigger="hover"
          mouseLeaveDelay={0.3}
        >
          <UserCard
            // Display name and MMR in the user card
            username={user.username ?? "username"}
            rank={user.mmr ? `${user.mmr} MMR` : "0 MMR"}
            showPointer
            subview={<DownOutlined />}
          />
        </Popover>

        {/* Our UserProfile (from your code) in an AntD modal. 
            The component itself handles localStorage userId/token. */}
        <Modal
          open={showProfile}
          footer={null}
          onCancel={handleCloseProfile}
          // optional: style={{ top: 80 }} or width, etc.
        >
          <UserProfile />
        </Modal>
      </>
    );
  }
  // Not logged in => show Register/Login
  else {
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

//
// The top-level nav header with the app menu and the user's profile section
//
const Header: React.FC = () => {
  const { user } = useGlobalUser();

  useEffect(() => {}, [user]);

  return (
    <nav style={{ position: "fixed", top: 8, left: 8, right: 8, zIndex: 100 }}>
      <Card size="small" style={{ padding: 4 }}>
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
          />
          <ProfileSection />
        </Flex>
      </Card>
    </nav>
  );
};

export default Header;
