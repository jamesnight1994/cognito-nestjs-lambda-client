import { AdminAddUserToGroupCommandOutput, AdminCreateUserCommand, AdminCreateUserCommandInput, CognitoIdentityProviderClient, InitiateAuthCommand, InitiateAuthCommandInput, InitiateAuthCommandOutput, InvalidUserPoolConfigurationException, UsernameExistsException } from '@aws-sdk/client-cognito-identity-provider';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Callback } from 'aws-lambda';

@Injectable()
export class AuthService {
    private client: CognitoIdentityProviderClient;
    
    public newUser: AdminCreateUserCommandInput;
    constructor(){
        this.client = new CognitoIdentityProviderClient({
            region: process.env.COGNITO_AWS_REGION
        });
        
        
    }

    // admin create user
    async adminCreateUser(email: string,callback: Callback){
        this.newUser = {
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: email
        };
        let command = new AdminCreateUserCommand(this.newUser);
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
}
