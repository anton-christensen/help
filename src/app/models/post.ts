export const PostPath = 'posts';

export interface Post {
  id: string;
  courseID: string;
  content: string;
  created: string | object;
}
