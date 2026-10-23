
import { randomUUID } from "crypto";
import validator from "validator";

export type MembershipStatus = "ACTIVE" | "INACTIVE";
export type MembershipRole = "OPERATOR" | "ADMIN" | "VIEWER";

export interface MembershipState {
    id: string;
    userId: string;
    organizationId: string;
    role: MembershipRole;
    status: MembershipStatus;
    createdAt: Date;
    updatedAt: Date;
}

export class Membership {
    private readonly id: string;
    private readonly userId: string;
    private readonly organizationId: string;
    private role: MembershipRole;
    private status: MembershipStatus;
    private readonly createdAt: Date;
    private updatedAt: Date;

    private constructor(state: MembershipState) {
        this.id = state.id;
        this.userId = state.userId;
        this.organizationId = state.organizationId;
        this.role = state.role;
        this.status = state.status;
        this.createdAt = new Date(state.createdAt);
        this.updatedAt = new Date(state.updatedAt);
    }

    public static create(userId: string, organizationId: string, role: MembershipRole): Membership {
        const validUserId = Membership.validateUserId(userId);
        const validOrganizationId = Membership.validateOrganizationId(organizationId);
        const validRole = Membership.validateRole(role);
        const now = new Date();

        return new Membership({
            id: randomUUID(),
            userId: validUserId,
            organizationId: validOrganizationId,
            role: validRole,
            status: "ACTIVE",
            createdAt: now,
            updatedAt: now
        });
    }

    public static restore(state: MembershipState): Membership {
        const validId = Membership.validateId(state.id);
        const validUserId = Membership.validateUserId(state.userId);
        const validOrganizationId = Membership.validateOrganizationId(state.organizationId);
        const validRole = Membership.validateRole(state.role);

        if (state.status !== "ACTIVE" && state.status !== "INACTIVE") {
            throw new Error("Invalid membership status.");
        }

        if (!(state.createdAt instanceof Date) || !(state.updatedAt instanceof Date)) {
            throw new Error("Membership timestamps must be Date objects.");
        }

        if (!Number.isFinite(state.createdAt.getTime()) || !Number.isFinite(state.updatedAt.getTime())) {
            throw new Error("Invalid timestamps for membership.");
        }

        if (state.updatedAt.getTime() < state.createdAt.getTime()) {
            throw new Error("UpdatedAt cannot be earlier than CreatedAt.");
        }

        return new Membership({
            ...state,
            id: validId,
            userId: validUserId,
            organizationId: validOrganizationId,
            role: validRole
        });
    }

    private static validateId(id: string): string {
        if (typeof id !== "string" || !validator.isUUID(id)) {
            throw new Error("Invalid membership ID.");
        }

        return id;
    }

    private static validateUserId(userId: string): string {
        if (typeof userId !== "string" || !validator.isUUID(userId)) {
            throw new Error("Invalid user ID.");
        }

        return userId;
    }

    private static validateOrganizationId(organizationId: string): string {
        if (typeof organizationId !== "string" || !validator.isUUID(organizationId)) {
            throw new Error("Invalid organization ID.");
        }

        return organizationId;
    }

    private static validateRole(role: MembershipRole): MembershipRole {
        if (role !== "OPERATOR" && role !== "ADMIN" && role !== "VIEWER") {
            throw new Error("Invalid membership role.");
        }

        return role;
    }

    public getId(): string {
        return this.id;
    }

    public getUserId(): string {
        return this.userId;
    }

    public getOrganizationId(): string {
        return this.organizationId;
    }

    public getRole(): MembershipRole {
        return this.role;
    }

    public getStatus(): MembershipStatus {
        return this.status;
    }

    public getCreatedAt(): Date {
        return new Date(this.createdAt);
    }

    public getUpdatedAt(): Date {
        return new Date(this.updatedAt);
    }

    public changeRole(newRole: MembershipRole): void {
        const validRole = Membership.validateRole(newRole);

        if (this.role === validRole) return;

        this.role = validRole;
        this.touch();
    }

    public activate(): void {
        if (this.status === "ACTIVE") return;

        this.status = "ACTIVE";
        this.touch();
    }

    public deactivate(): void {
        if (this.status === "INACTIVE") return;

        this.status = "INACTIVE";
        this.touch();
    }

    private touch(): void {
        this.updatedAt = new Date();
    }

    public toState(): MembershipState {
        return {
            id: this.id,
            userId: this.userId,
            organizationId: this.organizationId,
            role: this.role,
            status: this.status,
            createdAt: new Date(this.createdAt),
            updatedAt: new Date(this.updatedAt)
        };
    }
}
