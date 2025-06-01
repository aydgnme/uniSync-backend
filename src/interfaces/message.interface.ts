export interface IMessage {
  id: string;
  sender: string;
  subject: string;
  message: string;
  time: string;
  unread: boolean;
  createdAt: Date;
  updatedAt: Date;
} 