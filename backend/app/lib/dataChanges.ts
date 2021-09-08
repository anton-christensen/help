import * as admin from 'firebase-admin';
import { Database } from '../database';
import { TrashCan } from '../models/trashCan';
import { NotificationToken } from '../models/notificationToken';
import { Course } from '../models/course';
import { User } from '../models/user';
import {r, RDatum} from 'rethinkdb-ts';

export class OnUpdateWorker {
    private static hasFirebaseAccess = true;
    public static start() {
        console.log('Loading service account...');
        try {
            const serviceAccount = require('../../serviceAccountKey.json');
            const fbOptions = {
                credential: admin.credential.cert(serviceAccount),
                databaseURL: 'https://aau-help.firebaseio.com'
            }
            admin.initializeApp(fbOptions);
        } catch {
            this.hasFirebaseAccess = false;
            console.log('service account failed to load. Notification service is unavailable')
        }
        if(this.hasFirebaseAccess)
            console.log('Service account loaded!');

        const listenerPromises = [];
        console.log('Setting up database listeners...');

        listenerPromises.push(
            Database.trashCans
                .changes({includeTypes: true})
                .run(Database.connection)
                .then((cursor) => {
                    return cursor.each((err, row) => {
                        if (row.type === 'add') {
                            OnUpdateWorker.onNewTrashCan(row['new_val'])
                        }
                        if (row.type === 'change') {
                            OnUpdateWorker.onUpdateTrashCan(row['old_val'], row['new_val']);
                        }
                    });
                })
                .catch(() => console.error('Failed to set up trashcan listeners'))
        );

        listenerPromises.push(
            Database.notificationTokens
                .changes({includeTypes: true})
                .run(Database.connection)
                .then((cursor) => {
                    return cursor.each((err, row) => {
                        if (row.type === 'add') {
                            OnUpdateWorker.onNewNotificationToken(row['new_val'])
                        }
                        if (row.type === 'remove') {
                            OnUpdateWorker.onDeleteNotificationToken(row['old_val'])
                        }
                        if (row.type === 'change') {
                            OnUpdateWorker.onUpdatedNotificationToken(row['old_val'], row['new_val'])
                        }
                    });
                })
                .catch(() => console.error('Failed to set up notification token listeners'))
        );

        listenerPromises.push(
            Database.courses
                .changes({includeTypes: true})
                .run(Database.connection)
                .then((cursor) => {
                    return cursor.each((err, row) => {
                        if (row.type === 'remove') {
                            OnUpdateWorker.onDeleteCourse(row['old_val'])
                        }
                        if (row.type === 'change') {
                            OnUpdateWorker.onUpdateCourse(row['old_val'], row['new_val'])
                        }
                    });
                })
                .catch(() => console.error('Failed to set up course listeners'))
        );

        listenerPromises.push(
            Database.users
                .changes({includeTypes: true})
                .run(Database.connection)
                .then((cursor) => {
                    return cursor.each((err, row) => {
                        if (row.type === 'remove') {
                            OnUpdateWorker.onUserDelete(row['old_val'])
                        }
                        if (row.type === 'change') {
                            OnUpdateWorker.onUserUpdate(row['old_val'], row['new_val'])
                        }
                    });
                })
                .catch(() => console.error('Failed to set up user listeners'))
        );

        return Promise.all(listenerPromises)
            .then(() => console.log('Succesfully set up database listeners...'))
    }


    static onNewTrashCan(can: TrashCan) {
        if(!this.hasFirebaseAccess) return;
        
        // Send notification to proper topic when a trashcan is created
        const topic = `TrashCan-${can.departmentSlug}-${can.courseSlug}`;
        return admin.messaging()
            .sendToTopic(topic, {
            notification: {
              title: `A ${can.courseSlug.toUpperCase()} student needs help!`,
              body: `Room no. ${can.room}`,
              clickAction: `https://help.aau.dk/departments/${can.departmentSlug}/courses/${can.courseSlug}`,
              icon: `https://help.aau.dk/assets/icons/icon-128x128.png`
            }
          });
    }

    static onUpdateTrashCan(oldCan: TrashCan, newCan: TrashCan) {
        const promises = [];

        // Remove userID from trashcans when they are removed
        if (oldCan.active && !newCan.active) {
            promises.push(
                Database.trashCans
                .get(newCan.id)
                .replace(r.row.without('userID'))
                .run(Database.connection)
            )
        }

        // Move all earlier trashcans up in line when a trashcan is removed
        if (oldCan.active && !newCan.active) {
            promises.push(
                Database.trashCans
                    .filter((trashCan: RDatum<TrashCan>) => {
                        return  trashCan('departmentSlug').eq(oldCan.departmentSlug).and(
                                trashCan('courseSlug').eq(oldCan.courseSlug)).and(
                                trashCan('active').eq(true)).and(
                                trashCan('created').gt(oldCan.created)
                        );
                    })
                    .update({
                        numInLine: r.row('numInLine').sub(1)
                    })
                    .run(Database.connection)
            )
        }

        return Promise.all(promises);
    }

    static onNewNotificationToken(notificationToken: NotificationToken) {
        if(!this.hasFirebaseAccess) return;

        // Subscribe notification tokens when they are created
        const topic = `TrashCan-${notificationToken.departmentSlug}-${notificationToken.courseSlug}`;
        return admin.messaging()
            .subscribeToTopic(notificationToken.token, topic);
    }


    static onUpdatedNotificationToken(oldNotificationToken: NotificationToken, newNotificationToken: NotificationToken) {
        if(!this.hasFirebaseAccess) return;

        // Handle subscriptions whenever a notification token is updated
        const oldTopic = `TrashCan-${oldNotificationToken.departmentSlug}-${oldNotificationToken.courseSlug}`;
        const newTopic = `TrashCan-${newNotificationToken.departmentSlug}-${newNotificationToken.courseSlug}`;

        return admin.messaging()
            .unsubscribeFromTopic(oldNotificationToken.token, oldTopic)
            .then(() => admin.messaging().subscribeToTopic(newNotificationToken.token, newTopic));
    }

    static onDeleteNotificationToken(notificationToken: NotificationToken) {
        if(!this.hasFirebaseAccess) return;

        // Unsubscribe tokens when they are deleted
        const topic = `TrashCan-${notificationToken.departmentSlug}-${notificationToken.courseSlug}`;
        return admin.messaging()
            .unsubscribeFromTopic(notificationToken.token, topic);
    }

    static onUpdateCourse(oldCourse: Course, newCourse: Course) {
        // Remove notification tokens from users if the are removed from a course

        // Make a list of all removed userIDs
        const removedUsers = [];
        for (const oldUser of oldCourse.associatedUserIDs) {
            if (!newCourse.associatedUserIDs.includes(oldUser)) {
                removedUsers.push(oldUser);
            }
        }

        if (removedUsers.length === 0) {
            return null;
        }

        // Remove notification tokens for each removed user and this course
        const promises = [];
        for (const removedUser of removedUsers) {
            promises.push(
                Database.notificationTokens.filter({
                    departmentSlug: oldCourse.departmentSlug,
                    courseSlug: oldCourse.slug,
                    userID: removedUser
                }).delete().run(Database.connection)
            );
        }

        return Promise.all(promises);
    };

    static onDeleteCourse(oldCourse: Course) {
        const promises = [];

        // Remove all notification tokens related to the course
        promises.push(
            Database.notificationTokens
            .filter({
                departmentSlug: oldCourse.departmentSlug,
                courseSlug: oldCourse.slug
            })
            .delete()
            .run(Database.connection)
        );

        // Remove all posts related to the course
        promises.push(
            Database.posts
                .filter({
                    departmentSlug: oldCourse.departmentSlug,
                    courseSlug: oldCourse.slug
                })
                .delete()
                .run(Database.connection)
        );

        return Promise.all(promises);
    }

    static onUserUpdate(oldUser: User, newUser: User) {
        const promises = [];

        // Remove all notification tokens from users if they are demoted to students
        if (newUser.role === 'student') {
            promises.push(
                Database.notificationTokens
                    .filter({userID: oldUser.id})
                    .delete()
                    .run(Database.connection)
            );
        }

        return Promise.all(promises);
    }


    static onUserDelete(user: User) {
        const promises = [];

        // Remove all notification tokens from users when they are deleted
        promises.push(
            Database.notificationTokens
                .filter({userID: user.id})
                .delete()
                .run(Database.connection)
        );

        return Promise.all(promises);
    }
}
