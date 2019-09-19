import express from "express";
import { AddressInfo } from "net";
import * as dotenv from "dotenv";
import { Database } from "./database";

// const bodyParser = require( 'body-parser' );
// const cors = require( 'cors' );
// const helmet = require( 'helmet' );
// require('dotenv').config();
dotenv.config();

Database.init().then(() => {
    const app = express();
    
    
    // app.use( logger( 'dev' ) );
    // app.use( bodyParser.urlencoded( {
    //     extended: false
    // } ) );
    // app.use( cors() );
    // app.use( helmet() );
    
    
    const departments = require('./routes/departments');
    const courses = require('./routes/courses');
    
    app.use( express.json() )

    app.use((req, res, next) => {
        console.log(`${req.method}: ${req.path}`);
        next();
    });
    app.use( '/departments', departments );
    app.use( '/departments/:departmentSlug/courses', courses );
    
    app.use((req, res, next) => {
        console.log("finished: ", req.path);
        next();
    });

    // app.use( ( error, request, response, next ) => {
    //     response.status( error.status || 500 );
    //     response.json( {
    //         error: error.message
    //     } );
    // } );
    
    // app.use( ( request, response, next ) => {
    //     let error = new Error( 'Not Found' );
    //     error.status = 404;
    //     response.json( error );
    // } );
    
    var server = app.listen(process.env.API_PORT, function() {
        try {
            let host = (server.address() as AddressInfo).address;
            let port = (server.address() as AddressInfo).address;
            console.log( 'App is listening on http://%s:%s', host, port );
        } catch {}
    } );
});
