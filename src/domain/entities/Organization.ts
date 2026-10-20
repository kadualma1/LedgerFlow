
import { randomUUID } from "node:crypto";

export type OrganizationStatus = "ACTIVE" | "INACTIVE";

export interface OrganizationState {
    id: string;
    name: string;
    baseCurrency: string;
    createdAt: Date;
    updatedAt: Date;
    status: OrganizationStatus;
}

export class Organization {
    private readonly id: string;
    private name: string;
    private baseCurrency: string;
    private readonly createdAt: Date;
    private updatedAt: Date;
    private status: OrganizationStatus;

    private constructor(state: OrganizationState) {
        this.id = state.id;
        this.name = state.name;
        this.baseCurrency = state.baseCurrency;
        this.createdAt = new Date(state.createdAt);
        this.updatedAt = new Date(state.updatedAt);
        this.status = state.status;
    }

    public static create(name: string, baseCurrency: string): Organization {
        const validName = Organization.validateName(name);
        const validCurrency = Organization.validateCurrency(baseCurrency);

        const now = new Date();

        return new Organization({
            id: randomUUID(),
            name: validName,
            baseCurrency: validCurrency,
            createdAt: now,
            updatedAt: now,
            status: "ACTIVE"
        });
    }

    public static restore(state: OrganizationState): Organization {
        const name = Organization.validateName(state.name);
        const baseCurrency = Organization.validateCurrency(state.baseCurrency);

        if (!state.id || !state.id.trim()) {
            throw new Error("Invalid organization ID.");
        }

        if (state.status !== "ACTIVE" && state.status !== "INACTIVE") {
            throw new Error("Invalid organization status.");
        }

        if (!Number.isFinite(state.createdAt.getTime()) ||
            !Number.isFinite(state.updatedAt.getTime()) ||
            state.updatedAt.getTime() < state.createdAt.getTime()) {
            throw new Error("Invalid organization dates.");
        }

        return new Organization({
            ...state,
            name,
            baseCurrency
        });
    }

    private static validateName(name: string): string {
        if (typeof name !== "string") {
            throw new Error("Organization name must be a string.");
        }

        const normalizedName = name.trim();

        if (normalizedName.length === 0) {
            throw new Error("Organization name cannot be empty.");
        }

        if (normalizedName.length > 120) {
            throw new Error(
                "Organization name cannot exceed 120 characters."
            );
        }

        return normalizedName;
    }

    private static validateCurrency(currency: string): string {
        if (typeof currency !== "string") {
            throw new Error("Currency must be a string.");
        }

        const normalizedCurrency = currency.trim().toUpperCase();

        const supportedCurrencies = ["BRL", "USD", "EUR"];

        if (!supportedCurrencies.includes(normalizedCurrency)) {
            throw new Error("Unsupported currency.");
        }

        return normalizedCurrency;
    }

    public getId(): string {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public getBaseCurrency(): string {
        return this.baseCurrency;
    }

    public getCreatedAt(): Date {
        return new Date(this.createdAt);
    }

    public getUpdatedAt(): Date {
        return new Date(this.updatedAt);
    }

    public getStatus(): OrganizationStatus {
        return this.status;
    }

    public rename(newName: string): void {
        const validName = Organization.validateName(newName);

        if (validName === this.name) {
            return;
        }

        this.name = validName;
        this.touch();
    }

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

    public changeBaseCurrency(newCurrency: string, hasFinancialRecords: boolean): void {
        const validCurrency = Organization.validateCurrency(newCurrency);

        if (validCurrency === this.baseCurrency) {
            return;
        }

        if (hasFinancialRecords) {
            throw new Error(
                "Cannot change currency after financial records exist."
            );
        }

        this.baseCurrency = validCurrency;
        this.touch();
    }

    private touch(): void {
        this.updatedAt = new Date();
    }

    public toState(): OrganizationState {
        return {
            id: this.id,
            name: this.name,
            baseCurrency: this.baseCurrency,
            createdAt: new Date(this.createdAt),
            updatedAt: new Date(this.updatedAt),
            status: this.status
        };
    }
}
