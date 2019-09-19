import { r, Connection, RCursor } from 'rethinkdb-ts';
import { Router } from 'express';
import { Database } from '../database';
import { check } from 'express-validator';

export const departmentRouter = Router();

departmentRouter
.get( '/departments', ( request, response ) => {
    Database.departments.run(Database.connection)
        .then( result => {
            response.send( result );
        })
        .catch( error => response.send( error ) );
});


departmentRouter
.get( '/departments/:departmentSlug', ( request, response ) => {
    Database.departments.filter({
        slug: request.params.departmentSlug
    })
    .run(Database.connection)
    .then( result => {
        response.send( result );
    })
    .catch( error => response.send( error ) );
});
