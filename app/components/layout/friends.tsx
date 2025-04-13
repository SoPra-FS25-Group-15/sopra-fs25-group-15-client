"use client";

import "@ant-design/v5-patch-for-react-19";
import React, { useState, useEffect, useCallback } from "react";
import { Button, Card, Form, Input, List } from "antd";
import { CheckOutlined, CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { useApi } from "@/hooks/useApi";
import Notification, { NotificationProps } from "@/components/general/notification";
import UserCard from "@/components/general/usercard";
import PublicUserProfile from "@/components/general/publicProfile";

interface Friend {
  userId: string;
  username: string;
  profilePicture: string;
}

interface FriendRequest {
  requestId: string;
  fromUserId: string;
  username: string;
  email?: string;
  profilePicture: string;
  isIncoming: boolean;
}

interface PublicProfile {
  userId: string;
  username: string;
  profilePicture: string;
}

// Helper function to load the token from localStorage when available.
const loadToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  let token = localStorage.getItem("token");
  if (!token) {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        token = parsedUser.token;
      } catch (err) {
        console.error("Failed to parse user from localStorage:", err);
      }
    }
  }
  return token;
};

const FriendManagement: React.FC = () => {
  const apiService = useApi();

  // Track the authentication token.
  const [authToken, setAuthToken] = useState<string | null>(loadToken());
  const [loadingToken, setLoadingToken] = useState<boolean>(true);

  // Now: collapsed === false means minimized view is shown;
  // collapsed === true means extended view is shown.
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [showInviteForm, setShowInviteForm] = useState<boolean>(false);
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);

  const [form] = Form.useForm();
  const [notification, setNotification] = useState<NotificationProps | null>(null);

  const containerStyle: React.CSSProperties = {
    position: "fixed",
    right: 8,
    top: 98,
    maxWidth: 500,
    width: "100%",
    zIndex: 1000,
    background: "#222",
    border: "1px solid #444",
    borderRadius: 8,
    padding: 16,
  };

  // Effect to load token on mount and listen for storage changes.
  useEffect(() => {
    const updateToken = () => {
      const token = loadToken();
      setAuthToken(token);
    };

    updateToken();
    setLoadingToken(false);

    if (typeof window !== "undefined") {
      window.addEventListener("storage", updateToken);
      return () => window.removeEventListener("storage", updateToken);
    }
  }, []);

  // Also poll localStorage every 5 seconds to catch changes in the same tab.
  useEffect(() => {
    const intervalId = setInterval(() => {
      const token = loadToken();
      if (token !== authToken) {
        setAuthToken(token);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [authToken]);

  // When token changes, clear any previously stored friend data so that the wrong user's data is not displayed.
  useEffect(() => {
    if (!authToken) {
      setFriends([]);
      setFriendRequests([]);
      setSentRequests([]);
      return;
    }
    // Clear old data
    setFriends([]);
    setFriendRequests([]);
    setSentRequests([]);
    // Fetch new data for the current token
    fetchFriends();
    fetchFriendRequests();
    fetchSentRequests();
  }, [authToken]);

  // Force extended view (collapsed = true) whenever there is an incoming or sent friend request.
  useEffect(() => {
    if (friendRequests.length > 0 || sentRequests.length > 0) {
      setCollapsed(true);
    }
  }, [friendRequests, sentRequests]);

  // Build headers for API calls.
  const getAuthHeaders = useCallback(() => {
    return {
      Authorization: authToken || "",
      "Content-Type": "application/json",
    };
  }, [authToken]);

  const fetchFriends = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await apiService.get<Friend[]>("/friends", { headers });
      setFriends(response);
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to load friends list.",
        onClose: () => setNotification(null),
      });
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await apiService.get<FriendRequest[]>("/friends/requests", { headers });
      setFriendRequests(response);
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to load friend requests.",
        onClose: () => setNotification(null),
      });
    }
  };

  const fetchSentRequests = async () => {
    try {
      const headers = getAuthHeaders();
      const allRequests = await apiService.get<FriendRequest[]>("/friends/all-requests", { headers });
      const sent = allRequests.filter(request => !request.isIncoming);
      setSentRequests(sent);
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to load sent friend requests.",
        onClose: () => setNotification(null),
      });
    }
  };

  const handleSendRequest = async (values: { target: string }) => {
    try {
      const headers = getAuthHeaders();
      // Step 1: Search for the user by email (or username).
      const searchResponse = await apiService.post<{
        userid: number;
        username: string;
        email: string;
      }>("/users/search", { email: values.target }, { headers });

      const userId = searchResponse.userid;
      // Step 2: Send the friend request using the user ID.
      const response = await apiService.post<{
        message: string;
        requestId: string;
      }>("/friends/request", { recipient: userId }, { headers });

      setNotification({
        type: "success",
        message: response.message,
        onClose: () => setNotification(null),
      });
      form.resetFields();
      setShowInviteForm(false);
      fetchFriendRequests();
      fetchSentRequests();
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to send friend request.",
        onClose: () => setNotification(null),
      });
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const headers = getAuthHeaders();
      const response = await apiService.put<{ message: string; friend: Friend }>(
        `/friends/requests/${requestId}`,
        { action: "accept" },
        { headers }
      );
      setNotification({
        type: "success",
        message: response.message,
        onClose: () => setNotification(null),
      });
      fetchFriends();
      fetchFriendRequests();
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to accept friend request.",
        onClose: () => setNotification(null),
      });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const headers = getAuthHeaders();
      const response = await apiService.post<{ message: string }>(
        `/friends/requests/${requestId}`,
        {},
        { headers }
      );
      setNotification({
        type: "success",
        message: response.message,
        onClose: () => setNotification(null),
      });
      fetchFriendRequests();
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to decline friend request.",
        onClose: () => setNotification(null),
      });
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const headers = getAuthHeaders();
      const response = await apiService.delete<{ message: string }>(
        `/friends/requests/${requestId}`,
        { headers }
      );
      setNotification({
        type: "success",
        message: response?.message || "Friend request canceled successfully.",
        onClose: () => setNotification(null),
      });
      fetchSentRequests();
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to cancel friend request.",
        onClose: () => setNotification(null),
      });
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      const headers = getAuthHeaders();
      const response = await apiService.delete<{ message: string }>(`/friends/${friendId}`, { headers });
      setNotification({
        type: "success",
        message: response?.message || "Friend removed successfully.",
        onClose: () => setNotification(null),
      });
      fetchFriends();
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to remove friend.",
        onClose: () => setNotification(null),
      });
    }
  };

  // ======================
  //   Render Logic
  // ======================

  // If we're still loading the token from storage, return nothing (or a spinner).
  if (loadingToken) {
    return null;
  }

  // If no token is present, hide this component entirely (return nothing).
  if (!authToken) {
    return null;
  }

  // Main return once we do have a token:
  return (
    <>
      {notification && <Notification {...notification} />}

      {/* Collapsed == false => minimized view */}
      {!collapsed ? (
        <div style={{ ...containerStyle, width: 80, padding: 8, textAlign: "center" }}>
          <div style={{ marginBottom: 8 }}>
            {friends.map((friend) => (
              <div
                key={friend.userId}
                style={{ marginBottom: 8, cursor: "pointer" }}
                onClick={() =>
                  setSelectedProfile({
                    userId: friend.userId,
                    username: friend.username,
                    profilePicture: friend.profilePicture,
                  })
                }
              >
                <UserCard username={friend.username} showPointer />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 8 }}>
            <Button
              type="text"
              icon={<PlusOutlined style={{ fontSize: "16px" }} />}
              onClick={() => {
                setCollapsed(true);
                setShowInviteForm(true);
              }}
            />
          </div>
          <div style={{ cursor: "pointer", fontWeight: "bold" }} onClick={() => setCollapsed(true)}>
            &laquo;
          </div>
        </div>
      ) : selectedProfile ? (
        // Public profile view
        <div style={containerStyle}>
          <PublicUserProfile userId={selectedProfile.userId} onBack={() => setSelectedProfile(null)} />
        </div>
      ) : showInviteForm ? (
        // Invite Friend form
        <div style={containerStyle}>
          <div style={{ marginBottom: 16 }}>
            <span
              style={{ cursor: "pointer", fontWeight: "bold", marginRight: 8 }}
              onClick={() => setShowInviteForm(false)}
            >
              &#8592;
            </span>
            Add New Friend
          </div>
          <Card>
            <Form form={form} layout="vertical" onFinish={handleSendRequest}>
              <Form.Item
                name="target"
                label="Friend's Email or Username"
                rules={[{ required: true, message: "Please input your friend's email or username!" }]}
              >
                <Input placeholder="Enter your friend's email or username" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Send Invitation
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      ) : (
        // Extended (full) main view
        <div style={containerStyle}>
          <div style={{ marginBottom: 16, textAlign: "right" }}>
            <span style={{ cursor: "pointer", fontWeight: "bold" }} onClick={() => setCollapsed(false)}>
              &raquo;
            </span>
          </div>
          <div style={{ marginBottom: 16, textAlign: "right" }}>
            <Button type="default" onClick={() => setShowInviteForm(true)}>
              Add Friend
            </Button>
          </div>
          <Card title="Friend Requests">
            <List
              dataSource={friendRequests}
              locale={{ emptyText: "No friend requests available." }}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      key="accept"
                      type="text"
                      onClick={() => handleAcceptRequest(item.requestId)}
                      icon={<CheckOutlined style={{ color: "green", fontSize: "16px" }} />}
                    />,
                    <Button
                      key="decline"
                      type="text"
                      onClick={() => handleDeclineRequest(item.requestId)}
                      icon={<CloseOutlined style={{ color: "red", fontSize: "16px" }} />}
                    />,
                  ]}
                >
                  <UserCard
                    username={item.username}
                    showPointer
                    onClick={() =>
                      setSelectedProfile({
                        userId: item.fromUserId,
                        username: item.username,
                        profilePicture: item.profilePicture,
                      })
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
          <Card title="Sent Friend Requests" style={{ marginTop: 16 }}>
            <List
              dataSource={sentRequests}
              locale={{ emptyText: "No sent friend requests." }}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      key="cancel"
                      type="text"
                      onClick={() => handleCancelRequest(item.requestId)}
                      icon={<CloseOutlined style={{ color: "grey", fontSize: "16px" }} />}
                    />,
                  ]}
                >
                  <UserCard
                    username={item.username}
                    showPointer
                    onClick={() =>
                      setSelectedProfile({
                        userId: item.fromUserId,
                        username: item.username,
                        profilePicture: item.profilePicture,
                      })
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
          <Card title="Friends List" style={{ marginTop: 16 }}>
            <List
              dataSource={friends}
              locale={{ emptyText: "No friends found." }}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      key="remove"
                      type="text"
                      onClick={() => handleRemoveFriend(item.userId)}
                      icon={<CloseOutlined style={{ color: "grey", fontSize: "16px" }} />}
                    />,
                  ]}
                >
                  <UserCard
                    username={item.username}
                    showPointer
                    onClick={() =>
                      setSelectedProfile({
                        userId: item.userId,
                        username: item.username,
                        profilePicture: item.profilePicture,
                      })
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </div>
      )}
    </>
  );
};

export default FriendManagement;
