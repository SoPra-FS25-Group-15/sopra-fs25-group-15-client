import { GlobalUserProvider } from "@/contexts/globalUser";
import { WebSocketProvider } from "@/contexts/webSocketProvider"; // import the new provider
import "@/styles/globals.css";
import { purple, red } from "@ant-design/colors";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student XX-XXX-XXX",
  description: "sopra-fs25-template-client",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <GlobalUserProvider>
          <WebSocketProvider>
            <ConfigProvider
              theme={{
                token: {
                  colorPrimary: purple[5],
                  colorBgBase: "#222",
                  fontSize: 16,
                  colorLink: purple[3],
                  colorTextBase: "#fff",
                  colorPrimaryBg: "#222",
                  colorBgElevated: "#333",
                  colorBgSolid: purple[5],
                  colorBorder: "#555",
                  colorBorderSecondary: "#444",
                  colorErrorBg: red[9],
                  colorErrorBorder: red[8],
                  colorErrorText: "#fff",
                  colorTextPlaceholder: "#aaa",
                },
              }}
            >
              <AntdRegistry>{children}</AntdRegistry>
            </ConfigProvider>
          </WebSocketProvider>
        </GlobalUserProvider>
      </body>
    </html>
  );
}
