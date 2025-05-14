"use client";

import Menu, { MenuItem } from "@/components/general/menu";
import UserCard from "@/components/general/usercard";
import { useGlobalUser } from "@/contexts/globalUser";
import { useGlobalUserAttributes } from "@/contexts/globalUserAttributes";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User, UserAttributes } from "@/types/user";
import { CloseOutlined, DownOutlined } from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";
import { Button, Card, Drawer, Flex, Modal, Popover } from "antd";
import Link from "next/link";
import { useEffect, useState } from "react";
import UserProfile from "../userMenu/userProfile";
import Achievements from "../userMenu/achievements";
import GameHistory from "../userMenu/gameHistory";
import Settings from "../userMenu/settings";

const appLinks: MenuItem[] = [
  { label: "Play", link: "/casual" },
  { label: "Leaderboard", link: "/leaderboard" },
  { label: "Game Rules", link: "/rules" },
];

type Modal = "profile" | "achievements" | "history" | "settings";

/**
 * Profile: shows links to user's profile, achievements, game history, and settings.
 */
const Profile: React.FC = () => {
  const { clear: clearUser } = useLocalStorage<User | null>("user", null);
  const { clear: clearUserAttributes } = useLocalStorage<UserAttributes | null>("userAttributes", null);
  const { user } = useGlobalUser();
  const { userAttributes } = useGlobalUserAttributes();

  const [activeView, setActiveView] = useState<Modal | null>(null);
  const [popoverVisible, setPopoverVisible] = useState(false);

  const handleOpen = (view: Modal) => {
    setActiveView(view);
    setPopoverVisible(false);
  };

  const handleClose = () => {
    setActiveView(null);
    setPopoverVisible(true);
  };

  function handleLogout() {
    clearUser();
    clearUserAttributes();
    setActiveView(null);
    setPopoverVisible(false);
  }

  // Close the popover when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent, not: string[]) => {
      //check if the clicked element has a parent that has a class that is part of the not list
      const isOutside = not.every((className) => {
        const element = event.target as HTMLElement;
        return !element.closest(`.${className}`);
      });
      if (isOutside) {
        setPopoverVisible(false);
      }
    };
    const onMouseDown = (e: MouseEvent) => handleClickOutside(e, ["user-menu", "ant-popover"]);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPopoverVisible(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (user) {
    const userLinks: MenuItem[] = [
      { label: "Profile", onClick: () => handleOpen("profile") },
      { label: "Achievements", onClick: () => handleOpen("achievements") },
      { label: "Game History", onClick: () => handleOpen("history") },
      { label: "Settings", onClick: () => handleOpen("settings") },
      { label: "Sign out", onClick: handleLogout },
    ];

    return (
      <>
        <Drawer
          open={!!activeView}
          closeIcon={false}
          onClose={() => handleClose()}
          extra={
            <Button style={{ width: 40, height: 40 }} type="text" onClick={() => handleClose()}>
              <CloseOutlined />
            </Button>
          }
          placement="left"
          title={activeView ? activeView.charAt(0).toUpperCase() + activeView.slice(1) : ""}
          footer={null}
          width={800}
          maskClosable
          style={{ zIndex: 1000 }}
        >
          {activeView === "profile" && <UserProfile />}
          {activeView === "achievements" && <Achievements />}
          {activeView === "history" && <GameHistory />}
          {activeView === "settings" && <Settings />}
        </Drawer>
        <span style={{ maxWidth: "25vw" }}>
          <Popover
            className="user-menu"
            content={
              <div className="user-menu">
                <Menu items={userLinks} />
              </div>
            }
            placement="bottomRight"
            open={popoverVisible}
          >
            <UserCard
              style={{ borderRadius: 4, height: 72, width: "100%", background: "#fff", color: "#000" }}
              username={user.username ?? "username"}
              subviewBottom={userAttributes ? `${userAttributes.xp} XP` : "0 XP"}
              showPointer
              subviewRight={<DownOutlined />}
              onClick={() => setPopoverVisible(!popoverVisible)}
            />
          </Popover>
        </span>
      </>
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
              <Menu style={{ height: 72 }} items={appLinks} horizontal />
            </Flex>
            <Profile />
          </Flex>
        </Card>
      </nav>
    </>
  );
};

export default Header;
