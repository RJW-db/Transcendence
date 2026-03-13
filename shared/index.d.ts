export interface ActionResponse {
  success: boolean;
  error?: string;
}

export interface UserData {
  ID: number;
  alias: string;
  online: boolean;
}

export interface OutgoingDirectMessage {
  receiverAlias: string;
  message: string;
}

export interface IncomingDirectMessage {
  messageID: number;
  sender: UserData;
  dateTime: Date;
  message: string;
}

export interface OutgoingFriendRequest {
  receiverAlias: string;
}

export interface IncomingFriendRequest {
  requestID: number;
  sender: UserData;
  sentAt: Date;
}
