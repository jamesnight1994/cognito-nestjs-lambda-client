import { HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Callback, Context, Handler } from 'aws-lambda/handler';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  const appContext = await NestFactory.createApplicationContext(AuthModule);
  const authService = appContext.get(AuthService);
  console.info("Registering user on cognito")
  // console.log(JSON.stringify(event));

  let response = await authService.adminCreateUser(event['email']);

  return {
    body: response,
    statusCode: HttpStatus.OK
  }

};