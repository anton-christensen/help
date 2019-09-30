import * as admin from 'firebase-admin';
import { Database } from '../database';
import { ChangesOptions } from 'rethinkdb';
import { TrashCan } from '../models/trashCan';
import { NotificationToken } from '../models/notificationToken';


export class NotificationWorker {
    public static start() {
        Database.trashCans.changes({includeTypes: true}).run().then(cursor => {
            cursor.each((err, row) => {
                if(row.type == "add") {
                    NotificationWorker.onNewTrashCan(row['new_val'])
                }
            });
        });

        Database.notificationTokens.changes({includeTypes: true}).run().then(cursor => {
            cursor.each((err, row) => {
                if(row.type == "add") {
                    NotificationWorker.onNewNotificationToken(row['new_val'])
                }
                if(row.type == "remove") {
                    NotificationWorker.onDeleteNotificationToken(row['old_val'])
                }
                if(row.type == "change") {
                    NotificationWorker.onUpdatedNotificationToken(row['old_val'], row['new_val'])
                }
            });
        });
    }

    static onNewTrashCan(can: TrashCan) {
        admin.messaging().sendToTopic(`TrashCan-${can.departmentSlug}-${can.courseSlug}`, {
            notification: {
              title: `A ${can.courseSlug.toUpperCase()} student needs help!`,
              body: `Room no. ${can.room}`,
              clickAction: `https://help.aau.dk/departments/${can.departmentSlug}/courses/${can.courseSlug}`,
              icon: `https://help.aau.dk/assets/icons/icon-128x128.png`
            }
          })
    }


    // Subscribe notification tokens to trash cans from their course
    static onNewNotificationToken(notificationToken: NotificationToken) {
        return admin.messaging().subscribeToTopic(notificationToken.token, `TrashCan-${notificationToken.departmentSlug}-${notificationToken.courseSlug}`);
    }

    // Handle notification token subscriptions on updates
    static onUpdatedNotificationToken(oldNotificationToken: NotificationToken, newNotificationToken: NotificationToken) {
        return admin.messaging().unsubscribeFromTopic(oldNotificationToken.token, `TrashCan-${oldNotificationToken.departmentSlug}-${oldNotificationToken.courseSlug}`).then(() => {
            return admin.messaging().subscribeToTopic(newNotificationToken.token, `TrashCan-${newNotificationToken.departmentSlug}-${notificationToken.courseSlug}`);
        });
    }

    // Unsubscribe when tokens are removed
    static onDeleteNotificationToken(notificationToken: NotificationToken) {
        return admin.messaging().unsubscribeFromTopic(notificationToken.token, `TrashCan-${notificationToken.departmentSlug}-${notificationToken.courseSlug}`);
    }
}