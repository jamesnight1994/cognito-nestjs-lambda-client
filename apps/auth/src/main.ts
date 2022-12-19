import {
  HttpException,
  HttpStatus,
  NotAcceptableException,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Callback, Context, Handler } from 'aws-lambda/handler';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { NewUser, User } from './@types/user';
import { AppClient, VerifyAppClient } from './@types/app';

interface AuthEvent {
  eventType:
    | 'GET_ACCESS_TOKEN'
    | 'VERIFY_ACCESS_TOKEN'
    | 'REGISTER'
    | 'LOGIN'
    | 'TEST';
  data: AppClient | VerifyAppClient | NewUser | User;
}

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  const appContext = await NestFactory.createApplicationContext(AuthModule);
  const authService = appContext.get(AuthService);
  const authEvent: AuthEvent = JSON.parse(JSON.stringify(event));
  console.info(authEvent);

  if (authEvent.eventType == 'REGISTER') {
    await authService.adminCreateUser(authEvent.data as NewUser, callback);
  } else if (authEvent.eventType == 'GET_ACCESS_TOKEN') {
    await authService.getAccessToken(authEvent.data as AppClient, callback);
  } else if (authEvent.eventType == 'LOGIN') {
    await authService.initiateAuth(authEvent.data as User, callback);
  } else if (authEvent.eventType == 'VERIFY_ACCESS_TOKEN') {
    await authService.verifyToken(authEvent.data as VerifyAppClient, callback);
  } else if (authEvent.eventType == 'TEST') {
    callback(null, 'Lami Auth is operational');
  } else {
    callback(new HttpException('Event not found', HttpStatus.NOT_FOUND));
  }
};
