import { AdminCreateUserCommand, AdminCreateUserCommandInput, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { Injectable } from '@nestjs/common';

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
    adminCreateUser(email: string){
        this.newUser = {
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: email
        };
        let command = new AdminCreateUserCommand(this.newUser);

        try{
            let response = this.client.send(command);
            return response;
        }catch(e){
            return e;
        }
    }

    // TODO: admin get user


    // TODO: admin get users
    
}
