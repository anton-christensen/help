import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();

export const onNewMessagingToken = functions.firestore
  .document('users/{id}').onUpdate((snap, context) => {
    console.log('Someone new wants notifications!');
    const data = snap.after.data();
    return admin.messaging().subscribeToTopic(data['messagingTokens'], 'questions');
  });

export const onHelpRequest = functions.firestore
  .document('questions/{id}').onWrite((snap, context) => {
    console.log('Question posted!', snap.after.data());

    const message = {
      data: {
        title: 'test',
        body: 'more test'
      },
      notification: {
        title: 'test 123',
        body: 'more test 123'
      }
    };

    return admin.messaging().sendToTopic('questions', message);
  });
