import Hapi from '@hapi/hapi';
import autoBind from 'auto-bind';
import {
  EditUserEmailPayload,
  EditUserPayload,
  IUsersService,
  RegisterUserPayload,
  ResetPasswordPayload,
  UploadPicturePayload,
  VerifyUserPayload,
} from '../../services/interfaces/IUsersService';
import { IAlbumsService } from '../../services/interfaces/IAlbumsService';
import { ISongsService } from '../../services/interfaces/ISongsService';
import { IStorageService } from '../../services/interfaces/IStorageService';
import { IUploadsValidator } from '../../validator/uploads';
import { IUsersValidator } from '../../validator/users';

type IdParams = { id: string };
type Credentials = { id: string };

export class UsersHandler {
  private _usersService: IUsersService;
  private _albumsService: IAlbumsService;
  private _songsService: ISongsService;
  private _storageService: IStorageService;
  private _uploadsValidator: IUploadsValidator;
  private _usersValidator: IUsersValidator;

  constructor(
    usersService: IUsersService,
    albumsService: IAlbumsService,
    songsService: ISongsService,
    storageService: IStorageService,
    uploadsValidator: IUploadsValidator,
    usersValidator: IUsersValidator,
  ) {
    this._usersService = usersService;
    this._albumsService = albumsService;
    this._songsService = songsService;
    this._storageService = storageService;
    this._uploadsValidator = uploadsValidator;
    this._usersValidator = usersValidator;

    autoBind(this);
  }

  async getUsersHandler(request: Hapi.Request) {
    const { fullname, username } = request.query as { fullname?: string; username?: string };
    const users = await this._usersService.getUsers(fullname, username);

    return {
      status: 'success',
      data: {
        users,
      },
    };
  }

  async getPopularUsersHandler() {
    const users = await this._usersService.getPopularUsers();

    return {
      status: 'success',
      data: {
        users,
      },
    };
  }

  async getLoggedUserHandler(request: Hapi.Request) {
    const { id: credentialId } = request.auth.credentials as Credentials;

    const users = await this._usersService.getUserById(credentialId);
    const followers = await this._usersService.getArtistFollower(credentialId);
    const mappedFollowers = followers.result.map((follower) => follower.id);
    const listenedCount = await this._usersService.getUserTotalListened(credentialId);
    const likedCount = await this._usersService.getUserTotalLiked(credentialId);

    return {
      status: 'success',
      data: {
        users: {
          ...users,
          followers: mappedFollowers,
          listenedCount,
          likedCount,
        },
      },
    };
  }

  async getUserByIdHandler(request: Hapi.Request) {
    const { id: userId } = request.params as IdParams;

    const user = await this._usersService.getUserById(userId);
    // Public profile: deliberately leaves out `email`.
    const publicProfile = {
      id: user.id,
      username: user.username,
      fullname: user.fullname,
      description: user.description,
      picture: user.picture,
      is_active: user.is_active,
      is_banned: user.is_banned,
    };
    const followers = await this._usersService.getArtistFollower(userId);
    const mappedFollowers = followers.result.map((follower) => follower.id);

    const albums = await this._albumsService.getAlbumsByArtist(userId);
    const singles = await this._songsService.getSinglesByArtist(userId);

    const mappedSingles = await Promise.all(singles.map(async (song) => {
      const likes = await this._songsService.getSongLikes(song.id);
      return {
        ...song,
        likes: likes.result.map((like) => like.id),
      };
    }));

    return {
      status: 'success',
      data: {
        ...publicProfile,
        followers: mappedFollowers,
        albums,
        singles: mappedSingles,
      },
    };
  }

  async getFollowedUsersHandler(request: Hapi.Request) {
    const { id: credentialId } = request.auth.credentials as Credentials;
    const users = await this._usersService.getFollowedUsers(credentialId);

    return {
      status: 'success',
      data: {
        users,
      },
    };
  }

  async postUserHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const payload = request.payload as RegisterUserPayload;
    this._usersValidator.validateUserPayload(payload);
    const {
      email, username, password, fullname,
    } = payload;

    const userId = await this._usersService.addUser({
      email,
      username,
      password,
      fullname,
    });

    const response = h.response({
      status: 'success',
      data: {
        userId,
      },
    });
    response.code(201);
    return response;
  }

  async putUserByIdHandler(request: Hapi.Request) {
    const payload = request.payload as EditUserPayload;
    this._usersValidator.validatePutUserPayload(payload);
    const { id } = request.params as IdParams;
    const { id: credentialId } = request.auth.credentials as Credentials;

    await this._usersService.verifyLoggedUser(id, credentialId);
    await this._usersService.editUserById(id, payload);

    return {
      status: 'success',
      message: 'User edited successfully',
    };
  }

  // only edit email if user is not active yet
  async editUserEmailHandler(request: Hapi.Request) {
    const payload = request.payload as EditUserEmailPayload;
    this._usersValidator.validatePutUserEmailPayload(payload);
    const { id } = request.params as IdParams;
    const { id: credentialId } = request.auth.credentials as Credentials;
    const { email } = payload;

    await this._usersService.verifyLoggedUser(id, credentialId);
    await this._usersService.editUserEmailById(id, email);

    return {
      status: 'success',
      message: 'User email changed successfullly',
    };
  }

  async verifyUserHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const payload = request.payload as VerifyUserPayload;
    this._usersValidator.validateVerifyUserPayload(payload);
    const { id } = request.params as IdParams;
    const { otp } = payload;

    await this._usersService.activateUserById(id, otp);

    const response = h.response({
      status: 'success',
      message: 'Account verified successfully',
    });

    response.code(201);
    return response;
  }

  async resetUserPasswordHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const payload = request.payload as ResetPasswordPayload;
    this._usersValidator.validateResetPasswordPayload(payload);
    const { id } = request.params as IdParams;
    const { otp, password } = payload;

    await this._usersService.resetUserPasswordById(id, otp, password);

    const response = h.response({
      status: 'success',
      message: 'Password changed successfully',
    });

    response.code(201);
    return response;
  }

  async postFollowArtistHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { id } = request.params as IdParams;
    const { id: credentialId } = request.auth.credentials as Credentials;

    await this._usersService.getUserById(id);
    await this._usersService.addFollowerToArtist(credentialId, id);

    const response = h.response({
      status: 'success',
      message: 'Successfully follow the artist',
    });

    response.code(201);
    return response;
  }

  async deleteFollowArtistHandler(request: Hapi.Request) {
    const { id } = request.params as IdParams;
    const { id: credentialId } = request.auth.credentials as Credentials;

    await this._usersService.deleteFollowerFromArtist(credentialId, id);

    return {
      status: 'success',
      message: 'Successfully unfollow the artist',
    };
  }

  async getArtistFollowerHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { id } = request.params as IdParams;

    const followers = await this._usersService.getArtistFollower(id);

    return h.response({
      status: 'success',
      data: {
        followers: followers.result.length,
      },
    });
  }

  async postUploadPictureHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { id } = request.params as IdParams;
    const { picture } = request.payload as UploadPicturePayload;
    const { id: credentialId } = request.auth.credentials as Credentials;
    this._uploadsValidator.validateImageHeaders(picture.hapi.headers);

    await this._usersService.getUserById(id);
    await this._usersService.verifyLoggedUser(id, credentialId);

    const fileLocation = await this._storageService.writeFile(picture, picture.hapi);

    await this._usersService.addProfilePicture(id, fileLocation);

    const response = h.response({
      status: 'success',
      message: 'Profile picture added successfully',
      data: {
        fileLocation,
      },
    });

    response.code(201);
    return response;
  }
}
