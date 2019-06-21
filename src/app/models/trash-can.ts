import * as firebase from 'firebase/app';

export class TrashCan {
  public id: string;
  public uid: string;
  public instituteSlug: string;
  public courseSlug: string;
  public room: string;
  public active: boolean;
  public created: string | object;

  constructor(id: string, uid: string, instituteSlug: string, courseSlug: string, room: string) {
    this.id = id;
    this.uid = uid;
    this.instituteSlug = instituteSlug;
    this.courseSlug = courseSlug;
    this.room = room;
    this.active = true;
    this.created = firebase.firestore.FieldValue.serverTimestamp();
  }
}
