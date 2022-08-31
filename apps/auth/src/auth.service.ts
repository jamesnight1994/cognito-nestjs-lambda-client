import { AdminAddUserToGroupCommandOutput, AdminCreateUserCommand, AdminCreateUserCommandInput, CognitoIdentityProviderClient, UsernameExistsException } from '@aws-sdk/client-cognito-identity-provider';
import { HttpCode, HttpStatus, Injectable } from '@nestjs/common';

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
    async adminCreateUser(email: string){
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
        }catch(e){
            if(e instanceof UsernameExistsException){
                response.message = e.message;
                response.httpCode = HttpStatus.BAD_REQUEST;
            }
        }
        return response;
    }
    
}
