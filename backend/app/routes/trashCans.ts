import { r, Connection, RCursor } from 'rethinkdb-ts';
import { Router } from 'express';
import { Database } from '../database';
import { check } from 'express-validator';
import { HelpResponse } from '../lib/responses';
import { getUser, userRoleIn, userIsAssociatedWithCourse } from '../lib/auth';
import { TrashCan } from '../models/trashCan';
import { shouldStream, createStream } from '../lib/stream';

export const trashCanRouter = Router();

trashCanRouter
.get( '/departments/:departmentSlug/courses/:courseSlug/trashcans', async ( request, response ) => {
    const user = getUser(response);
    console.log(user, request.header('auth-token'));

    let query = Database.trashCans
    .filter({
        active: true,
        departmentSlug: request.params.departmentSlug,
        courseSlug: request.params.courseSlug
    });

    if(
        userRoleIn(user, ['student']) || 
        (
            userRoleIn(user, ['TA', 'lecturer']) && 
            !await userIsAssociatedWithCourse(user, request.params.departmentSlug, request.params.courseSlug)
        )
    ) {
        // get your own trashcan
        query = query.filter({userID: user.id});
        if(shouldStream(response)) {
            createStream(
                response, 
                `GET:/${request.params.departmentSlug}/${request.params.courseSlug}/trashcans/${user.id}`,
                query.changes(),
                (err, row) => row
            );
        }
        let cans = await query.run(Database.connection);
        return response.send(JSON.stringify(cans)+'\n');
    }
    if(shouldStream(response)) {
        createStream(
            response,
            `GET-ALL:/${request.params.departmentSlug}/${request.params.courseSlug}/trashcans`,
            query.changes(),
            (err, row) => row
        );
    }
    query = query.orderBy('created');
    let cans = await query.run(Database.connection);
    
    return response.send(JSON.stringify(cans)+'\n');
});

trashCanRouter
.post( '/departments/:departmentSlug/courses/:courseSlug/trashcans', async ( request, response ) => {
    const user = getUser(response);
    if(!user) {
        return HelpResponse.disallowed(response);
    }


    let can: TrashCan = {
        active: true,
        courseSlug: request.params.courseSlug,
        departmentSlug: request.params.departmentSlug,
        room: request.body.room,
        userID: user.id ? user.id : "",
        created: await r.now().run(Database.connection)
    };

    // TODO: check schema
    Database.trashCans.insert(can)
    .run(Database.connection)
    .then( result => {
        response.send( result );
    })
    .catch( error => response.send( error ) );
});

trashCanRouter
.delete( '/departments/:departmentSlug/courses/:courseSlug/trashcans/:trashcanID', ( request, response ) => {
    Database.trashCans.filter({
        active: true,
        departmentSlug: request.params.departmentSlug,
        courseSlug: request.params.courseSlug,
        id: request.params.trashcanID
    })
    .update({active: false})
    .run(Database.connection)
    .then( result => {
        response.send( result );
    })
    .catch( error => response.send( error ) );
});
