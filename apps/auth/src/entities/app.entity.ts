import { Entity, PrimaryColumn } from "typeorm";

@Entity('apps')
export class App {
    @PrimaryColumn()
    tenant_id: number;
    
    client_id: string;
    legacy_client_id: string;
    user_pool: string;
}
