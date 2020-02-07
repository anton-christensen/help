import { RequestHandler } from 'express';
import { Database } from '../database';
import { checkSchema, matchedData } from 'express-validator';
import { HelpResponse } from '../lib/responses';
import { getUser, userRoleIn, userIsAssociatedWithCourse } from '../lib/auth';
import { shouldStream, createStream } from '../lib/stream';

export namespace NotificationTokenController {

    export const getUsersNotificationTokenValidator = checkSchema({
        departmentSlug: { in: ['params'] },
        courseSlug: { in: ['params'] },
        deviceID: { in: ['params'] },
        _user: { in: ['params'] }
    });
    export const getUsersNotificationToken: RequestHandler = async (request, response) => {
        const user = getUser(request);
        const input = matchedData(request);
        
        let query;
        query = Database.notificationTokens
        .filter({
            userID: user.id,
            deviceID: input.deviceID,
            departmentSlug: input.departmentSlug,
            courseSlug: input.courseSlug
        });
    
        if(shouldStream(response)) {
            createStream(
                response,
                `GET(${user.id}:${input.deviceID}):/${input.departmentSlug}/${input.courseSlug}/notifyToken/`,
                query.changes(),
                (err, row) => row
            );
        }
    
        let notificationTokens = await query.run(Database.connection);
        if(notificationTokens.length)
            HelpResponse.success(response, notificationTokens[0]);
        else
            HelpResponse.success(response, null);
    }


    export const insertNotificationTokenValidator = checkSchema({
        departmentSlug: { in: ['params'], isString: true },
        courseSlug: { in: ['params'], isString: true },
        deviceID: { in: ['body'], isString: true},
        token: { in: ['body'], isString: true},
    });
    export const insertNotificationToken: RequestHandler = async (request, response) => {
        const user = getUser(request);
        const input = matchedData(request);
    
        if(
            (
                userRoleIn(user, ['admin']) ||
                (
                    userRoleIn(user, ['TA', 'lecturer'])
                    && 
                    userIsAssociatedWithCourse(user, input.departmentSlug, input.courseSlug)
                )
            ) === false
        ) {
            // if not (admin or ((ta or lecturer) and associated with course))
            return HelpResponse.disallowed(response);
        }
    
        Database.notificationTokens.insert(
            {
                deviceID: input.deviceID,
                userID: user.id,
                departmentSlug: input.departmentSlug,
                courseSlug: input.courseSlug,
                token: input.token
            }
        )
        .run(Database.connection)
        .then( result => {
            HelpResponse.success(response, result);
        })
        .catch( error => HelpResponse.error(response, error) );
    }


    export const deleteNotificationTokenValidator = checkSchema({
        departmentSlug: { in: ['params'] },
        courseSlug: { in: ['params'] },
        deviceID: { in: ['params'] },
        _user: { in: ['params'] }
    });
    export const deleteNotificationToken: RequestHandler = async (request, response) => {
        const user = getUser(request);
        const input = matchedData(request);
        
        let query;
        query = Database.notificationTokens
        .filter({
            userID: user.id,
            deviceID: input.deviceID,
            departmentSlug: input.departmentSlug,
            courseSlug: input.courseSlug
        }).delete();
    
        let notificationTokens = await query.run(Database.connection);
        HelpResponse.success(response, notificationTokens);
    }

}
