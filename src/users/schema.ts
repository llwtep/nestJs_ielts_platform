import { relations } from "drizzle-orm";
import { pgTable,serial,text, uuid} from "drizzle-orm/pg-core";
import { attempts } from "src/attempts/schema";


export const users=pgTable('users',{
    id:uuid('id').primaryKey(),
    email:text('email').unique(),
    password:text('password'),
    role:text('role').default('user').notNull(),
})

export const userRelations=relations(users,({many})=>({
    attempts:many(attempts)
}));

