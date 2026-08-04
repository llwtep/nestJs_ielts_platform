import { Injectable, Inject} from "@nestjs/common";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DATABASE_CONNECTION } from "src/database/database-connection";
import * as schema from 'src/users/schema'
import { randomUUID } from "crypto";
@Injectable()
export class UserRepository{
    constructor(
            @Inject(DATABASE_CONNECTION) private readonly database:NodePgDatabase<typeof schema>,
        ){}

    
    async createUser(user:typeof schema.users.$inferInsert){
        const [createdUser] = await this.database.insert(schema.users).values({
            ...user,
            id: user.id || randomUUID()
        }).returning();
        return createdUser;
    }
    
    async getByEmail(email:string){
        const condition=eq(schema.users.email, email)
        return this.database.query.users.findFirst({
            where:condition
        });
    }
}