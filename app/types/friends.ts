export interface FriendRequest {
  requestId: number;
  status: string;
  incoming: boolean;
  sender: number;
  senderUsername: string;
  recipient: number;
  recipientUsername: string;
}

export interface Friend {
  friendId: number;
  username: string;
}
