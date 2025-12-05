import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AppService {
  constructor(
    @Inject('RABBITMQ_SERVICE')
    private readonly rabbitmqClient: ClientProxy,
  ) {}

  getHello(): string {
    return 'API online!';
  }

  sendTestMessage() {
    this.rabbitmqClient.emit('evento_teste', {
      msg: 'Olá RabbitMQ!',
    });

    return { status: 'ok', message: 'Mensagem enviada para o RabbitMQ!' };
  }
}
