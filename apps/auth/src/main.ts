import { HttpException, HttpStatus, NotAcceptableException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Callback, Context, Handler } from 'aws-lambda/handler';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';

type AuthEvent = {
  eventType: string,
  data: {}
}
export enum EventTypes  {
  CONFIRM_FORGOT_PASSWORD = 'CONFIRM_FORGOT_PASSWORD',
  GET_ACCESS_TOKEN = 'GET_ACCESS_TOKEN',
  REGISTER = 'REGISTER',
  LOGIN = 'LOGIN',
  TEST = 'TEST',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  REQUIRED_CHANGE_PASSWORD = 'REQUIRED_CHANGE_PASSWORD'
}
export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  const appContext = await NestFactory.createApplicationContext(AuthModule);
  const authService = appContext.get(AuthService);
  let authEvent = JSON.parse(JSON.stringify(event));
  console.info(authEvent);
  
  if(event["eventType"] == EventTypes.REGISTER){
    await authService.adminCreateUser(
        authEvent.data,
        callback
      )
  }else if(event["eventType"] == EventTypes.GET_ACCESS_TOKEN){
    await authService.getAccessToken(event["data"]['client_id'],event["data"]['client_secret'],callback)
  }else if(event["eventType"] == EventTypes.LOGIN){
    await authService.initiateAuth(
      event["data"]['email'],
      event["data"]['password'],
      event["data"]['clientId'],
      'USER_PASSWORD_AUTH',
      callback
    )
  }else{
    callback(new HttpException('Event not found', HttpStatus.NOT_FOUND))
  }

};