import * as firebase from 'firebase';

export class Post {
  public id: string;
  public course: string;
  public content: string;
  public created: string | object;

  constructor(id: string, course: string, content: string) {
    this.id = id;
    this.content = content;
    this.course = course;
    this.created = firebase.firestore.FieldValue.serverTimestamp();
  }
}
