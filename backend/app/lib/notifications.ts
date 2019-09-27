import * as admin from 'firebase-admin';
import { Database } from '../database';
import { ChangesOptions } from 'rethinkdb';
import { TrashCan } from '../models/trashCan';


export class NotificationWorker {
    public static start() {
        Database.trashCans.changes({includeTypes: true}).run().then(cursor => {
            cursor.each((err, row) => {
                if(row.type == "add") {
                    NotificationWorker.onNewTrashCan(row['new_val'])
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
    static onNewNotificationToken(token) {
        const data = token.data();
        return admin.messaging().subscribeToTopic(data.token, `TrashCan-${data.courseID}`);
    }

    // Handle notification token subscriptions on updates
    static onUpdatedNotificationToken(token) {
        const oldData = token.before.data();
        const newData = token.after.data();

        return admin.messaging().unsubscribeFromTopic(oldData.token, `TrashCan-${oldData.courseID}`).then(() => {
            return admin.messaging().subscribeToTopic(newData.token, `TrashCan-${newData.courseID}`);
        });
    }

    // Unsubscribe when tokens are removed
    static onDeleteNotificationToken(token) {
        const data = token.data();

        return admin.messaging().unsubscribeFromTopic(data.token, `TrashCan-${data.courseID}`);
    }
}