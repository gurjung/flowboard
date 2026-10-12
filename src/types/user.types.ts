export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export type GrantMode = 'allow' | 'deny';

export interface Grant {
  id: string;
  resourceId: string;
  userId: string;
  mode: GrantMode;
}
