
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { Organization } from "../../src/domain/entities/Organization.js";
import { OrganizationRepo } from "../../src/infrastructure/repositories/OrganizationRepo.js";
import { organizations } from "../../src/infrastructure/database/schema.js";
import { db } from "../../src/infrastructure/database/db.js";
import { pool } from "../../src/infrastructure/database/pool.js";

describe("OrganizationRepo - Integration", () => {
    const repo = new OrganizationRepo();
    const createdIds: string[] = [];
    let databaseVerified = false;

    beforeAll(async () => {
        if (process.env.DB_NAME !== "ledgerflow_test") {
            throw new Error("Tests cannot run outside ledgerflow_test.");
        }

        const result = await pool.query("SELECT current_database() AS database");

        if (result.rows[0]?.database !== "ledgerflow_test") {
            throw new Error("PostgreSQL connection points to the wrong database.");
        }

        databaseVerified = true;
    });

    afterEach(async () => {
        if (!databaseVerified || createdIds.length === 0) return;

        await db.delete(organizations).where(inArray(organizations.id, createdIds));
        createdIds.length = 0;
    });

    it("saves an organization", async () => {
        const organization = Organization.create("Aurora Tecnologia", "BRL");
        createdIds.push(organization.getId());

        await repo.save(organization);

        const restored = await repo.findById(organization.getId());

        expect(restored).not.toBeNull();
        expect(restored?.toState()).toEqual(organization.toState());
    });

    it("returns null when an organization does not exist", async () => {
        const organization = Organization.create("Nonexistent", "BRL");

        const result = await repo.findById(organization.getId());

        expect(result).toBeNull();
    });

    it("restores an independent Organization instance", async () => {
        const organization = Organization.create("Aurora", "BRL");
        createdIds.push(organization.getId());
        await repo.save(organization);

        const restored = await repo.findById(organization.getId());

        expect(restored).toBeInstanceOf(Organization);
        expect(restored).not.toBe(organization);
        expect(restored?.toState()).toEqual(organization.toState());
    });

    it("persists changes to the organization name", async () => {
        const organization = Organization.create("Aurora", "BRL");
        createdIds.push(organization.getId());
        await repo.save(organization);

        organization.rename("Boreal Tech");
        await repo.update(organization);

        const restored = await repo.findById(organization.getId());

        expect(restored?.getName()).toBe("Boreal Tech");
    });

    it("persists organization deactivation", async () => {
        const organization = Organization.create("Aurora", "BRL");
        createdIds.push(organization.getId());
        await repo.save(organization);

        organization.deactivate();
        await repo.update(organization);

        const restored = await repo.findById(organization.getId());

        expect(restored?.toState().status).toBe("INACTIVE");
    });

    it("preserves ID and creation date when updating", async () => {
        const organization = Organization.create("Aurora", "BRL");
        createdIds.push(organization.getId());
        await repo.save(organization);

        const originalState = organization.toState();

        organization.rename("Boreal Tech");
        await repo.update(organization);

        const restored = await repo.findById(organization.getId());

        expect(restored?.getId()).toBe(originalState.id);
        expect(restored?.toState().createdAt).toEqual(originalState.createdAt);
    });

    it("throws when updating a nonexistent organization", async () => {
        const organization = Organization.create("Aurora", "BRL");

        await expect(repo.update(organization)).rejects.toThrow(
            `Organization with ID ${organization.getId()} not found for update.`
        );
    });

    it("rejects duplicate organization IDs", async () => {
        const organization = Organization.create("Aurora", "BRL");
        createdIds.push(organization.getId());

        await repo.save(organization);

        await expect(repo.save(organization)).rejects.toThrow();
    });
});
