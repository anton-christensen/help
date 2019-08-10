export type Role = 'admin' | 'lecturer' | 'assistant' | 'student';

export class User {
  uid: string;
  email: string;
  imageURL: string;
  anon: boolean;
  name: string;
  role: Role;

  constructor(authData) {
    this.uid = authData.uid;
    this.email = authData.email;
    this.imageURL = authData.photoURL;
    this.anon = authData.isAnonymous;
    this.name = authData.displayName;
    this.role = 'student';
  }
}
