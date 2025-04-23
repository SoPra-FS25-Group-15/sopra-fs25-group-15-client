export interface FriendRequest {
  id: number;
  status: string;
  incoming: boolean;
  senderUsername: string;
  recipientUsername: string;
}

export interface Friend {
  id: number;
  username: string;
}
