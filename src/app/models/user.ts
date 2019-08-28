export type Role = 'admin' | 'lecturer' | 'assistant' | 'student';

export const UserPath = 'users';

export interface User {
  uid: string;
  email: string;
  anon: boolean;
  name: string;
  role: Role;
}
