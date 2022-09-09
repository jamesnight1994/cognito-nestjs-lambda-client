import { AdminCreateUserCommand, ForgotPasswordCommandInput, CognitoIdentityProviderClient, InitiateAuthCommand, InitiateAuthCommandInput, ForgotPasswordCommand, AdminCreateUserCommandInput, RespondToAuthChallengeCommand, AdminCreateUserCommandOutput, ConfirmForgotPasswordCommandInput, ConfirmForgotPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { Injectable } from '@nestjs/common';
import { Callback } from 'aws-lambda';
import { CognitoJwtVerifier } from "aws-jwt-verify";

@Injectable()
export class AuthService {
    private client: CognitoIdentityProviderClient;

    constructor(){
        this.client = new CognitoIdentityProviderClient({
            region: process.env.COGNITO_AWS_REGION
        });
        
        
    }

    // admin create user
    async adminCreateUser(email: string,callback: Callback){
        let data: AdminCreateUserCommandInput = {
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: email
        };
        let command: AdminCreateUserCommand = new AdminCreateUserCommand(data);
        try{
            let response = await this.client.send(command);
            callback(null,response);
        }catch(e){
            callback(e);
        };
    }
    
    // confirm forgot password
    async  confirmForgotPassword(email: string, password: string,code: string,callback: Callback) {
        let data: ConfirmForgotPasswordCommandInput = {
            ClientId: process.env.COGNITO_CLIENT_ID,
            ConfirmationCode: code,
            Username: email,
            Password: password
        };

        let command = new ConfirmForgotPasswordCommand(data);

        this.client.send(command);
        try{
            let response = await this.client.send(command);
            callback(null,response);
        }catch(e){
            callback(e);
        }
    }

    async initiateAuth(email: string, password: string,type: string,callback: Callback) {
        let input: InitiateAuthCommandInput = {
            AuthFlow: type,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password
            },
            ClientId: process.env.COGNITO_CLIENT_ID
        };
        let command: InitiateAuthCommand = new InitiateAuthCommand(input);

        try{
            let response = await this.client.send(command);
            callback(null,response);
        }catch(e){
            callback(e);
        }

    
    }

    // forgot password
    async  forgotPassword(email: string,callback: Callback) {
        let data: ForgotPasswordCommandInput = {
            ClientId: process.env.COGNITO_CLIENT_ID,
            Username: email
        };

        let command = new ForgotPasswordCommand(data);

        this.client.send(command);
        try{
            let response = await this.client.send(command);
            callback(null,response);
        }catch(e){
            callback(e);
        }
        
    }

    // respond to auth challenge
    async respondToAuthChallenge(challengeName: string,challengeResponses,session: string,callback: Callback) {
        let input = {
            ChallengeName: challengeName,
            ClientId: process.env.COGNITO_CLIENT_ID,
            Session: session,
            ChallengeResponses: challengeResponses
        };
        let command: RespondToAuthChallengeCommand = new RespondToAuthChallengeCommand(input);

        try{
            let response = await this.client.send(command);
            callback(null,response);
        }catch(e){
            callback(e);
        }
    }

    async verifyToken(token: string,tokenUse: "access",callback: Callback) {
        let verifier = CognitoJwtVerifier.create({
            userPoolId: process.env.COGNITO_USER_POOL_ID,
            tokenUse: tokenUse,
            clientId: process.env.COGNITO_CLIENT_ID,
          });
        try {
            const payload = await verifier.verify(token);
            callback(null,payload);
          } catch(e) {
            return callback(e);
          }
    }
}
