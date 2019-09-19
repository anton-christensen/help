import * as crypto from "crypto";
import { Role, User } from "../models/user";
import { Response, RequestHandler } from "express";
import { AuthTokenFootprint } from "../models/authToken";
import { Database } from "../database";
import { r } from "rethinkdb-ts";

export const user = (response: Response): User => {
    let _user = (response.locals._user as User);
    return _user ? _user : {
        anon: true,
        role: 'student',
        name: '',
        email: ''
    }
}

export const userRole = (response: Response): Role => {
    return user(response).role;
}

export const generateToken = ():string => {
    return crypto.randomBytes(256).toString('hex');
}

export const hash = (data: string):string => {
    return crypto.createHash('sha256').update(data).digest('hex');
}

export const AuthMiddleware:RequestHandler = async (request, response, next) => {
    let token = request.header('auth-token');
    if(token) {
        token = hash(token);
        const footprint = (await Database.db.table('authTokens').get(token)
        .run(Database.connection) as AuthTokenFootprint);
        let now = await r.now().run(Database.connection);
        if(now < footprint.expiration) {
            response.locals._user = await Database.users.get(footprint.userID).run(Database.connection);
        }
    }
    next();
};