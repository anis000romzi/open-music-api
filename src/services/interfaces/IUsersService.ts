import { HapiFileStream } from '../../types/hapi-file';

export interface RegisterUserPayload {
  email: string;
  username: string;
  password: string;
  fullname: string;
}

export interface EditUserPayload {
  fullname: string;
  username: string;
  description: string;
}

export interface EditUserEmailPayload {
  email: string;
}

export interface VerifyUserPayload {
  otp: string;
}

export interface ResetPasswordPayload {
  otp: string;
  password: string;
}

export interface UploadPicturePayload {
  picture: HapiFileStream;
}

// Public profile fields, safe to return to anyone. Never add `email` or
// `password` here: these objects are spread straight into API responses.
export interface UserSummary {
  id: string;
  username: string;
  fullname: string;
  description: string | null;
  picture: string | null;
}

export interface User extends UserSummary {
  email: string;
  is_active: boolean;
  is_banned: boolean | null;
}

export interface PopularUser extends UserSummary {
  followers: number;
}

export interface UserByEmail {
  id: string;
  username: string;
}

export interface ArtistFollowersResult {
  result: { id: string }[];
}

export interface IUsersService {
  addUser(payload: RegisterUserPayload): Promise<string>;
  getUsers(fullname?: string, username?: string): Promise<UserSummary[]>;
  getPopularUsers(): Promise<PopularUser[]>;
  getFollowedUsers(userId: string): Promise<UserSummary[]>;
  getUserById(userId: string): Promise<User>;
  getUserByEmail(email: string): Promise<UserByEmail>;
  editUserById(id: string, payload: EditUserPayload): Promise<void>;
  editUserEmailById(id: string, newEmail: string): Promise<void>;
  activateUserById(id: string, otp: string): Promise<string>;
  resetUserPasswordById(id: string, otp: string, password: string): Promise<string>;
  verifyNewUsername(username: string): Promise<void>;
  verifyNewEmail(email: string): Promise<void>;
  verifyUserCredential(usernameOrEmail: string, password: string): Promise<string>;
  verifyLoggedUser(id: string, loggedUser: string): Promise<void>;
  addProfilePicture(id: string, fileLocation: string): Promise<void>;
  addFollowerToArtist(userId: string, artistId: string): Promise<void>;
  deleteFollowerFromArtist(userId: string, artistId: string): Promise<void>;
  getArtistFollower(id: string): Promise<ArtistFollowersResult>;
  getUserTotalListened(id: string): Promise<number | null>;
  getUserTotalLiked(id: string): Promise<number>;
}
