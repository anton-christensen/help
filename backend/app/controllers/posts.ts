import { r, RDatum } from 'rethinkdb-ts';
import { RequestHandler } from 'express';
import { Database } from '../database';
import { checkSchema, matchedData } from 'express-validator';
import { HelpResponse } from '../lib/responses';
import { getUser, userRoleIn, userIsAssociatedWithCourse } from '../lib/auth';
import { shouldStream, createStream } from '../lib/stream';

export namespace PostController {
    export const getPostsValidator = checkSchema({
        departmentSlug: { in: 'params', isString: true },
        courseSlug: { in: 'params', isString: true },
    });
    export const getPosts: RequestHandler = (request, response) => {
        const input = matchedData(request);
        let query = Database.posts.filter({
            departmentSlug: input.departmentSlug,
            courseSlug: input.courseSlug
        });
    
        if(shouldStream(response)) {
            createStream(
                response,
                `GET-ALL:/${input.departmentSlug}/${input.courseSlug}/posts`,
                query.changes(),
                (err, row) => row
            );
        }

        HelpResponse.fromPromise(response, query.run(Database.connection));
    }


    export const createPostValidator = checkSchema({
        departmentSlug: { in: 'params', isString: true },
        courseSlug: { in: 'params', isString: true },
        content: { in: 'body', isString: true },
    });
    export const createPost: RequestHandler = (request, response) => {
        const user = getUser(request);
        const input = matchedData(request);

        if(userRoleIn(user, ['student'])) {
            return HelpResponse.disallowed(response);
        }
        else if(userRoleIn(user, ['TA', 'lecturer'])) {
            if(!userIsAssociatedWithCourse(user, input.departmentSlug, input.courseSlug))
                return HelpResponse.disallowed(response);
        }

        // TODO: validate that course exists

        input.created = r.now();
        input.updated = r.now();
        HelpResponse.fromPromise(response, Database.posts.insert(input).run(Database.connection));
    }

    export const updatePostValidator = checkSchema({
        departmentSlug: { in: 'params', isString: true },
        courseSlug: { in: 'params', isString: true },
        postID: { in: 'params', isString: true },

        content: { in: 'body', isString: true },
    });
    export const updatePost: RequestHandler = (request, response) => {
        const user = getUser(request);
        let params = matchedData(request);
        let input = matchedData(request);

        if(userRoleIn(user, ['student'])) {
            return HelpResponse.disallowed(response);
        }
        else if(userRoleIn(user, ['TA', 'lecturer'])) {
            if(!userIsAssociatedWithCourse(user, params.departmentSlug, params.courseSlug))
                return HelpResponse.disallowed(response);
        }
    
        input.updated = r.now();
        HelpResponse.fromPromise(response, Database.posts.get(params.postID).update(input).run(Database.connection));
    }

    export const deletePostValidator = checkSchema({
        departmentSlug: { in: 'params', isString: true },
        courseSlug: { in: 'params', isString: true },
        postID: { in: 'params', isString: true },
    });
    export const deletePost: RequestHandler = (request, response) => {
        const user = getUser(request);
        const input = matchedData(request);

        if(userRoleIn(user, ['student'])) {
            return HelpResponse.disallowed(response);
        }
        else if(userRoleIn(user, ['TA', 'lecturer'])) {
            if(!userIsAssociatedWithCourse(user, input.departmentSlug, input.courseSlug))
                return HelpResponse.disallowed(response);
        }
    
        HelpResponse.fromPromise(response, Database.posts.get(input.postID).delete().run(Database.connection));
    }
}
