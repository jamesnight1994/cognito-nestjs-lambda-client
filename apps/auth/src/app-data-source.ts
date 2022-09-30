import { DataSource } from "typeorm";
import { App } from "./entities/app.entity";

const Entities=  [App];
// export const appDataSource = async () => {
//     return new DataSource({
//         type: 'postgres',
//         host: process.env.CONFIG_DB_HOST,
//         port: 5432,
//         username: process.env.CONFIG_DB_USER,
//         password: process.env.CONFIG_DB_PASSWORD,
//         database: process.env.CONFIG_DB_DATABASE,
//         entities: Entities,
//         synchronize: false,
//     }).initialize();
// }
export const appDataSource = new DataSource({
    type: 'postgres',
    host: process.env.CONFIG_DB_HOST,
    port: 5432,
    username: process.env.CONFIG_DB_USER,
    password: process.env.CONFIG_DB_PASSWORD,
    database: process.env.CONFIG_DB_DATABASE,
    entities: Entities,
    synchronize: false,
});

