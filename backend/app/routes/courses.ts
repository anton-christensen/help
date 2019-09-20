import { r, Connection, RCursor, RDatum } from 'rethinkdb-ts';
import { Router } from 'express';
import { Database } from '../database';
import { getUser, userRoleIn } from '../lib/auth';
import { HelpResponse } from '../lib/responses';
import { User } from '../models/user';

async function userIsAssociatedWithCourse(user: User, departmentSlug: string, courseSlug: string) {
    return await Database.courses.filter({
        departmentSlug: departmentSlug,
        slug: courseSlug
    })('associatedUserIDs').nth(0).contains(user.id ? user.id : null).run(Database.connection);
}


export const courseRouter = Router();

courseRouter
.get('/courses', (request, response) => {
    let user = getUser(response);
    if(userRoleIn(user, ['student', 'TA'])) {
        // disallow
        return HelpResponse.dissalowed(response);
    }
    // r.table("users").filter(function(user) {
    //     return user("placesVisited").contains("France")
    // }).run( conn, callback)

    r.row('age').contains('test')
    Database.courses.filter((course:RDatum<any>) => course('associatedUserIDs').contains(user.id ? user.id : null))
    .run(Database.connection)
    .then( result => {
        response.send( result );
    })
    .catch(error => error(response, error));
});

courseRouter
.post('/courses', (request, response) => {
    const user = getUser(response);
    if(userRoleIn(user, ['student', 'TA'])) {
        // disallow
        return HelpResponse.dissalowed(response);
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

    query.run(Database.connection)
    .then( result => {
        response.send( result );
    })
    .catch(error => HelpResponse.error(response, error));
});


courseRouter
.get('/departments/:departmentSlug/courses/:courseSlug', ( request, response ) => {
    // TODO: include posts
    
    Database.courses.filter({
        departmentSlug: request.params.departmentSlug,
        slug: request.params.courseSlug
    })
    .run(Database.connection)
    .then( result => {
        response.send( result );
    })
    .catch( error => response.send( error ) );
});


courseRouter
.put('/departments/:departmentSlug/courses/:courseSlug', async (request, response) => {
    let data = request.body;
    
    const user = getUser(response);
    if(user.role == 'student') {
        // disallow
        return HelpResponse.dissalowed(response);
    }
    else if(user.role == 'TA' && 'enabled' in data) {
        // TODO: disallow if other keys than enabled

        // remove all but enabled property
        data = {enabled: data.enabled};
    }
    
    if(userRoleIn(user, ['TA', 'lecturer'])) {
        try {
            
            if(!userIsAssociatedWithCourse(user, request.params.departmentSlug, request.params.courseSlug))
                return HelpResponse.dissalowed(response);
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
        return HelpResponse.dissalowed(response);
    }
    if(user.role == 'lecturer') {
        if(!userIsAssociatedWithCourse(user, request.params.departmentSlug, request.params.courseSlug))
            return HelpResponse.dissalowed(response);
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
.post('/departments/:departmentSlug/courses/:courseSlug/posts', (request, response) => {
    const user = getUser(response);
    if(userRoleIn(user, ['student'])) {
        return HelpResponse.dissalowed(response);
    }
    else if(userRoleIn(user, ['TA', 'lecturer'])) {
        if(!userIsAssociatedWithCourse(user, request.params.departmentSlug, request.params.courseSlug))
            return HelpResponse.dissalowed(response);
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
        return HelpResponse.dissalowed(response);
    }
    else if(userRoleIn(user, ['TA', 'lecturer'])) {
        if(!userIsAssociatedWithCourse(user, request.params.departmentSlug, request.params.courseSlug))
            return HelpResponse.dissalowed(response);
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