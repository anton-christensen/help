import * as firebase from 'firebase';

export class Question {
  public id: string;
  public roomNumber: string;
  public created: string | object;

  constructor(id: string, roomNumber: string) {
    this.id = id;
    this.roomNumber = roomNumber;
    this.created = firebase.firestore.FieldValue.serverTimestamp();
  }
}
