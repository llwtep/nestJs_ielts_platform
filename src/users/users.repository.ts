import { Injectable, Inject} from "@nestjs/common";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DATABASE_CONNECTION } from "src/database/database-connection";
import * as schema from 'src/users/schema'
@Injectable()
export class UserRepository{
    constructor(
            @Inject(DATABASE_CONNECTION) private readonly database:NodePgDatabase<typeof schema>,
        ){}

    
    async createUser(user:typeof schema.users.$inferInsert){
        await this.database.insert(schema.users).values(user);
    }
    
    async getByEmail(email:string){
        const condition=eq(schema.users.email, email)
        return this.database.query.users.findFirst({
            where:condition
        });
    }
}