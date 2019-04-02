export class User {
  uid: string;
  email: string;
  imageURL: string;
  name: string;
  messagingTokens: string[];
  admin: boolean;
  courses: string[];

  constructor(authData) {
    this.uid = authData.uid;
    this.email = authData.email;
    this.imageURL = authData.photoURL;
    this.name = '';
    this.messagingTokens = [];
    this.admin = false;
    this.courses = [];
  }
}
