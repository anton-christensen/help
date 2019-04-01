import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();

export const onNewMessagingToken = functions.firestore
  .document('users/{id}').onUpdate((snap) => {
    const data = snap.after.data();

    if (data.messagingTokens && data.messagingTokens.length) {
      return admin.messaging().subscribeToTopic(data.messagingTokens, 'questions');
    } else {
      return null;
    }

  });

export const onHelpRequest = functions.firestore
  .document('questions/{id}').onWrite((snap) => {
    const roomNumber = snap.after.data().roomNumber;
    const message = {
      notification: {
        title: 'Someone needs help!',
        body: `Room no. ${roomNumber}`
      }
    };

    return admin.messaging().sendToTopic('questions', message);
  });
