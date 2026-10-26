
import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Membership } from "../../src/domain/entities/Membership.js";

describe("Membership - Unit", () => {
    const userId = randomUUID();
    const organizationId = randomUUID();

    function createMembership() {
        return Membership.create(userId, organizationId, "ADMIN");
    }

    it("creates an active membership", () => {
        const membership = createMembership();

        expect(membership.getRole()).toBe("ADMIN");
        expect(membership.getStatus()).toBe("ACTIVE");
        expect(membership.getUserId()).toBe(userId);
        expect(membership.getOrganizationId()).toBe(organizationId);
    });

    it("generates a valid UUID", () => {
        const membership = createMembership();

        expect(membership.getId()).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
    });

    it("rejects invalid user IDs", () => {
        expect(() => Membership.create("invalid", organizationId, "ADMIN")).toThrow("Invalid user ID.");
    });

    it("rejects invalid organization IDs", () => {
        expect(() => Membership.create(userId, "invalid", "ADMIN")).toThrow("Invalid organization ID.");
    });

    it("rejects invalid roles", () => {
        expect(() => Membership.create(userId, organizationId, "OWNER" as any)).toThrow("Invalid membership role.");
    });

    it("changes the membership role", () => {
        const membership = createMembership();

        membership.changeRole("OPERATOR");

        expect(membership.getRole()).toBe("OPERATOR");
    });

    it("deactivates and reactivates membership", () => {
        const membership = createMembership();

        membership.deactivate();
        expect(membership.getStatus()).toBe("INACTIVE");

        membership.activate();
        expect(membership.getStatus()).toBe("ACTIVE");
    });

    it("does not change timestamps on repeated no-op operations", () => {
        const membership = createMembership();
        const before = membership.getUpdatedAt();

        membership.activate();
        membership.changeRole("ADMIN");

        expect(membership.getUpdatedAt()).toEqual(before);
    });

    it("restores membership state correctly", () => {
        const original = createMembership();
        const restored = Membership.restore(original.toState());

        expect(restored).not.toBe(original);
        expect(restored.toState()).toEqual(original.toState());
    });

    it("protects internal dates from external mutation", () => {
        const membership = createMembership();
        const state = membership.toState();

        state.createdAt.setFullYear(1990);
        state.updatedAt.setFullYear(1990);

        expect(membership.getCreatedAt().getFullYear()).not.toBe(1990);
        expect(membership.getUpdatedAt().getFullYear()).not.toBe(1990);
    });

    it("rejects invalid restored timestamps", () => {
        const membership = createMembership();
        const state = membership.toState();

        state.updatedAt = new Date(state.createdAt.getTime() - 1000);

        expect(() => Membership.restore(state)).toThrow(
            "UpdatedAt cannot be earlier than CreatedAt."
        );
    });
});
