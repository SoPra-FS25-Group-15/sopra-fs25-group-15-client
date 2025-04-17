import "@/styles/globals.css";
import { purple, red } from "@ant-design/colors";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import type { Metadata } from "next";
import ContextProvider from "./contexts/contextProvider";
import { WebSocketProvider } from "./contexts/webSocketProvider";

export const metadata: Metadata = {
  title: "ActionGuessr",
  description: "Find out where you are on the world. Now as a turn based game with friends.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          height: "100vh",
          width: "100%",
          color: "#fff",
          backgroundColor: "#111",
        }}
      >
        <WebSocketProvider>
          <ContextProvider>
            <ConfigProvider
              theme={{
                token: {
                  //Seed token
                  colorPrimary: purple[5],
                  colorBgBase: "#222",
                  fontSize: 16,
                  colorLink: purple[3],
                  //Map token
                  colorTextBase: "#fff",
                  colorPrimaryBg: "#222",
                  colorBgElevated: "#333",
                  colorBgSolid: purple[5],
                  colorBorder: "#555",
                  colorBorderSecondary: "#444",
                  colorErrorBg: red[9],
                  colorErrorBorder: red[8],
                  colorErrorText: "#fff",
                  //Alias token
                  colorTextPlaceholder: "#aaa",
                },
              }}
            >
              <AntdRegistry>{children}</AntdRegistry>
            </ConfigProvider>
          </ContextProvider>
        </WebSocketProvider>
      </body>
    </html>
  );
}
