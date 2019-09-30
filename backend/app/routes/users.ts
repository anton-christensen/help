import { Router } from 'express';
import { UserController } from '../controllers/users';
import { schemaErrorHandler } from '../lib/responses';

export const userRouter = Router();

userRouter.get( '/user', UserController.getAuthedUserValidator, schemaErrorHandler, UserController.getAuthedUser);
userRouter.get( '/users/:userID', UserController.getUserByIDValidator, schemaErrorHandler, UserController.getUserByID);
userRouter.get( '/users', UserController.getUsersByQueryValidator, schemaErrorHandler, UserController.getUsersByQuery);
userRouter.post('/users', UserController.createUserValidator, schemaErrorHandler, UserController.createUser);
userRouter.get( '/user/_auth', UserController.validateCASLoginValidator, schemaErrorHandler, UserController.validateCASLogin);
