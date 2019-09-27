import { Router } from 'express';
import { Database } from '../database';
import { getUser, userRoleIn, userIsAssociatedWithCourse } from '../lib/auth';
import { HelpResponse } from '../lib/responses';
import { shouldStream, createStream } from '../lib/stream';

export const notificationTokensRouter = Router();

notificationTokensRouter
.get('/departments/:departmentSlug/courses/:courseSlug/trashcans/notificationtokens', async (request, response) => {
    const user = getUser(response);
    const dpSlug = request.params.departmentSlug;
    const cSlug = request.params.courseSlug;
    const body = request.body;
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
    
    let query;
    query = Database.notificationTokens
    .filter({
        userID: user.id,
        deviceID: body.deviceID,
        departmentSlug: dpSlug,
        courseSlug: cSlug
    });

    if(shouldStream(response)) {
        createStream(
            response,
            `GET(${user.id}):/user`,
            query.changes(),
            (err, row) => row
        );
    }

    let notificationTokens = await query.run(Database.connection);
    response.send(JSON.stringify(notificationTokens) + '\n');

});
