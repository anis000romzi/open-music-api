// Minimal contract used by already-migrated modules. Extend this when the
// users module itself is migrated to TypeScript.
export interface User {
  id: string;
  email: string;
  username: string;
  fullname: string;
  description: string | null;
  picture: string | null;
  is_active: boolean;
  is_banned: boolean | null;
}

export interface IUsersService {
  getUserById(userId: string): Promise<User>;
}
