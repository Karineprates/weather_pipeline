import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { WeatherModule } from './weather/weather.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { AppController } from './app.controller';
import { ExternalModule } from './external/external.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRoot(
      process.env.MONGO_URI ||
        'mongodb://root:root@mongo:27017/weather?authSource=admin',
    ),

    RabbitmqModule,

    UsersModule,

    AuthModule,

    WeatherModule,

    ExternalModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
