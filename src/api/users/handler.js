const autoBind = require('auto-bind');

class UsersHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postUserHandler(request, h) {
    this._validator.validateUserPayload(request.payload);
    const {
      email, username, password, fullname,
    } = request.payload;

    const userId = await this._service.addUser({
      email, username, password, fullname,
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

  async verifyUserHandler(request, h) {
    const { email, otp } = request.payload;

    const userId = await this._service.activateUser(email, otp);

    const response = h.response({
      status: 'success',
      message: 'Verifikasi akun berhasil',
      data: {
        userId,
      },
    });
    response.code(201);
    return response;
  }
}

module.exports = UsersHandler;
