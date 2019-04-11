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
  .document('courses/{id}').onUpdate((snap) => {
    if(snap.before.data().slug == snap.after.data().slug) 
      return null;
    console.log("before: ", snap.before.data());
    console.log("after: ", snap.after.data());
  // Update all notification tokens related to the course
  return admin.firestore().collection('notificationTokens')
    .where('courseSlug', '==', snap.before.data().slug).get()
    .then((tokens) => {
      const promises = [];
      tokens.forEach(token => {
        promises.push(token.ref.update({courseSlug: snap.after.data().slug}));
      });
      return Promise.all(promises);
    })
  // Update all posts related to the course
    .then(() => {
      return admin.firestore().collection('posts')
        .where('course', '==', snap.before.data().slug).get();
    })
    .then((posts) => {
      const promises = [];
      posts.forEach(post => {
        promises.push(post.ref.update({course: snap.after.data().slug}));
      });
      return Promise.all(promises);
    })
  // Update the course for all TAs
    .then(() => {
      return admin.firestore().collection('users')
        .where('courses', 'array-contains', snap.before.data().slug).get();
    })
    .then((users) => {
      const promises = [];
      users.forEach(user => {
        promises.push(user.ref.update({courses: FieldValue.arrayRemove(snap.before.data().slug)}));
        promises.push(user.ref.update({courses: FieldValue.arrayUnion(snap.after.data().slug)}));
      });
      return Promise.all(promises);
    });
});

export const onDeleteCourse = functions.firestore
.document('courses/{id}').onDelete((snap) => {
  console.log('started course deletion');

  // Remove all notification tokens related to the course
  return admin.firestore().collection('notificationTokens')
    .where('courseSlug', '==', snap.data().slug).get()
    .then((tokens) => {
      console.log('gonna delete these tokens!', tokens);
      const promises = [];
      tokens.forEach(token => {
        promises.push(token.ref.delete());
      });
      return Promise.all(promises);
    })
  // Remove all posts related to the course
    .then(() => {
      console.log('done with tokens');
      return admin.firestore().collection('posts')
        .where('course', '==', snap.data().slug).get();
    })
    .then((posts) => {
      console.log('gonna delete these posts!', posts);
      const promises = [];
      posts.forEach(post => {
        promises.push(post.ref.delete());
      });
      return Promise.all(promises);
    })
  // Remove the course from all TAs
    .then(() => {
      return admin.firestore().collection('users')
        .where('courses', 'array-contains', snap.data().slug).get();
    })
    .then((users) => {
      console.log('These are the relevant users:', users);
      const promises = [];
      users.forEach(user => {
        console.log('doing user', user);
        promises.push(user.ref.update({courses: FieldValue.arrayRemove(snap.data().slug)}));
      });
      return Promise.all(promises);
    });
});

export const onUserUpdate = functions.firestore
  .document('users/{id}').onUpdate((snap, context) => {
    const afterCourses = snap.after.data().courses;
    const changedCourses = snap.before.data().courses.filter((course) => !afterCourses.includes(course));
    if(changedCourses.length == 0)
      return null;
    console.log(`${snap.before.data().name} is no longer a TA in these courses:`, changedCourses);

    const promises = [];
    for (const changedCourse of changedCourses) {
      promises.push(admin.firestore().collection('notificationTokens')
        .where('userId', '==', context.params.id)
        .where('courseSlug', '==', changedCourse).get()
        .then((tokens) => {
          const tokenPromises = [];
          tokens.forEach((token) => {
            console.log('deleting', token.ref.path);
            tokenPromises.push(token.ref.delete());
          });
          return Promise.all(tokenPromises);
        }));
    }

    return Promise.all(promises);
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
