import { r, RDatum } from 'rethinkdb-ts';
import { RequestHandler } from 'express';
import { Database } from '../database';
import { checkSchema, matchedData } from 'express-validator';
import { HelpResponse } from '../lib/responses';
import { getUser, userRoleIn, userIsAssociatedWithCourse } from '../lib/auth';
import { shouldStream, createStream } from '../lib/stream';

export namespace CourseController {
    export const getAssociatedCoursesValidator = checkSchema({});
    export const getAssociatedCourses: RequestHandler = (request, response) => {
        let user = getUser(request);
        if(userRoleIn(user, ['student', 'TA'])) {
            // disallow
            return HelpResponse.disallowed(response);
        }
    
        let query = Database.courses
                    .filter(
                        (course:RDatum<any>) => 
                            course('associatedUserIDs').contains(user.id ? user.id : null)
                    );
    
        createStream(
            response,
            `GET(${user.id}):/courses`,
            query.changes(),
            (err, row) => row
        );
    
        HelpResponse.fromPromise(response, query.run(Database.connection));
    }

    export const createCourseValidator = checkSchema({
        title: { in: 'body', isString: true },
        slug: { in: 'body', isString: true },
        departmentSlug: { in: 'body', isString: true },
        associatedUserIDs: { in: 'body', isArray: true },
    });
    export const createCourse: RequestHandler = (request, response) => {
        const user = getUser(request);
        const input = matchedData(request);
        if(userRoleIn(user, ['student', 'TA'])) {
            return HelpResponse.disallowed(response);
        }

        // TODO: validate unique slug

        HelpResponse.fromPromise(response, Database.courses.insert(input).run(Database.connection));
    }

    export const getCoursesByDepartmentValidator = checkSchema({
        departmentSlug: { in: 'params', isString: true },
    });
    export const getCoursesByDepartment: RequestHandler = async ( request, response ) => {
        let user = getUser(request);
        const input = matchedData(request);
    
        let query = Database.courses.filter({
            departmentSlug: input.departmentSlug
        });

        if(userRoleIn(user, ['student'])) {
            // get active courses on department
            query = query.filter({enabled: true});
        }
        else if(userRoleIn(user, ['TA', 'lecturer'])) {
            // get active & associated courses on department
            query = query.filter((course:RDatum) => {
                return r.or(
                    course('enabled').eq(true),
                    course('associatedUserIDs').contains(user.id ? user.id : null), // TODO: remove nullable property of id on user
                )
            });
        }
        else if(userRoleIn(user, ['admin'])) {
            // get all courses on department
        }

        createStream(
            response,
            `GET(${user.id}):/${input.departmentSlug}/courses`,
            query.changes(),
            (err, row) => row
        );

        HelpResponse.fromPromise(response, query.run(Database.connection))
    }



    export const getCourseValidator = checkSchema({
        departmentSlug: { in: 'params', isString: true },
        courseSlug: { in: 'params', isString: true },
    });
    export const getCourse: RequestHandler = ( request, response ) => {
        const input = matchedData(request);        

        let query = Database.courses.filter({
            departmentSlug: input.departmentSlug,
            slug: input.courseSlug
        });
    
        createStream(
            response,
            `GET:/${input.departmentSlug}/${input.courseSlug}`,
            query.changes(),
            (err, row) => row
        )
        query.run(Database.connection)
        .then( result => {
            if(result.length)
                HelpResponse.success(response, result[0]);
            else
                HelpResponse.success(response, null);
        })
        .catch( error => HelpResponse.error(response, error ));
    }


    export const updateCourseValidator = checkSchema({
        departmentSlug_: { in: 'params', isString: true },
        courseSlug_: { in: 'params', isString: true },
        
        enabled: { in: 'body', optional: true, isBoolean: true },
        title: { in: 'body', optional: true, isString: true },
        slug: { in: 'body', optional: true, isString: true },
        departmentSlug: { in: 'body', optional: true, isString: true },
        associatedUserIDs: { in: 'body', optional: true, isArray: true },
    });
    export const updateCourse: RequestHandler = async (request, response) => {
        const user = getUser(request);
        const params = matchedData(request, {locations: ['params']});
        let input = matchedData(request, {locations: ['body']});
        
        if(user.role == 'student') {
            return HelpResponse.disallowed(response);
        }
        else if(user.role == 'TA' && 'enabled' in input) {
            // remove all but enabled property
            input = { 
                enabled: input.enabled
            };
        }
        
        if(userRoleIn(user, ['TA', 'lecturer'])) {
            try {
                if(!userIsAssociatedWithCourse(user, params.departmentSlug_, params.courseSlug_))
                    return HelpResponse.disallowed(response);
            }
            catch(error) {
                return HelpResponse.error(response, error);
            }
        }
        
        let query = Database.courses.filter({
            departmentSlug: params.departmentSlug_,
            slug: params.courseSlug_
        }).update(input, {returnChanges: true});

        HelpResponse.fromPromise(response, query.run(Database.connection));
    }


    export const deleteCourseValidator = checkSchema({
        departmentSlug: { in: 'params', isString: true },
        courseSlug: { in: 'params', isString: true },
    });
    export const deleteCourse: RequestHandler = (request, response) => {
        const user = getUser(request);
        const input = matchedData(request);

        if(userRoleIn(user, ['student', 'TA'])) {
            return HelpResponse.disallowed(response);
        }
        if(user.role == 'lecturer') {
            if(!userIsAssociatedWithCourse(user, input.departmentSlug, input.courseSlug))
                return HelpResponse.disallowed(response);
        }
    
        let query = Database.courses.filter({
            departmentSlug: input.departmentSlug,
            slug: input.courseSlug
        })
        .delete({returnChanges: true});

        HelpResponse.fromPromise(response, query.run(Database.connection));
    }
}
