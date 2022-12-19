import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Tenant } from './tenant';

@Entity('persons')
export default class Person {
  @PrimaryColumn()
  email: string;

  @Column()
  person: string;

  @Column()
  cognito_username: string;
}
