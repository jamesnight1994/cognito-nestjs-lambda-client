import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('apps')
export class App {
    @PrimaryColumn()
    tenant_id: number;
    
    @Column()
    client_id: string;
    
    @Column()
    legacy_client_id: string;

    @Column()
    user_pool: string;
}
