import { getUser, userRoleIn, generateToken, hash } from "../lib/auth";
import { shouldStream, createStream } from "../lib/stream";
import { Database } from "../database";
import { RequestHandler } from "express";
import { HelpResponse } from "../lib/responses";
import { r, RDatum } from "rethinkdb-ts";
import { User } from "../models/user";
import { AuthTokenFootprint } from "../models/authToken";
import got = require("got");
import { checkSchema, matchedData } from "express-validator";

export namespace UserController {
    export const getAuthedUserValidator = checkSchema({});
    export const getAuthedUser: RequestHandler = async (request, response) => {
        const user = getUser(request);
        console.log(user);
        let query;
        if(user.anon === false) {
            query = Database.users.get(user.id);
            createStream(
                response,
                `GET(${user.id}):/user`,
                query.changes(),
                (err, row) => row
            );
        }
        HelpResponse.success(response, user);
    }


    export const getUserByIDValidator = checkSchema({
        userID: { in: ['params'] }
    });
    export const getUserByID: RequestHandler = async (request, response) => {
        let user = getUser(request);
        if(userRoleIn(user, ['student', 'TA'])) {
            return HelpResponse.disallowed(response);
        }
        else if(userRoleIn(user, ['lecturer', 'admin'])) {
            let query = Database.users.get(request.params.userID);
            
            if(shouldStream(response)) {
                createStream(
                    response,
                    `GET:/users/${request.params.userID}`,
                    query.changes(),
                    (err, row) => row
                );
            }
    
            HelpResponse.fromPromise(response, query.run(Database.connection));
        }
    }
    
    export const getUsersByQueryValidator = checkSchema({
        q: { in: ['query'], isString: true},
        p: { in: ['query'], optional: true, isInt: true, toInt: true },
        l: { in: ['query'], optional: true, isInt: true, toInt: true },
        _user: { in: ['params'] }
    });
    export const getUsersByQuery: RequestHandler = async (request, response) => {
        let user = getUser(request);
        const input = matchedData(request);
        let page = (input.p ? input.p : 0);
        let limit = (input.l ? input.l : 10);
        
        if(limit > 25 || limit < 1) {
            HelpResponse.error(response, 'limit must be in range [1..25]')
        }
        if(page < 0) {
            HelpResponse.error(response, 'page cannot be negative');
        }
    
        if(userRoleIn(user, ['student', 'TA'])) {
            return HelpResponse.disallowed(response);
        }
        else if(userRoleIn(user, ['lecturer', 'admin'])) {
            let query = Database.users.filter((user: RDatum) =>
                r.or(
                    r.row('name').downcase().match(input.q.toLowerCase()).eq(null).not(),
                    r.row('email').downcase().match(input.q.toLowerCase()).eq(null).not()
                )
            );
            
            const count = Math.ceil(await query.count().run(Database.connection) / limit);
            query = query.skip(page*limit).limit(limit);
    
            createStream(
                response,
                `GET:/users?q=${input.q.toLowerCase()}`,
                query.changes(),
                (err, row) => row
            );
            query.orderBy('name');
            
            HelpResponse.pagedFromPromise(response, count, query.run(Database.connection));
            // HelpResponse.fromPromise(response, query.run(Database.connection));
        }
    }

    export const createUserValidator = checkSchema({
        email: { in: ['body'], isEmail:  true },
        role:  { in: ['body'], isIn: { options: [['TA', 'student', 'lecturer', 'admin']] } },
        name:  { in: ['body'], optional: true, isString: true },
    });
    export const createUser: RequestHandler = (request, response) => {
        const user = getUser(request);
        const input = matchedData(request);
        input.anon = false;
    
        if(userRoleIn(user, ['student', 'TA'])) {
            return HelpResponse.disallowed(response);
        }
        else if(user.role == 'lecturer' && (input.role == 'admin' || input.role == 'lecturer')) {
            return HelpResponse.disallowed(response);
        }

        // TODO: Check that user email is unique
    
        HelpResponse.fromPromise(response, Database.users.insert(input).run(Database.connection));
    }

    export const updateUserValidator = checkSchema({
        userID:{ in: ['params'] },
        email: { in: ['body'], optional: true, isEmail:  true },
        role:  { in: ['body'], optional: true, isIn: { options: [['TA', 'student', 'lecturer', 'admin']] } },
        name:  { in: ['body'], optional: true, isString: true },
    });
    export const updateUser: RequestHandler = (request, response) => {
        const user = getUser(request);
        const input = matchedData(request, {locations: ['body']});
        const params = matchedData(request, {locations: ['params']});
        input.anon = false;
    
        if(userRoleIn(user, ['student', 'TA'])) {
            return HelpResponse.disallowed(response);
        }
        else if(user.role == 'lecturer' && (input.role == 'admin' || input.role == 'lecturer')) {
            return HelpResponse.disallowed(response);
        }

        // TODO: Check that user email is unique
    
        HelpResponse.fromPromise(response, Database.users.get(params.userID).update(input).run(Database.connection));
    }

    export const deleteUserValidator = checkSchema({
        userID:{ in: ['params'] },
    });
    export const deleteUser: RequestHandler = (request, response) => {
        const user = getUser(request);
        const params = matchedData(request, {locations: ['params']});
    
        if(userRoleIn(user, ['student', 'TA', 'lecturer'])) {
            return HelpResponse.disallowed(response);
        }

        HelpResponse.fromPromise(response, Database.users.get(params.userID).delete().run(Database.connection));
    }

    export const validateCASLoginValidator = checkSchema({
        target: { in: ['query'], isString: true },
        ticket: { in: ['query'], isString: true },
    });
    export const validateCASLogin: RequestHandler = ( request, response ) => {
        const input = matchedData(request);
        
        got(
            `https://signon.aau.dk/cas/samlValidate?TARGET=${process.env.API_HOST}${request.path}?target=${encodeURI(input.target)}`, 
            { 
                method: 'post',
                body: `<?xml version=\"1.0\" encoding=\"utf-8\"?>
                       <SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\">
                           <SOAP-ENV:Header/>
                           <SOAP-ENV:Body>
                               <samlp:Request xmlns:samlp=\"urn:oasis:names:tc:SAML:1.0:protocol\"  MajorVersion=\"1\" MinorVersion=\"1\">
                                   <samlp:AssertionArtifact>${input.ticket}</samlp:AssertionArtifact>
                               </samlp:Request>
                           </SOAP-ENV:Body>
                       </SOAP-ENV:Envelope>`
            },
        )
        .then((casResponse) => {
            let body = casResponse ? casResponse.body : "";
    
            if (!body.includes('saml1p:Success')) {
                throw "authentication error" + JSON.stringify(request);
            }
                 
            let extractMatch = (match: RegExpExecArray | null) => {
                if(match == null || match.length < 2) {
                    throw "decode error: " + body;
                }
                return match[1];
            };
            const email = extractMatch(new RegExp('<saml1:Attribute AttributeName="mail" AttributeNamespace="http://www.ja-sig.org/products/cas/"><saml1:AttributeValue xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xsd:string">([^<]+)</saml1:AttributeValue></saml1:Attribute>').exec(body));
            const firstName = extractMatch(new RegExp('<saml1:Attribute AttributeName="givenName" AttributeNamespace="http://www.ja-sig.org/products/cas/"><saml1:AttributeValue xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xsd:string">([^<]+)</saml1:AttributeValue></saml1:Attribute>').exec(body));
            const lastName = extractMatch(new RegExp('<saml1:Attribute AttributeName="sn" AttributeNamespace="http://www.ja-sig.org/products/cas/"><saml1:AttributeValue xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xsd:string">([^<]+)</saml1:AttributeValue></saml1:Attribute>').exec(body));
            
            return Database.users.filter({email: email})
            .run(Database.connection)
            .then(queryResult => {
                if(queryResult.length == 0) {
                    // Create a new user
                    const user: User = {
                        email,
                        anon: false,
                        name: `${firstName} ${lastName}`,
                        role: 'student',
                    };
    
                    return Database.users.insert(user, {returnChanges: true})
                    .run(Database.connection)
                    .then(insertResult => {
                        if(insertResult.changes && insertResult.changes[0].new_val) {
                            return Promise.resolve((insertResult.changes[0].new_val as User));
                        }
                        else
                            throw "DB insertion error";
                    });
                }
                else {
                    const user = (queryResult[0] as User);
                    if(user.name && user.name.length) {
                        return Promise.resolve(user);
                    }
                    else {
                        // TODO: update users name
                        return Database.users.get(user.id)
                        .update({name: `${firstName} ${lastName}`}, {returnChanges: "always"})
                        .run(Database.connection)
                        .then(updateResult => {
                            if(updateResult.changes && updateResult.changes[0].new_val) {
                                return Promise.resolve((updateResult.changes[0].new_val as User));
                            }
                            else
                                throw "DB update error";
                        });
                    }
                }
            });
            
        })
        .catch(error => {
            console.log("CAS Error: ", error);
            response.send(error);
        })
        .then(async value => {
            const user = (value as User);
            if(user.id == undefined) throw "Not a user"
            const authToken = generateToken();
            const tokenExpirationInDays = process.env.TOKEN_DAYS_LIFETIME ? parseInt(process.env.TOKEN_DAYS_LIFETIME) : 7;
            const tokenFootprint: AuthTokenFootprint = {
                hash: hash(authToken),
                userID: user.id,
                expiration: await r.now().add(tokenExpirationInDays*24*60*60).run(Database.connection)
            }
            
            return Database.db.table('authTokens').insert(tokenFootprint)
            .run(Database.connection)
            .then( insertQuery => {
                console.log("Successfully authenticated: ", tokenFootprint);
                response.redirect(`${input.target}?token=${authToken}`);
            });
        })
        .catch(error => {
            console.log("New token error: ", error);
            response.send(error);
        });
    }
}