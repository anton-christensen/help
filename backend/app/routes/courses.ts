import { Router } from 'express';
import { schemaErrorHandler } from '../lib/responses';
import { CourseController } from '../controllers/courses';

export const courseRouter = Router();

courseRouter.get(   '/courses', CourseController.getAssociatedCoursesValidator, schemaErrorHandler, CourseController.getAssociatedCourses);
courseRouter.post(  '/courses', CourseController.createCourseValidator, schemaErrorHandler, CourseController.createCourse);
courseRouter.get(   '/departments/:departmentSlug/courses', CourseController.getCoursesByDepartmentValidator, schemaErrorHandler, CourseController.getCoursesByDepartment);
courseRouter.get(   '/departments/:departmentSlug/courses/:courseSlug', CourseController.getCourseValidator, schemaErrorHandler, CourseController.getCourse);
courseRouter.put(   '/departments/:departmentSlug_/courses/:courseSlug_', CourseController.updateCourseValidator, schemaErrorHandler, CourseController.updateCourse);
courseRouter.delete('/departments/:departmentSlug/courses/:courseSlug', CourseController.deleteCourseValidator, schemaErrorHandler, CourseController.deleteCourse);
