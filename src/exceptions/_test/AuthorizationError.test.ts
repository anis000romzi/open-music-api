import AuthorizationError from "../AuthorizationError";
import ClientError from "../ClientError";

describe('AuthorizationError', () => {
  it('should create AuthorizationError correctly', () => {
    const authorizationError = new AuthorizationError('authorization error!');

    expect(authorizationError).toBeInstanceOf(AuthorizationError);
    expect(authorizationError).toBeInstanceOf(ClientError);
    expect(authorizationError).toBeInstanceOf(Error);

    expect(authorizationError.statusCode).toEqual(403);
    expect(authorizationError.message).toEqual('authorization error!');
    expect(authorizationError.name).toEqual('AuthorizationError');
  });
});
