import { randomUUID } from "node:crypto";
import validator, { isEmail } from "validator";

export type UserStatus = "ACTIVE" | "INACTIVE";

export interface UserState {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    status: UserStatus;
    emailVerifiedAt: Date | null;
}

export class User {
    private readonly id: string;
    private name: string;
    private email: string;
    private readonly createdAt: Date;
    private updatedAt: Date;
    private status: UserStatus;
    private emailVerifiedAt: Date | null;

    private constructor(state: UserState) {
        this.id = state.id;
        this.name = state.name;
        this.email = state.email;
        this.createdAt = new Date(state.createdAt);
        this.updatedAt = new Date(state.updatedAt);
        this.status = state.status;
        this.emailVerifiedAt = state.emailVerifiedAt ? new Date(state.emailVerifiedAt) : null;
    }

    public static create(name: string, email: string): User {
        const validName = User.validateName(name);
        const validEmail = User.validateEmail(email);

        const now = new Date();

        return new User({
            id: randomUUID(),
            name: validName,
            email: validEmail,
            createdAt: now,
            updatedAt: now,
            status: "ACTIVE",
            emailVerifiedAt: null
        });
    }

    public static restore(state: UserState): User {
        const name = User.validateName(state.name);
        const email = User.validateEmail(state.email);

        if (!state.id || !state.id.trim()) {
            throw new Error("Invalid user ID.");
        }

        if (state.status !== "ACTIVE" && state.status !== "INACTIVE") {
            throw new Error("Invalid user status.");
        }

        if (!(state.createdAt instanceof Date) || !(state.updatedAt instanceof Date)) {
            throw new Error("User timestamps must be Date objects.");
        }

        if (!Number.isFinite(state.createdAt.getTime()) || !Number.isFinite(state.updatedAt.getTime())) {
            throw new Error("Invalid timestamps for user.");
        }

        if (state.updatedAt.getTime() < state.createdAt.getTime()) {
            throw new Error("UpdatedAt cannot be earlier than CreatedAt.");
        }

        if (state.emailVerifiedAt !== null) {
            if (!(state.emailVerifiedAt instanceof Date) || !Number.isFinite(state.emailVerifiedAt.getTime())) {
                throw new Error("Invalid email verification date.");
            }

            if (state.emailVerifiedAt.getTime() < state.createdAt.getTime()) {
                throw new Error("Email verification cannot predate user creation.");
            }

            if (state.emailVerifiedAt.getTime() > state.updatedAt.getTime()) {
                throw new Error("Email verification cannot be later than the last update.");
            }
        }

        return new User({
            ...state,
            name,
            email,
        })
    }

    private static validateName(name: string): string {
        if (typeof name !== "string") {
            throw new Error("User name must be a string.");
        }

        const normalizedName = name.trim();

        if (normalizedName.length === 0) {
            throw new Error("User name cannot be empty.");
        }

        if (normalizedName.length > 120) {
            throw new Error("User name cannot exceed 120 characters.");
        }

        return normalizedName;
    }

    private static validateEmail(email: string): string {
        if (typeof email !== "string") {
            throw new Error("User email must be a string.");
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!validator.isEmail(normalizedEmail)) {
            throw new Error("Invalid email format.");
        }

        return normalizedEmail;
    }

    public getId(): string {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public getEmail(): string {
        return this.email;
    }

    public getCreatedAt(): Date {
        return new Date(this.createdAt);
    }

    public getUpdatedAt(): Date {
        return new Date(this.updatedAt);
    }

    public getStatus(): UserStatus {
        return this.status;
    }

    public getEmailVerifiedAt(): Date | null {
        return this.emailVerifiedAt ? new Date(this.emailVerifiedAt) : null;
    }

    public rename(newName: string): void {
        const validName = User.validateName(newName);
        if (this.name === validName) {
            return;
        }
        this.name = validName;
        this.touch();
    }

    // public changeEmail(newEmail: string): void {
    //     const validEmail = User.validateEmail(newEmail);
    //     this.email = validEmail;
    //     this.emailVerifiedAt = null; // Reset email verification status when email changes
    //     this.touch();
    // }

    public activate(): void {
        if (this.status === "ACTIVE") {
            return;
        }
        this.status = "ACTIVE";
        this.touch();
    }

    public deactivate(): void {
        if (this.status === "INACTIVE") {
            return;
        }
        this.status = "INACTIVE";
        this.touch();
    }

    private touch(): void {
        this.updatedAt = new Date();
    }

    public toState(): UserState {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            createdAt: new Date(this.createdAt),
            updatedAt: new Date(this.updatedAt),
            status: this.status,
            emailVerifiedAt: this.emailVerifiedAt ? new Date(this.emailVerifiedAt) : null
        };
    }
}