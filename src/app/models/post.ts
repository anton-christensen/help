import * as firebase from 'firebase/app';

export class Post {
  public id: string;
  public courseSlug: string;
  public instituteSlug: string;
  public content: string;
  public created: string | object;

  constructor(id: string, instituteSlug: string, courseSlug: string, content: string) {
    this.id = id;
    this.content = content;
    this.instituteSlug = instituteSlug;
    this.courseSlug = courseSlug;
    this.created = firebase.firestore.FieldValue.serverTimestamp();
  }
}
