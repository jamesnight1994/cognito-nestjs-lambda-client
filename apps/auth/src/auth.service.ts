import { AdminCreateUserCommand, ForgotPasswordCommandInput, CognitoIdentityProviderClient, ForgotPasswordCommand, AdminCreateUserCommandInput, RespondToAuthChallengeCommand, ConfirmForgotPasswordCommandInput, ConfirmForgotPasswordCommand, InitiateAuthCommand, InitiateAuthCommandInput, InitiateAuthCommandOutput, RespondToAuthChallengeCommandOutput, RespondToAuthChallengeCommandInput } from '@aws-sdk/client-cognito-identity-provider';
import { Injectable } from '@nestjs/common';
import { Callback } from 'aws-lambda';
import { CognitoJwtVerifier } from "aws-jwt-verify";
import axios from 'axios';
import { App } from './entities/app';
import { appDataSource } from './app-data-source';
import { createHmac } from 'crypto';
import { CognitoAccessTokenPayload } from 'aws-jwt-verify/jwt-model';

type NewUser = {
    email: string,
    password: string,
    userPoolId: string
}

type LoginUser = {
    email: string,
    password: string,
    clientId: string
}

@Injectable()
export class AuthService {
    private client: CognitoIdentityProviderClient;

    constructor() {
        this.client = new CognitoIdentityProviderClient({
            region: process.env.COGNITO_AWS_REGION
        });


    }

    /**
     * Get tenant access token credentials from tenant user pool
     * @param clientId 
     * @param clientSecret 
     */
    async getAccessToken(clientId: string, clientSecret: string, callback: Callback) {
        // TODO search if  legacy credentials
        let app = await this.getAppBy({
            auth0_id: clientId
        });

        // if legacy client id is found:(false)
        if(app != null){
            // ...clientId arg is equal client_id(that belongs to cognito) attribute
            console.log("Legacy client_id found");
            clientId = app.client_id
            console.log("Client Id is now",clientId)
        }

        let querystring = require('querystring');
        let data = querystring.stringify({
            'grant_type': 'client_credentials',
            'client_id': clientId,
            'client_secret': clientSecret,
            'scopes': 'list'
        })
        // access by lazy loader
        try {
            await appDataSource.initialize();
            let tenant = await appDataSource.getRepository(App).findOneBy({
                client_id: clientId
            });
            await appDataSource.destroy()
            console.log(tenant);
            let userPoolName = tenant.user_pool;
            let COGNITO_DOMAIN = `https://${userPoolName}.auth.eu-west-1.amazoncognito.com/oauth2/token`;
            console.log("Fetching token from", COGNITO_DOMAIN);
            console.log('data ', data);
            let response = await axios({
                method: 'POST',
                url: COGNITO_DOMAIN,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                    // "Authorization": 'Basic ' + Buffer.from(clientId + ":" + clientSecret).toString('base64')
                },
                data: data
            });
            callback(null, response.data);

        } catch (e) {
            callback(e);
        }
    }

    // admin create user
    async adminCreateUser(newUser: NewUser, callback: Callback) {
        let tenant = await this.getAppBy({
            cognito_userpool_id: newUser.userPoolId
        });
        try {
            let input: AdminCreateUserCommandInput = {
                UserPoolId: newUser.userPoolId,
                Username: newUser.email,
                TemporaryPassword: process.env.TEMPORARY_PASSWORD,
                UserAttributes: [
                    {
                        Name: "email",
                        Value: newUser.email,
                    },
                    {
                        Name: "email_verified",
                        Value: "true",
                    }
                ]
            };
            // register user on cognito
            const adminCreateUserCommandInput: AdminCreateUserCommand = new AdminCreateUserCommand(input);
            let { User } = await this.client.send(adminCreateUserCommandInput);

            // Set user password...
            this.setUserPassword({
                email: newUser.email,
                password: newUser.password,
                userPoolId: newUser.userPoolId
            }, tenant);
            
            callback(null, User);
        } catch (e) {
            callback(e);
        }
    }

    // confirm forgot password
    async confirmForgotPassword(email: string, password: string, code: string, callback: Callback) {
        let data: ConfirmForgotPasswordCommandInput = {
            ClientId: process.env.COGNITO_CLIENT_ID,
            ConfirmationCode: code,
            Username: email,
            Password: password
        };

        let command = new ConfirmForgotPasswordCommand(data);

        this.client.send(command);
        try {
            let response = await this.client.send(command);
            callback(null, response);
        } catch (e) {
            callback(e);
        }
    }

    async initiateAuth(email: string, password: string, clientId: string, type: string, callback: Callback) {
        await appDataSource.initialize();
        let tenant = await appDataSource.getRepository(App).findOneBy({
            client_id: clientId
        });
        await appDataSource.destroy();
        const hasher = createHmac('sha256', tenant.client_secret);
        hasher.update(`${email}${tenant.client_id}`);
        const secretHash = hasher.digest('base64');


        let input: InitiateAuthCommandInput = {
            AuthFlow: type,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password,
                SECRET_HASH: secretHash
            },
            ClientId: tenant.client_id
        };
        let command: InitiateAuthCommand = new InitiateAuthCommand(input);

        try {
            let response: InitiateAuthCommandOutput = await this.client.send(command);
            let data: object;
            if (response.AuthenticationResult != undefined) {
                data = {
                    access_token: response.AuthenticationResult.AccessToken,
                    token_type: response.AuthenticationResult.TokenType,
                    expires_in: response.AuthenticationResult.RefreshToken,
                    refresh_token: response.AuthenticationResult.RefreshToken
                }
                callback(null, data);
            } else if (response.ChallengeName == 'NEW_PASSWORD_REQUIRED') {
                data = {
                    challenge_name: response.ChallengeName,
                    session: response.Session
                }
                callback(null, data);
            }
        } catch (e) {
            callback(e);
        }


    }

    // forgot password
    async forgotPassword(email: string, callback: Callback) {
        let data: ForgotPasswordCommandInput = {
            ClientId: process.env.COGNITO_CLIENT_ID,
            Username: email
        };

        let command = new ForgotPasswordCommand(data);

        this.client.send(command);
        try {
            let response = await this.client.send(command);
            callback(null, response);
        } catch (e) {
            callback(e);
        }

    }

    // respond to auth challenge
    async respondToAuthChallenge(challengeName: string, challengeResponses, session: string, callback: Callback) {
        let input = {
            ChallengeName: challengeName,
            ClientId: process.env.COGNITO_CLIENT_ID,
            Session: session,
            ChallengeResponses: challengeResponses
        };
        let command: RespondToAuthChallengeCommand = new RespondToAuthChallengeCommand(input);

        try {
            let response = await this.client.send(command);
            callback(null, response);
        } catch (e) {
            callback(e);
        }
    }

    async verifyToken(token: string, tokenUse: "access"): Promise<CognitoAccessTokenPayload> {
        let verifier = CognitoJwtVerifier.create({
            userPoolId: 'eu-west-1_yndJYKWT4',
            tokenUse: tokenUse,
            clientId: '7btmpg6nb8lq1unsq2cm1cm85h',
        });

        const payload = verifier.verify(token);
        return await payload;
    }

    private async setUserPassword(newUser: NewUser, tenant: App): Promise<RespondToAuthChallengeCommandOutput> {
        const hasher = createHmac('sha256', tenant.client_secret);
        hasher.update(`${newUser.email}${tenant.client_id}`);
        const secretHash = hasher.digest('base64');

        
       
        
        try{
            // ...start authentication challenge
            const initiateAuthCommandInput = {
                AuthFlow: 'USER_PASSWORD_AUTH',
                AuthParameters: {
                    USERNAME: newUser.email,
                    PASSWORD: process.env.TEMPORARY_PASSWORD,
                    SECRET_HASH: secretHash
                },
                ClientId: tenant.client_id,
                secretHash: secretHash,
            };
            const initiateAuthCommand: InitiateAuthCommand = new InitiateAuthCommand(initiateAuthCommandInput);
            let { ChallengeName, Session } = await this.client.send(initiateAuthCommand);

            // ...respond to authentication challenge
            const respondToAuthChallengeCommandInput: RespondToAuthChallengeCommandInput = {
                ChallengeName: ChallengeName,
                ClientId: tenant.client_id,
                Session: Session,
                ChallengeResponses: {
                    USERNAME: newUser.email,
                    PASSWORD: process.env.TEMPORARY_PASSWORD,
                    NEW_PASSWORD: newUser.password,
                    SECRET_HASH: secretHash
                }
            };
            //... respond to authentication challenge
            const respondToAuthChallengeCommand: RespondToAuthChallengeCommand = new RespondToAuthChallengeCommand(respondToAuthChallengeCommandInput);
            return this.client.send(respondToAuthChallengeCommand);

        }catch(e){
            throw e;
        }
        // return RespondToAuthChallengeCommand
    }

    private async getAppBy(app) {
        await appDataSource.initialize();
        let tenant = await appDataSource.getRepository(App).findOneBy(app);
        await appDataSource.destroy();
        return tenant;

    }
}
