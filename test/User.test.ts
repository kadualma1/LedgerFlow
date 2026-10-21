
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { User, type UserState } from "../src/domain/entities/User.js";

const INITIAL_DATE = new Date("2026-10-20T10:00:00.000Z");
const LATER_DATE = new Date("2026-10-21T10:00:00.000Z");

function createValidState(): UserState {
    return User.create("Carlos", "carlos@example.com").toState();
}

describe("User", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(INITIAL_DATE);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("Creation", () => {
        it("should create a valid user", () => {
            const user = User.create("Carlos", "carlos@example.com");

            expect(user.getName()).toBe("Carlos");
            expect(user.getEmail()).toBe("carlos@example.com");
            expect(user.getStatus()).toBe("ACTIVE");
            expect(user.getEmailVerifiedAt()).toBeNull();
        });

        it("should generate unique UUIDs", () => {
            const first = User.create("Carlos", "carlos@example.com");
            const second = User.create("Ana", "ana@example.com");

            expect(first.getId()).not.toBe(second.getId());
            expect(first.getId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        });

        it("should initialize timestamps", () => {
            const user = User.create("Carlos", "carlos@example.com");

            expect(user.getCreatedAt()).toEqual(INITIAL_DATE);
            expect(user.getUpdatedAt()).toEqual(INITIAL_DATE);
        });

        it("should normalize name and email", () => {
            const user = User.create("  Carlos  ", "  CARLOS@EXAMPLE.COM  ");

            expect(user.getName()).toBe("Carlos");
            expect(user.getEmail()).toBe("carlos@example.com");
        });
    });

    describe("Name validation", () => {
        it("should reject empty names", () => {
            expect(() => User.create("", "carlos@example.com")).toThrow();
            expect(() => User.create("   ", "carlos@example.com")).toThrow();
        });

        it("should accept names with exactly 120 characters", () => {
            const user = User.create("A".repeat(120), "carlos@example.com");

            expect(user.getName()).toHaveLength(120);
        });

        it("should reject names longer than 120 characters", () => {
            expect(() => User.create("A".repeat(121), "carlos@example.com")).toThrow();
        });

        it("should reject invalid name types", () => {
            expect(() => User.create(null as unknown as string, "carlos@example.com")).toThrow();
            expect(() => User.create(123 as unknown as string, "carlos@example.com")).toThrow();
        });
    });

    describe("Email validation", () => {
        it("should reject invalid email formats", () => {
            const invalidEmails = ["", " ", "invalid", "test@", "@example.com", "test example@gmail.com"];

            for (const email of invalidEmails) {
                expect(() => User.create("Carlos", email)).toThrow();
            }
        });

        it("should reject invalid email types", () => {
            expect(() => User.create("Carlos", null as unknown as string)).toThrow();
            expect(() => User.create("Carlos", 123 as unknown as string)).toThrow();
        });

        it("should accept valid email formats", () => {
            const validEmails = ["carlos@example.com", "carlos.silva@example.com", "user+test@example.com"];

            for (const email of validEmails) {
                expect(User.create("Carlos", email).getEmail()).toBe(email);
            }
        });
    });

    describe("Renaming", () => {
        it("should rename and update timestamp", () => {
            const user = User.create("Carlos", "carlos@example.com");

            vi.setSystemTime(LATER_DATE);
            user.rename("Carlos Eduardo");

            expect(user.getName()).toBe("Carlos Eduardo");
            expect(user.getUpdatedAt()).toEqual(LATER_DATE);
            expect(user.getCreatedAt()).toEqual(INITIAL_DATE);
        });

        it("should not update timestamp when name is unchanged", () => {
            const user = User.create("Carlos", "carlos@example.com");

            vi.setSystemTime(LATER_DATE);
            user.rename(" Carlos ");

            expect(user.getUpdatedAt()).toEqual(INITIAL_DATE);
        });

        it("should preserve state after invalid renaming", () => {
            const user = User.create("Carlos", "carlos@example.com");
            const originalState = user.toState();

            expect(() => user.rename("")).toThrow();
            expect(user.toState()).toEqual(originalState);
        });
    });

    describe("Status", () => {
        it("should deactivate a user", () => {
            const user = User.create("Carlos", "carlos@example.com");

            vi.setSystemTime(LATER_DATE);
            user.deactivate();

            expect(user.getStatus()).toBe("INACTIVE");
            expect(user.getUpdatedAt()).toEqual(LATER_DATE);
        });

        it("should reactivate a user", () => {
            const user = User.create("Carlos", "carlos@example.com");

            user.deactivate();
            user.activate();

            expect(user.getStatus()).toBe("ACTIVE");
        });

        it("should not modify timestamp for unchanged status", () => {
            const user = User.create("Carlos", "carlos@example.com");

            vi.setSystemTime(LATER_DATE);
            user.activate();

            expect(user.getUpdatedAt()).toEqual(INITIAL_DATE);

            user.deactivate();
            const updatedAt = user.getUpdatedAt();
            user.deactivate();

            expect(user.getUpdatedAt()).toEqual(updatedAt);
        });
    });

    describe("State and restoration", () => {
        it("should serialize the complete state", () => {
            const user = User.create("Carlos", "carlos@example.com");

            expect(user.toState()).toEqual({
                id: user.getId(),
                name: "Carlos",
                email: "carlos@example.com",
                createdAt: INITIAL_DATE,
                updatedAt: INITIAL_DATE,
                status: "ACTIVE",
                emailVerifiedAt: null
            });
        });

        it("should restore an existing user", () => {
            const original = User.create("Carlos", "carlos@example.com");
            const restored = User.restore(original.toState());

            expect(restored).toBeInstanceOf(User);
            expect(restored.toState()).toEqual(original.toState());
        });

        it("should restore a verified email timestamp", () => {
            const state = createValidState();
            state.updatedAt = LATER_DATE;
            state.emailVerifiedAt = LATER_DATE;

            const restored = User.restore(state);

            expect(restored.getEmailVerifiedAt()).toEqual(LATER_DATE);
        });

        it("should reject invalid IDs", () => {
            const state = createValidState();

            expect(() => User.restore({ ...state, id: "" })).toThrow();
            expect(() => User.restore({ ...state, id: "   " })).toThrow();
        });

        it("should reject invalid statuses", () => {
            const state = createValidState();

            expect(() => User.restore({ ...state, status: "DELETED" as UserState["status"] })).toThrow();
        });

        it("should reject invalid timestamps", () => {
            const state = createValidState();

            expect(() => User.restore({ ...state, createdAt: new Date("invalid") })).toThrow();
            expect(() => User.restore({ ...state, updatedAt: new Date("invalid") })).toThrow();
            expect(() => User.restore({ ...state, updatedAt: new Date("2020-01-01") })).toThrow();
        });

        it("should reject invalid email verification dates", () => {
            const state = createValidState();

            expect(() => User.restore({ ...state, emailVerifiedAt: new Date("invalid") })).toThrow();
            expect(() => User.restore({ ...state, emailVerifiedAt: new Date("2020-01-01") })).toThrow();
            expect(() => User.restore({ ...state, emailVerifiedAt: LATER_DATE })).toThrow();
        });

        it("should prevent external mutation of dates", () => {
            const user = User.create("Carlos", "carlos@example.com");

            const createdAt = user.getCreatedAt();
            createdAt.setFullYear(1990);

            const state = user.toState();
            state.updatedAt.setFullYear(1990);

            expect(user.getCreatedAt()).toEqual(INITIAL_DATE);
            expect(user.getUpdatedAt()).toEqual(INITIAL_DATE);
        });


        it("should isolate dates from restored state", () => {
            const state = createValidState();
            state.updatedAt = new Date(LATER_DATE);
            state.emailVerifiedAt = new Date(LATER_DATE);

            const restored = User.restore(state);

            state.createdAt.setFullYear(1990);
            state.updatedAt.setFullYear(1990);
            state.emailVerifiedAt.setFullYear(1990);

            expect(restored.getCreatedAt()).toEqual(INITIAL_DATE);
            expect(restored.getUpdatedAt()).toEqual(LATER_DATE);
            expect(restored.getEmailVerifiedAt()).toEqual(LATER_DATE);
        });

    });
});
