import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import { Prisma, PrismaClient } from '../../generated/prisma';
import {
  ArtistFollowersResult,
  EditUserPayload,
  IUsersService,
  PopularUser,
  RegisterUserPayload,
  User,
  UserByEmail,
  UserSummary,
} from '../interfaces/IUsersService';
import { ICacheService } from '../interfaces/ICacheService';
import { AuthenticationError } from '../../exceptions/AuthenticationError';
import { AuthorizationError } from '../../exceptions/AuthorizationError';
import { InvariantError } from '../../exceptions/InvariantError';
import { NotFoundError } from '../../exceptions/NotFoundError';

const userSummarySelect = {
  id: true,
  username: true,
  fullname: true,
  description: true,
  picture: true,
} satisfies Prisma.usersSelect;

const userSelect = {
  ...userSummarySelect,
  email: true,
  is_active: true,
  is_banned: true,
} satisfies Prisma.usersSelect;

const isRecordNotFound = (error: unknown) => (
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'
);

export class PostgresUsersService implements IUsersService {
  private _prisma: PrismaClient;
  private _cacheService: ICacheService;

  constructor(prisma: PrismaClient, cacheService: ICacheService) {
    this._prisma = prisma;
    this._cacheService = cacheService;
  }

  async addUser({
    email, username, password, fullname,
  }: RegisterUserPayload): Promise<string> {
    await this.verifyNewUsername(username);
    await this.verifyNewEmail(email);

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();

    try {
      const user = await this._prisma.users.create({
        data: {
          id: `user-${nanoid(16)}`,
          email,
          username,
          password: hashedPassword,
          fullname,
          is_active: false,
          created_at: now,
          updated_at: now,
          description: null,
          picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullname)}&background=random&size=128`,
        },
        select: { id: true },
      });

      return user.id;
    } catch {
      throw new InvariantError('Failed registering user');
    }
  }

  async getUsers(fullname?: string, username?: string): Promise<UserSummary[]> {
    const searchConditions: Prisma.usersWhereInput[] = [];

    if (fullname !== undefined) {
      searchConditions.push({ fullname: { contains: fullname, mode: 'insensitive' } });
    }

    if (username !== undefined) {
      searchConditions.push({ username: { contains: username, mode: 'insensitive' } });
    }

    return this._prisma.users.findMany({
      where: {
        is_active: true,
        is_banned: false,
        ...(searchConditions.length ? { OR: searchConditions } : {}),
      },
      select: userSummarySelect,
      take: 20,
    });
  }

  async getPopularUsers(): Promise<PopularUser[]> {
    const users = await this._prisma.users.findMany({
      where: { is_active: true, is_banned: false },
      select: {
        ...userSummarySelect,
        _count: { select: { follower_artist_follower_artist_artist_idTousers: true } },
      },
      orderBy: { follower_artist_follower_artist_artist_idTousers: { _count: 'desc' } },
      take: 20,
    });

    return users.map(({ _count: count, ...user }) => ({
      ...user,
      followers: count.follower_artist_follower_artist_artist_idTousers,
    }));
  }

  async getFollowedUsers(userId: string): Promise<UserSummary[]> {
    return this._prisma.users.findMany({
      where: {
        is_active: true,
        is_banned: false,
        follower_artist_follower_artist_artist_idTousers: { some: { user_id: userId } },
      },
      select: userSummarySelect,
    });
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this._prisma.users.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async getUserByEmail(email: string): Promise<UserByEmail> {
    const user = await this._prisma.users.findUnique({
      where: { email },
      select: { id: true, username: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async editUserById(
    id: string,
    { fullname, username, description }: EditUserPayload,
  ): Promise<void> {
    const { username: oldUsername } = await this.getUserById(id);

    if (oldUsername !== username) {
      await this.verifyNewUsername(username);
    }

    const { count } = await this._prisma.users.updateMany({
      where: { id },
      data: {
        fullname, username, description, updated_at: new Date(),
      },
    });

    if (!count) {
      throw new NotFoundError('Failed updating user info. Id not found');
    }
  }

  // only edit email if user is not active yet
  async editUserEmailById(id: string, newEmail: string): Promise<void> {
    const { is_active: isActive, email } = await this.getUserById(id);

    if (isActive) {
      throw new AuthorizationError('Failed updating user email. User is active');
    }

    if (newEmail !== email) {
      await this.verifyNewEmail(newEmail);
    }

    const { count } = await this._prisma.users.updateMany({
      where: { id },
      data: { email: newEmail, updated_at: new Date() },
    });

    if (!count) {
      throw new NotFoundError('Failed updating user email. Id not found');
    }
  }

  async activateUserById(id: string, otp: string): Promise<string> {
    try {
      const storedOtp = await this._cacheService.get(`verify:${id}`);

      if (storedOtp !== otp) {
        throw new InvariantError('OTP code doesn\'t match');
      }

      const { count } = await this._prisma.users.updateMany({
        where: { id },
        data: { is_active: true, updated_at: new Date() },
      });

      if (!count) {
        throw new InvariantError('User verification failed');
      }

      await this._cacheService.delete(`verify:${id}`);
      return id;
    } catch {
      throw new InvariantError('User verification failed');
    }
  }

  async resetUserPasswordById(id: string, otp: string, password: string): Promise<string> {
    try {
      const storedOtp = await this._cacheService.get(`forgot:${id}`);

      if (storedOtp !== otp) {
        throw new InvariantError('OTP code doesn\'t match');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const { count } = await this._prisma.users.updateMany({
        where: { id },
        data: { password: hashedPassword, updated_at: new Date() },
      });

      if (!count) {
        throw new InvariantError('Password reset failed');
      }

      await this._cacheService.delete(`forgot:${id}`);
      return id;
    } catch {
      throw new InvariantError('Password reset failed');
    }
  }

  async verifyNewUsername(username: string): Promise<void> {
    const user = await this._prisma.users.findUnique({
      where: { username },
      select: { id: true },
    });

    if (user) {
      throw new InvariantError('Username is already in use');
    }
  }

  async verifyNewEmail(email: string): Promise<void> {
    const user = await this._prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });

    if (user) {
      throw new InvariantError('Email is already in use');
    }
  }

  async verifyUserCredential(usernameOrEmail: string, password: string): Promise<string> {
    if (!usernameOrEmail) {
      throw new AuthenticationError('Username/email or password wrong');
    }

    const user = await this._prisma.users.findFirst({
      where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] },
      select: { id: true, password: true, is_banned: true },
    });

    if (!user) {
      throw new AuthenticationError('Username/email or password wrong');
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      throw new AuthenticationError('Username/email or password wrong');
    }

    if (user.is_banned === true) {
      throw new AuthenticationError('This account has been banned');
    }

    return user.id;
  }

  async verifyLoggedUser(id: string, loggedUser: string): Promise<void> {
    const user = await this._prisma.users.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.id !== loggedUser) {
      throw new AuthorizationError('You are not authorized to access this resource');
    }
  }

  async addProfilePicture(id: string, fileLocation: string): Promise<void> {
    await this._prisma.users.updateMany({
      where: { id },
      data: { picture: fileLocation, updated_at: new Date() },
    });
  }

  async addFollowerToArtist(userId: string, artistId: string): Promise<void> {
    if (await this.verifyUserFollow(userId, artistId)) {
      throw new InvariantError('Failed to follow artist');
    }

    await this._prisma.follower_artist.create({
      data: {
        id: `follow-${nanoid(16)}`,
        user_id: userId,
        artist_id: artistId,
      },
    });
  }

  async deleteFollowerFromArtist(userId: string, artistId: string): Promise<void> {
    try {
      await this._prisma.follower_artist.delete({
        where: { user_id_artist_id: { user_id: userId, artist_id: artistId } },
      });
    } catch (error) {
      if (isRecordNotFound(error)) {
        throw new InvariantError('Failed to unfollow artist');
      }
      throw error;
    }
  }

  async getArtistFollower(id: string): Promise<ArtistFollowersResult> {
    const followers = await this._prisma.follower_artist.findMany({
      where: { artist_id: id },
      select: { user_id: true },
    });

    return {
      result: followers.map(({ user_id: userId }) => ({ id: userId })),
    };
  }

  async getUserTotalListened(id: string): Promise<number | null> {
    const { _sum: sum } = await this._prisma.songs.aggregate({
      where: { artist: id },
      _sum: { listened: true },
    });

    return sum.listened;
  }

  async getUserTotalLiked(id: string): Promise<number> {
    return this._prisma.user_song_likes.count({
      where: { songs: { artist: id } },
    });
  }

  async verifyUserFollow(userId: string, artistId: string): Promise<boolean> {
    const follow = await this._prisma.follower_artist.findUnique({
      where: { user_id_artist_id: { user_id: userId, artist_id: artistId } },
      select: { id: true },
    });

    return follow !== null;
  }
}
