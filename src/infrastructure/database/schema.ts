
import { sql } from "drizzle-orm";
import { check, pgTable, timestamp, index, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
    id: uuid("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    baseCurrency: varchar("base_currency", { length: 3 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    status: varchar("status", { length: 8, enum: ["ACTIVE", "INACTIVE"] }).notNull().default("ACTIVE")
}, (table) => [
    check("chk_organization_name", sql`length(trim(${table.name})) > 0`),
    check("chk_organization_currency", sql`${table.baseCurrency} IN ('BRL', 'USD', 'EUR')`),
    check("chk_organization_dates", sql`${table.updatedAt} >= ${table.createdAt}`),
    check("chk_organization_status", sql`${table.status} IN ('ACTIVE', 'INACTIVE')`)
]);

export const users = pgTable("users", {
    id: uuid("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 120 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    status: varchar("status", { length: 8, enum: ["ACTIVE", "INACTIVE"] }).notNull().default("ACTIVE"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true })
}, (table) => [
    check("chk_user_name", sql`length(trim(${table.name})) > 0`),
    check("chk_user_email", sql`length(trim(${table.email})) > 0`),
    check("chk_user_dates", sql`${table.updatedAt} >= ${table.createdAt}`),
    check("chk_user_status", sql`${table.status} IN ('ACTIVE', 'INACTIVE')`),
    check("chk_user_email_verified_at", sql`${table.emailVerifiedAt} IS NULL OR (${table.emailVerifiedAt} >= ${table.createdAt} AND ${table.emailVerifiedAt} <= ${table.updatedAt})`),
    uniqueIndex("idx_users_email_unique").on(sql`lower(${table.email})`)
]);

export const memberships = pgTable("memberships", {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "restrict" }),
    role: varchar("role", { length: 8, enum: ["OPERATOR", "ADMIN", "VIEWER"] }).notNull(),
    status: varchar("status", { length: 8, enum: ["ACTIVE", "INACTIVE"] }).notNull().default("ACTIVE"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
    check("chk_membership_role", sql`${table.role} IN ('OPERATOR', 'ADMIN', 'VIEWER')`),
    check("chk_membership_status", sql`${table.status} IN ('ACTIVE', 'INACTIVE')`),
    check("chk_membership_dates", sql`${table.updatedAt} >= ${table.createdAt}`),
    uniqueIndex("idx_memberships_user_organization_unique").on(table.userId, table.organizationId),
    index("idx_memberships_user_id").on(table.userId),
    index("idx_memberships_organization_id").on(table.organizationId),
]);
