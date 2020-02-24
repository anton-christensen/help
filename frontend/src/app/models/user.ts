export type Role = 'admin' | 'lecturer' | 'TA' | 'student';
export function showRole(role: Role): string {
  if (role === 'TA') {
    return role;
  } else {
    return role[0].toUpperCase() + role.slice(1);
  }
}

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
