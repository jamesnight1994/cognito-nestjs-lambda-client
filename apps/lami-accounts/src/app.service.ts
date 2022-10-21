import { CognitoIdentityProviderClient, CreateResourceServerCommand, CreateUserPoolClientCommand, CreateUserPoolCommand, CreateUserPoolCommandOutput, CreateUserPoolDomainCommand } from '@aws-sdk/client-cognito-identity-provider';
import { Injectable } from '@nestjs/common';
import { create } from 'domain';
import { type } from 'os';
import { config } from 'process';
import { In } from 'typeorm';
import { dataSource } from './data.source';
import { App } from './entities/app';
import { Tenant } from './entities/tenant';

type TenantAuth0Ids = Array<string>
type TenantUserPoolAndClient = { 
  userPool: {
    id: string
    name: string
  },
  client: {
    id: string,
    secret: string
  }
};

@Injectable()
export class AppService {
  private client: CognitoIdentityProviderClient;

  constructor() {
      this.client = new CognitoIdentityProviderClient({
          region: process.env.COGNITO_AWS_REGION
      });


  }

  async  registerTenantApps(clients: TenantAuth0Ids){
    (await this.getApps(clients)).forEach(async (app)=>{
      // register app on cognito
      this.createTenantUserPoolAndClient(app.tenant.tenant_name).then(async (data) => {
        /**
         * Add the following values to their respective columns
         * - cognito_userpool_id
         * - user_pool
         * - client_id
         * - client_secret
         */
        app.cognito_userpool_id = data.userPool.id;
        app.user_pool = data.userPool.name;
        app.client_id = data.client.id;
        app.client_secret = data.client.secret;

        // ...update config
        app.tenant.tenant_config.cognito_client_id = data.client.id;
        app.tenant.tenant_config.cognito_userpool_id = data.userPool.id;
        
        console.log('Updated attributes',app);
        // ...update columnns
        await dataSource.initialize();
        let appRepository = await dataSource.getRepository(App);
        let tenantRepository = await dataSource.getRepository(Tenant);
        // update app
        await appRepository.update(app.auth0_id,app);
        //update tenant config
        await tenantRepository.update(app.tenant.tenant_id,app.tenant);
        await dataSource.destroy();
        
      })
    });
  }
  async getApps(clients: TenantAuth0Ids): Promise<App[]>{
    await dataSource.initialize();
    let apps = await dataSource.getRepository(App).find({
      relations: {
        tenant: true
      },
      where: {
        auth0_id: In(clients)
      }
    })
    
    await dataSource.destroy();
    return apps;
  }
  async createTenantUserPoolAndClient(tenantName: string): Promise<TenantUserPoolAndClient>{
    // create userpool
    let poolName = `${tenantName.toLowerCase().replace(/ /g,'')}-${process.env.NODE_ENV}`;
    let uuid = `${poolName}-${new Date().valueOf()}`;
    const createUserPoolCommand = new CreateUserPoolCommand({
      PoolName: poolName,
      UsernameAttributes: ['email'],
      MfaConfiguration: 'OFF',
      
    });
    // create user pool
    const { UserPool }= await this.client.send(createUserPoolCommand);

    // create resource server
    const createResourceServerCommand = new CreateResourceServerCommand({
      Name: poolName,
      UserPoolId: UserPool.Id,
      Identifier: 'https://localhost:8080/api/v2',
      Scopes: [
        {
          ScopeName: 'access',
          ScopeDescription: 'General access to API'
        }
      ]
    });
    let { ResourceServer } = await this.client.send(createResourceServerCommand);

    // create userpool domain
    const createUserpoolDomainCommand = new CreateUserPoolDomainCommand({
      Domain: poolName,
      UserPoolId: UserPool.Id
    });
    this.client.send(createUserpoolDomainCommand);

    // default client
    const createUserPoolClientCommand = new CreateUserPoolClientCommand({
      ClientName: 'Default',
      UserPoolId: UserPool.Id,
      ExplicitAuthFlows: ['USER_PASSWORD_AUTH'],
      GenerateSecret: true,
      AllowedOAuthFlows: ['client_credentials'],
      SupportedIdentityProviders: ['COGNITO'],
      AllowedOAuthScopes: [ 'https://localhost:8080/api/v2/access' ]
    });
   const { UserPoolClient } = await this.client.send(createUserPoolClientCommand);

    return { 
      userPool: {
        id: UserPool.Id,
        name: UserPool.Name
      },
      client: {
        id: UserPoolClient.ClientId,
        secret: UserPoolClient.ClientSecret
      }
    };
  }
}
