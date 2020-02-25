
import {r, RDatum} from 'rethinkdb-ts';
import { RequestHandler } from 'express';
import { Database } from '../database';
import { checkSchema, matchedData } from 'express-validator';
import { HelpResponse } from '../lib/responses';
import { getUser, userRoleIn, userIsAssociatedWithCourse } from '../lib/auth';
import { TrashCan } from '../models/trashCan';
import { createStream } from '../lib/stream';
import {User} from "../models/user";

export namespace TrashCanController {
    async function adminOrAssociated(user: User, departmentSlug: any, courseSlug: any) {
        return user.role == 'admin' || (
            userRoleIn(user, ['TA', 'lecturer']) &&
            await userIsAssociatedWithCourse(user, departmentSlug, courseSlug)
        )
    }

    async function studentOrUnassociated(user: User, departmentSlug: any, courseSlug: any) {
        return user.role == 'student' || (
            userRoleIn(user, ['TA', 'lecturer']) &&
            !await userIsAssociatedWithCourse(user, departmentSlug, courseSlug)
        )
    }

    export const getRelevantTrashCanValidator = checkSchema({
        departmentSlug: { in: ['params'], isString: true },
        courseSlug: { in: ['params'], isString: true }
    });
    export const getRelevantTrashCan: RequestHandler = async ( request, response ) => {
        const user = getUser(request);
        const input = matchedData(request);

        if (!user) {
            return HelpResponse.disallowed(response);
        }

        let query = Database.trashCans
            .filter({
                active: true,
                departmentSlug: input.departmentSlug,
                courseSlug: input.courseSlug
            });
    
        if (await studentOrUnassociated(user, input.departmentSlug, input.courseSlug)) {
            // Get your own trashcan
            query = query.filter({userID: user.id});
            createStream(
                response, 
                `GET:/${input.departmentSlug}/${input.courseSlug}/trashcans/${user.id}`,
                query.changes(),
                (err, row) => row
            );

            return HelpResponse.fromPromise(response, query.run(Database.connection));
        }

        if (await adminOrAssociated(user, input.departmentSlug, input.courseSlug)) {
            createStream(
                response,
                `GET-ALL:/${input.departmentSlug}/${input.courseSlug}/trashcans`,
                query.changes(),
                (err, row) => row
            );
            query = query.orderBy('created');
            return HelpResponse.fromPromise(response, query.run(Database.connection));
        }
    };

    export const createTrashCanValidator = checkSchema({
        departmentSlug: { in: 'params', isString: true },
        courseSlug: { in: 'params', isString: true },
        room: { in: 'body', isString: true },
    });
    export const createTrashCan: RequestHandler = async ( request, response ) => {
        const user = getUser(request);
        const input = matchedData(request);

        if (!user) {
            return HelpResponse.disallowed(response);
        }

        // Get the number of active trashcans in the course
        const existingTrashCans: TrashCan[] = await Database.trashCans
            .filter({
                active: true,
                departmentSlug: input.departmentSlug,
                courseSlug: input.ccourseSlug}
            )
            .run(Database.connection);

        // Check if user has a trashcan already
        const userHasTrashCan = existingTrashCans.some((can) => can.userID === user.id);
        if (user.id && userHasTrashCan) {
            return HelpResponse.error(response, 'You already have a trash can out in this course!', 406);
        }

        const can: TrashCan = {
            userID: user.id ? user.id : '',
            departmentSlug: input.departmentSlug,
            courseSlug: input.courseSlug,
            room: input.room,
            responderName: '',
            active: true,
            created: await r.now().run(Database.connection),
            numInLine: existingTrashCans.length
        };

        Database.trashCans
            .insert(can)
            .run(Database.connection)
                .then((result) => HelpResponse.success(response, result))
                .catch((error) => HelpResponse.error(response, error));
    };

    export const respondToTrashCanValidator = checkSchema({
        departmentSlug: { in: 'params', isString: true },
        courseSlug: { in: 'params', isString: true },
        trashcanID: { in: 'params', isString: true },
        enable: { in: 'body', isBoolean: true },
    });
    export const respondToTrashCan: RequestHandler = async ( request, response ) => {
        const user = getUser(request);
        const input = matchedData(request);

        // There must be a user
        if (!user) {
            return HelpResponse.disallowed(response);
        }

        // Get the trashcan from DB
        const can = await Database.trashCans
            .get(input.trashcanID)
            .run(Database.connection);

        // Check if we found a trashcan and that it is active
        if (!can || can.active === false) {
            return HelpResponse.error(response, 'TrashCan does not exist', 404);
        }

        // Associated TA/lecturers and admins are allowed
        if (await adminOrAssociated(user, input.departmentSlug, input.courseSlug)) {
            if (input.enable) {
                return HelpResponse.fromPromise(response,
                    Database
                        .trashCans
                        .filter((can: RDatum) => {
                            return can('id').eq(input.trashcanID).or(can('responderName').eq(user.name))
                        }).update((can: RDatum) => {
                        return r.branch(
                            can('id').eq(input.trashcanID),
                            {responderName: user.name},
                            {responderName: ''}
                        )
                    }).run(Database.connection)
                );
            } else {
                return HelpResponse.fromPromise(response,
                    Database
                        .trashCans
                        .get(input.trashcanID)
                        .update({responderName: ''})
                        .run(Database.connection)
                );
            }
        }
    };

    export const retractTrashCanValidator = checkSchema({
        departmentSlug: { in: 'params' },
        courseSlug: { in: 'params' },
        trashcanID: { in: 'params' },
    });
    export const retractTrashCan: RequestHandler = async ( request, response ) => {
        const user = getUser(request);
        const input = matchedData(request);
        
        let can = await Database.trashCans.get(input.trashcanID).run(Database.connection);

        if(!can || can.active == false) {
            return HelpResponse.error(response, 'TrashCan does not exist', 404);
        }

        // Retracted by the student
        if(can.userID && can.userID == user.id) {
            return HelpResponse.fromPromise(response, 
                Database
                .trashCans
                .get(input.trashcanID)
                .update({active: false, retractedBy: 'student', retractedAt: r.now()})
                .run(Database.connection)
            );
        }

        // Removed by a TA/lecturer/admin
        if (await adminOrAssociated(user, input.departmentSlug, input.courseSlug)) {
            return HelpResponse.fromPromise(response, 
                Database
                .trashCans
                .get(input.trashcanID)
                .update({active: false, retractedBy: user.id, retractedAt: r.now()})
                .run(Database.connection)
            );
        }
    }

}
