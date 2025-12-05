import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_SERVICE } from './rabbitmq/rabbitmq.module';

@Controller()
export class AppController {
  constructor(
    @Inject(RABBITMQ_SERVICE)
    private readonly rabbitClient: ClientProxy,
  ) {}

  @Get('test-rabbit')
  testRabbit() {
    this.rabbitClient.emit('weather_created', {
      message: 'RabbitMQ test message!',
      timestamp: new Date(),
    });

    return { message: 'RabbitMQ message sent!' };
  }

  // === Healthcheck ===
  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }
}
