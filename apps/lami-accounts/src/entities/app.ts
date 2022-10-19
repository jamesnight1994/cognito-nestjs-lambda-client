import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { Tenant } from "./tenant";

@Entity('apps')
export class App {
    @PrimaryColumn()
    auth0_id: string;
    
    @Column()
    cognito_userpool_id: string;

    @OneToOne(() => Tenant,{onUpdate: 'CASCADE', onDelete: 'CASCADE', eager: true})
    @JoinColumn({
        name: 'tenant_id'
    })
    tenant: Tenant;
    
    @Column()
    client_id: string;
    
    @Column()
    legacy_client_id: string;

    @Column()
    user_pool: string;

    @Column()
    client_secret: string;

}
