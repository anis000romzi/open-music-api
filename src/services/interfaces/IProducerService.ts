export interface IProducerService {
  sendMessage(queue: string, message: string): Promise<void>;
}
