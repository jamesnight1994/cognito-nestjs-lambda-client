import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthService } from './auth.service';
import { App } from './entities/app.entity';

const Entities=  [App];
@Module({
  imports: [
    TypeOrmModule.forFeature(Entities),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.CONFIG_DB_HOST,
      port: 5432,
      username: process.env.CONFIG_DB_USER,
      password: process.env.CONFIG_DB_PASSWORD,
      database: process.env.CONFIG_DB_DATABASE,
      entities: Entities,
      synchronize: false,
    }),
  ],
  providers: [AuthService],
})
export class AuthModule {
  constructor(private dataSourse: DataSource) {}
}
