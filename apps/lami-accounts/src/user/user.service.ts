import { RespondToAuthChallengeCommandOutput, InitiateAuthCommand, RespondToAuthChallengeCommandInput, RespondToAuthChallengeCommand, CognitoIdentityProviderClient, AdminCreateUserCommand, AdminCreateUserCommandInput } from '@aws-sdk/client-cognito-identity-provider';
import { Inject, Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import { App } from '../entities/app';

export type NewUser = {
    email: string;
    password: string;
    userPoolId: string;
    app?: App
  };
  
  export type User = {
    email: string;
    password: string;
    clientId: string;
    app?: App
  };
  

@Injectable()
export class UserService {

    constructor(@Inject('COGNITO_CLIENT') private client: CognitoIdentityProviderClient) {}

    /**
     * 
     * @param newUser{NewUser}
     * @returns 
     */
    async adminCreateUser(newUser: NewUser) {
        try {
            const input: AdminCreateUserCommandInput = {
              UserPoolId: newUser.userPoolId,
              Username: newUser.email,
              TemporaryPassword: process.env.TEMPORARY_PASSWORD,
              UserAttributes: [
                {
                  Name: 'email',
                  Value: newUser.email,
                },
                {
                  Name: 'email_verified',
                  Value: 'true',
                },
              ],
            };
            // register user on cognito
            const adminCreateUserCommandInput: AdminCreateUserCommand =
              new AdminCreateUserCommand(input);
            const { User } = await this.client.send(adminCreateUserCommandInput);
      
            // Set user password...
            this.setUserPassword(
              {
                ...newUser,
              },
              newUser.app,
            );
      
            
          } catch (e) {
            // return thw error
            return e;
          }
    }
    async setUserPassword(
        newUser: NewUser,
        app: App,
    ): Promise<RespondToAuthChallengeCommandOutput> {
        const hasher = createHmac('sha256', app.client_secret);
        hasher.update(`${newUser.email}${app.client_id}`);
        const secretHash = hasher.digest('base64');

        try {
            // ...start authentication challenge
            const initiateAuthCommandInput = {
                AuthFlow: 'USER_PASSWORD_AUTH',
                AuthParameters: {
                    USERNAME: newUser.email,
                    PASSWORD: process.env.TEMPORARY_PASSWORD,
                    SECRET_HASH: secretHash,
                },
                ClientId: app.client_id,
                secretHash: secretHash,
            };
            const initiateAuthCommand: InitiateAuthCommand = new InitiateAuthCommand(
                initiateAuthCommandInput,
            );
            const { ChallengeName, Session } = await this.client.send(
                initiateAuthCommand,
            );

            // ...respond to authentication challenge
            const respondToAuthChallengeCommandInput: RespondToAuthChallengeCommandInput =
            {
                ChallengeName: ChallengeName,
                ClientId: app.client_id,
                Session: Session,
                ChallengeResponses: {
                    USERNAME: newUser.email,
                    PASSWORD: process.env.TEMPORARY_PASSWORD,
                    NEW_PASSWORD: newUser.password,
                    SECRET_HASH: secretHash,
                },
            };
            //... respond to authentication challenge
            const respondToAuthChallengeCommand: RespondToAuthChallengeCommand =
                new RespondToAuthChallengeCommand(respondToAuthChallengeCommandInput);
            return this.client.send(respondToAuthChallengeCommand);
        } catch (e) {
            throw e;
        }
        // return RespondToAuthChallengeCommand
    }
}
