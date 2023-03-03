import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import config from 'config';
import { AllExceptionFilter } from './httpExceptionFilter';

@Module({
  imports: [
    MongooseModule.forRoot(config.get('mongoDbUrl'), {
      //get problem solve tsconfig "esModuleInterop": true
      useNewUrlParser: true,
      keepAlive: true,
      useUnifiedTopology: true,
      w: 1,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: 'APP_FILTER', useClass: AllExceptionFilter },
  ],
})
export class AppModule {}
