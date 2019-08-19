import * as firebase from 'firebase/app';

export const PostPath = 'posts';
 
export class Post {
  public id: string;
  public courseID: string;
  public content: string;
  public created: string | object;

  constructor(id: string, courseID: string, content: string) {
    this.id = id;
    this.content = content;
    this.courseID = courseID;
    this.created = firebase.firestore.FieldValue.serverTimestamp();
  }
}
