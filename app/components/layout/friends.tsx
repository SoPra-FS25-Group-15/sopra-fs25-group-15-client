"use client";

import Notification, { NotificationProps } from "@/components/general/notification";
import PublicUserProfile from "@/components/general/publicProfile";
import UserCard from "@/components/general/usercard";
import { useGlobalUser } from "@/contexts/globalUser";
import { useApi } from "@/hooks/useApi";
import { green, red } from "@ant-design/colors";
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";
import { Button, Card, Flex, Form, Input, List, Modal, Segmented, Tabs, TabsProps, Tooltip } from "antd";
import React, { useEffect, useState, useCallback } from "react";

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

  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [hover, setHover] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<string>("Friends");
  const [showInviteForm, setShowInviteForm] = useState<boolean>(false);
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);

  const [notification, setNotification] = useState<NotificationProps | null>(null);

  const { user } = useGlobalUser();

  const getAuthHeaders = useCallback((): HeadersInit | undefined => {
    if (user) {
      return {
        Authorization: user.token,
        "Content-Type": "application/json",
      } as HeadersInit;
    }
  }, [user]);

  const containerStyle: React.CSSProperties = {
    position: "fixed",
    right: 8,
    top: 98,
    width: "100%",
    zIndex: 800,
  };

  const componentStyle: React.CSSProperties = {
    overflowY: "auto",
    maxWidth: 350,
    width: "100%",
    maxHeight: "calc(100vh - 90px - 2*8px)",
    background: "#222",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 5px 10px rgba(0, 0, 0, 0.2)",
    borderRadius: 8,
    padding: 12,
    zIndex: 1000,
  };

  // API calls for fetching friends, incoming requests, and sent requests
  // These functions are memoized with useCallback() to avoid unnecessary re-renders
  const fetchFriends = useCallback(async () => {
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
  }, [apiService, getAuthHeaders]);

  const fetchIncomingRequests = useCallback(async () => {
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
  }, [apiService, getAuthHeaders]);

  const fetchSentRequests = useCallback(async () => {
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
  }, [apiService, getAuthHeaders]);

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
      fetchIncomingRequests();
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
      fetchIncomingRequests();
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

  const handleHover = () => {
    setHover(true);
  };
  const handleLeave = () => {
    setHover(false);
  };

  // Fetch data once the user object is available.
  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchIncomingRequests();
      fetchSentRequests();
    }
  }, [fetchIncomingRequests, fetchFriends, fetchSentRequests, user]);

  if (!user) {
    return null;
  }

  // Collapsed view
  if (collapsed) {
    return (
      <>
        <AddFriendModal open={showInviteForm} setOpen={setShowInviteForm} headers={getAuthHeaders()} />
        <Flex
          onPointerEnter={handleHover}
          onPointerLeave={handleLeave}
          gap={8}
          align="center"
          justify="flex-end"
          style={{ ...containerStyle, width: "fit-content" }}
        >
          <Flex align="center" justify="center" style={{ height: "100%" }}>
            <Button
              onClick={() => {
                setCollapsed(false);
                setHover(false);
              }}
              type="text"
              style={{
                translate: hover ? "unset" : "40px",
                background: "#fff",
                color: "#000",
                width: 20,
                borderRadius: "100%",
                boxShadow: "0 5px 10px rgba(0, 0, 0, 0.2)",
                zIndex: 900,
              }}
            >
              <ArrowLeftOutlined style={{ fontSize: "16px" }} />
            </Button>
          </Flex>
          <Flex
            vertical
            align="center"
            justify="center"
            gap={16}
            style={{ ...componentStyle, width: 80, minHeight: 80 }}
          >
            <Flex vertical gap={8} justify="center" align="center" style={{ height: "100%" }}>
              {friends.map((friend, index) => (
                <Tooltip key={index} title={friend.username} placement="left">
                  <UserCard
                    borderless
                    iconOnly
                    showPointer
                    username={friend.username}
                    onClick={() => console.log(friend.username)}
                  />
                </Tooltip>
              ))}
              <Tooltip title="Add friends" placement="left" mouseEnterDelay={1}>
                <Button
                  type="text"
                  icon={<PlusOutlined style={{ fontSize: "16px" }} />}
                  style={{ height: 48, width: 48, border: "1px dotted rgba(255, 255, 255, 0.5)", borderRadius: "100%" }}
                  onClick={() => {
                    setShowInviteForm(true);
                  }}
                />
              </Tooltip>
            </Flex>
          </Flex>
        </Flex>
      </>
    );
  }

  // Public profile view
  if (selectedProfile) {
    return (
      <div style={containerStyle}>
        {notification && <Notification {...notification} />}
        <PublicUserProfile userId={selectedProfile.username} onBack={() => setSelectedProfile(null)} />
      </div>
    );
  }

  // Expanded main view
  const friendTabs: TabsProps["items"] = [
    {
      key: "Friends",
      label: undefined,
      children: (
        <Card
          title="Friends List"
          extra={
            <Flex gap={8} align="center">
              <Button type="text" icon={<ReloadOutlined />} onClick={() => fetchFriends()}></Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowInviteForm(true)}>
                Add
              </Button>
            </Flex>
          }
        >
          <List
            dataSource={friends}
            locale={{ emptyText: "No friends found." }}
            renderItem={(item) => (
              <List.Item>
                <UserCard
                  username={item.username}
                  showPointer
                  onClick={() =>
                    setSelectedProfile({
                      username: item.username,
                    })
                  }
                  subviewRight={
                    <Button
                      key="remove"
                      type="text"
                      onClick={() => handleRemoveFriend(item.userId)}
                      icon={<CloseOutlined style={{ color: "grey", fontSize: "16px" }} />}
                    />
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      ),
    },
    {
      key: "Incoming",
      label: undefined,
      children: (
        <Card
          title="Incoming Friend Requests"
          extra={<Button type="text" icon={<ReloadOutlined />} onClick={() => fetchIncomingRequests()}></Button>}
        >
          <List
            dataSource={friendRequests}
            locale={{ emptyText: "No friend requests in your inbox." }}
            renderItem={(item) => (
              <List.Item>
                <UserCard
                  username={item.senderUsername}
                  showPointer
                  onClick={() =>
                    setSelectedProfile({
                      username: item.senderUsername,
                    })
                  }
                  subviewRight={
                    <Flex gap={8} align="center">
                      <Button
                        key="accept"
                        type="text"
                        onClick={() => handleAcceptRequest(item.requestId)}
                        icon={<CheckOutlined style={{ color: green[5], fontSize: "16px" }} />}
                      />

                      <Button
                        key="decline"
                        type="text"
                        onClick={() => handleDeclineRequest(item.requestId)}
                        icon={<CloseOutlined style={{ color: red[5], fontSize: "16px" }} />}
                      />
                    </Flex>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      ),
    },
    {
      key: "Outgoing",
      label: undefined,
      children: (
        <Card
          title="Sent Friend Requests"
          extra={<Button type="text" icon={<ReloadOutlined />} onClick={() => fetchSentRequests()}></Button>}
        >
          <List
            dataSource={sentRequests}
            locale={{ emptyText: "No pending outgoing friend requests." }}
            renderItem={(item) => (
              <List.Item>
                <UserCard
                  username={item.recipientUsername}
                  subviewBottom={item.email}
                  showPointer
                  onClick={() =>
                    setSelectedProfile({
                      username: item.recipientUsername,
                    })
                  }
                  subviewRight={
                    <Flex gap={8} align="center">
                      <Button
                        key="cancel"
                        type="text"
                        onClick={() => handleCancelRequest(item.requestId)}
                        icon={<CloseOutlined style={{ color: "grey", fontSize: "16px" }} />}
                      />
                    </Flex>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      ),
    },
  ];

  return (
    <>
      <AddFriendModal open={showInviteForm} setOpen={setShowInviteForm} headers={getAuthHeaders()} />
      <Flex gap={8} align="center" justify="flex-end" style={{ ...containerStyle, bottom: 8 }}>
        <Button
          onClick={() => setCollapsed(true)}
          type="text"
          style={{
            background: "#fff",
            color: "#000",
            width: 20,
            borderRadius: "100%",
            boxShadow: "0 5px 10px rgba(0, 0, 0, 0.2)",
            zIndex: 900,
          }}
        >
          <CloseOutlined style={{ fontSize: "16px" }} />
        </Button>
        <Flex vertical gap={16} style={{ ...componentStyle, height: "100%" }}>
          {notification && <Notification {...notification} />}
          <Segmented
            defaultValue="Friends"
            onChange={(tabId) => {
              setActiveTab(tabId);
            }}
            block
            options={["Friends", "Incoming", "Outgoing"]}
          />
          <Tabs tabBarStyle={{ display: "none" }} items={friendTabs} activeKey={activeTab} />
        </Flex>
      </Flex>
    </>
  );
};

export default FriendManagement;

// AddFriendModal component
// This component displays a modal for adding a friend
interface AddFriendModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  headers: HeadersInit | undefined;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({ open, setOpen, headers }) => {
  const apiService = useApi();
  const [isSending, setIsSending] = useState(false);
  const [form] = Form.useForm();
  const [notification, setNotification] = useState<NotificationProps | null>(null);

  const handleSendRequest = async (query: string) => {
    try {
      const response = await apiService.post<{
        message: string;
        requestId: string;
      }>("/friends/request", { searchString: query }, { headers });
      setNotification({
        type: "success",
        message: response.message,
        onClose: () => setNotification(null),
      });
      form.resetFields();
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to send friend request.",
        onClose: () => setNotification(null),
      });
    }
  };

  const handleOk = async () => {
    setIsSending(true);
    await handleSendRequest(form.getFieldValue("target"));
    setIsSending(false);
  };

  const handleClose = () => {
    setOpen(false);
    form.resetFields();
    setNotification(null);
  };

  return (
    <Modal
      title="Add a friend"
      open={open}
      onOk={handleOk}
      onClose={handleClose}
      onCancel={handleClose}
      okText="Send"
      confirmLoading={isSending}
      maskClosable
    >
      <Flex justify="center" gap={8} vertical>
        {notification && <Notification {...notification} />}
        <Form form={form} layout="vertical" autoComplete="off">
          <Form.Item name="target" label="Send a friend request by entering their email or username">
            <Input placeholder="email or username" />
          </Form.Item>
        </Form>
      </Flex>
    </Modal>
  );
};
