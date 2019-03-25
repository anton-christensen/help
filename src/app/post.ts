import * as firebase from 'firebase';

export class Post {
  public id: string;
  public content: string;
  public created: string | object;

  constructor(id: string, content: string) {
    this.id = id;
    this.content = content;
    this.created = firebase.firestore.FieldValue.serverTimestamp();
  }
}
