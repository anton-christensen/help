import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from '@google-cloud/firestore';
admin.initializeApp();

export const onNewNotificationToken = functions.firestore
  .document('notificationTokens/{id}').onCreate((snap) => {
    const data = snap.data();

    return admin.messaging().subscribeToTopic(data.token, `trashCan-${data.courseSlug}`);
  });

export const onUpdatedNotificationToken = functions.firestore
  .document('notificationTokens/{id}').onUpdate((snap) => {
    const oldData = snap.before.data();
    const newData = snap.after.data();

    return admin.messaging().unsubscribeFromTopic(oldData.token, `trashCan-${oldData.courseSlug}`)
      .then(() => {
        return admin.messaging().subscribeToTopic(newData.token, `trashCan-${newData.courseSlug}`);
      });
  });

export const onDeleteNotificationToken = functions.firestore
  .document('notificationTokens/{id}').onDelete((snap) => {
  const data = snap.data();

  return admin.messaging().unsubscribeFromTopic(data.token, `trashCan-${data.courseSlug}`);
});


export const onUpdateCourse = functions.firestore
.document('courses/{id}').onUpdate((snap, context) => {
  // update course from each of the TAs
  admin.firestore().collection('users')
    .where('courses', 'array-contains', snap.before.data().slug).get()
    .then(users => {
      users.forEach(user => {
        user.ref.update({'courses': FieldValue.arrayRemove(snap.before.data().slug)});
        user.ref.update({'courses': FieldValue.arrayUnion(snap.after.data().slug)});
      });
    }
  );

  // update posts to reflect new slug
  admin.firestore().collection('posts')
    .where('course', '==', snap.before.data().slug).get()
    .then(posts => {
      posts.forEach(post => {
        post.ref.update({'course': snap.after.data().slug});
      });
    }
  );

  // remove each notification token for the course
  admin.firestore().collection('notificationTokens')
    .where('courseSlug', '==', snap.before.data().slug).get()
    .then(tokens => {
      tokens.forEach(token => {
        token.ref.update({'courseSlug': snap.after.data().slug});
      });
    }
  );

  return null;
});

export const onDeleteCourse = functions.firestore
.document('courses/{id}').onDelete((snap) => {
  console.log('started course deletion');
  // remove course from each of the TAs
  admin.firestore().collection('users')
    .where('courses', 'array-contains', snap.data().slug).get()
    .then(users => {
      console.log('These are the relevant users:', users);
      users.forEach(user => {
        console.log('doing user', user);
        user.ref.update({'courses': FieldValue.arrayRemove(snap.data().slug)});
      });
    }
  );

  console.log('done with users');

  // Delete posts of course
  admin.firestore().collection('posts')
    .where('course', '==', snap.data().slug).get()
    .then(posts => {

      console.log('gonna delete these posts!', posts);
      posts.forEach(post => {
        post.ref.delete();
      });
    }
  );

  console.log('done with posts');

  // remove each notification token for the course
  admin.firestore().collection('notificationTokens')
    .where('courseSlug', '==', snap.data().slug).get()
    .then(tokens => {
      console.log('gonna delete this tokens!', tokens);
      tokens.forEach(token => {
        token.ref.delete();
      });
    }
  );

  return null;
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

    return admin.messaging().sendToTopic(`trashCan-${trashCan.course}`, {
      notification: {
        title: `A ${trashCan.course.toUpperCase()} student needs help!`,
        body: `Room no. ${trashCan.room}`,
        clickAction: `https://help.antonchristensen.net/courses/${trashCan.course}`,
        icon: `https://help.antonchristensen.net/assets/icons/icon-128x128.png`
      }
    });
  });
