import { r, Connection, RCursor } from 'rethinkdb-ts';
import { Router } from 'express';
import { Database } from '../database';
import { check } from 'express-validator';
const router = Router();

router.get( '/', ( request, response ) => {
    Database.departments.run(Database.connection)
        .then( result => {
            response.send( result );
        })
        .catch( error => response.send( error ) );
});


router.get( '/:departmentSlug', ( request, response ) => {
    Database.departments.filter(
    {
        slug: request.params.departmentSlug
    })
    .run(Database.connection)
    .then( result => {
        response.send( result );
    })
    .catch( error => response.send( error ) );
});

module.exports = router;