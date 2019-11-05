import { Router } from 'express';
import { DepartmentController } from '../controllers/departments';
import { schemaErrorHandler } from '../lib/responses';

export const departmentRouter = Router();

departmentRouter.get( '/departments', DepartmentController.getAllDepartmentsValidator, schemaErrorHandler, DepartmentController.getAllDepartments);
departmentRouter.get( '/departments/:departmentSlug', DepartmentController.getDepartmentValidator, schemaErrorHandler, DepartmentController.getDepartment);
