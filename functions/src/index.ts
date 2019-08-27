import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();

export const onNewTrashCan = functions.firestore
  .document('trashCans/{id}').onCreate((snap) => {
    const trashCan = snap.data();

    return admin.firestore().doc(`courses/${trashCan.courseID}`).get()
      .then((doc) => {
        const course = doc.data();

        return admin.messaging().sendToTopic(`TrashCan-${trashCan.courseID}`, {
          notification: {
            title: `A ${course.slug.toUpperCase()} student needs help!`,
            body: `Room no. ${trashCan.room}`,
            clickAction: `https://help.aau.dk/departments/${course.instituteSlug}/courses/${course.slug}`,
            icon: `https://help.aau.dk/assets/icons/icon-128x128.png`
          }
        });
    });
  });


export const onNewNotificationToken = functions.firestore
  .document('notificationTokens/{id}').onCreate((snap) => {
    const data = snap.data();
    return admin.messaging().subscribeToTopic(data.token, `TrashCan-${data.courseID}`);
  });

export const onUpdatedNotificationToken = functions.firestore
  .document('notificationTokens/{id}').onUpdate((snap) => {
    const oldData = snap.before.data();
    const newData = snap.after.data();

    return admin.messaging().unsubscribeFromTopic(oldData.token, `TrashCan-${oldData.courseID}`)
      .then(() => {
        return admin.messaging().subscribeToTopic(newData.token, `TrashCan-${newData.courseID}`);
      });
  });

export const onDeleteNotificationToken = functions.firestore
  .document('notificationTokens/{id}').onDelete((snap) => {
  const data = snap.data();

  return admin.messaging().unsubscribeFromTopic(data.token, `TrashCan-${data.courseID}`);
});


export const onUpdateCourse = functions.firestore
  .document('courses/{courseID}').onUpdate((snap, ctx) => {
    // Check if there was a change to associated users
    const removedUsers = [];
    for (const oldUser of snap.before.data().associatedUserIDs) {
      if (!snap.after.data().associatedUserIDs.includes(oldUser)) {
        removedUsers.push(oldUser);
      }
    }

    if (removedUsers.length === 0) {
      return null;
    }
    console.log(`These users were removed from course ${ctx.params.courseID}:`, removedUsers);

    // Remove notification tokens for each removed user and this course
    const removedUsersPromises = [];
    for (const removedUser of removedUsers) {
      removedUsersPromises.push(
        admin.firestore().collection('notificationTokens')
          .where('courseID', '==', ctx.params.courseID)
          .where('userID', '==', removedUser).get()
          .then((tokens) => {
            console.log('Deleting these tokens:', tokens);
            const tokenPromises = [];
            tokens.forEach(token => {
              tokenPromises.push(token.ref.delete());
            });
            return Promise.all(tokenPromises);
        })
      );
    }

    return Promise.all(removedUsersPromises);
});

export const onDeleteCourse = functions.firestore
.document('courses/{courseID}').onDelete((snap, ctx) => {
  console.log('Started course deletion');

  // Remove all notification tokens related to the course
  return admin.firestore().collection('notificationTokens')
    .where('courseID', '==', ctx.params.courseID).get()
    .then((tokens) => {
      console.log('Deleting these tokens:', tokens);
      const promises = [];
      tokens.forEach(token => {
        promises.push(token.ref.delete());
      });
      return Promise.all(promises);
    })
  // Remove all posts related to the course
    .then(() => {
      console.log('Tokens deleted');
      return admin.firestore().collection('posts')
        .where('courseID', '==', ctx.params.courseID).get();
    })
    .then((posts) => {
      console.log('Deleting these posts:', posts);
      const promises = [];
      posts.forEach(post => {
        promises.push(post.ref.delete());
      });
      return Promise.all(promises);
    });
});


export const onUserUpdate = functions.firestore
  .document('users/{userID}').onUpdate((snap, ctx) => {
    if (snap.after.data().role !== 'student') {
      return null;
    }

    // If the new role is 'student', delete all notification tokens related to this user
    return admin.firestore().collection('notificationTokens')
      .where('userID', '==', ctx.params.userID).get()
      .then((tokens) => {
        console.log('Deleting these tokens:', tokens);
        const tokenPromises = [];
        tokens.forEach(token => {
          tokenPromises.push(token.ref.delete());
        });
        return Promise.all(tokenPromises);
      });
  });

export const onUserDelete = functions.firestore
  .document('users/{userID}').onDelete((snap, ctx) => {
    // Delete all notification tokens related to this user
    return admin.firestore().collection('notificationTokens')
      .where('userID', '==', ctx.params.userID).get()
      .then((tokens) => {
        console.log('Deleting these tokens:', tokens);
        const tokenPromises = [];
        tokens.forEach(token => {
          tokenPromises.push(token.ref.delete());
        });
        return Promise.all(tokenPromises);
      });
  });

import * as express from 'express';
import * as request from 'request';
const app = express();
const casUrl = 'https://login.aau.dk/cas';
const helpUrl = 'https://help.aau.dk/login';

app.get('/', (req, res) => {
  if (typeof(req.query.ticket) === 'string') {
    request(`${casUrl}/serviceValidate?service=${helpUrl}&ticket=${req.query.ticket}`, {json: true}, (err, res2, body) => {
      if (err) {
        return console.log(err);
      }
      res.send(body);
    });
  } else {
    res.redirect(`${casUrl}/login?service=${helpUrl}`);
  }
});

export const casLogin = functions.https.onRequest(app);
