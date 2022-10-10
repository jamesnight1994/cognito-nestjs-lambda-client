import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { App } from './entities/app';

const Entities=  [App];
@Module({
  imports: [
  ],
  providers: [
    AuthService,
  ],
})
export class AuthModule {}
