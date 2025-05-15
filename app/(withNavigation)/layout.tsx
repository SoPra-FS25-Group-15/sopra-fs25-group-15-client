import GlobalInvitePopup from "@/components/general/globalPopUp";
import FriendManagement from "@/components/layout/friends";
import Header from "@/components/layout/header";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { Flex } from "antd";

export default function NavigationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <FriendManagement></FriendManagement>
      <GlobalInvitePopup></GlobalInvitePopup>

      <AntdRegistry>
        <Flex
          vertical
          gap={8}
          justify="start"
          style={{
            padding: 8,
            margin: "0 auto",
            maxWidth: 1280,
            height: "100%",
            minHeight: 500,
          }}
        >
          <Header></Header>
          {/* Reserve place for header */}
          <section style={{ height: 82, flexShrink: 0 }}></section>
          {/* Content Section */}
          <section style={{ height: "100%" }}>{children}</section>
        </Flex>
      </AntdRegistry>
    </>
  );
}
