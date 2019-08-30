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

// var success = "<cas:serviceResponse xmlns:cas='http://www.yale.edu/tp/cas'>\n<cas:authenticationSuccess>\n<cas:user>achri15@student.aau.dk</cas:user>\n</cas:authenticationSuccess>\n</cas:serviceResponse>";
// var error = "<cas:serviceResponse xmlns:cas='http://www.yale.edu/tp/cas'>\n<cas:authenticationFailure code='INVALID_TICKET'>\nticket &#039;ST-25250-s64agWia4mUUs0scpSfV-cas&#039; not recognized\n</cas:authenticationFailure>\n</cas:serviceResponse>";

function encodeServiceURL(target) {
  return encodeURIComponent(`${helpUrl}${typeof(target) === 'string' ? '?target=' + encodeURIComponent(target) : ''}`);
}

app.get('/login', (req, res) => {
  if (typeof(req.query.ticket) === 'string') {
    request.post(
      `${casUrl}/samlValidate?TARGET=${encodeServiceURL(req.query.target)}`, 
      { body: `<?xml version=\"1.0\" encoding=\"utf-8\"?><SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\"><SOAP-ENV:Header/><SOAP-ENV:Body><samlp:Request xmlns:samlp=\"urn:oasis:names:tc:SAML:1.0:protocol\"  MajorVersion=\"1\" MinorVersion=\"1\"><samlp:AssertionArtifact>${req.query.ticket}</samlp:AssertionArtifact></samlp:Request></SOAP-ENV:Body></SOAP-ENV:Envelope>` },
      (err, res2, body) => {
        let email                 = "achri15@student.aau.dk";
        let givenName             = "Anton";
        let surname               = "Christensen";
        // let aauUserClassification = "student";
        // let aauUserStatus         = "active";
        // let aauStudentID          = "123456";
        if (!body.includes('samlp:Success')) {
          res.send('CAS authentication error\n');
          return ;
        } else {
          email                 = new RegExp('<Attribute AttributeName="mail" AttributeNamespace="http://www.ja-sig.org/products/cas/"><AttributeValue>([^<]+)</AttributeValue>').exec(body)[1];
          givenName             = new RegExp('<Attribute AttributeName="givenName" AttributeNamespace="http://www.ja-sig.org/products/cas/"><AttributeValue>([^<]+)</AttributeValue>').exec(body)[1];
          surname               = new RegExp('<Attribute AttributeName="sn" AttributeNamespace="http://www.ja-sig.org/products/cas/"><AttributeValue>([^<]+)</AttributeValue>').exec(body)[1];
          // The following is available but unused          
          // aauUserClassification = new RegExp('<Attribute AttributeName="aauUserClassification" AttributeNamespace="http://www.ja-sig.org/products/cas/"><AttributeValue>([^<]+)</AttributeValue>').exec(body)[1];
          // aauUserStatus         = new RegExp('<Attribute AttributeName="aauUserStatus" AttributeNamespace="http://www.ja-sig.org/products/cas/"><AttributeValue>([^<]+)</AttributeValue>').exec(body)[1];
          // aauStudentID          = new RegExp('<Attribute AttributeName="aauStudentID" AttributeNamespace="http://www.ja-sig.org/products/cas/"><AttributeValue>([^<]+)</AttributeValue>').exec(body)[1];
        }

        admin.firestore().collection('users')
          .where('email', '==', email).get()
          .then((userQuerySnapshot) => {
            if (userQuerySnapshot.empty) {
              // New user: Save it in the database
              const newUser = {
                email,
                anon: false,
                name: `${givenName} ${surname}`,
                role: 'student'
              };

              return admin.firestore().collection('users').add(newUser);
            } else {
              // if name is falsy (empty)
              if(!(userQuerySnapshot.docs[0].data().name)) {
                return userQuerySnapshot.docs[0].ref.update({name: `${givenName} ${surname}`}).then(() => {
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
                if (typeof(req.query.target) === 'string') {
                  res.redirect(req.query.target + `/authed?token=${customToken}`);
                } else {
                  res.redirect(`https://help.aau.dk/authed?token=${customToken}`);
                }
              })
              .catch((error) => {
                console.log('Error creating custom token:', error);
                res.send(error);
              });
          });
    });
  } else {
    res.redirect(`${casUrl}/login?service=${encodeServiceURL(req.query.target)}`);
  }
});

export const casLogin = functions.https.onRequest(app);
