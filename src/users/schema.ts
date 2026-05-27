import { relations } from "drizzle-orm";
import { pgTable,serial,text, integer} from "drizzle-orm/pg-core";
import { attempts } from "src/attempts/schema";


export const users=pgTable('users',{
    id:serial('id').primaryKey(),
    email:text('email').unique(),
    password:text('password'),
})

export const userRelations=relations(users,({many})=>({
    attempts:many(attempts)
}));

