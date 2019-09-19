import { r, Connection, RCursor } from 'rethinkdb-ts';
import { Router } from 'express';
import { Database } from '../database';

export const courseRouter = Router();

courseRouter
.get('/courses', (request, response) => {
    Database.courses
    .run(Database.connection)
    .then( result => {
        response.send( result );
    })
    .catch(error => response.send(error));
});

courseRouter
.get('/departments/:departmentSlug/courses', ( request, response ) => {
    Database.courses.filter({
        departmentSlug: request.params.departmentSlug
    })
    .run(Database.connection)
    .then( result => {
        response.send( result );
    })
    .catch(error => response.send(error));
});


courseRouter
.get('/departments/:departmentSlug/courses/:courseSlug', ( request, response ) => {
    Database.courses.filter({
        departmentSlug: request.params.departmentSlug,
        slug: request.params.courseSlug
    })
    .run(Database.connection)
    .then( result => {
        response.send( result );
    })
    .catch( error => response.send( error ) );
});

courseRouter
.post('/departments/:departmentSlug/courses/', (request, response) => {
    let data = request.body;
    Database.courses.insert(data)
    .run(Database.connection)
    .then( result => {
        response.send(result);
    });
});

courseRouter
.put('/departments/:departmentSlug/courses/:courseSlug', (request, response) => {
    let data = request.body;
    Database.courses.filter({
        departmentSlug: request.params.departmentSlug,
        slug: request.params.courseSlug
    }).update(data, {returnChanges: true})
    .run(Database.connection)
    .then( result => {
        response.send(result);
    });
});

courseRouter
.delete('/departments/:departmentSlug/courses/:courseSlug', (request, response) => {
    Database.courses.filter({
        departmentSlug: request.params.departmentSlug,
        slug: request.params.courseSlug
    })
    .delete({returnChanges: true})
    .run(Database.connection)
    .then( result => {
        response.send(result);
    })
});
