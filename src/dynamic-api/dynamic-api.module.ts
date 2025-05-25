import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { DynamicApiController } from './dynamic-api.controller';
import { DynamicApiService } from './dynamic-api.service';
import { ExecutionService } from './execution.service';
import { ConfigModule } from '../config/config.module';
import { SecurityMiddleware } from '../common/middleware/security.middleware';

@Module({
  imports: [ConfigModule],
  controllers: [DynamicApiController],
  providers: [DynamicApiService, ExecutionService],
  exports: [DynamicApiService, ExecutionService],
})
export class DynamicApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityMiddleware).forRoutes('api');
  }
}
