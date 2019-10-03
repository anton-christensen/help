import * as crypto from "crypto";
import { Role, User } from "../models/user";
import { Response, Request, RequestHandler } from "express";
import { AuthTokenFootprint } from "../models/authToken";
import { Database } from "../database";
import { r } from "rethinkdb-ts";
import { HelpResponse } from "./responses";

export const getUser = (request: Request): User => {
    let _user = ((request as any)._user as User);
    return _user;
}

export const userRoleIn = (user: User, roles: Role[]): boolean => {
    return roles.includes(user.role);
}

export const userRole = (request: Request): Role => {
    return getUser(request).role;
}

export const userIsAssociatedWithCourse = async (user: User, departmentSlug: string, courseSlug: string) => {
    return await Database.courses.filter({
        departmentSlug: departmentSlug,
        slug: courseSlug
    })('associatedUserIDs').contains(function(idList) { return idList.contains(user.id ? user.id : null) }).run(Database.connection);
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
        if(!footprint) {
            let user = {
                anon: true,
                id: '',
                email: '',
                name: '',
                role: 'student'
            }
            user.id = await r.uuid(token).run(Database.connection);
            (request as any)._user = (user as any);
            return next();
        }

        let now = await r.now().run(Database.connection);
        if(now < footprint.expiration) {
            (request as any)._user = await Database.users.get(footprint.userID).run(Database.connection);
        }
        
        if(!userRoleIn(getUser(request), ['student', 'TA', 'lecturer', 'admin'])) {
            return HelpResponse.error(response, "Unknown user role");
        }
        return next();
    }
    else {
        return next();
    }
};
