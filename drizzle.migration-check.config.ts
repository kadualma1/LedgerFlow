import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.migration-check", override: true });

if (process.env.DB_NAME !== "ledgerflow_migration_check") {
    throw new Error("Migration verification must use ledgerflow_migration_check.");
}

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/infrastructure/database/schema.ts",
    out: "./drizzle",
    dbCredentials: {
        host: process.env.DB_HOST!,
        port: Number(process.env.DB_PORT),
        database: process.env.DB_NAME!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!
    }
});