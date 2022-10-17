import { CognitoIdentityProviderClient, CreateResourceServerCommand, CreateUserPoolClientCommand, CreateUserPoolCommand, CreateUserPoolCommandOutput, CreateUserPoolDomainCommand } from '@aws-sdk/client-cognito-identity-provider';
import { Injectable } from '@nestjs/common';
import { create } from 'domain';
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
      PoolName: tenantName,
      UsernameAttributes: ['email'],
      MfaConfiguration: 'No MFA',
      
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
      Domain: tenantName,
      UserPoolId: UserPool.Id
    });
    this.client.send(createUserpoolDomainCommand);

    // create resource server
    const createResourceServerCommand = new CreateResourceServerCommand({
      Name:'General API access',
      UserPoolId: UserPool.Id,
      Identifier: 'https://localhost:8080/api/v2/',
      Scopes: [
        {
          ScopeName: 'access',
          ScopeDescription: 'General access to API'
        }
      ]
    });

    return { UserPool };
  }
}
