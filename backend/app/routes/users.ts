import { r, Connection, RCursor, RDatum } from 'rethinkdb-ts';
import { Router, RequestHandler } from 'express';
import { Database } from '../database';
import { check } from 'express-validator';
import got = require('got');
import { User } from '../models/user';
import { AuthTokenFootprint } from '../models/authToken';
import { generateToken, hash, getUser, userRoleIn } from '../lib/auth';
import { HelpResponse } from '../lib/responses';

export const userRouter = Router();

userRouter
.get('/user', (request, response) => {
    response.send(getUser(response));
});

userRouter
.get( '/user/_auth', ( request, response ) => {
    if (typeof(request.query.target) !== 'string') {
        response.send(`I don't know where to send you...`);
        return;
    }
    if (typeof(request.query.ticket) !== 'string') {
        response.send(`You need to come from the authentication service...`);
        return;
    }
    got(
        `https://login.aau.dk/cas/samlValidate?TARGET=${encodeURI(request.query.target)}`, 
        { 
            method: 'post',
            body: `<?xml version=\"1.0\" encoding=\"utf-8\"?>
                   <SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\">
                       <SOAP-ENV:Header/>
                       <SOAP-ENV:Body>
                           <samlp:Request xmlns:samlp=\"urn:oasis:names:tc:SAML:1.0:protocol\"  MajorVersion=\"1\" MinorVersion=\"1\">
                               <samlp:AssertionArtifact>${request.query.ticket}</samlp:AssertionArtifact>
                           </samlp:Request>
                       </SOAP-ENV:Body>
                   </SOAP-ENV:Envelope>`
        },
    )
    .then(casResponse => {
        let body = casResponse ? casResponse.body : "";

        if (!body.includes('samlp:Success')) {
            throw "authentication error";
        }
             
        let extractMatch = (match: RegExpExecArray | null) => {
            if(match == null || match.length < 2) {
                throw "decode error";
            }
            return match[1];
        };
        const email = extractMatch(new RegExp('<Attribute AttributeName="mail" AttributeNamespace="http://www.ja-sig.org/products/cas/"><AttributeValue>([^<]+)</AttributeValue>').exec(body));
        const firstName = extractMatch(new RegExp('<Attribute AttributeName="givenName" AttributeNamespace="http://www.ja-sig.org/products/cas/"><AttributeValue>([^<]+)</AttributeValue>').exec(body));
        const lastName = extractMatch(new RegExp('<Attribute AttributeName="sn" AttributeNamespace="http://www.ja-sig.org/products/cas/"><AttributeValue>([^<]+)</AttributeValue>').exec(body));
        
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
            response.redirect(`${request.query.target}?token=${authToken}`);
        });
    })
    .catch(error => {
        console.log("New token error: ", error);
        response.send(error);
    });
});

userRouter
.get('/users', async (request, response) => {
    let user = getUser(response);
    if(userRoleIn(user, ['student', 'TA'])) {
        return HelpResponse.dissalowed(response);
    }
    else if(userRoleIn(user, ['lecturer', 'admin'])) {
        let users = await Database.users.filter((user: RDatum) =>
            r.or(
                r.row('name').downcase().match(request.query.q.toLowerCase()).eq(null).not(),
                r.row('email').downcase().match(request.query.q.toLowerCase()).eq(null).not()
            )
        ).run(Database.connection);
        response.send(users);
    }
    else {
        return HelpResponse.error(response, 'Unknown user role');
    }
});