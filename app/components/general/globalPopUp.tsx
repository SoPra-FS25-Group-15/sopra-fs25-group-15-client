'use client';

import React, { useEffect } from "react";
import { Modal, Button, Typography } from "antd";
import { useWebSocket } from "@/contexts/webSocketProvider";

const { Paragraph } = Typography;

const GlobalInvitePopup: React.FC = () => {
  const { popupInvite, setPopupInvite } = useWebSocket();

  useEffect(() => {
    console.log("GlobalInvitePopup rendered with popupInvite:", popupInvite);
  }, [popupInvite]);

  const handleAccept = () => {
    // Add additional logic as needed (e.g., publish an accept message, navigate, etc.)
    setPopupInvite(null);
  };

  const handleDecline = () => {
    setPopupInvite(null);
  };

  return (
    <Modal
      title="Lobby Invitation"
      open={popupInvite !== null}
      onCancel={handleDecline}
      footer={null}
      style={{ zIndex: 2000 }}
    >
      {popupInvite && (
        <>
          <Paragraph>
            You have received an invitation from <b>{popupInvite.fromUsername}</b> to join lobby <b>{popupInvite.lobbyCode}</b>.
          </Paragraph>
          <div style={{ textAlign: "right" }}>
            <Button onClick={handleDecline} danger style={{ marginRight: 10 }}>
              Decline
            </Button>
            <Button type="primary" onClick={handleAccept}>
              Accept
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default GlobalInvitePopup;
