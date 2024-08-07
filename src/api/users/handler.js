const autoBind = require('auto-bind');

class UsersHandler {
  constructor(
    usersService,
    albumsService,
    songsService,
    storageService,
    uploadsValidator,
    usersValidator,
  ) {
    this._usersService = usersService;
    this._albumsService = albumsService;
    this._songsService = songsService;
    this._storageService = storageService;
    this._usersValidator = usersValidator;
    this._uploadsValidator = uploadsValidator;

    autoBind(this);
  }

  async getUsersHandler(request) {
    const { fullname, username } = request.query;
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

  async getLoggedUserHandler(request) {
    const { id: credentialId } = request.auth.credentials;

    const users = await this._usersService.getUserById(credentialId);
    const followers = await this._usersService.getArtistFollower(credentialId);
    const mappedFollowers = followers.result.map((like) => like.id);
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

  async getUserByIdHandler(request) {
    const { id: userId } = request.params;

    const user = await this._usersService.getUserById(userId);
    const followers = await this._usersService.getArtistFollower(userId);
    const mappedFollowers = followers.result.map((like) => like.id);

    const albums = await this._albumsService.getAlbumsByArtist(userId);
    const singles = await this._songsService.getSinglesByArtist(userId);

    const mappedSingles = await Promise.all(singles.map(async (song) => {
      const likes = await this._songsService.getSongLikes(song.id);
      const mappedLikes = likes.result.map((like) => like.id);
      return {
        ...song,
        likes: mappedLikes,
      };
    }));

    return {
      status: 'success',
      data: {
        ...user,
        followers: mappedFollowers,
        albums,
        singles: mappedSingles,
      },
    };
  }

  async getFollowedUsersHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const users = await this._usersService.getFollowedUsers(credentialId);

    return {
      status: 'success',
      data: {
        users,
      },
    };
  }

  async postUserHandler(request, h) {
    this._usersValidator.validateUserPayload(request.payload);
    const {
      email, username, password, fullname,
    } = request.payload;

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

  async putUserByIdHandler(request) {
    this._usersValidator.validatePutUserPayload(request.payload);
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._usersService.verifyLoggedUser(id, credentialId);
    await this._usersService.editUserById(id, request.payload);

    return {
      status: 'success',
      message: 'User edited successfully',
    };
  }

  // only edit email if user is not active yet
  async editUserEmailHandler(request) {
    this._usersValidator.validatePutUserEmailPayload(request.payload);
    const { id } = request.params;
    const { email } = request.payload;

    await this._usersService.editUserEmailById(id, email);

    return {
      status: 'success',
      message: 'User email changed successfullly',
    };
  }

  async verifyUserHandler(request, h) {
    const { id } = request.params;
    const { otp } = request.payload;

    await this._usersService.activateUserById(id, otp);

    const response = h.response({
      status: 'success',
      message: 'Account verified successfully',
    });

    response.code(201);
    return response;
  }

  async resetUserPasswordHandler(request, h) {
    const { id } = request.params;
    const { otp, password } = request.payload;

    await this._usersService.resetUserPasswordById(id, otp, password);

    const response = h.response({
      status: 'success',
      message: 'Password changed successfully',
    });

    response.code(201);
    return response;
  }

  async postFollowArtistHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._usersService.getUserById(credentialId);
    await this._usersService.addFollowerToArtist(credentialId, id);

    const response = h.response({
      status: 'success',
      message: 'Successfully follow the artist',
    });

    response.code(201);
    return response;
  }

  async deleteFollowArtistHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._usersService.deleteFollowerFromArtist(credentialId, id);

    return {
      status: 'success',
      message: 'Successfully unfollow the artist',
    };
  }

  async getArtistFollowerHandler(request, h) {
    const { id } = request.params;

    const followers = await this._usersService.getArtistFollower(id);

    const response = h.response({
      status: 'success',
      data: {
        followers: followers.result.length,
      },
    });

    return response;
  }

  async postUploadPictureHandler(request, h) {
    const { id } = request.params;
    const { picture } = request.payload;
    const { id: credentialId } = request.auth.credentials;
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

module.exports = UsersHandler;
