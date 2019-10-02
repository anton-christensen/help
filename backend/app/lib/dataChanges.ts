import * as admin from 'firebase-admin';
import { Database } from '../database';
import { TrashCan } from '../models/trashCan';
import { NotificationToken } from '../models/notificationToken';
import { Course } from '../models/course';
import { User } from '../models/user';
import { r } from 'rethinkdb-ts';

export class OnUpdateWorker {
    public static start() {
        console.log("loading service account");
        var serviceAccount = require("../../serviceAccountKey.json");
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://aau-help.firebaseio.com"
        });

        console.log("setting up database listeners");
        Database.trashCans.changes({includeTypes: true}).run(Database.connection).then(cursor => {
            cursor.each((err, row) => {
                if(row.type == "add") {
                    OnUpdateWorker.onNewTrashCan(row['new_val'])
                }
                if(row.type == "change") {
                    OnUpdateWorker.onUpdateTrashCan(row['old_val'], row['new_val']);
                }
            });
        });

        Database.notificationTokens.changes({includeTypes: true}).run(Database.connection).then(cursor => {
            cursor.each((err, row) => {
                if(row.type == "add") {
                    OnUpdateWorker.onNewNotificationToken(row['new_val'])
                }
                if(row.type == "remove") {
                    OnUpdateWorker.onDeleteNotificationToken(row['old_val'])
                }
                if(row.type == "change") {
                    OnUpdateWorker.onUpdatedNotificationToken(row['old_val'], row['new_val'])
                }
            });
        });

        Database.courses.changes({includeTypes: true}).run(Database.connection).then(cursor => {
            cursor.each((err, row) => {
                if(row.type == "remove") {
                    OnUpdateWorker.onDeleteCourse(row['old_val'])
                }
                if(row.type == "change") {
                    OnUpdateWorker.onUpdateCourse(row['old_val'], row['new_val'])
                }
            });
        });

        Database.users.changes({includeTypes: true}).run(Database.connection).then(cursor => {
            cursor.each((err, row) => {
                if(row.type == "remove") {
                    OnUpdateWorker.onUserDelete(row['old_val'])
                }
                if(row.type == "change") {
                    OnUpdateWorker.onUserUpdate(row['old_val'], row['new_val'])
                }
            });
        });
    }

    // Send notification to proper topic when a trashcan appears
    static onNewTrashCan(can: TrashCan) {
        admin.messaging().sendToTopic(`TrashCan-${can.departmentSlug}-${can.courseSlug}`, {
            notification: {
              title: `A ${can.courseSlug.toUpperCase()} student needs help!`,
              body: `Room no. ${can.room}`,
              clickAction: `https://help.aau.dk/departments/${can.departmentSlug}/courses/${can.courseSlug}`,
              icon: `https://help.aau.dk/assets/icons/icon-128x128.png`
            }
          });
    }

    // Send notification to proper topic when a trashcan appears
    static onUpdateTrashCan(oldCan: TrashCan, newCan: TrashCan) {
        if(newCan.active == false)
            Database.trashCans.get(newCan.id).replace(r.row.without('userID')).run(Database.connection);
    }





    // Subscribe notification tokens to trash cans from their course
    static onNewNotificationToken(notificationToken: NotificationToken) {
        return admin.messaging().subscribeToTopic(notificationToken.token, `TrashCan-${notificationToken.departmentSlug}-${notificationToken.courseSlug}`);
    }

    // Handle notification token subscriptions on updates
    static onUpdatedNotificationToken(oldNotificationToken: NotificationToken, newNotificationToken: NotificationToken) {
        return admin.messaging().unsubscribeFromTopic(oldNotificationToken.token, `TrashCan-${oldNotificationToken.departmentSlug}-${oldNotificationToken.courseSlug}`).then(() => {
            return admin.messaging().subscribeToTopic(newNotificationToken.token, `TrashCan-${newNotificationToken.departmentSlug}-${newNotificationToken.courseSlug}`);
        });
    }

    // Unsubscribe when tokens are removed
    static onDeleteNotificationToken(notificationToken: NotificationToken) {
        return admin.messaging().unsubscribeFromTopic(notificationToken.token, `TrashCan-${notificationToken.departmentSlug}-${notificationToken.courseSlug}`);
    }

    // Remove notification tokens from users if the are removed from a course
    static onUpdateCourse(oldCourse: Course, newCourse: Course) {
        // Check if there was a change to associated users
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
        const removedUsersPromises = [];
        for (const removedUser of removedUsers) {
            removedUsersPromises.push(
                Database.notificationTokens.filter({
                    departmentSlug: oldCourse.departmentSlug,
                    courseSlug: oldCourse.slug,
                    userID: removedUser
                }).delete().run(Database.connection)
            );
        }

        return Promise.all(removedUsersPromises);
    };



    // Remove all notification tokens related to a deleted course
    static onDeleteCourse(oldCourse: Course) {
        // Remove all notification tokens related to the course
        Database.notificationTokens.filter(
            {
                departmentSlug: oldCourse.departmentSlug,
                courseSlug: oldCourse.slug
            }
        ).delete().run(Database.connection)
        // Remove all posts related to the course
        .then(() => {
            return Database.posts.filter(
                {
                    departmentSlug: oldCourse.departmentSlug,
                    courseSlug: oldCourse.slug
                }
            ).delete().run(Database.connection);
        });
    }

    // Remove all notification tokens from users if they are demoted to students
    static onUserUpdate(oldUser: User, newUser: User) {
        if (newUser.role !== 'student') {
            return null;
        }

        // If the new role is 'student', delete all notification tokens related to this user
        return Database.notificationTokens.filter(
            {
                userID: oldUser.id
            }
        ).delete().run(Database.connection);
    }

    // Remove all notification tokens from users when they are deleted
    static onUserDelete(user: User) {
        return Database.notificationTokens.filter(
            {
                userID: user.id
            }
        ).delete().run(Database.connection);
    }
}