import {Router} from 'express';
import {schemaErrorHandler} from '../lib/responses';
import {TrashCanController} from '../controllers';

export const trashCanRouter = Router();

trashCanRouter.get(
    '/departments/:departmentSlug/courses/:courseSlug/trashcans',
    TrashCanController.getRelevantTrashCanValidator,
    schemaErrorHandler,
    TrashCanController.getRelevantTrashCan
);

trashCanRouter.post(
    '/departments/:departmentSlug/courses/:courseSlug/trashcans',
    TrashCanController.createTrashCanValidator,
    schemaErrorHandler,
    TrashCanController.createTrashCan
);

trashCanRouter.put(
    '/departments/:departmentSlug/courses/:courseSlug/trashcans/:trashcanID/responder',
    TrashCanController.respondToTrashCanValidator,
    schemaErrorHandler,
    TrashCanController.respondToTrashCan
);

trashCanRouter.delete(
    '/departments/:departmentSlug/courses/:courseSlug/trashcans/:trashcanID',
    TrashCanController.retractTrashCanValidator,
    schemaErrorHandler,
    TrashCanController.retractTrashCan
);
