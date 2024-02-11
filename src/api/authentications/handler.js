const autoBind = require('auto-bind');
const { customAlphabet } = require('nanoid');

class AuthenticationsHandler {
  constructor(
    cacheService,
    authenticationsService,
    producerService,
    usersService,
    tokenManager,
    validator,
  ) {
    this._cacheService = cacheService;
    this._authenticationsService = authenticationsService;
    this._producerService = producerService;
    this._usersService = usersService;
    this._tokenManager = tokenManager;
    this._validator = validator;

    autoBind(this);
  }

  async postAuthenticationHandler(request, h) {
    this._validator.validatePostAuthenticationPayload(request.payload);

    const { username, password } = request.payload;
    const id = await this._usersService.verifyUserCredential(username, password);

    const accessToken = this._tokenManager.generateAccessToken({ id });
    const refreshToken = this._tokenManager.generateRefreshToken({ id });

    await this._authenticationsService.addRefreshToken(refreshToken);

    const response = h.response({
      status: 'success',
      data: {
        accessToken,
        refreshToken,
      },
    });
    response.code(201);
    return response;
  }

  async putAuthenticationHandler(request) {
    this._validator.validatePutAuthenticationPayload(request.payload);

    const { refreshToken } = request.payload;
    await this._authenticationsService.verifyRefreshToken(refreshToken);
    const { id } = this._tokenManager.verifyRefreshToken(refreshToken);

    const accessToken = this._tokenManager.generateAccessToken({ id });
    return {
      status: 'success',
      data: {
        accessToken,
      },
    };
  }

  async deleteAuthenticationHandler(request) {
    this._validator.validateDeleteAuthenticationPayload(request.payload);

    const { refreshToken } = request.payload;
    await this._authenticationsService.verifyRefreshToken(refreshToken);
    await this._authenticationsService.deleteRefreshToken(refreshToken);

    return {
      status: 'success',
      message: 'Refresh token berhasil dihapus',
    };
  }

  async postVerificationCodeHandler(request, h) {
    const { email } = request.payload;

    const nanoid = customAlphabet('1234567890', 6);
    const otp = `${nanoid()}`;

    await this._usersService.getUserByEmail(email);
    await this._cacheService.set(`verify:${email}`, otp);
    await this._producerService.sendMessage('auth:verify', JSON.stringify({ email, otp }));

    const response = h.response({
      status: 'success',
      message: 'Permintaan Anda sedang kami proses',
    });

    response.code(201);
    return response;
  }
}

module.exports = AuthenticationsHandler;
