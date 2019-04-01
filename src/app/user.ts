export class User {
  uid: string;
  email: string;
  imageURL: string;
  name: string;
  admin: boolean;

  constructor(authData) {
    this.uid = authData.uid;
    this.email = authData.email;
    this.imageURL = authData.photoURL;
    this.name = '';
    this.admin = false;
  }
}
