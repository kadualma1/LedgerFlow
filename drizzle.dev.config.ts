import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env", override: true });

if (process.env.DB_NAME !== "ledgerflow_dev") {
    throw new Error("Migrations must target ledgerflow_dev.");
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
        password: process.env.DB_PASSWORD!,
        ssl: false
    }
});