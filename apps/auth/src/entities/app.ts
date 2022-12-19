import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('apps')
export class App {
  @PrimaryColumn()
  auth0_id: string;

  @Column()
  tenant_id: number;

  @Column()
  client_id: string;

  @Column()
  legacy_client_id: string;

  @Column()
  user_pool: string;

  @Column()
  client_secret: string;

  @Column()
  cognito_userpool_id: string;
}
