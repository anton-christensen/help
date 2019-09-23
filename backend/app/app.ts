import express from "express";
import { AddressInfo } from "net";
import * as dotenv from "dotenv";
import { Database } from "./database";
import { departmentRouter, courseRouter, userRouter } from './routes';
import { AuthMiddleware } from "./lib/auth";
import { StreamMiddleware, StreamWorker } from "./lib/stream";
import { trashCanRouter } from "./routes/trashCans";
import {get} from 'http'
import { RequestOptions } from "https";

dotenv.config();

Database.init().then(() => {
    const app = express();

    app.use(express.json())
    app.use((req, res, next) => {
        console.log(`${req.method}: ${req.path}`);
        next();
    });

    // get user from auth-token
    app.use(AuthMiddleware);
    app.use(StreamMiddleware);

    app.use( '/', departmentRouter );
    app.use( '/', courseRouter );
    app.use( '/', trashCanRouter );
    app.use( '/', userRouter)
    
    app.use((req, res, next) => {
        console.log("finished: ", req.path);
        next();
    });
    
    var server = app.listen(process.env.API_PORT, function() {
        try {
            let host = (server.address() as AddressInfo).address;
            let port = (server.address() as AddressInfo).address;
            console.log( 'App is listening on http://%s:%s', host, port );
        } catch {}
    } );

    StreamWorker.start();

});
