import { RespondToAuthChallengeCommandOutput, InitiateAuthCommand, RespondToAuthChallengeCommandInput, RespondToAuthChallengeCommand, CognitoIdentityProviderClient, AdminCreateUserCommand, AdminCreateUserCommandInput, AdminCreateUserCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import { Inject, Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import { App } from '../entities/app';

export type User = {
    email: string;
    password: string;
    app: App
};



@Injectable()
export class UserService {

    constructor(
        @Inject('COGNITO_CLIENT') private cognitoIdentityProviderClient: CognitoIdentityProviderClient
    ) { }

    async adminCreateUser(newUser: User): Promise<User> {
        try {
            const input: AdminCreateUserCommandInput = {
                UserPoolId: newUser.app.user_pool,
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
            await this.cognitoIdentityProviderClient.send(adminCreateUserCommandInput)
                .then(() => {
                    // Set user password...
                    this.setUserPassword(
                        {
                            ...newUser,
                        },
                        newUser.app,
                    );
                }).catch(e => {
                    throw new Error(e);
                });




        } catch (e) {
            // return thw error
            return e;
        }
    }
    async setUserPassword(
        newUser: User,
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
            const { ChallengeName, Session } = await this.cognitoIdentityProviderClient.send(
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
            return this.cognitoIdentityProviderClient.send(respondToAuthChallengeCommand);
        } catch (e) {
            return e;
        }
    }
}
