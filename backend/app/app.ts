import {AddressInfo} from 'net';
import {Database} from './database';
import {departmentRouter, courseRouter, userRouter, postRouter, trashCanRouter} from './routes';
import {AuthMiddleware, generateToken} from './lib/auth';
import {StreamMiddleware, StreamWorker} from './lib/stream';
import {notificationTokensRouter} from './routes';
import {OnUpdateWorker} from './lib/dataChanges';
import {HelpResponse} from './lib/responses';
import express from 'express';
import * as dotEnv from 'dotenv';
import compression from 'compression';
import cors from 'cors';

dotEnv.config();

Database.init().then(() => {
    const app = express();
    app.use(express.json());
    app.use(compression());
    app.use(cors())

    // disable caching
    app.use(function (req, res, next) {
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
        next();
    });

    app.use((req, res, next) => {
        console.log(`${req.method}: ${req.path}`);
        res.contentType('json');
        next();
    });

    app.get('/anon/auth', async (request, response) => {
        HelpResponse.success(response, {token: generateToken()});
    });

    // get user from auth-token
    app.use(AuthMiddleware);
    app.use(StreamMiddleware);

    app.use('/', departmentRouter);
    app.use('/', courseRouter);
    app.use('/', postRouter);
    app.use('/', trashCanRouter);
    app.use('/', userRouter);
    app.use('/', notificationTokensRouter);
    
    app.use((req, res, next) => {
        console.log('finished: ', req.path);
        next();
    });
    
    const server = app.listen(process.env.API_PORT, function() {
        try {
            const host = (server.address() as AddressInfo).address;
            const port = (server.address() as AddressInfo).port;
            console.log( 'App is listening on http://%s:%s', host, port );
        } catch {}
    } );

    StreamWorker.start();
    OnUpdateWorker.start();
});
