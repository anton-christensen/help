import * as firebase from 'firebase';

export class TrashCan {
  public id: string;
  public course: string;
  public room: string;
  public created: string | object;

  constructor(id: string, course: string, room: string) {
    this.id = id;
    this.course = course;
    this.room = room;
    this.created = firebase.firestore.FieldValue.serverTimestamp();
  }
}
