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

    const { usernameOrEmail, password } = request.payload;
    const id = await this._usersService.verifyUserCredential(usernameOrEmail, password);

    const accessToken = this._tokenManager.generateAccessToken({ id });
    const refreshToken = this._tokenManager.generateRefreshToken({ id });

    await this._authenticationsService.addRefreshToken(refreshToken);

    const response = h.response({
      status: 'success',
      data: {
        accessToken,
      },
    });

    // Set the refresh token as an HTTP-only cookie
    response.state('refresh-token', refreshToken, {
      ttl: 30 * 24 * 60 * 60 * 1000,
      isHttpOnly: true,
      isSecure: true,
      isSameSite: 'Strict',
    });

    response.code(201);
    return response;
  }

  async putAuthenticationHandler(request) {
    const { 'refresh-token': refreshToken } = request.state;

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
    const { 'refresh-token': refreshToken } = request.state;
    await this._authenticationsService.verifyRefreshToken(refreshToken);
    await this._authenticationsService.deleteRefreshToken(refreshToken);

    return {
      status: 'success',
      message: 'Refresh token deleted successfully',
    };
  }

  async postVerificationCodeHandler(request, h) {
    const { userId } = request.payload;

    const nanoid = customAlphabet('1234567890', 6);
    const otp = `${nanoid()}`;

    const { email } = await this._usersService.getUserById(userId);
    await this._producerService.sendMessage('auth:verify', JSON.stringify({ userId, email, otp }));

    const response = h.response({
      status: 'success',
      message: 'OTP code has been sent',
    });

    response.code(201);
    return response;
  }

  async postResetPasswordRequest(request, h) {
    const { email } = request.payload;

    const nanoid = customAlphabet('1234567890', 6);
    const otp = `${nanoid()}`;

    const { id: userId, username } = await this._usersService.getUserByEmail(email);
    await this._producerService.sendMessage('auth:forgot', JSON.stringify({
      userId, username, email, otp,
    }));

    const response = h.response({
      status: 'success',
      message: 'OTP code has been sent',
      data: {
        userId,
      },
    });

    response.code(201);
    return response;
  }
}

module.exports = AuthenticationsHandler;
