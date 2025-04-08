"use client";

import "@ant-design/v5-patch-for-react-19";
import Header from "./components/layout/header";
import FriendManagement from "./components/layout/friends";
import { Flex } from "antd";

export default function Home() {
  return (
    <section style={{ padding: 8 }}>
      <Header></Header>
      <FriendManagement></FriendManagement>

      <Flex vertical style={{ width: "calc(100% - 88px)" }}>
        <div>
          <h1>Group 15</h1>
          <h3>sopra-fs25-group-15-client</h3>
        </div>
      </Flex>
    </section>
  );
}
