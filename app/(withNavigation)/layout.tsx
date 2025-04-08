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
    <section style={{ padding: 8 }}>
      <Header></Header>
      <FriendManagement></FriendManagement>
      <AntdRegistry>
        <Flex vertical style={{ width: "calc(100% - 88px)" }}>
          {children}
        </Flex>
      </AntdRegistry>
    </section>
  );
}
