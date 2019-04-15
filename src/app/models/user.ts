export class User {
  uid: string;
  email: string;
  imageURL: string;
  anon: boolean;
  name: string;
  admin: boolean;
  courses: string[];

  constructor(authData) {
    this.uid = authData.uid;
    this.email = authData.email;
    this.imageURL = authData.photoURL;
    this.anon = authData.isAnonymous;
    this.name = '';
    this.admin = false;
    this.courses = [];
  }
}
