import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConfigProvider } from "antd";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "@/styles/globals.css";
import Header from "@/components/layout/navigation/header";
import { GlobalUserProvider } from "@/contexts/globalUser";
import FriendManagement from "./components/layout/friends";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Student XX-XXX-XXX",
  description: "sopra-fs25-template-client",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <GlobalUserProvider>
          <ConfigProvider theme={{}}>
            <Header></Header>
            <FriendManagement></FriendManagement>
            <AntdRegistry>{children}</AntdRegistry>
          </ConfigProvider>
        </GlobalUserProvider>
      </body>
    </html>
  );
}
