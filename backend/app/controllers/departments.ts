import { RequestHandler } from 'express';
import { Database } from '../database';
import { checkSchema, matchedData } from 'express-validator';
import { HelpResponse } from '../lib/responses';

export namespace DepartmentController {
    export const getAllDepartmentsValidator = checkSchema({});
    export const getAllDepartments: RequestHandler = ( request, response ) => {
        HelpResponse.fromPromise(response, Database.departments.orderBy('title').run(Database.connection));
    }

    export const getDepartmentValidator = checkSchema({
        departmentSlug: { in: 'params' },
    });
    export const getDepartment: RequestHandler =  ( request, response ) => {
        const input = matchedData(request);
        HelpResponse.fromPromise(
            response,
            Database.departments.filter({
                slug: input.departmentSlug
            })
            .run(Database.connection)
        )
    }
}
