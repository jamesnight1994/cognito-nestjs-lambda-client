import { AdminCreateUserCommand, AdminCreateUserCommandInput, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { Injectable } from '@nestjs/common';
import { response } from 'express';

@Injectable()
export class AuthService {
    private client: CognitoIdentityProviderClient;
    
    public newUser: AdminCreateUserCommandInput
    constructor(){
        this.client = new CognitoIdentityProviderClient({
            region: process.env.AWS_REGION
        });
        this.newUser.UserPoolId = process.env.COGNITO_USER_POOL_ID;
        
    }

    // TODO(verify): admin create user
    adminCreateUser(email: string){
        this.newUser.Username = email;
        let command = new AdminCreateUserCommand(this.newUser);

        try{
            let response = this.client.send(command);
            return response;
        }catch(e){
            return response;
        }
    }

    // TODO: admin get user


    // TODO: admin get users
    
}
