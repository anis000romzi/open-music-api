import Hapi from '@hapi/hapi';
import autoBind from 'auto-bind';
import { customAlphabet } from 'nanoid';
import { IAuthenticationsService } from '../../services/interfaces/IAuthenticationsService';
import { ICacheService } from '../../services/interfaces/ICacheService';
import { IProducerService } from '../../services/interfaces/IProducerService';
import { IUsersService } from '../../services/interfaces/IUsersService';
import { ITokenManager } from '../../tokenize/TokenManager';
import {
  ForgotPasswordPayload,
  IAuthenticationsValidator,
  LoginPayload,
  VerificationCodePayload,
} from '../../validator/authentications';
import { AuthenticationError } from '../../exceptions/AuthenticationError';
import { InvariantError } from '../../exceptions/InvariantError';
import { NotFoundError } from '../../exceptions/NotFoundError';
import { TooManyRequestsError } from '../../exceptions/TooManyRequestsError';

type RefreshTokenState = { 'refresh-token'?: string };
type OtpType = 'verify' | 'forgot';

const REFRESH_TOKEN_COOKIE = 'refresh-token';
const REFRESH_TOKEN_COOKIE_OPTIONS = {
  isHttpOnly: true,
  isSecure: true,
  isSameSite: 'Strict',
} as const;

// Minimum time between two OTP emails of the same type for the same user.
const OTP_COOLDOWN_SEC = 60;

const generateOtp = customAlphabet('1234567890', 6);

export class AuthenticationsHandler {
  private _cacheService: ICacheService;
  private _authenticationsService: IAuthenticationsService;
  private _producerService: IProducerService;
  private _usersService: IUsersService;
  private _tokenManager: ITokenManager;
  private _validator: IAuthenticationsValidator;

  constructor(
    cacheService: ICacheService,
    authenticationsService: IAuthenticationsService,
    producerService: IProducerService,
    usersService: IUsersService,
    tokenManager: ITokenManager,
    validator: IAuthenticationsValidator,
  ) {
    this._cacheService = cacheService;
    this._authenticationsService = authenticationsService;
    this._producerService = producerService;
    this._usersService = usersService;
    this._tokenManager = tokenManager;
    this._validator = validator;

    autoBind(this);
  }

  private async startOtpCooldown(type: OtpType, userId: string) {
    const key = `otp-cooldown:${type}:${userId}`;

    let onCooldown = true;
    try {
      await this._cacheService.get(key);
    } catch {
      onCooldown = false; // cache miss
    }

    if (onCooldown) {
      throw new TooManyRequestsError(
        `Please wait ${OTP_COOLDOWN_SEC} seconds before requesting another OTP code`,
      );
    }

    await this._cacheService.set(key, '1', OTP_COOLDOWN_SEC);
  }

  async postAuthenticationHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const payload = request.payload as LoginPayload;
    this._validator.validatePostAuthenticationPayload(payload);

    const { usernameOrEmail, password } = payload;
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
    response.state(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...REFRESH_TOKEN_COOKIE_OPTIONS,
      ttl: 30 * 24 * 60 * 60 * 1000,
    });

    response.code(201);
    return response;
  }

  async putAuthenticationHandler(request: Hapi.Request) {
    const { 'refresh-token': refreshToken } = request.state as RefreshTokenState;

    await this._authenticationsService.verifyRefreshToken(refreshToken);
    const { id } = this._tokenManager.verifyRefreshToken(refreshToken as string);

    try {
      const { is_banned: isBanned } = await this._usersService.getUserById(id);
      if (isBanned === true) {
        throw new AuthenticationError('This account has been banned');
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new InvariantError('Invalid refresh token');
      }
      throw error;
    }

    const accessToken = this._tokenManager.generateAccessToken({ id });

    return {
      status: 'success',
      data: {
        accessToken,
      },
    };
  }

  async deleteAuthenticationHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { 'refresh-token': refreshToken } = request.state as RefreshTokenState;
    await this._authenticationsService.verifyRefreshToken(refreshToken);
    await this._authenticationsService.deleteRefreshToken(refreshToken);

    const response = h.response({
      status: 'success',
      message: 'Refresh token deleted successfully',
    });
    response.unstate(REFRESH_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE_OPTIONS);
    return response;
  }

  async postVerificationCodeHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const payload = request.payload as VerificationCodePayload;
    this._validator.validatePostVerificationCodePayload(payload);
    const { userId } = payload;

    const { email, is_active: isActive } = await this._usersService.getUserById(userId);

    if (isActive) {
      throw new InvariantError('User is already verified');
    }

    await this.startOtpCooldown('verify', userId);

    const otp = generateOtp();
    await this._producerService.sendMessage('auth:verify', JSON.stringify({ userId, email, otp }));

    const response = h.response({
      status: 'success',
      message: 'OTP code has been sent',
    });

    response.code(201);
    return response;
  }

  async postResetPasswordRequest(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const payload = request.payload as ForgotPasswordPayload;
    this._validator.validatePostForgotPasswordPayload(payload);
    const { email } = payload;

    const { id: userId, username } = await this._usersService.getUserByEmail(email);

    await this.startOtpCooldown('forgot', userId);

    const otp = generateOtp();
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
