import { DataSource } from "typeorm";
import { App } from "./entities/app";

export const appDataSource = new DataSource({
    type: 'postgres',
    host: process.env.CONFIG_DB_HOST,
    port: 5432,
    username: process.env.CONFIG_DB_USER,
    password: process.env.CONFIG_DB_PASSWORD,
    database: process.env.CONFIG_DB_DATABASE,
    entities: [App],
    synchronize: false,
});

