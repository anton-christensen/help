import { r, Connection, RCursor } from 'rethinkdb-ts';
import { Router } from 'express';
import { Database } from '../database';
const router = Router();

router.get( '/', ( request, response ) => {
    Database.courses.filter(
    {
        departmentSlug: request.params.departmentSlug
    })
    .run(Database.connection)
    .then( result => {
        response.send( result );
    })
    .catch( error => response.send( error ) );
});


router.get( '/:courseSlug', ( request, response ) => {
    Database.courses.filter(
    {
        departmentSlug: request.params.departmentSlug,
        slug: request.params.courseSlug
    })
    .run(Database.connection)
    .then( result => {
        response.send( result );
    })
    .catch( error => response.send( error ) );
});

router.post('/', (request, response) => {
    let data = request.body;
    Database.courses.insert(data)
    .run(Database.connection)
    .then( result => {
        response.send(result);
    });
});

router.put('/:courseSlug', (request, response) => {
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

router.delete('/:courseSlug', (request, response) => {
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

module.exports = router;