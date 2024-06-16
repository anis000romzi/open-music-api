/* eslint-disable no-undef */
const ClientError = require('../ClientError');

describe('ClientError', () => {
  it('should throw error when directly use it', () => {
    const clientError = new ClientError('client error!');

    expect(clientError).toBeInstanceOf(ClientError);
    expect(clientError).toBeInstanceOf(Error);

    expect(clientError.statusCode).toEqual(400);
    expect(clientError.message).toEqual('client error!');
    expect(clientError.name).toEqual('ClientError');
  });
});
