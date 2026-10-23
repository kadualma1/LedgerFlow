import { db } from "../database/db.js";
import { organizations } from "../database/schema.js";
import { Organization } from "../../domain/entities/Organization.js";
import { eq } from "drizzle-orm";

export class OrganizationRepo {
    public async save(organization: Organization): Promise<void> {
        const state = organization.toState();
        await db.insert(organizations).values(state);
    }

    public async update(organization: Organization): Promise<void> {
        const state = organization.toState();
        const result = await db.update(organizations).set({
            name: state.name,
            baseCurrency: state.baseCurrency,
            updatedAt: state.updatedAt,
            status: state.status
        }).where(eq(organizations.id, state.id)).returning({ id: organizations.id });

        if (result.length === 0) {
            throw new Error(`Organization with ID ${state.id} not found for update.`);
        }
    }

    public async findById(id: string): Promise<Organization | null> {
        const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
        const row = result[0];
        if (!row) return null;
        return Organization.restore(row);
    }
}