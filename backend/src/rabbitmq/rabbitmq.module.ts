import { Module } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

export const RABBITMQ_SERVICE = 'RABBITMQ_SERVICE';

@Module({
  providers: [
    {
      provide: RABBITMQ_SERVICE,
      useFactory: () => {
        const url =
          process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672';
        const queue = process.env.RABBITMQ_QUEUE || 'weather_queue';

        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [url],
            queue,
          },
        });
      },
    },
  ],
  exports: [RABBITMQ_SERVICE],
})
export class RabbitmqModule {}
