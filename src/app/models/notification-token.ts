import { Course } from './course';

export const NotificationTokenPath = 'notificationTokens';

export class NotificationToken {
  id: string;
  token: string;
  deviceID: string;
  userID: string;
  courseID: string;

  constructor(id: string, token: string, deviceID: string, user: {uid: string}, course: Course) {
    this.id = id;
    this.token = token;
    this.deviceID = deviceID;
    this.userID = user.uid;
    this.courseID = course.id;
  }
}
