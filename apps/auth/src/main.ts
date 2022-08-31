import { HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Callback, Context, Handler } from 'aws-lambda/handler';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';

export enum EventTypes  {
  REGISTER = 'REGISTER',
  LOGIN = 'LOGIN'
}
export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  const appContext = await NestFactory.createApplicationContext(AuthModule);
  const authService = appContext.get(AuthService);
  
  if(event["eventType"] == EventTypes.REGISTER){
    return await authService.adminCreateUser(event["data"]['email']);
  }else if(event["eventType"] == EventTypes.LOGIN){
    
  }else{
    return {
      body: "Event type not found",
      statusCode: HttpStatus.NOT_FOUND
    }
  }

};