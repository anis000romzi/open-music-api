import { ClientError } from './ClientError';

export class TooManyRequestsError extends ClientError {
  constructor(message: string) {
    super(message, 429);
    this.name = 'TooManyRequestsError';
  }
}
