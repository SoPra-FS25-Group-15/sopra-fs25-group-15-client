"use client";

import { useEffect, useState } from "react";
import Menu, { MenuItem } from "@/components/general/menu";
import UserCard from "@/components/general/usercard";
import Achievements from "@/components/layout/achievements";
import GameHistory from "@/components/layout/gameHistory";
import Settings from "@/components/layout/settings";
import { useGlobalUser } from "@/contexts/globalUser";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { DollarOutlined, DownOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Popover, Tag } from "antd";
import Link from "next/link";

/** 
 * Left-side header links remain the same as before. 
 */
const appLinks: MenuItem[] = [
  { label: "Home", link: "/" },
  { label: "Play Casual", link: "/casual" },
  { label: "Play Competitive", link: "/competitive" },
  { label: "Leaderboard", link: "/leaderboard" },
  { label: "Game Rules", link: "/rules" },
];

/**
 * We define the props for Profile to accept a callback onSelectView(viewName).
 * We’ll call it from the “Achievements,” “Game History,” and “Settings” menu items.
 */
type ProfileProps = {
  onSelectView: (viewName: "achievements" | "history" | "settings") => void;
};

const Profile: React.FC<ProfileProps> = ({ onSelectView }) => {
  const { clear: clearToken } = useLocalStorage<User | null>("user", null);
  const { user } = useGlobalUser();

  function handleLogout() {
    clearToken();
  }

  useEffect(() => {
    // Re-renders when the user changes
  }, [user]);

  if (user) {
    // Logged-in: show user card with popover
    // The popover items now call onSelectView(...) instead of linking to a route
    const userLinks: MenuItem[] = [
      { label: "Profile", link: "/profile" },
      { label: "Achievements", onClick: () => onSelectView("achievements") },
      { label: "Game History", onClick: () => onSelectView("history") },
      { label: "Settings", onClick: () => onSelectView("settings") },
      { label: "Sign out", onClick: handleLogout },
    ];

    return (
      <Popover
        content={<Menu items={userLinks} />}
        trigger="hover"
        mouseLeaveDelay={0.3}
      >
        <UserCard
          username={user.username ?? "username"}
          rank={user.mmr ? `${user.mmr} MMR` : "0 MMR"}
          showPointer
          subview={<DownOutlined />}
        />
      </Popover>
    );
  } else {
    // Not logged in: show Register + Login buttons
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

/**
 * Header: keeps track of the active view in state, shows the corresponding component below.
 */
const Header: React.FC = () => {
  const { user } = useGlobalUser();
  // "achievements", "history", "settings", or null
  const [activeView, setActiveView] = useState<null | "achievements" | "history" | "settings">(
    null
  );

  useEffect(() => {}, [user]);

  // Called by Profile’s “Achievements,” “Game History,” or “Settings” items
  function handleSelectView(viewName: "achievements" | "history" | "settings") {
    // If user clicks the same item again, close it; otherwise open the newly selected view
    setActiveView((prev) => (prev === viewName ? null : viewName));
  }

  return (
    <nav style={{ position: "fixed", top: 8, left: 8, right: 8, zIndex: 100 }}>
      <Card styles={{ body: { padding: 4 } }} size="small">
        <Flex justify="space-between" align="center">
          {/* Left-hand side: standard routes + store */}
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

          {/* Right-hand side: Profile w/ popover */}
          <Profile onSelectView={handleSelectView} />
        </Flex>
      </Card>

      {/* Conditionally render the chosen view below the header */}
      <div style={{ marginTop: 80, padding: 16 }}>
        {activeView === "achievements" && <Achievements />}
        {activeView === "history" && <GameHistory />}
        {activeView === "settings" && <Settings />}
      </div>
    </nav>
  );
};

export default Header;
