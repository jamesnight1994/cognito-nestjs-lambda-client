import { HttpException, HttpStatus, NotAcceptableException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Callback, Context, Handler } from 'aws-lambda/handler';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';

export enum EventTypes  {
  REGISTER = 'REGISTER',
  LOGIN = 'LOGIN',
  TEST = 'TEST'
}
export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  const appContext = await NestFactory.createApplicationContext(AuthModule);
  const authService = appContext.get(AuthService,);
  
  if(event["eventType"] == EventTypes.REGISTER){
    await authService.adminCreateUser(event["data"]['email'],callback)
  }else if(event["eventType"] == EventTypes.LOGIN){
    await authService.initiateAuth(event["data"]['email'],event["data"]['password'],'USER_PASSWORD_AUTH',callback)
  }else if(event["eventType"] == EventTypes.TEST){
    callback("Function is working",HttpStatus.OK)
  }else{
    callback(new HttpException('Event not found', HttpStatus.NOT_FOUND))
  }

};