
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { User } from "../../src/domain/entities/User.js";
import { UserRepo } from "../../src/infrastructure/repositories/UserRepo.js";
import { users } from "../../src/infrastructure/database/schema.js";
import { db } from "../../src/infrastructure/database/db.js";
import { pool } from "../../src/infrastructure/database/pool.js";

describe("UserRepo - Integration", () => {
    const repo = new UserRepo();
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

        await db.delete(users).where(inArray(users.id, createdIds));
        createdIds.length = 0;
    });

    it("saves a user successfully", async () => {
        const user = User.create("Carlos", "carlos@example.com");
        createdIds.push(user.getId());

        await repo.save(user);

        const restored = await repo.findById(user.getId());

        expect(restored).not.toBeNull();
        expect(restored?.toState()).toEqual(user.toState());
    });

    it("returns null when the user does not exist", async () => {
        const user = User.create("Carlos", "carlos@example.com");

        const result = await repo.findById(user.getId());

        expect(result).toBeNull();
    });

    it("restores an independent User instance", async () => {
        const user = User.create("Carlos", "carlos@example.com");
        createdIds.push(user.getId());

        await repo.save(user);

        const restored = await repo.findById(user.getId());

        expect(restored).toBeInstanceOf(User);
        expect(restored).not.toBe(user);
        expect(restored?.toState()).toEqual(user.toState());
    });

    it("persists changes to the user's name", async () => {
        const user = User.create("Carlos", "carlos@example.com");
        createdIds.push(user.getId());

        await repo.save(user);

        user.rename("Carlos Eduardo");
        await repo.update(user);

        const restored = await repo.findById(user.getId());

        expect(restored?.toState().name).toBe("Carlos Eduardo");
    });

    it("persists user deactivation", async () => {
        const user = User.create("Carlos", "carlos@example.com");
        createdIds.push(user.getId());

        await repo.save(user);

        user.deactivate();
        await repo.update(user);

        const restored = await repo.findById(user.getId());

        expect(restored?.toState().status).toBe("INACTIVE");
    });

    it("preserves the ID and creation date after updating", async () => {
        const user = User.create("Carlos", "carlos@example.com");
        createdIds.push(user.getId());

        await repo.save(user);

        const original = user.toState();

        user.rename("Carlos Eduardo");
        await repo.update(user);

        const restored = await repo.findById(user.getId());

        expect(restored?.toState().id).toBe(original.id);
        expect(restored?.toState().createdAt).toEqual(original.createdAt);
    });

    it("throws when updating a nonexistent user", async () => {
        const user = User.create("Carlos", "carlos@example.com");

        await expect(repo.update(user)).rejects.toThrow(
            `User with ID ${user.getId()} not found for update.`
        );
    });

    it("finds a user by email regardless of letter case", async () => {
        const user = User.create("Carlos", "carlos@example.com");
        createdIds.push(user.getId());

        await repo.save(user);

        const restored = await repo.findByEmail("  CARLOS@EXAMPLE.COM  ");

        expect(restored).not.toBeNull();
        expect(restored?.toState().id).toBe(user.getId());
        expect(restored?.toState().email).toBe("carlos@example.com");
    });

    it("returns null when the email does not exist", async () => {
        const result = await repo.findByEmail("unknown@example.com");

        expect(result).toBeNull();
    });

    it("rejects duplicate email addresses", async () => {
        const first = User.create("Carlos", "duplicate@example.com");
        const second = User.create("Eduardo", "DUPLICATE@example.com");
        createdIds.push(first.getId(), second.getId());

        await repo.save(first);

        await expect(repo.save(second)).rejects.toMatchObject({
            cause: {
                code: "23505",
                constraint: "idx_users_email_unique"
            }
        });
    });

    it("persists email verification", async () => {
        const user = User.create("Carlos", "carlos@example.com");
        createdIds.push(user.getId());

        await repo.save(user);

        user.verifyEmail();
        await repo.update(user);

        const restored = await repo.findById(user.getId());

        expect(restored?.toState().emailVerifiedAt).toBeInstanceOf(Date);
        expect(restored?.toState().emailVerifiedAt).toEqual(
            user.toState().emailVerifiedAt
        );
    });

    it("invalidates email verification after changing the address", async () => {
        const user = User.create("Carlos", "carlos@example.com");
        createdIds.push(user.getId());

        await repo.save(user);

        user.verifyEmail();
        await repo.update(user);

        user.changeEmail("new@example.com");
        await repo.update(user);

        const restored = await repo.findById(user.getId());

        expect(restored?.toState().email).toBe("new@example.com");
        expect(restored?.toState().emailVerifiedAt).toBeNull();

        const previousEmail = await repo.findByEmail("carlos@example.com");
        const newEmail = await repo.findByEmail("new@example.com");

        expect(previousEmail).toBeNull();
        expect(newEmail?.toState().id).toBe(user.getId());
    });
});
