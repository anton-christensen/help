import { r, Connection, RCursor } from 'rethinkdb-ts';
import { Router } from 'express';
import { Database } from '../database';
import { check } from 'express-validator';
import { HelpResponse } from '../lib/responses';

export const trashCanRouter = Router();

trashCanRouter
.get( '/departments/:departmentSlug/courses/:courseSlug/trashcan', async ( request, response ) => {
    let courses = await Database.courses.filter({
        departmentSlug: request.params.departmentSlug,
        slug: request.params.courseSlug
    }).withFields('id').run(Database.connection);
    
    if(courses.length < 1) {
        return HelpResponse.error(response, "No such course");
    }
    let courseID = courses[0].id;

    Database.trashCans.filter({
        courseID: courseID
    });

    Database.departments.run(Database.connection)
        .then( result => {
            response.send( result );
        })
        .catch( error => response.send( error ) );
});

trashCanRouter
.post( '/departments/:departmentSlug/courses/:courseSlug/trashcan', ( request, response ) => {
    Database.departments.filter({
        slug: request.params.departmentSlug
    })
    .run(Database.connection)
    .then( result => {
        response.send( result );
    })
    .catch( error => response.send( error ) );
});

trashCanRouter
.delete( '/departments/:departmentSlug/courses/:courseSlug/trashcan', ( request, response ) => {
    Database.departments.filter({
        slug: request.params.departmentSlug
    })
    .run(Database.connection)
    .then( result => {
        response.send( result );
    })
    .catch( error => response.send( error ) );
});
