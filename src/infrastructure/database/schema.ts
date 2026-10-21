import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
    id: uuid("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    baseCurrency: varchar("base_currency", { length: 3 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    status: varchar("status", { length: 8, enum: ["ACTIVE", "INACTIVE"] }).notNull().default("ACTIVE")
});

export const users = pgTable("users", {
    id: uuid("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 120 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    status: varchar("status", { length: 8, enum: ["ACTIVE", "INACTIVE"] }).notNull().default("ACTIVE"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
});
