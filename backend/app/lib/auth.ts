import * as crypto from "crypto";
import { Role, User } from "../models/user";
import { Response, RequestHandler } from "express";
import { AuthTokenFootprint } from "../models/authToken";
import { Database } from "../database";
import { r } from "rethinkdb-ts";
import { HelpResponse } from "./responses";

export const getUser = (response: Response): User => {
    let _user = (response.locals._user as User);
    return _user ? _user : {
        anon: true,
        role: 'student',
        id: '',
        name: '',
        email: ''
    }
}

export const userRoleIn = (user: User, roles: Role[]): boolean => {
    return roles.includes(user.role);
}

export const userRole = (response: Response): Role => {
    return getUser(response).role;
}

export const userIsAssociatedWithCourse = async (user: User, departmentSlug: string, courseSlug: string) => {
    return await Database.courses.filter({
        departmentSlug: departmentSlug,
        slug: courseSlug
    })('associatedUserIDs').nth(0).contains(user.id ? user.id : null).run(Database.connection);
}

export const generateToken = ():string => {
    return crypto.randomBytes(64).toString('hex');
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
    if(!userRoleIn(getUser(response), ['student', 'TA', 'lecturer', 'admin'])) {
        return HelpResponse.error(response, "Unknown user role");
    }
    next();
};