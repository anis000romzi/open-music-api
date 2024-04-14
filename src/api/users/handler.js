const autoBind = require('auto-bind');

class UsersHandler {
  constructor(
    usersService,
    albumsService,
    storageService,
    uploadsValidator,
    usersValidator,
  ) {
    this._usersService = usersService;
    this._albumsService = albumsService;
    this._storageService = storageService;
    this._usersValidator = usersValidator;
    this._uploadsValidator = uploadsValidator;

    autoBind(this);
  }

  async getLoggedUserHandler(request) {
    const { id: credentialId } = request.auth.credentials;

    const users = await this._usersService.getUserById(credentialId);

    return {
      status: 'success',
      data: {
        users,
      },
    };
  }

  async getUserByIdHandler(request) {
    const { id: userId } = request.params;

    const {
      id, email, username, fullname, description, picture,
    } = await this._usersService.getUserById(userId);
    const albums = await this._albumsService.getAlbumsByArtist(userId);

    return {
      status: 'success',
      data: {
        id,
        email,
        username,
        fullname,
        description,
        picture,
        albums,
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
      message: 'User berhasil diperbarui',
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
      message: 'Email user berhasil diperbarui',
    };
  }

  async verifyUserHandler(request, h) {
    const { id } = request.params;
    const { otp } = request.payload;

    await this._usersService.activateUserById(id, otp);

    const response = h.response({
      status: 'success',
      message: 'Verifikasi akun berhasil',
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
      message: 'Password berhasil diubah',
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
      message: 'Berhasil mengikuti artist',
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
      message: 'Berhasil berhenti mengikuti artist',
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

    const filename = await this._storageService.writeFile(picture, picture.hapi);
    const fileLocation = `http://${process.env.HOST}:${process.env.PORT}/users/picture/${filename}`;

    await this._usersService.addProfilePicture(id, fileLocation);

    const response = h.response({
      status: 'success',
      message: 'Foto profile berhasil diunggah',
      data: {
        fileLocation,
      },
    });

    response.code(201);
    return response;
  }
}

module.exports = UsersHandler;
