import { CognitoIdentityProviderClient, CreateResourceServerCommand, CreateUserPoolClientCommand, CreateUserPoolCommand, CreateUserPoolCommandOutput, CreateUserPoolDomainCommand } from '@aws-sdk/client-cognito-identity-provider';
import { Injectable } from '@nestjs/common';
import { create } from 'domain';
import { config } from 'process';
import { dataSource } from './data.source';
import { App } from './entities/app';


@Injectable()
export class AppService {
  private client: CognitoIdentityProviderClient;

  constructor() {
      this.client = new CognitoIdentityProviderClient({
          region: process.env.COGNITO_AWS_REGION
      });


  }

  async createTenantUserPoolAndClient(tenantName: string): Promise<any>{
    // create userpool
    const createUserPoolCommand = new CreateUserPoolCommand({
      PoolName: `${tenantName.toLowerCase()}-${process.env.NODE_ENV}`,
      UsernameAttributes: ['email'],
      MfaConfiguration: 'OFF',
      
    });
    // create user pool
    const { UserPool }= await this.client.send(createUserPoolCommand);

    // default client
    const createUserPoolClientCommand = new CreateUserPoolClientCommand({
      ClientName: 'Default',
      UserPoolId: UserPool.Id,
      ExplicitAuthFlows: ['USER_PASSWORD_AUTH'],
      GenerateSecret: true,
      AllowedOAuthFlows: ['client_credentials'],
      SupportedIdentityProviders: ['COGNITO'],
      // TODO: create scopes
      AllowedOAuthScopes: []
    });
    this.client.send(createUserPoolClientCommand);

    // create userpool domain
    const createUserpoolDomainCommand = new CreateUserPoolDomainCommand({
      Domain: `${tenantName.toLowerCase()}-${process.env.NODE_ENV}`,
      UserPoolId: UserPool.Id
    });
    this.client.send(createUserpoolDomainCommand);

    // create resource server
    const createResourceServerCommand = new CreateResourceServerCommand({
      Name: `${tenantName.toLowerCase()}-${process.env.NODE_ENV}`,
      UserPoolId: UserPool.Id,
      Identifier: 'https://localhost:8080/api/v2/',
      Scopes: [
        {
          ScopeName: 'access',
          ScopeDescription: 'General access to API'
        }
      ]
    });
    this.client.send(createResourceServerCommand);

    return { UserPool };
  }
}
