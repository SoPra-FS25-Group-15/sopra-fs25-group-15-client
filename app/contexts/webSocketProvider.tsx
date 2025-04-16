'use client';

import React, { createContext, useEffect, useState, useContext, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { message } from 'antd';
import { useGlobalUser } from '@/contexts/globalUser';

interface IWebSocketContext {
  stompConnected: boolean;
  popupInvite: { fromUsername: string; lobbyCode: string } | null;
  // Other methods you might need, e.g. to publish messages.
}

const WebSocketContext = createContext<IWebSocketContext | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useGlobalUser();
  const [stompConnected, setStompConnected] = useState(false);
  const [popupInvite, setPopupInvite] = useState<{ fromUsername: string; lobbyCode: string } | null>(null);
  const stompClient = useRef<Client | null>(null);

  useEffect(() => {
    if (user?.token) {
      console.log("Initializing global STOMP connection for token:", user.token);
      stompClient.current = new Client({
        webSocketFactory: () =>
          new SockJS(`http://localhost:8080/ws/lobby-manager?token=${user.token}`),
        connectHeaders: {
          Authorization: `Bearer ${user.token}`,
        },
        reconnectDelay: 5000,
        onConnect: () => {
          console.log("Global STOMP connected");
          setStompConnected(true);

          // Subscribe for incoming invitations
          stompClient.current?.subscribe(
            "/user/topic/lobby-manager/invites",
            (msg) => {
              console.log("Global: Received invite message:", msg.body);
              try {
                const response = JSON.parse(msg.body);
                if (response.type === "INVITE_IN") {
                  const { fromUsername, lobbyCode } = response.payload;
                  console.log("Global: Setting popupInvite:", fromUsername, lobbyCode);
                  setPopupInvite({ fromUsername, lobbyCode });
                  // Optionally, you can use a global notification library here.
                  message.info(`Invitation from ${fromUsername} for lobby ${lobbyCode}`);
                }
              } catch (err) {
                console.error("Global: Error processing incoming invite:", err);
              }
            }
          );
        },
        onStompError: (frame) => {
          console.error("Global STOMP error:", frame.headers["message"]);
          console.error("Global STOMP error details:", frame.body);
        },
        onDisconnect: () => {
          console.log("Global STOMP disconnected");
          setStompConnected(false);
        },
      });

      stompClient.current.activate();
    }

    return () => {
      stompClient.current?.deactivate();
    };
  }, [user?.token]);

  return (
    <WebSocketContext.Provider value={{ stompConnected, popupInvite }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
