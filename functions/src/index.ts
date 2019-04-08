import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();

export const onNewNotificationToken = functions.firestore
  .document('users/{id}').onUpdate((snap) => {
    const user = snap.after.data();

    if (user.notificationTokens) {
      for (const course of Object.keys(user.notificationTokens)) {
        admin.messaging().subscribeToTopic(user.notificationTokens[course], `trash-can-${course}`);
      }
    }

    return null;
  });

export const onHelpRequest = functions.firestore
  .document('trash-cans/{id}').onWrite((snap) => {
    const trashCan = snap.after.data();

    return admin.messaging().sendToTopic(`trash-can-${trashCan.course}`, {
      notification: {
        title: `A ${trashCan.course.toUpperCase()} student needs help!`,
        body: `Room no. ${trashCan.room}`
      }
    });
  });
