export interface IAuthenticationsService {
  addRefreshToken(token: string): Promise<void>;
  verifyRefreshToken(token: string | undefined): Promise<void>;
  deleteRefreshToken(token: string | undefined): Promise<void>;
}
