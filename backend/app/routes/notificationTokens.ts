import { Router } from 'express';
import { Database } from '../database';
import { getUser, userRoleIn, userIsAssociatedWithCourse } from '../lib/auth';
import { HelpResponse, schemaErrorHandler } from '../lib/responses';
import { shouldStream, createStream } from '../lib/stream';
import { NotificationTokenController } from '../controllers/notificationTokens';

export const notificationTokensRouter = Router();

notificationTokensRouter.get('/departments/:departmentSlug/courses/:courseSlug/trashcans/notificationtokens/:deviceID', NotificationTokenController.getUsersNotificationTokenValidator, schemaErrorHandler, NotificationTokenController.getUsersNotificationToken);
notificationTokensRouter.post('/departments/:departmentSlug/courses/:courseSlug/trashcans/notificationtokens', NotificationTokenController.insertNotificationTokenValidator, schemaErrorHandler, NotificationTokenController.insertNotificationToken);
notificationTokensRouter.delete('/departments/:departmentSlug/courses/:courseSlug/trashcans/notificationtokens/:deviceID', NotificationTokenController.deleteNotificationTokenValidator, schemaErrorHandler, NotificationTokenController.deleteNotificationToken);