export type Role = 'admin' | 'lecturer' | 'TA' | 'student';

export interface User {
  id?: string;
  email: string;
  anon: boolean;
  name: string;
  role: Role;
}

export interface POSTUser {
  email: string;
  name: string;
  role: Role;
}

