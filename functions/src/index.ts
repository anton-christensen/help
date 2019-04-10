import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();

export const onNewNotificationToken = functions.firestore
  .document('notificationTokens/{id}').onCreate((snap) => {
    const data = snap.data();

    return admin.messaging().subscribeToTopic(data.token, `trashCan/${data.courseSlug}`);
  });

export const onUpdatedNotificationToken = functions.firestore
  .document('notificationTokens/{id}').onUpdate((snap) => {
    const oldData = snap.before.data();
    const newData = snap.after.data();

    return admin.messaging().unsubscribeFromTopic(oldData.token, `trashCan/${oldData.courseSlug}`)
      .then(() => {
        return admin.messaging().subscribeToTopic(newData.token, `trashCan/${newData.courseSlug}`);
      });
  });

export const onDeleteNotificationToken = functions.firestore
  .document('notificationTokens/{id}').onDelete((snap) => {
    const data = snap.data();

    return admin.messaging().unsubscribeFromTopic(data.token, `trashCan/${data.courseSlug}`);
  });

export const onNoLongerTA = functions.firestore
  .document('users/{id}').onUpdate((snap, context) => {
    const afterCourses = snap.after.data().courses;
    const changedCourses = snap.before.data().courses.filter((course) => !afterCourses.includes(course));
    console.log(`${snap.before.data().name} is no longer a TA in these courses:`, changedCourses);

    for (const changedCourse of changedCourses) {
      admin.firestore().collection('notificationTokens')
        .where('userId', '==', context.params.id)
        .where('courseSlug', '==', changedCourse).get()
        .then((tokens) => {
          tokens.forEach((token) => {
            console.log('deleting', token.ref.path);
            token.ref.delete();
          });
        });
    }

    return null;
  });

export const onHelpRequest = functions.firestore
  .document('trash-cans/{id}').onCreate((snap) => {
    const trashCan = snap.data();

    return admin.messaging().sendToTopic(`trashCan/${trashCan.course}`, {
      notification: {
        title: `A ${trashCan.course.toUpperCase()} student needs help!`,
        body: `Room no. ${trashCan.room}`
      }
    });
  });
