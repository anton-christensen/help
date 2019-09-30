import { r, Connection, RCursor, RDatum } from 'rethinkdb-ts';
import { Router } from 'express';
import { Database } from '../database';
import { getUser, userRoleIn, userIsAssociatedWithCourse } from '../lib/auth';
import { HelpResponse } from '../lib/responses';
import { User } from '../models/user';
import { shouldStream, createStream } from '../lib/stream';

export const courseRouter = Router();

courseRouter
.get('/courses', (request, response) => {
    let user = getUser(response);
    if(userRoleIn(user, ['student', 'TA'])) {
        // disallow
        return HelpResponse.disallowed(response);
    }

    let query = Database.courses
                .filter(
                    (course:RDatum<any>) => 
                        course('associatedUserIDs').contains(user.id ? user.id : null)
                );

    if(shouldStream(response)) {
        createStream(
            response,
            `GET(${user.id}):/courses`,
            query.changes(),
            (err, row) => row
        );
    }

    query.run(Database.connection)
    .then( result => {
        response.send( JSON.stringify(result)+'\n' );
    })
    .catch(error => error(response, error));
});

courseRouter
.post('/courses', (request, response) => {
    const user = getUser(response);
    if(userRoleIn(user, ['student', 'TA'])) {
        // disallow
        return HelpResponse.disallowed(response);
    }
    
    // TODO: validate schema
    let data = request.body;
    Database.courses.insert(data)
    .run(Database.connection)
    .then( result => {
        response.send(result);
    });
});

courseRouter
.get('/departments/:departmentSlug/courses', async ( request, response ) => {
    let user = getUser(response);

    // default filter: department
    let query = Database.courses.filter({
        departmentSlug: request.params.departmentSlug
    });
    // r.db('help').table('courses').filter({enabled: true}).union(r.db('help').table('courses').filter(c => c('associatedUserIDs').contains('2ab7fc83-f8fa-4da5-9085-155545e0d6c1'))).distinct()
    if(userRoleIn(user, ['student'])) {
        // get active courses on department
        query = query.filter({enabled: true});
    }
    else if(userRoleIn(user, ['TA', 'lecturer'])) {
        // get active & associated courses on department
        query = query.filter((course:RDatum) => {
            return r.or(
                course('enabled').eq(true),
                course('associatedUserIDs').contains(user.id ? user.id : null),
            )
        });
    }
    else if(userRoleIn(user, ['admin'])) {
        // get all courses on department
    }
    if(shouldStream(response)) {
        createStream(
            response,
            `GET(${user.id}):/${request.params.departmentSlug}/courses`,
            query.changes(),
            (err, row) => row
        );
    }

    query.run(Database.connection)
    .then( result => {
        response.send( JSON.stringify(result) + '\n' );
    })
    .catch(error => HelpResponse.error(response, error));
});


courseRouter
.get('/departments/:departmentSlug/courses/:courseSlug', ( request, response ) => {
    let query = Database.courses.filter({
        departmentSlug: request.params.departmentSlug,
        slug: request.params.courseSlug
    });

    if(shouldStream(response)) {
        createStream(
            response,
            `GET:/${request.params.departmentSlug}/${request.params.courseSlug}`,
            query.changes(),
            (err, row) => row.new_val
        )
    }
    query.run(Database.connection)
    .then( result => {
        // TODO: check om der er et resultat
        response.send( JSON.stringify(result[0])+'\n');
    })
    .catch( error => response.send( error ) );
});


courseRouter
.put('/departments/:departmentSlug/courses/:courseSlug', async (request, response) => {
    let data = request.body;
    
    const user = getUser(response);
    if(user.role == 'student') {
        // disallow
        return HelpResponse.disallowed(response);
    }
    else if(user.role == 'TA' && 'enabled' in data) {
        // TODO: disallow if other keys than enabled

        // remove all but enabled property
        data = {enabled: data.enabled};
    }
    
    if(userRoleIn(user, ['TA', 'lecturer'])) {
        try {
            
            if(!userIsAssociatedWithCourse(user, request.params.departmentSlug, request.params.courseSlug))
                return HelpResponse.disallowed(response);
        }
        catch(error) {
            return HelpResponse.error(response, error);
        }
    }
    
    // TODO: validate schema
    Database.courses.filter({
        departmentSlug: request.params.departmentSlug,
        slug: request.params.courseSlug
    }).update(data, {returnChanges: true})
    .run(Database.connection)
    .then( result => {
        response.send(result);
    });
});

courseRouter
.delete('/departments/:departmentSlug/courses/:courseSlug', (request, response) => {
    const user = getUser(response);
    if(userRoleIn(user, ['student', 'TA'])) {
        return HelpResponse.disallowed(response);
    }
    if(user.role == 'lecturer') {
        if(!userIsAssociatedWithCourse(user, request.params.departmentSlug, request.params.courseSlug))
            return HelpResponse.disallowed(response);
    }

    Database.courses.filter({
        departmentSlug: request.params.departmentSlug,
        slug: request.params.courseSlug
    })
    .delete({returnChanges: true})
    .run(Database.connection)
    .then( result => {
        response.send(result);
    })
});

courseRouter
.get('/departments/:departmentSlug/courses/:courseSlug/posts', (request, response) => {
    let query = Database.posts.filter({
        departmentSlug: request.params.departmentSlug,
        courseSlug: request.params.courseSlug
    });

    if(shouldStream(response)) {
        createStream(
            response,
            `GET-ALL:/${request.params.departmentSlug}/${request.params.courseSlug}/posts`,
            query.changes(),
            (err, row) => row
        );
    }

    query.run(Database.connection)
    .then(result => {
        response.send(JSON.stringify(result)+'\n');
    });
});

courseRouter
.post('/departments/:departmentSlug/courses/:courseSlug/posts', (request, response) => {
    const user = getUser(response);
    if(userRoleIn(user, ['student'])) {
        return HelpResponse.disallowed(response);
    }
    else if(userRoleIn(user, ['TA', 'lecturer'])) {
        if(!userIsAssociatedWithCourse(user, request.params.departmentSlug, request.params.courseSlug))
            return HelpResponse.disallowed(response);
    }

    let post = request.body;
    // TODO: validate post

    Database.posts.insert(post)
    .run(Database.connection)
    .then(result => {
        response.send(result);
    });
});

courseRouter
.put('/departments/:departmentSlug/courses/:courseSlug/posts/:postID', (request, response) => {
    const user = getUser(response);
    if(userRoleIn(user, ['student'])) {
        return HelpResponse.disallowed(response);
    }
    else if(userRoleIn(user, ['TA', 'lecturer'])) {
        if(!userIsAssociatedWithCourse(user, request.params.departmentSlug, request.params.courseSlug))
            return HelpResponse.disallowed(response);
    }

    let post = request.body;
    // TODO: validate post

    // TODO: check if post ID is valid post ID
    Database.posts.get(request.params.postID).update(post)
    .run(Database.connection)
    .then(result => {
        response.send(result);
    });
});
