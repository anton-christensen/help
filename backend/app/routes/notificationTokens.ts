import { Router } from 'express';
import { Database } from '../database';
import { getUser, userRoleIn, userIsAssociatedWithCourse } from '../lib/auth';
import { HelpResponse } from '../lib/responses';
import { shouldStream, createStream } from '../lib/stream';

export const notificationTokensRouter = Router();

notificationTokensRouter
.get('/departments/:departmentSlug/courses/:courseSlug/trashcans/notificationtokens/:deviceID', async (request, response) => {
    const user = getUser(response);
    const dpSlug = request.params.departmentSlug;
    const cSlug = request.params.courseSlug;
    const dID = request.params.deviceID;
    
    let query;
    query = Database.notificationTokens
    .filter({
        userID: user.id,
        deviceID: dID,
        departmentSlug: dpSlug,
        courseSlug: cSlug
    });

    if(shouldStream(response)) {
        createStream(
            response,
            `GET(${user.id}:${dID}):/${dpSlug}/${dpSlug}/notifyToken/`,
            query.changes(),
            (err, row) => row
        );
    }

    let notificationTokens = await query.run(Database.connection);
    response.send(JSON.stringify(notificationTokens) + '\n');
});

notificationTokensRouter
.post('/departments/:departmentSlug/courses/:courseSlug/trashcans/notificationtokens', async (request, response) => {
    const user = getUser(response);
    const dpSlug = request.params.departmentSlug;
    const cSlug = request.params.courseSlug;
    const dID = request.body.deviceID;
    const token = request.body.token

    if(
        (
            userRoleIn(user, ['admin']) ||
            (
                userRoleIn(user, ['TA', 'lecturer'])
                && 
                userIsAssociatedWithCourse(user, dpSlug, cSlug)
            )
        ) === false
    ) {
        // if not (admin or ((ta or lecturer) and associated with course))
        return HelpResponse.disallowed(response);
    }

    Database.notificationTokens.insert(
        {
            deviceID: dID,
            userID: user.id,
            departmentSlug: dpSlug,
            courseSlug: cSlug,
            token: token
        }
    )
    .run(Database.connection)
    .then( result => {
        response.send( result );
    })
    .catch( error => response.send( error ) );
});
