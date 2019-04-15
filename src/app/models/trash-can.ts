import * as firebase from 'firebase/app';

export class TrashCan {
  public id: string;
  public uid: string;
  public course: string;
  public room: string;
  public active: boolean;
  public created: string | object;

  constructor(id: string, uid: string, course: string, room: string) {
    this.id = id;
    this.uid = uid;
    this.course = course;
    this.room = room;
    this.active = true;
    this.created = firebase.firestore.FieldValue.serverTimestamp();
  }
}
