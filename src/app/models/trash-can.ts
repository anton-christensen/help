import * as firebase from 'firebase/app';

export class TrashCan {
  public id: string;
  public userID: string;
  public courseID: string;
  public room: string;
  public active: boolean;
  public created: string | object;

  constructor(id: string, uid: string, courseID: string, room: string) {
    this.id = id;
    this.userID = uid;
    this.courseID = courseID;
    this.room = room;
    this.active = true;
    this.created = firebase.firestore.FieldValue.serverTimestamp();
  }
}
