import { db } from "../database/db.js";
import { users } from "../database/schema.js";
import { User } from "../../domain/entities/User.js";
import { eq, sql } from "drizzle-orm";

export class UserRepo {
    public async save(user: User): Promise<void> {
        const state = user.toState();
        await db.insert(users).values(state);
    }

    public async update(user: User): Promise<void> {
        const state = user.toState();
        const result = await db.update(users).set({
            name: state.name,
            email: state.email,
            updatedAt: state.updatedAt,
            status: state.status,
            emailVerifiedAt: state.emailVerifiedAt
        }).where(eq(users.id, state.id)).returning({ id: users.id });

        if (result.length === 0) {
            throw new Error(`User with ID ${state.id} not found for update.`);
        }
    }

    public async findById(id: string): Promise<User | null> {
        const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
        const row = result[0];
        if (!row) return null;
        return User.restore(row);
    }

    public async findByEmail(email: string): Promise<User | null> {
        const result = await db.select().from(users).where(eq(sql<string>`lower(${users.email})`, email.trim().toLowerCase())).limit(1);
        const row = result[0];
        if (!row) return null;
        return User.restore(row);
    }
}