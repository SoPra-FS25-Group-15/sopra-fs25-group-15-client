"use client";

import Menu, { MenuItem } from "@/components/general/menu";
import UserCard from "@/components/general/usercard";
import Achievements from "@/components/layout/achievements";
import GameHistory from "@/components/layout/gameHistory";
import Settings from "@/components/layout/settings";
import UserProfile from "@/components/layout/user";
import { useGlobalUser } from "@/contexts/globalUser";
import { useGlobalUserAttributes } from "@/contexts/globalUserAttributes";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { DollarOutlined, DownOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Popover, Tag } from "antd";
import Link from "next/link";
import { useEffect, useState } from "react";

const appLinks: MenuItem[] = [
  { label: "Play Casual", link: "/casual" },
  { label: "Play Competitive", link: "/competitive" },
  { label: "Leaderboard", link: "/leaderboard" },
  { label: "Game Rules", link: "/rules" },
];

type Screens = "profile" | "achievements" | "history" | "settings";

type ProfileProps = {
  onSelectView: (viewName: Screens) => void;
};

/**
 * Profile: shows links to user's profile, achievements, game history, and settings.
 */
const Profile: React.FC<ProfileProps> = ({ onSelectView }) => {
  const [loading, setLoading] = useState(true);

  const { clear: clearToken } = useLocalStorage<User | null>("user", null);
  const { user } = useGlobalUser();
  const { userAttributes } = useGlobalUserAttributes();

  function handleLogout() {
    clearToken();
  }

  useEffect(() => {
    setLoading(false);
  }, [user, userAttributes]); // Re-renders on change

  if (loading) {
    return;
  }

  if (user) {
    const userLinks: MenuItem[] = [
      { label: "Profile", onClick: () => onSelectView("profile") },
      { label: "Achievements", onClick: () => onSelectView("achievements") },
      { label: "Game History", onClick: () => onSelectView("history") },
      { label: "Settings", onClick: () => onSelectView("settings") },
      { label: "Sign out", onClick: handleLogout },
    ];

    return (
      <span style={{ maxWidth: "25vw" }}>
        <Popover content={<Menu items={userLinks} />} trigger="click" placement="bottomRight" mouseLeaveDelay={0.3}>
          <UserCard
            style={{ borderRadius: 4, height: 72, width: "100%", background: "#fff", color: "#000" }}
            username={user.username ?? "username"}
            subviewBottom={userAttributes ? `${userAttributes.mmr} MMR` : "0 MMR"}
            showPointer
            subviewRight={<DownOutlined />}
          />
        </Popover>
      </span>
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
  const { userAttributes } = useGlobalUserAttributes();
  const [activeView, setActiveView] = useState<Screens | null>(null);

  useEffect(() => {}, [user, userAttributes]); // Re-renders on change

  function handleSelectView(viewName: Screens) {
    setActiveView((prev) => (prev === viewName ? null : viewName));
  }

  return (
    <>
      <nav style={{ position: "fixed", top: 8, left: 8, right: 8, zIndex: 100, height: 82, overflow: "hidden" }}>
        <Card styles={{ body: { padding: 4 } }} size="small">
          <Flex justify="space-between" align="center">
            <Flex align="center" gap={8}>
              <Link href={"/"}>
                <Flex style={{ fontSize: 24, padding: "12px 28px", color: "#fff" }}>
                  <span style={{ fontWeight: "500" }}>Action</span>
                  <span style={{ fontWeight: "800" }}>Guessr</span>
                </Flex>
              </Link>
              <Menu
                style={{ height: 72 }}
                items={[
                  ...appLinks,
                  {
                    label: "Store",
                    link: "/store",
                    subview: user ? (
                      <Tag icon={<DollarOutlined />} color="gold">
                        {userAttributes ? userAttributes.points : "0"}
                      </Tag>
                    ) : undefined,
                  },
                ]}
                horizontal
              />
            </Flex>

            {/* Right-hand side: Profile w/ popover */}
            <Profile onSelectView={handleSelectView} />
          </Flex>
        </Card>
      </nav>

      {/* Conditionally render the chosen view below the header */}
      <div style={{ padding: 8 + 82 }}>
        {activeView === "profile" && <UserProfile />}
        {activeView === "achievements" && <Achievements />}
        {activeView === "history" && <GameHistory />}
        {activeView === "settings" && <Settings />}
      </div>
    </>
  );
};

export default Header;
