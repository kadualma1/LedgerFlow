
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Organization, type OrganizationState } from "../../src/domain/entities/Organization.js";

const INITIAL_DATE = new Date("2026-10-20T10:00:00.000Z");
const LATER_DATE = new Date("2026-10-21T10:00:00.000Z");

function createValidState(): OrganizationState {
    return Organization.create("Aurora", "BRL").toState();
}

describe("Organization", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(INITIAL_DATE);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("Creation", () => {
        it("should create an organization with valid data", () => {
            const organization = Organization.create("Aurora", "BRL");

            expect(organization.getName()).toBe("Aurora");
            expect(organization.getBaseCurrency()).toBe("BRL");
            expect(organization.getStatus()).toBe("ACTIVE");
        });

        it("should generate unique UUIDs", () => {
            const first = Organization.create("Aurora", "BRL");
            const second = Organization.create("Boreal", "USD");

            expect(first.getId()).not.toBe(second.getId());
            expect(first.getId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        });

        it("should initialize both dates", () => {
            const organization = Organization.create("Aurora", "BRL");

            expect(organization.getCreatedAt()).toEqual(INITIAL_DATE);
            expect(organization.getUpdatedAt()).toEqual(INITIAL_DATE);
        });

        it("should normalize organization name", () => {
            const organization = Organization.create("  Aurora  ", "BRL");

            expect(organization.getName()).toBe("Aurora");
        });

        it("should normalize currency to uppercase", () => {
            const organization = Organization.create("Aurora", " brl ");

            expect(organization.getBaseCurrency()).toBe("BRL");
        });
    });

    describe("Validation", () => {
        it("should reject empty names", () => {
            expect(() => Organization.create("", "BRL")).toThrow();
            expect(() => Organization.create("   ", "BRL")).toThrow();
        });

        it("should accept names with exactly 120 characters", () => {
            const organization = Organization.create("A".repeat(120), "BRL");

            expect(organization.getName()).toHaveLength(120);
        });

        it("should reject names longer than 120 characters", () => {
            expect(() => Organization.create("A".repeat(121), "BRL")).toThrow();
        });

        it("should reject invalid name types at runtime", () => {
            expect(() => Organization.create(null as unknown as string, "BRL")).toThrow();
            expect(() => Organization.create(123 as unknown as string, "BRL")).toThrow();
        });

        it("should reject unsupported currencies", () => {
            expect(() => Organization.create("Aurora", "INVALID")).toThrow();
            expect(() => Organization.create("Aurora", "")).toThrow();
        });

        it("should accept supported currencies", () => {
            for (const currency of ["BRL", "USD", "EUR"]) {
                expect(Organization.create("Aurora", currency).getBaseCurrency()).toBe(currency);
            }
        });
    });

    describe("Renaming", () => {
        it("should rename the organization and update its timestamp", () => {
            const organization = Organization.create("Aurora", "BRL");

            vi.setSystemTime(LATER_DATE);
            organization.rename("Aurora Tecnologia");

            expect(organization.getName()).toBe("Aurora Tecnologia");
            expect(organization.getUpdatedAt()).toEqual(LATER_DATE);
            expect(organization.getCreatedAt()).toEqual(INITIAL_DATE);
        });

        it("should not update timestamp when name is unchanged", () => {
            const organization = Organization.create("Aurora", "BRL");

            vi.setSystemTime(LATER_DATE);
            organization.rename(" Aurora ");

            expect(organization.getUpdatedAt()).toEqual(INITIAL_DATE);
        });

        it("should preserve state when renaming fails", () => {
            const organization = Organization.create("Aurora", "BRL");
            const originalState = organization.toState();

            expect(() => organization.rename("")).toThrow();
            expect(organization.toState()).toEqual(originalState);
        });
    });

    describe("Status", () => {
        it("should deactivate an active organization", () => {
            const organization = Organization.create("Aurora", "BRL");

            vi.setSystemTime(LATER_DATE);
            organization.deactivate();

            expect(organization.getStatus()).toBe("INACTIVE");
            expect(organization.getUpdatedAt()).toEqual(LATER_DATE);
        });

        it("should reactivate an inactive organization", () => {
            const organization = Organization.create("Aurora", "BRL");

            organization.deactivate();
            organization.activate();

            expect(organization.getStatus()).toBe("ACTIVE");
        });

        it("should not update timestamp when status is unchanged", () => {
            const organization = Organization.create("Aurora", "BRL");

            vi.setSystemTime(LATER_DATE);
            organization.activate();

            expect(organization.getUpdatedAt()).toEqual(INITIAL_DATE);

            organization.deactivate();
            const updatedAt = organization.getUpdatedAt();

            organization.deactivate();

            expect(organization.getUpdatedAt()).toEqual(updatedAt);
        });
    });

    describe("Base currency", () => {
        it("should allow currency changes without financial records", () => {
            const organization = Organization.create("Aurora", "BRL");

            vi.setSystemTime(LATER_DATE);
            organization.changeBaseCurrency("USD", false);

            expect(organization.getBaseCurrency()).toBe("USD");
            expect(organization.getUpdatedAt()).toEqual(LATER_DATE);
        });

        it("should reject currency changes when financial records exist", () => {
            const organization = Organization.create("Aurora", "BRL");
            const originalState = organization.toState();

            expect(() => organization.changeBaseCurrency("USD", true)).toThrow();
            expect(organization.toState()).toEqual(originalState);
        });

        it("should reject unsupported currency changes", () => {
            const organization = Organization.create("Aurora", "BRL");

            expect(() => organization.changeBaseCurrency("INVALID", false)).toThrow();
            expect(organization.getBaseCurrency()).toBe("BRL");
        });

        it("should not update timestamp when currency remains unchanged", () => {
            const organization = Organization.create("Aurora", "BRL");

            vi.setSystemTime(LATER_DATE);
            organization.changeBaseCurrency("brl", false);

            expect(organization.getUpdatedAt()).toEqual(INITIAL_DATE);
        });
    });

    describe("State and restoration", () => {
        it("should serialize the organization state", () => {
            const organization = Organization.create("Aurora", "BRL");
            const state = organization.toState();

            expect(state).toEqual({
                id: organization.getId(),
                name: "Aurora",
                baseCurrency: "BRL",
                createdAt: INITIAL_DATE,
                updatedAt: INITIAL_DATE,
                status: "ACTIVE"
            });
        });

        it("should restore an organization preserving its identity", () => {
            const original = Organization.create("Aurora", "BRL");
            const restored = Organization.restore(original.toState());

            expect(restored).toBeInstanceOf(Organization);
            expect(restored.toState()).toEqual(original.toState());
            expect(restored.getId()).toBe(original.getId());
        });

        it("should reject invalid IDs", () => {
            const state = createValidState();

            expect(() => Organization.restore({ ...state, id: "" })).toThrow();
            expect(() => Organization.restore({ ...state, id: "   " })).toThrow();
        });

        it("should reject invalid statuses", () => {
            const state = createValidState();

            expect(() => Organization.restore({
                ...state,
                status: "DELETED" as OrganizationState["status"]
            })).toThrow();
        });

        it("should reject invalid or inconsistent dates", () => {
            const state = createValidState();

            expect(() => Organization.restore({
                ...state,
                createdAt: new Date("invalid")
            })).toThrow();

            expect(() => Organization.restore({
                ...state,
                updatedAt: new Date("2020-01-01T00:00:00Z")
            })).toThrow();
        });

        it("should prevent external mutation of internal dates", () => {
            const organization = Organization.create("Aurora", "BRL");

            const getterDate = organization.getCreatedAt();
            getterDate.setFullYear(1990);

            const state = organization.toState();
            state.updatedAt.setFullYear(1990);

            expect(organization.getCreatedAt()).toEqual(INITIAL_DATE);
            expect(organization.getUpdatedAt()).toEqual(INITIAL_DATE);
        });

        it("should isolate dates from the state used for restoration", () => {
            const state = createValidState();
            const restored = Organization.restore(state);

            state.createdAt.setFullYear(1990);
            state.updatedAt.setFullYear(1990);

            expect(restored.getCreatedAt()).toEqual(INITIAL_DATE);
            expect(restored.getUpdatedAt()).toEqual(INITIAL_DATE);
        });
    });
});
