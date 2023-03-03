import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import config from 'config';
import { TransformationInterceptor } from './responseinterceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new TransformationInterceptor());
  await app.listen(config.get('port'), () => {
    console.log(`SERVER IS RUNNING ON http://localhost:${config.get('port')}`);
  });
}
bootstrap();
