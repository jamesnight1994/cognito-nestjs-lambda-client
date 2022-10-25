import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('tenants')
export class Tenant {
    @PrimaryColumn()
    tenant_id: number;
    
    @Column()
    tenant_name: string;

    @Column({ type: 'json' })
    tenant_config;
    
}
