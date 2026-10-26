import { db } from "../database/db.js";
import { memberships } from "../database/schema.js";
import { eq } from "drizzle-orm";
import { Membership } from "../../domain/entities/Membership.js";

export class MembershipRepo {
    public async save(membership: Membership): Promise<void> {
        const state = membership.toState();
        await db.insert(memberships).values(state);
    }

    public async update(membership: Membership): Promise<void> {
        const state = membership.toState();
        const result = await db.update(memberships).set({
            role: state.role,
            updatedAt: state.updatedAt,
            status: state.status
        }).where(eq(memberships.id, state.id)).returning({ id: memberships.id });

        if (result.length === 0) {
            throw new Error(`Membership with ID ${state.id} not found for update.`);
        }
    }

    public async findById(id: string): Promise<Membership | null> {
        const result = await db.select().from(memberships).where(eq(memberships.id, id)).limit(1);
        const row = result[0];
        if (!row) return null;
        return Membership.restore(row);
    }

    public async findByUserId(userId: string): Promise<Membership[]> {
        const result = await db.select().from(memberships).where(eq(memberships.userId, userId));
        return result.map(row => Membership.restore(row));
    }

    public async findByOrganizationId(organizationId: string): Promise<Membership[]> {
        const result = await db.select().from(memberships).where(eq(memberships.organizationId, organizationId));
        return result.map(row => Membership.restore(row));
    }
}