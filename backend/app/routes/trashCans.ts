import { Router } from 'express';
import { schemaErrorHandler } from '../lib/responses';
import { TrashCanController } from '../controllers/trashCans';

export const trashCanRouter = Router();

trashCanRouter.get(   '/departments/:departmentSlug/courses/:courseSlug/trashcans', TrashCanController.getUsersTrashCanValidator, schemaErrorHandler, TrashCanController.getUsersTrashCan);
trashCanRouter.post(  '/departments/:departmentSlug/courses/:courseSlug/trashcans', TrashCanController.createTrashCanValidator, schemaErrorHandler, TrashCanController.createTrashCan);
trashCanRouter.delete('/departments/:departmentSlug/courses/:courseSlug/trashcans/:trashcanID', TrashCanController.retractTrashCanValidator, schemaErrorHandler, TrashCanController.retractTrashCan);