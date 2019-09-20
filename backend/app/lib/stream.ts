import * as crypto from "crypto";
import { Role, User } from "../models/user";
import { Response, RequestHandler } from "express";
import { AuthTokenFootprint } from "../models/authToken";
import { Database } from "../database";
import { r, RFeed } from "rethinkdb-ts";
const grip = require('grip');
const expressGrip = require('express-grip');
expressGrip.configure({
    gripProxyRequired: true,
    gripProxies: [{ 'control_uri': 'http://pushpin:5561',}]
});

export const StreamMiddleware:RequestHandler = async (request, response, next) => {
    let shouldStream = (request.header('stream') ? true : false);
    response.locals._shouldStream = shouldStream;

    if(shouldStream) {
        response.header('Grip-Hold', 'stream');
        response.header('Grip-Channel', 'test');
    }

    next();
};

export class StreamLib {
    public static shouldStream = (response: Response): User => {
        return response.locals._shouldStream;
    }

    public static createStream = (dbStream :RFeed, channel: string, response: Response) => {
    
    }
    
    
    public static streamWorker = () => {
        setInterval(() => {
            console.log("sending data");
            expressGrip.publish('test', new grip.HttpStreamFormat("-published data-" + '\n'));
        }, 2000);
    }
}
