import { Router } from 'express';
import { UserController } from '../controllers/users';
import { schemaErrorHandler } from '../lib/responses';

export const userRouter = Router();

userRouter.get( '/user', UserController.getAuthedUserValidator, schemaErrorHandler, UserController.getAuthedUser);
userRouter.get( '/users/:userID', UserController.getUserByIDValidator, schemaErrorHandler, UserController.getUserByID);
userRouter.get( '/users', UserController.getUsersByQueryValidator, schemaErrorHandler, UserController.getUsersByQuery);
userRouter.post('/users', UserController.createUserValidator, schemaErrorHandler, UserController.createUser);
userRouter.put('/users/:userID', UserController.updateUserValidator, schemaErrorHandler, UserController.updateUser);
userRouter.delete('/users/:userID', UserController.deleteUserValidator, schemaErrorHandler, UserController.deleteUser);
userRouter.get( '/user/_auth', UserController.validateCASLoginValidator, schemaErrorHandler, UserController.validateCASLogin);
