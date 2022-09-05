import { AdminAddUserToGroupCommandOutput, AdminCreateUserCommand, AdminCreateUserCommandInput, ChallengeResponse, CognitoIdentityProviderClient, InitiateAuthCommand, InitiateAuthCommandInput, InitiateAuthCommandOutput, InvalidUserPoolConfigurationException, RespondToAuthChallengeCommand, UsernameExistsException } from '@aws-sdk/client-cognito-identity-provider';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Callback } from 'aws-lambda';

@Injectable()
export class AuthService {
    private client: CognitoIdentityProviderClient;
    
    private user: AdminCreateUserCommandInput;
    constructor(){
        this.client = new CognitoIdentityProviderClient({
            region: process.env.COGNITO_AWS_REGION
        });
        
        
    }

    // admin create user
    async adminCreateUser(email: string,callback: Callback){
        this.user = {
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: email
        };
        let command = new AdminCreateUserCommand(this.user);
        try{
            let response = await this.client.send(command);
            callback(null,response);
        }catch(e){
            callback(e);
        };
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
}
