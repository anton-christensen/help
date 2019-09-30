
import { r } from 'rethinkdb-ts';
import { RequestHandler } from 'express';
import { Database } from '../database';
import { checkSchema, matchedData } from 'express-validator';
import { HelpResponse } from '../lib/responses';
import { getUser, userRoleIn, userIsAssociatedWithCourse } from '../lib/auth';
import { TrashCan } from '../models/trashCan';
import { shouldStream, createStream } from '../lib/stream';

export namespace TrashCanController {

    export const getUsersTrashCanValidator = checkSchema({
        departmentSlug: { in: ['params'], isString: true },
        courseSlug: { in: ['params'], isString: true }
    });
    export const getUsersTrashCan: RequestHandler = async ( request, response ) => {
        const user = getUser(request);
        const input = matchedData(request);
    
        let query = Database.trashCans
        .filter({
            active: true,
            departmentSlug: input.departmentSlug,
            courseSlug: input.courseSlug
        });
    
        if(
            userRoleIn(user, ['student']) || 
            (
                userRoleIn(user, ['TA', 'lecturer']) && 
                !await userIsAssociatedWithCourse(user, input.departmentSlug, input.courseSlug)
            )
        ) {
            // get your own trashcan
            query = query.filter({userID: user.id});
            createStream(
                response, 
                `GET:/${input.departmentSlug}/${input.courseSlug}/trashcans/${user.id}`,
                query.changes(),
                (err, row) => row
            );
            return HelpResponse.fromPromise(response, query.run(Database.connection));
        }
        createStream(
            response,
            `GET-ALL:/${input.departmentSlug}/${input.courseSlug}/trashcans`,
            query.changes(),
            (err, row) => row
        );
        query = query.orderBy('created');
        return HelpResponse.fromPromise(response, query.run(Database.connection));
    }

    export const createTrashCanValidator = checkSchema({
        departmentSlug: { in: 'params', isString: true },
        courseSlug: { in: 'params', isString: true },
        room: { in: 'body', isString: true },
    });
    export const createTrashCan: RequestHandler = async ( request, response ) => {
        const user = getUser(request);
        const input = matchedData(request);

        if(!user) {
            return HelpResponse.disallowed(response);
        }
    
        let can: TrashCan = {
            active: true,
            courseSlug: input.courseSlug,
            departmentSlug: input.departmentSlug,
            room: input.room,
            userID: user.id ? user.id : "",
            created: await r.now().run(Database.connection)
        };
    
        // TODO: check user doesn't already have a can out
        Database.trashCans.insert(can)
        .run(Database.connection)
        .then( result => {
            HelpResponse.success(response, result);
        })
        .catch( error => HelpResponse.error(response, error) );
    }

    export const retractTrashCanValidator = checkSchema({
        departmentSlug: { in: 'params' },
        courseSlug: { in: 'params' },
        trashcanID: { in: 'params' },
    });
    export const retractTrashCan: RequestHandler = ( request, response ) => {
        const input = matchedData(request);
        Database.trashCans.filter({
            active: true,
            departmentSlug: input.departmentSlug,
            courseSlug: input.courseSlug,
            id: input.trashcanID
        })
        .update({active: false})
        .run(Database.connection)
        .then( result => {
            HelpResponse.success(response, result);
        })
        .catch( error => HelpResponse.error(response, error) );
    }

}
