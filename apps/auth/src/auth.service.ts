import { AdminAddUserToGroupCommandOutput, AdminCreateUserCommand, AdminCreateUserCommandInput, CognitoIdentityProviderClient, UsernameExistsException } from '@aws-sdk/client-cognito-identity-provider';
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

        const response: any = {
            message: "Bad Request",
            httpCode: HttpStatus.BAD_REQUEST
        }
        
            
        try{
            let data = await this.client.send(command)
            response.message = data.User,
            response.httpCode = HttpStatus.CREATED
            callback(response.message,response.httpCode);
        }catch(e){
            if(e instanceof UsernameExistsException){
                callback(e, e.$response.statusCode);
            }
        };
        return response;
    }
    
}
