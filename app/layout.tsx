import "@/styles/globals.css";
import { blue, green, purple, red, yellow } from "@ant-design/colors";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import type { Metadata } from "next";
import ContextProvider from "./contexts/contextProvider";
import { WebSocketProvider } from "./contexts/webSocketProvider";
import { Space_Grotesk } from "next/font/google";
import LocalStorageHandler from "./contexts/localStorageHandler";

export const metadata: Metadata = {
  title: "ActionGuessr",
  description: "Find out where you are on the world. Now as a turn based game with friends.",
};

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "500", "700"],
  display: "swap",
  preload: true,
  variable: "--font-space-grotesk",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={spaceGrotesk.className}
        style={{
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          color: "#fff",
          backgroundColor: "#111",
        }}
      >
        <ContextProvider>
          <WebSocketProvider>
            <LocalStorageHandler>
              <ConfigProvider
                theme={{
                  token: {
                    //Seed token
                    fontFamily: `${spaceGrotesk.style.fontFamily}, sans-serif`,
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
                    colorWarningBg: yellow[9],
                    colorWarningBorder: yellow[8],
                    colorSuccessBg: green[9],
                    colorSuccessBorder: green[8],
                    colorInfoBg: blue[9],
                    colorInfoBorder: blue[8],
                    colorErrorText: "#fff",
                    //Alias token
                    colorBgSpotlight: "#333",
                    colorTextPlaceholder: "#aaa",
                  },
                }}
              >
                <AntdRegistry>{children}</AntdRegistry>
              </ConfigProvider>
            </LocalStorageHandler>
          </WebSocketProvider>
        </ContextProvider>
      </body>
    </html>
  );
}
