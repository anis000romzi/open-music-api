import amqp from 'amqplib';
import { IProducerService } from '../interfaces/IProducerService';

export class RabbitMQProducerService implements IProducerService {
  private _url: string;

  constructor(url: string = process.env.RABBITMQ_SERVER as string) {
    this._url = url;
  }

  async sendMessage(queue: string, message: string): Promise<void> {
    const connection = await amqp.connect(this._url);
    const channel = await connection.createChannel();
    await channel.assertQueue(queue, {
      durable: true,
    });

    channel.sendToQueue(queue, Buffer.from(message));

    setTimeout(() => {
      connection.close();
    }, 1000);
  }
}
