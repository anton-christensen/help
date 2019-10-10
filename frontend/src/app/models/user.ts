export type Role = 'admin' | 'lecturer' | 'TA' | 'student';

export interface User {
  id: string;
  email: string;
  anon: boolean;
  name: string;
  role: Role;
}

export const userStorageKey = 'user';


export type Token = string;

export interface TokenWrapper {
  token: Token;
}

export const tokenStorageKey = 'token';
