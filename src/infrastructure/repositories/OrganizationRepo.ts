import { db } from "../database/db.js";
import { organizations } from "../database/schema.js";
import { Organization } from "../../domain/entities/Organization.js";

export class OrganizationRepo {
    public async save(organization: Organization): Promise<void> {
        const state = organization.toState();
        await db.insert(organizations).values(state);
    }
}