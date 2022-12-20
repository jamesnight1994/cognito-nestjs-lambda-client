import { SNSClient } from '@aws-sdk/client-sns';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';

@Module({
  imports: [ConfigModule.forRoot(), UserModule],
  providers: [AppService,
  {
    provide: 'SNS_CLIENT',
    useValue: (new SNSClient({
      region: process.env.COGNITO_AWS_REGION,
    }))
  }
  ],
})
export class AppModule {}
