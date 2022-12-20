import {
  AdminCreateUserCommand,
  AdminCreateUserCommandInput,
  CognitoIdentityProviderClient,
  CreateResourceServerCommand,
  CreateUserPoolClientCommand,
  CreateUserPoolCommand,
  CreateUserPoolCommandOutput,
  CreateUserPoolDomainCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { Inject, Injectable } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Callback } from 'aws-lambda';
import { create } from 'domain';
import { response } from 'express';
import { type } from 'os';
import { config } from 'process';
import { In } from 'typeorm';
import { dataSource } from './data.source';
import { App } from './entities/app';
import Person from './entities/person';
import { Tenant } from './entities/tenant';
import { UserModule } from './user/user.module';
import { UserService } from './user/user.service';

type TenantAuth0Ids = Array<string>;
type TenantUserPoolAndClient = {
  userPool: {
    id: string;
    name: string;
  };
  client: {
    id: string;
    secret: string;
  };
};

@Injectable()
export class AppService {
  private client: CognitoIdentityProviderClient;

  constructor(
    @Inject('USER_SERVICE') private userService: UserService,
    @Inject('SNS_CLIENT') private snsClient: SNSClient,
  ) {}

  async migrateTenantPersons(app: App, callback: Callback) {
    (await this.getPersons(app)).forEach(async (person) => {
      // TODO Migrate existing persons to cognito
      try {
        const input: AdminCreateUserCommandInput = {
          UserPoolId: app.user_pool,
          Username: person.email,
          TemporaryPassword: process.env.TEMPORARY_PASSWORD,
          UserAttributes: [
            {
              Name: 'email',
              Value: person.email,
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

        // generate password=email-@domain+random-characters
        const password: string =
          person.email.split('@')[0] + Math.random().toString(36).slice(2);

        // Set user password for the user ...
        this.userService
          .adminCreateUser({
            email: person.email,
            password: password,
            app: app,
          })
          .then((user) => {
            // send the user their password
            const command = new PublishCommand({
              Message: `Hello ${person.first_name}

            Your new password is ${user.password}.
            `,
            });
            const response = this.snsClient.send(command);
          })
          .catch((e) => {
            throw new Error(e);
          });
      } catch (e) {
        // TODO log and skip the being registered
      }
    });
  }

  async registerTenantApps(clients: TenantAuth0Ids) {
    (await this.getApps(clients)).forEach(async (app) => {
      // register app on cognito
      this.createTenantUserPoolAndClient(app.tenant.tenant_name).then(
        async (data) => {
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

          console.log('Updated attributes', app);
          // ...update columnns
          await dataSource.initialize();
          const appRepository = await dataSource.getRepository(App);
          const tenantRepository = await dataSource.getRepository(Tenant);
          // update app
          await appRepository.update(app.auth0_id, app);
          //update tenant config
          await tenantRepository.update(app.tenant.tenant_id, app.tenant);
          await dataSource.destroy();
        },
      );
    });
  }
  async getApps(clients: TenantAuth0Ids): Promise<App[]> {
    await dataSource.initialize();
    const apps = await dataSource.getRepository(App).find({
      relations: {
        tenant: true,
      },
      where: {
        auth0_id: In(clients),
      },
    });

    await dataSource.destroy();
    return apps;
  }

  async getPersons(app: App): Promise<Person[]> {
    await dataSource.initialize();
    const persons = await dataSource.getRepository(Person).find({
      where: {
        tenant_party_id: app.tenant.tenant_id,
      },
    });

    await dataSource.destroy();
    return persons;
  }
  async createTenantUserPoolAndClient(
    tenantName: string,
  ): Promise<TenantUserPoolAndClient> {
    // create userpool
    const poolName = `${tenantName.toLowerCase().replace(/ /g, '')}-${
      process.env.NODE_ENV
    }`;
    const uuid = `${poolName}-${new Date().valueOf()}`;
    const createUserPoolCommand = new CreateUserPoolCommand({
      PoolName: poolName,
      UsernameAttributes: ['email'],
      MfaConfiguration: 'OFF',
    });
    // create user pool
    const { UserPool } = await this.client.send(createUserPoolCommand);

    // create resource server
    const createResourceServerCommand = new CreateResourceServerCommand({
      Name: poolName,
      UserPoolId: UserPool.Id,
      Identifier: 'https://localhost:8080/api/v2',
      Scopes: [
        {
          ScopeName: 'access',
          ScopeDescription: 'General access to API',
        },
      ],
    });
    const { ResourceServer } = await this.client.send(
      createResourceServerCommand,
    );

    // create userpool domain
    const createUserpoolDomainCommand = new CreateUserPoolDomainCommand({
      Domain: poolName,
      UserPoolId: UserPool.Id,
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
      AllowedOAuthScopes: ['https://localhost:8080/api/v2/access'],
      AllowedOAuthFlowsUserPoolClient: true,
    });
    const { UserPoolClient } = await this.client.send(
      createUserPoolClientCommand,
    );

    return {
      userPool: {
        id: UserPool.Id,
        name: UserPool.Name,
      },
      client: {
        id: UserPoolClient.ClientId,
        secret: UserPoolClient.ClientSecret,
      },
    };
  }
}
