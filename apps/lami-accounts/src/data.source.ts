import { DataSource } from 'typeorm';
import { App } from './entities/app';
import Person from './entities/person';
import { Tenant } from './entities/tenant';
export const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.CONFIG_DB_HOST,
  port: 5432,
  username: process.env.CONFIG_DB_USER,
  password: process.env.CONFIG_DB_PASSWORD,
  database: process.env.CONFIG_DB_DATABASE,
  entities: [App, Tenant, Person],
  synchronize: false,
});
