import { PublicUser } from "./user";

export interface FriendManagement {
  friends: [PublicUser][];
  requests: {
    out: [PublicUser][];
    in: [PublicUser][];
  };
}
