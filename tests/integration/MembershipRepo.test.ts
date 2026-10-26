
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import { Membership } from "../../src/domain/entities/Membership.js";
import { Organization } from "../../src/domain/entities/Organization.js";
import { User } from "../../src/domain/entities/User.js";
import { MembershipRepo } from "../../src/infrastructure/repositories/MembershipRepo.js";
import { OrganizationRepo } from "../../src/infrastructure/repositories/OrganizationRepo.js";
import { UserRepo } from "../../src/infrastructure/repositories/UserRepo.js";
import { memberships, organizations, users } from "../../src/infrastructure/database/schema.js";
import { db } from "../../src/infrastructure/database/db.js";
import { pool } from "../../src/infrastructure/database/pool.js";

describe("MembershipRepo - Integration", () => {
    const repo = new MembershipRepo();
    const userRepo = new UserRepo();
    const organizationRepo = new OrganizationRepo();

    const membershipIds: string[] = [];
    const userIds: string[] = [];
    const organizationIds: string[] = [];

    let databaseVerified = false;

    beforeAll(async () => {
        if (process.env.DB_NAME !== "ledgerflow_test") {
            throw new Error("Integration tests must use ledgerflow_test.");
        }

        const result = await pool.query("SELECT current_database() AS database");

        if (result.rows[0]?.database !== "ledgerflow_test") {
            throw new Error("PostgreSQL connection points to the wrong database.");
        }

        databaseVerified = true;
    });

    afterEach(async () => {
        if (!databaseVerified) return;

        // Foreign keys require memberships to be deleted first.
        if (membershipIds.length > 0) {
            await db.delete(memberships).where(inArray(memberships.id, membershipIds));
            membershipIds.length = 0;
        }

        if (userIds.length > 0) {
            await db.delete(users).where(inArray(users.id, userIds));
            userIds.length = 0;
        }

        if (organizationIds.length > 0) {
            await db.delete(organizations).where(inArray(organizations.id, organizationIds));
            organizationIds.length = 0;
        }
    });

    async function createUser(): Promise<User> {
        const user = User.create("Test User", `test-${randomUUID()}@example.com`);
        userIds.push(user.getId());
        await userRepo.save(user);
        return user;
    }

    async function createOrganization(): Promise<Organization> {
        const organization = Organization.create("Test Organization", "BRL");
        organizationIds.push(organization.getId());
        await organizationRepo.save(organization);
        return organization;
    }

    async function createMembership(
        userId: string,
        organizationId: string,
        role: "ADMIN" | "OPERATOR" | "VIEWER" = "ADMIN"
    ): Promise<Membership> {
        const membership = Membership.create(userId, organizationId, role);
        membershipIds.push(membership.getId());
        await repo.save(membership);
        return membership;
    }

    it("saves a membership with valid foreign keys", async () => {
        const user = await createUser();
        const organization = await createOrganization();
        const membership = await createMembership(user.getId(), organization.getId());

        const restored = await repo.findById(membership.getId());

        expect(restored).toBeInstanceOf(Membership);
        expect(restored?.toState()).toEqual(membership.toState());
    });

    it("returns null for a nonexistent membership", async () => {
        const restored = await repo.findById(randomUUID());

        expect(restored).toBeNull();
    });

    it("persists membership role changes", async () => {
        const user = await createUser();
        const organization = await createOrganization();
        const membership = await createMembership(user.getId(), organization.getId());

        membership.changeRole("VIEWER");
        await repo.update(membership);

        const restored = await repo.findById(membership.getId());

        expect(restored?.getRole()).toBe("VIEWER");
    });

    it("persists membership deactivation", async () => {
        const user = await createUser();
        const organization = await createOrganization();
        const membership = await createMembership(user.getId(), organization.getId());

        membership.deactivate();
        await repo.update(membership);

        const restored = await repo.findById(membership.getId());

        expect(restored?.getStatus()).toBe("INACTIVE");
    });

    it("rejects updating a nonexistent membership", async () => {
        const membership = Membership.create(randomUUID(), randomUUID(), "VIEWER");

        await expect(repo.update(membership)).rejects.toThrow(
            `Membership with ID ${membership.getId()} not found for update.`
        );
    });

    it("finds all memberships belonging to a user", async () => {
        const user = await createUser();
        const firstOrganization = await createOrganization();
        const secondOrganization = await createOrganization();

        const first = await createMembership(user.getId(), firstOrganization.getId(), "ADMIN");
        const second = await createMembership(user.getId(), secondOrganization.getId(), "VIEWER");

        const result = await repo.findByUserId(user.getId());

        expect(result).toHaveLength(2);
        expect(result.map(item => item.getId())).toEqual(
            expect.arrayContaining([first.getId(), second.getId()])
        );
    });

    it("finds all memberships belonging to an organization", async () => {
        const organization = await createOrganization();
        const firstUser = await createUser();
        const secondUser = await createUser();

        const first = await createMembership(firstUser.getId(), organization.getId(), "ADMIN");
        const second = await createMembership(secondUser.getId(), organization.getId(), "OPERATOR");

        const result = await repo.findByOrganizationId(organization.getId());

        expect(result).toHaveLength(2);
        expect(result.map(item => item.getId())).toEqual(
            expect.arrayContaining([first.getId(), second.getId()])
        );
    });

    it("rejects duplicate user-organization memberships", async () => {
        const user = await createUser();
        const organization = await createOrganization();

        await createMembership(user.getId(), organization.getId());

        const duplicate = Membership.create(user.getId(), organization.getId(), "VIEWER");

        await expect(repo.save(duplicate)).rejects.toMatchObject({
            cause: {
                code: "23505",
                constraint: "idx_memberships_user_organization_unique"
            }
        });
    });

    it("rejects memberships referencing a nonexistent user", async () => {
        const organization = await createOrganization();
        const membership = Membership.create(randomUUID(), organization.getId(), "VIEWER");

        await expect(repo.save(membership)).rejects.toMatchObject({
            cause: { code: "23503" }
        });
    });

    it("rejects memberships referencing a nonexistent organization", async () => {
        const user = await createUser();
        const membership = Membership.create(user.getId(), randomUUID(), "VIEWER");

        await expect(repo.save(membership)).rejects.toMatchObject({
            cause: { code: "23503" }
        });
    });
});
