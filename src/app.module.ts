import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from './config/config.module';
import { DynamicApiModule } from './dynamic-api/dynamic-api.module';

@Module({
  imports: [ConfigModule, DynamicApiModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
