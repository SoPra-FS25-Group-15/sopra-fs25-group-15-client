"use client";

import "@ant-design/v5-patch-for-react-19";
import React, { useState, useEffect } from "react";
import { Button, Card, Form, Input, List } from "antd";
import { CheckOutlined, CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { useApi } from "@/hooks/useApi";
import Notification, { NotificationProps } from "@/components/general/notification";
import UserCard from "@/components/general/usercard";
import PublicUserProfile from "@/components/general/publicProfile";
import { useGlobalUser } from "@/contexts/globalUser";

interface Friend {
  userId: string;
  username: string;
  profilePicture: string;
}

interface FriendRequest {
  requestId: string;
  senderUsername: string;
  recipientUsername: string;
  email?: string;
  profilePicture: string;
  incoming: boolean;
}

interface PublicProfile {
  username: string;
}

const FriendManagement: React.FC = () => {
  const apiService = useApi();

  // Always call hooks in the same order.
  const [loadingToken, setLoadingToken] = useState<boolean>(true);

  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [showInviteForm, setShowInviteForm] = useState<boolean>(false);
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);

  const [form] = Form.useForm();
  const [notification, setNotification] = useState<NotificationProps | null>(null);

  const { user } = useGlobalUser();

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

  useEffect(() => {
    const userData = localStorage.getItem("user");
    setLoadingToken(false);
    if (!userData) {
      return;
    }
  }, []);

  // Fetch data once the token is available.
  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
    fetchSentRequests();
  }, []);

  // Build headers including Content-Type for JSON.
  const getAuthHeaders = () => {
    if (user) {
      console.log("Using token for API calls:", user.token);
      return {
        Authorization: user.token || "",
        "Content-Type": "application/json",
      };
    }
  };

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
      console.log("Friend requests:", response);
      setFriendRequests(response);
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to load friend requests.",
        onClose: () => setNotification(null),
      });
    }
  };

  // Call /friends/all-requests and filter for outgoing (sent) friend requests.
  const fetchSentRequests = async () => {
    try {
      const headers = getAuthHeaders();
      const allRequests = await apiService.get<FriendRequest[]>("/friends/all-requests", { headers });
      console.log("All requests:", allRequests);
      const sent = allRequests.filter((request) => !request.incoming);
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
      // Step 1: Search for the user by email.
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
      const response = await apiService.post<{ message: string }>(`/friends/requests/${requestId}`, {}, { headers });
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

  // Updated handleCancelRequest: use a default message if response is null.
  const handleCancelRequest = async (requestId: string) => {
    try {
      const headers = getAuthHeaders();
      // The DELETE endpoint returns 204 No Content, so response might be null.
      const response = await apiService.delete<{ message: string }>(`/friends/requests/${requestId}`, { headers });
      setNotification({
        type: "success",
        message: (response && response.message) || "Friend request canceled successfully.",
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
        message: (response && response.message) || "Friend removed successfully.",
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

  if (loadingToken) {
    return <div>Loading...</div>;
  }

  if (user) {
    return (
      <>
        {collapsed ? (
          // Collapsed view.
          <div style={{ ...containerStyle, width: 80, padding: 8, textAlign: "center" }}>
            <div style={{ marginBottom: 8 }}>
              {friends.map((friend) => (
                <div
                  key={friend.userId}
                  style={{ marginBottom: 8, cursor: "pointer" }}
                  onClick={() =>
                    setSelectedProfile({
                      username: friend.username,
                    })
                  }
                >
                  <UserCard showPointer />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 8 }}>
              <Button
                type="text"
                icon={<PlusOutlined style={{ fontSize: "16px" }} />}
                onClick={() => {
                  setCollapsed(false);
                  setShowInviteForm(true);
                }}
              />
            </div>
            <div style={{ cursor: "pointer", fontWeight: "bold" }} onClick={() => setCollapsed(false)}>
              &laquo;
            </div>
          </div>
        ) : selectedProfile ? (
          // Public profile view.
          <div style={containerStyle}>
            {notification && <Notification {...notification} />}
            <PublicUserProfile userId={selectedProfile.username} onBack={() => setSelectedProfile(null)} />
          </div>
        ) : showInviteForm ? (
          // Invite Friend form.
          <div style={containerStyle}>
            {notification && <Notification {...notification} />}
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
          // Expanded main view.
          <div style={containerStyle}>
            {notification && <Notification {...notification} />}
            <div style={{ marginBottom: 16, textAlign: "right" }}>
              <span style={{ cursor: "pointer", fontWeight: "bold" }} onClick={() => setCollapsed(true)}>
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
                      username={item.senderUsername}
                      showPointer
                      onClick={() =>
                        setSelectedProfile({
                          username: item.senderUsername,
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
                      username={item.recipientUsername}
                      rank={item.email}
                      showPointer
                      onClick={() =>
                        setSelectedProfile({
                          username: item.recipientUsername,
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
                          username: item.username,
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
  }
};

export default FriendManagement;
