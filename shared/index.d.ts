export interface ActionResponse {
  success: boolean;
  error?: string;
}

export interface UserData {
  id: number;
  alias: string;
  online: boolean;
}

export interface OutgoingDirectMessage {
  receiverAlias: string;
  message: string;
}

export interface IncomingDirectMessage {
  messageId: number;
  sender: UserData;
  dateTime: Date;
  message: string;
}

export interface OutgoingFriendRequest {
  receiverAlias: string;
}

export interface IncomingFriendRequest {
  requestId: number;
  sender: UserData;
  sentAt: Date;
}

export interface BlockActionRequest {
	receiverAlias: string;
}
