import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { Module } from '@nestjs/common';
import { UserService } from './user.service';

const EXPORTS = [
  {
    provide: 'USER_SERVICE',
    useClass: UserService
  },
]
@Module({
  exports: [
    ...EXPORTS
  ],
  providers: [
    ...EXPORTS,
    {
      provide: 'COGNITO_CLIENT',
      useValue: (new CognitoIdentityProviderClient({
        region: process.env.COGNITO_AWS_REGION,
      }))
    }
  ]
})
export class UserModule {}
