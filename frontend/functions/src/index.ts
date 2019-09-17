import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();

// Delete user in database, when they are deleted in auth
exports.removeUser = functions.auth.user()
  .onDelete((user) => {
    return  admin.firestore().doc(`users/${user.uid}`).delete();
  });


// Send notification to proper topic when a trashcan appears
export const onNewTrashCan = functions.firestore
  .document('trashCans/{id}').onCreate((snap) => {
    const trashCan = snap.data();

    return admin.firestore().doc(`courses/${trashCan.courseID}`).get()
      .then((doc) => {
        const promises = [];
        const course = doc.data();

        promises.push(admin.messaging().sendToTopic(`TrashCan-${trashCan.courseID}`, {
          notification: {
            title: `A ${course.slug.toUpperCase()} student needs help!`,
            body: `Room no. ${trashCan.room}`,
            clickAction: `https://help.aau.dk/departments/${course.instituteSlug}/courses/${course.slug}`,
            icon: `https://help.aau.dk/assets/icons/icon-128x128.png`
          }
        }));

        promises.push(doc.ref.update('numTrashCansThisSession', admin.firestore.FieldValue.increment(1)));

        return Promise.all(promises);
    });
  });


// Subscribe notification tokens to trash cans from their course
export const onNewNotificationToken = functions.firestore
  .document('notificationTokens/{id}').onCreate((snap) => {
    const data = snap.data();
    return admin.messaging().subscribeToTopic(data.token, `TrashCan-${data.courseID}`);
  });

// Handle notification token subscriptions on updates
export const onUpdatedNotificationToken = functions.firestore
  .document('notificationTokens/{id}').onUpdate((snap) => {
    const oldData = snap.before.data();
    const newData = snap.after.data();

    return admin.messaging().unsubscribeFromTopic(oldData.token, `TrashCan-${oldData.courseID}`)
      .then(() => {
        return admin.messaging().subscribeToTopic(newData.token, `TrashCan-${newData.courseID}`);
      });
  });

// Unsubscribe when tokens are removed
export const onDeleteNotificationToken = functions.firestore
  .document('notificationTokens/{id}').onDelete((snap) => {
  const data = snap.data();

  return admin.messaging().unsubscribeFromTopic(data.token, `TrashCan-${data.courseID}`);
});

// Keep track of the number of courses per institute
export const addCourseInInstitute = functions.firestore
  .document('courses/{id}').onCreate((snap) => {
    const instituteSlug = snap.data().instituteSlug;
    // Get institute by slug
    return admin.firestore().collection('institutes').where('slug', '==', instituteSlug).get()
      .then((querySnap) => {
        // If it exists update it
        if (querySnap.empty) {
          return null;
        }

        return querySnap.docs[0].ref.update('numCourses', admin.firestore.FieldValue.increment(1));
      });
  });

export const updateCourseInInstitute = functions.firestore
  .document('courses/{id}').onUpdate((snap) => {
    // Check if there is a change in institute
    const oldInstituteSlug = snap.before.data().instituteSlug;
    const newInstituteSlug = snap.after.data().instituteSlug;
    if (oldInstituteSlug === newInstituteSlug) {
      return null;
    }

    // There was a change, decrement the old institute
    const promises = [];
    promises.push(admin.firestore().collection('institutes').where('slug', '==', oldInstituteSlug).get()
      .then((querySnap) => {
        // If it exists update it
        if (querySnap.empty) {
          return null;
        }

        return querySnap.docs[0].ref.update('numCourses', admin.firestore.FieldValue.increment(-1));
      }));

    // And increment the new one
    promises.push(admin.firestore().collection('institutes').where('slug', '==', newInstituteSlug).get()
      .then((querySnap) => {
        // If it exists update it
        if (querySnap.empty) {
          return null;
        }

        return querySnap.docs[0].ref.update('numCourses', admin.firestore.FieldValue.increment(1));
      }));

    // Return when both complete
    return Promise.all(promises);
  });

export const removeCourseInInstitute = functions.firestore
  .document('courses/{id}').onDelete((snap) => {
    const instituteSlug = snap.data().instituteSlug;
    // Get institute by slug
    return admin.firestore().collection('institutes').where('slug', '==', instituteSlug).get()
      .then((querySnap) => {
        // If it exists update it
        if (querySnap.empty) {
          return null;
        }

        return querySnap.docs[0].ref.update('numCourses', admin.firestore.FieldValue.increment(-1));
      });
  });

// Remove notification tokens from users if the are removed from a course
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

    // Remove notification tokens for each removed user and this course
    const removedUsersPromises = [];
    for (const removedUser of removedUsers) {
      removedUsersPromises.push(
        admin.firestore().collection('notificationTokens')
          .where('courseID', '==', ctx.params.courseID)
          .where('userID', '==', removedUser).get()
          .then((tokens) => {
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

// Remove all notification tokens related to a deleted course
export const onDeleteCourse = functions.firestore
.document('courses/{courseID}').onDelete((snap, ctx) => {
  // Remove all notification tokens related to the course
  return admin.firestore().collection('notificationTokens')
    .where('courseID', '==', ctx.params.courseID).get()
    .then((tokens) => {
      const promises = [];
      tokens.forEach(token => {
        promises.push(token.ref.delete());
      });
      return Promise.all(promises);
    })
  // Remove all posts related to the course
    .then(() => {
      return admin.firestore().collection('posts')
        .where('courseID', '==', ctx.params.courseID).get();
    })
    .then((posts) => {
      const promises = [];
      posts.forEach(post => {
        promises.push(post.ref.delete());
      });
      return Promise.all(promises);
    });
});

// Remove all notification tokens from users if they are demoted to students
export const onUserUpdate = functions.firestore
  .document('users/{userID}').onUpdate((snap, ctx) => {
    if (snap.after.data().role !== 'student') {
      return null;
    }

    // If the new role is 'student', delete all notification tokens related to this user
    return admin.firestore().collection('notificationTokens')
      .where('userID', '==', ctx.params.userID).get()
      .then((tokens) => {
        const tokenPromises = [];
        tokens.forEach(token => {
          tokenPromises.push(token.ref.delete());
        });
        return Promise.all(tokenPromises);
      });
  });

// Remove all notification tokens from users when they are deleted
export const onUserDelete = functions.firestore
  .document('users/{userID}').onDelete((snap, ctx) => {
    // Delete all notification tokens related to this user
    return admin.firestore().collection('notificationTokens')
      .where('userID', '==', ctx.params.userID).get()
      .then((tokens) => {
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

app.get('/login', (req, res) => {
  if (typeof(req.query.ticket) !== 'string') {
    return null;
  }

  request.post(
    `https://login.aau.dk/cas/samlValidate?TARGET=${encodeURI(req.query.target)}`,
    { body: `<?xml version=\"1.0\" encoding=\"utf-8\"?><SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\"><SOAP-ENV:Header/><SOAP-ENV:Body><samlp:Request xmlns:samlp=\"urn:oasis:names:tc:SAML:1.0:protocol\"  MajorVersion=\"1\" MinorVersion=\"1\"><samlp:AssertionArtifact>${req.query.ticket}</samlp:AssertionArtifact></samlp:Request></SOAP-ENV:Body></SOAP-ENV:Envelope>` },
    (err, res2, body) => {
      if (!body.includes('samlp:Success')) {
        res.send('CAS authentication error\n');
        return null;
      }
      const email = new RegExp('<Attribute AttributeName="mail" AttributeNamespace="http://www.ja-sig.org/products/cas/"><AttributeValue>([^<]+)</AttributeValue>').exec(body)[1];
      const firstName = new RegExp('<Attribute AttributeName="givenName" AttributeNamespace="http://www.ja-sig.org/products/cas/"><AttributeValue>([^<]+)</AttributeValue>').exec(body)[1];
      const lastName = new RegExp('<Attribute AttributeName="sn" AttributeNamespace="http://www.ja-sig.org/products/cas/"><AttributeValue>([^<]+)</AttributeValue>').exec(body)[1];

      admin.firestore().collection('users')
        .where('email', '==', email).get()
        .then((userQuerySnapshot) => {
          if (userQuerySnapshot.empty) {
            // New user: Save it in the database
            const newUser = {
              email,
              anon: false,
              name: `${firstName} ${lastName}`,
              role: 'student'
            };

            return admin.firestore().collection('users').add(newUser);
          } else {
            // if name is falsy (empty)
            if(!(userQuerySnapshot.docs[0].data().name)) {
              return userQuerySnapshot.docs[0].ref.update({name: `${firstName} ${lastName}`}).then(() => {
                return new Promise(((resolve) => resolve(userQuerySnapshot.docs[0])));
              });
            } else {
              // Returning user: Grab ID
              return new Promise(((resolve) => resolve(userQuerySnapshot.docs[0])));
            }
          }
        })
        .then((user: {id: string}) => {
          admin.auth().createCustomToken(user.id)
            .then((customToken) => {
              res.redirect(`${req.query.target}?token=${customToken}`);
            })
            .catch((error) => {
              console.log('Error creating custom token:', error);
              res.send(error);
            });
        });
  });
});

export const casLogin = functions.https.onRequest(app);
