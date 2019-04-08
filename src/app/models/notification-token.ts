import { Course } from './course';

export class NotificationToken {
  id: string;
  token: string;
  deviceId: number;
  userId: string;
  courseSlug: string;

  constructor(id: string, token: string, deviceId: number, user: {uid: string}, course: Course) {
    this.id = id;
    this.deviceId = deviceId;
    this.userId = user.uid;
    this.courseSlug = course.slug
  }
}
