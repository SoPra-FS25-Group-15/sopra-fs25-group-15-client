"use client";

import Notification, { NotificationProps } from "@/components/general/notification";
import PublicUserProfile from "@/components/general/publicUserProfile";
import UserCard from "@/components/general/usercard";
import { useGlobalUser } from "@/contexts/globalUser";
import { useApi } from "@/hooks/useApi";
import { Friend, FriendRequest } from "@/types/friends";
import { green, red } from "@ant-design/colors";
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";
import { Button, Card, Flex, Form, Input, List, Modal, Segmented, Tabs, TabsProps, Tooltip } from "antd";
import React, { useCallback, useEffect, useState } from "react";

const FriendManagement: React.FC = () => {
  const apiService = useApi();

  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [hover, setHover] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<string>("Friends");
  const [showInviteForm, setShowInviteForm] = useState<boolean>(false);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);

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
    maxWidth: 450,
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
      console.log("Friends:", response);
      setFriends(response);
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to load friends list.",
        onClose: () => setNotification(null),
      });
    }
  }, [apiService, getAuthHeaders]);

  const fetchRequests = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const allRequests = await apiService.get<FriendRequest[]>("/friends/all-requests", { headers });
      console.log("Requests:", allRequests);
      setFriendRequests(allRequests);
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to load friend requests.",
        onClose: () => setNotification(null),
      });
    }
  }, [apiService, getAuthHeaders]);

  const handleAcceptRequest = async (requestId: number) => {
    try {
      const headers = getAuthHeaders();
      await apiService.put(`/friends/requests/${requestId}`, { action: "accept" }, { headers });
      setNotification({
        type: "success",
        message: "Friend request accepted successfully.",
        onClose: () => setNotification(null),
      });
      fetchFriends();
      fetchRequests();
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to accept friend request.",
        onClose: () => setNotification(null),
      });
    }
  };

  const handleDeclineRequest = async (requestId: number) => {
    try {
      const headers = getAuthHeaders();
      await apiService.post(`/friends/requests/${requestId}`, { action: "deny" }, { headers });
      setNotification({
        type: "success",
        message: "Friend request declined successfully.",
        onClose: () => setNotification(null),
      });
      fetchRequests();
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to decline friend request.",
        onClose: () => setNotification(null),
      });
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    try {
      const headers = getAuthHeaders();
      // The DELETE endpoint returns 204 No Content, so response might be null.
      await apiService.delete(`/friends/requests/${requestId}`, { headers });
      setNotification({
        type: "success",
        message: "Outgoing friend request canceled successfully.",
        onClose: () => setNotification(null),
      });
      fetchRequests();
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to cancel friend request.",
        onClose: () => setNotification(null),
      });
    }
  };

  const handleRemoveFriend = async (friendId: number) => {
    try {
      const headers = getAuthHeaders();
      await apiService.delete(`/friends/${friendId}`, { headers });
      setNotification({
        type: "success",
        message: "Friend removed successfully.",
        onClose: () => setNotification(null),
      });
      fetchFriends();
      fetchRequests();
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
      fetchRequests();
    }
  }, [fetchRequests, fetchFriends, user]);

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
                    onClick={() => setSelectedProfileId(friend.friendId)}
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
            bordered={false}
            split={false}
            grid={{ gutter: 2, column: 1 }}
            dataSource={friends}
            locale={{ emptyText: "No friends found." }}
            renderItem={(friend) => (
              <List.Item>
                <UserCard
                  username={friend.username}
                  showPointer
                  onClick={() => setSelectedProfileId(friend.friendId)}
                  subviewRight={
                    <Button
                      key="remove"
                      type="text"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFriend(friend.friendId);
                      }}
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
          extra={<Button type="text" icon={<ReloadOutlined />} onClick={() => fetchRequests()}></Button>}
        >
          <List
            bordered={false}
            split={false}
            grid={{ gutter: 2, column: 1 }}
            dataSource={friendRequests.filter(
              (request) => request.recipientUsername === user.username && request.status === "pending"
            )}
            locale={{ emptyText: "No friend requests in your inbox." }}
            renderItem={(request) => (
              <List.Item>
                <UserCard
                  username={request.senderUsername}
                  showPointer
                  onClick={() => setSelectedProfileId(request.sender)}
                  subviewRight={
                    <Flex gap={8} align="center">
                      <Button
                        key="accept"
                        type="text"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptRequest(request.requestId);
                        }}
                        icon={<CheckOutlined style={{ color: green[5], fontSize: "16px" }} />}
                      />
                      <Button
                        key="decline"
                        type="text"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeclineRequest(request.requestId);
                        }}
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
          extra={<Button type="text" icon={<ReloadOutlined />} onClick={() => fetchRequests()}></Button>}
        >
          <List
            bordered={false}
            split={false}
            grid={{ gutter: 2, column: 1 }}
            dataSource={friendRequests.filter(
              (request) => request.senderUsername === user.username && request.status === "pending"
            )}
            locale={{ emptyText: "No pending outgoing friend requests." }}
            renderItem={(request) => (
              <List.Item>
                <UserCard
                  username={request.recipientUsername}
                  showPointer
                  onClick={() => setSelectedProfileId(request.recipient)}
                  subviewRight={
                    <Flex gap={8} align="center">
                      <Button
                        key="cancel"
                        type="text"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelRequest(request.requestId);
                        }}
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
      <PublicUserProfileModal
        open={selectedProfileId !== null}
        setOpen={(open) => {
          if (!open) {
            setSelectedProfileId(null);
          }
        }}
        userId={selectedProfileId}
      />
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

// PublicUserProfileModal component
// This component displays a modal to view a public user profile
const PublicUserProfileModal: React.FC<{
  open: boolean;
  setOpen: (open: boolean) => void;
  userId: number | null;
}> = ({ open, setOpen, userId }) => {
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Modal
      width={"50vw"}
      centered
      title="Profile"
      open={open}
      onOk={handleClose}
      onCancel={handleClose}
      okText="Close"
      maskClosable
    >
      <div style={{ maxHeight: "80vh", overflowY: "auto" }}>
        {userId ? <PublicUserProfile userId={userId} /> : <p>No user selected.</p>}
      </div>
    </Modal>
  );
};

// AddFriendModal component
// This component displays a modal for adding a friend
interface AddFriendModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  headers: HeadersInit | undefined;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({ open, setOpen, headers }) => {
  const apiService = useApi();
  const [hasValue, setHasValue] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [form] = Form.useForm();
  const [notification, setNotification] = useState<NotificationProps | null>(null);

  const handleSendRequest = async (query: string) => {
    try {
      setIsSending(true);
      const response = await apiService.post<{
        message: string;
      }>("/friends/request", { query: query }, { headers });
      setNotification({
        type: "success",
        message: response.message || "Friend request sent successfully.",
        onClose: () => setNotification(null),
      });
      form.resetFields();
      setHasValue(false);
      setIsSending(false);
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
      okButtonProps={{
        disabled: !hasValue,
        loading: isSending,
      }}
    >
      <Flex justify="center" gap={8} vertical>
        {notification && <Notification {...notification} />}
        <Form form={form} layout="vertical" autoComplete="off">
          <Form.Item name="target" label="Send a friend request by entering their email or username">
            <Input placeholder="email or username" onChange={(e) => setHasValue(e.target.value.trim().length > 0)} />
          </Form.Item>
        </Form>
      </Flex>
    </Modal>
  );
};
