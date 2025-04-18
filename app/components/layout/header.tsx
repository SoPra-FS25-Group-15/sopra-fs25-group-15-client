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
import "@ant-design/v5-patch-for-react-19";
import { Button, Card, Popover, Tag } from "antd";  // removed Flex
import Link from "next/link";
import { useEffect, useState } from "react";


const appLinks: MenuItem[] = [
  { label: "Home", link: "/" },
  { label: "Play Casual", link: "/casual" },
  { label: "Play Competitive", link: "/competitive" },
  { label: "Leaderboard", link: "/leaderboard" },
  { label: "Game Rules", link: "/rules" },
];

type Screens = "profile" | "achievements" | "history" | "settings";

type ProfileProps = {
  onSelectView: (viewName: Screens) => void;
};

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
  }, [user, userAttributes]);

  if (loading) return null;

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
        <Popover
          content={<Menu items={userLinks} />}
          trigger="click"
          placement="bottomRight"
          mouseLeaveDelay={0.3}
        >
          <UserCard
            style={{ borderRadius: 4, height: 72, width: "100%" }}
            username={user.username ?? "username"}
            subviewBottom={userAttributes ? `${userAttributes.mmr} MMR` : "0 MMR"}
            showPointer
            subviewRight={<DownOutlined />}
          />
        </Popover>
      </span>
    );
  } else {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, height: 72, paddingRight: 16 }}>
        <Link href="/register">
          <Button type="primary">Register</Button>
        </Link>
        <Link href="/login">
          <Button>Login</Button>
        </Link>
      </div>
    );
  }
};

const Header: React.FC = () => {
  const { user } = useGlobalUser();
  const { userAttributes } = useGlobalUserAttributes();
  const [activeView, setActiveView] = useState<Screens | null>(null);

  function handleSelectView(viewName: Screens) {
    setActiveView((prev) => (prev === viewName ? null : viewName));
  }

  return (
    <>
      {/* Fixed header bar */}
      <nav
        style={{
          position: "fixed",
          top: 8,
          left: 8,
          right: 8,
          height: 82,
          zIndex: 100,
          overflow: "hidden",
        }}
      >
        <Card size="small" bodyStyle={{ padding: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {/* Left: main nav */}
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

            {/* Right: profile/login */}
            <Profile onSelectView={handleSelectView} />
          </div>
        </Card>
      </nav>

      {/* Push everything down by header height + margin */}
      <div style={{ paddingTop:  50, paddingLeft: 8, paddingRight: 8 }}>
        {activeView === "profile" && <UserProfile />}
        {activeView === "achievements" && <Achievements />}
        {activeView === "history" && <GameHistory />}
        {activeView === "settings" && <Settings />}
      </div>
    </>
  );
};

export default Header;
