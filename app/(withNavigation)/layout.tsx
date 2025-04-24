import GlobalInvitePopup from "@/components/general/globalPopUp";
import FriendManagement from "@/components/layout/friends";
import Header from "@/components/layout/header";
import { AntdRegistry } from "@ant-design/nextjs-registry";

export default function NavigationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header></Header>
      <FriendManagement></FriendManagement>
      <GlobalInvitePopup></GlobalInvitePopup>

      <AntdRegistry>
        <section style={{ padding: 8, margin: "0 auto", maxWidth: 1280 }}>{children}</section>
      </AntdRegistry>
    </>
  );
}
