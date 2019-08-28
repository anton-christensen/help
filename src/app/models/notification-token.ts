export const NotificationTokenPath = 'notificationTokens';

export interface NotificationToken {
  id: string;
  token: string;
  deviceID: string;
  userID: string;
  courseID: string;
}
