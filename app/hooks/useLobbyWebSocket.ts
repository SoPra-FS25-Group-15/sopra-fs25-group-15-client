"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { message } from 'antd';

export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp?: string;
}

interface LobbyUser {
  userid: number;
  username: string;
}

interface LobbyInfo {
  lobbyId?: number;
  code: string;
  maxPlayers: string;
  playersPerTeam: number;
  host?: LobbyUser;
  players?: LobbyUser[];
}

interface UseLobbyWebSocketOptions {
  token: string | null;
  lobbyCode: string | null;
  onError?: (error: string) => void;
  onUserJoined?: (user: LobbyUser) => void;
  onUserLeft?: (userId: number) => void;
  onLobbyUpdate?: (lobbyInfo: LobbyInfo) => void;
  onLobbyDisbanded?: () => void;
  onInviteResult?: (result: unknown) => void;
}

export const useLobbyWebSocket = ({
  token,
  lobbyCode,
  onError,
  onUserJoined,
  onUserLeft,
  onLobbyUpdate,
  onLobbyDisbanded,
  onInviteResult
}: UseLobbyWebSocketOptions) => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lobbyInfo, setLobbyInfo] = useState<LobbyInfo | null>(null);
  const stompClient = useRef<Client | null>(null);
  const subscriptions = useRef<Map<string, { id: string, unsubscribe: () => void }>>(new Map());

  // Initialize the STOMP client
  const initialize = useCallback(() => {
    if (!token) {
      onError?.("Authentication token is required");
      setLoading(false);
      return;
    }

    try {
      console.log("Initializing STOMP connection with token");
      
      stompClient.current = new Client({
        webSocketFactory: () => new SockJS(`http://localhost:8080/ws/lobby-manager?token=${token}`),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        heartbeatIncoming: 0,
        heartbeatOutgoing: 0,
        reconnectDelay: 5000,
        onConnect: () => {
          console.log("STOMP connection established");
          setConnected(true);
          
          if (lobbyCode) {
            subscribeLobby(lobbyCode);
          }
          
          // Subscribe to invite results
          subscribeToInviteResults();
          
          setLoading(false);
        },
        onStompError: (frame) => {
          console.error("STOMP connection error:", frame.headers["message"], frame.body);
          onError?.(frame.headers["message"] || "Connection error");
          setConnected(false);
          setLoading(false);
        },
        onDisconnect: () => {
          console.log("STOMP disconnected");
          setConnected(false);
          setLoading(false);
        },
      });

      stompClient.current.activate();
    } catch (error) {
      console.error("Error initializing WebSocket connection:", error);
      onError?.(error instanceof Error ? error.message : "Unknown connection error");
      setLoading(false);
    }
  }, [token, lobbyCode, onError]);

  // Clean up subscriptions and connection on unmount
  useEffect(() => {
    return () => {
      // Unsubscribe from all topics
      subscriptions.current.forEach(subscription => {
        subscription.unsubscribe();
      });
      
      // Disconnect client
      if (stompClient.current && stompClient.current.connected) {
        stompClient.current.deactivate();
      }
    };
  }, []);

  // Initialize connection when token changes
  useEffect(() => {
    if (token) {
      initialize();
    }
  }, [token, initialize]);

  // Handle subscribing to a lobby
  const subscribeLobby = useCallback((code: string) => {
    if (!stompClient.current || !stompClient.current.connected) {
      console.error("Cannot subscribe: STOMP client not connected");
      return;
    }

    console.log(`Subscribing to lobby updates for code: ${code}`);

    // Subscribe to general lobby updates
    if (!subscriptions.current.has(`/topic/lobby/${code}`)) {
      const sub1 = stompClient.current.subscribe(`/topic/lobby/${code}`, (message: IMessage) => {
        try {
          const data = JSON.parse(message.body) as WebSocketMessage;
          console.log(`Received lobby update: ${data.type}`, data.payload);
          
          if (data.type === "UPDATE_SUCCESS") {
            setLobbyInfo(data.payload as LobbyInfo);
            onLobbyUpdate?.(data.payload as LobbyInfo);
          } else if (data.type === "LOBBY_DISBANDED") {
            onLobbyDisbanded?.();
          }
        } catch (error) {
          console.error("Error processing lobby update:", error);
        }
      });
      
      subscriptions.current.set(`/topic/lobby/${code}`, {
        id: sub1.id,
        unsubscribe: () => sub1.unsubscribe()
      });
    }

    // Subscribe to user-specific updates (joins/leaves)
    if (!subscriptions.current.has(`/topic/lobby/${code}/users`)) {
      const sub2 = stompClient.current.subscribe(`/topic/lobby/${code}/users`, (message: IMessage) => {
        try {
          const data = JSON.parse(message.body) as WebSocketMessage;
          console.log(`Received user update: ${data.type}`, data.payload);
          
          if (data.type === "USER_JOINED") {
            onUserJoined?.(data.payload as LobbyUser);
          } else if (data.type === "USER_LEFT") {
            onUserLeft?.((data.payload as {userId: number}).userId);
          }
        } catch (error) {
          console.error("Error processing user update:", error);
        }
      });
      
      subscriptions.current.set(`/topic/lobby/${code}/users`, {
        id: sub2.id,
        unsubscribe: () => sub2.unsubscribe()
      });
    }

    // Get initial lobby status
    stompClient.current.publish({
      destination: `/app/lobby-manager/lobby/${code}`,
      body: JSON.stringify({ type: "GET_LOBBY" }),
    });
  }, [onLobbyUpdate, onUserJoined, onUserLeft, onLobbyDisbanded]);

  // Subscribe to invite results
  const subscribeToInviteResults = useCallback(() => {
    if (!stompClient.current || !stompClient.current.connected) {
      return;
    }
    
    if (!subscriptions.current.has('/user/topic/lobby-manager/invite/result')) {
      const sub = stompClient.current.subscribe('/user/topic/lobby-manager/invite/result', (msg: IMessage) => {
        try {
          const data = JSON.parse(msg.body) as WebSocketMessage;
          console.log(`Received invite result: ${data.type}`, data.payload);
          
          if (data.type === "INVITE_SENT") {
            message.success(`Invitation sent to ${(data.payload as { recipient: string }).recipient}`);
          } else if (data.type === "INVITE_ERROR") {
            message.error((data.payload as { message?: string }).message || "Failed to send invitation");
          }
          
          onInviteResult?.(data);
        } catch (error) {
          console.error("Error processing invite result:", error);
        }
      });
      
      subscriptions.current.set('/user/topic/lobby-manager/invite/result', {
        id: sub.id,
        unsubscribe: () => sub.unsubscribe()
      });
    }
  }, [onInviteResult]);

  // Send an invite to another user
  const inviteUser = useCallback((username: string) => {
    if (!stompClient.current || !stompClient.current.connected) {
      onError?.("Not connected to the server");
      return false;
    }
    
    try {
      stompClient.current.publish({
        destination: "/app/lobby-manager/invite",
        body: JSON.stringify({
          type: "INVITE",
          payload: { toUsername: username }
        }),
      });
      return true;
    } catch (error) {
      console.error("Error sending invite:", error);
      onError?.(error instanceof Error ? error.message : "Failed to send invite");
      return false;
    }
  }, [onError]);

  // Update lobby settings
  const updateLobby = useCallback((settings: {maxPlayers?: number, playersPerTeam?: number}) => {
    if (!stompClient.current || !stompClient.current.connected || !lobbyCode) {
      onError?.("Not connected to the server");
      return false;
    }
    
    try {
      stompClient.current.publish({
        destination: `/app/lobby/${lobbyCode}/update`,
        body: JSON.stringify({
          type: "UPDATE",
          payload: settings
        }),
      });
      return true;
    } catch (error) {
      console.error("Error updating lobby:", error);
      onError?.(error instanceof Error ? error.message : "Failed to update lobby");
      return false;
    }
  }, [lobbyCode, onError]);

  // Leave the lobby
  const leaveLobby = useCallback(() => {
    if (!stompClient.current || !stompClient.current.connected || !lobbyCode) {
      return false;
    }
    
    try {
      stompClient.current.publish({
        destination: `/app/lobby/${lobbyCode}/leave`,
        body: JSON.stringify({
          type: "LEAVE",
          payload: {}
        }),
      });
      return true;
    } catch (error) {
      console.error("Error leaving lobby:", error);
      return false;
    }
  }, [lobbyCode]);

  return {
    connected,
    loading,
    lobbyInfo,
    inviteUser,
    updateLobby,
    leaveLobby
  };
};