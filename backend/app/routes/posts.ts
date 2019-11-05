import { r, Connection, RCursor, RDatum } from 'rethinkdb-ts';
import { Router } from 'express';
import { Database } from '../database';
import { getUser, userRoleIn, userIsAssociatedWithCourse } from '../lib/auth';
import { HelpResponse, schemaErrorHandler } from '../lib/responses';
import { User } from '../models/user';
import { shouldStream, createStream } from '../lib/stream';
import { PostController } from '../controllers/posts';

export const postRouter = Router();

postRouter.get ('/departments/:departmentSlug/courses/:courseSlug/posts', PostController.getPostsValidator, schemaErrorHandler, PostController.getPosts);
postRouter.post('/departments/:departmentSlug/courses/:courseSlug/posts', PostController.createPostValidator, schemaErrorHandler, PostController.createPost);
postRouter.put('/departments/:departmentSlug/courses/:courseSlug/posts/:postID', PostController.updatePostValidator, schemaErrorHandler, PostController.updatePost);
postRouter.delete('/departments/:departmentSlug/courses/:courseSlug/posts/:postID', PostController.deletePostValidator, schemaErrorHandler, PostController.deletePost);
