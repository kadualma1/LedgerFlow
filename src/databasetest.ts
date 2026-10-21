import { pool } from "./infrastructure/database/pool.js";

async function main(): Promise<void> {
    try {
        const result = await pool.query("SELECT current_database(), current_user, NOW() AS server_time");

        console.log("Database connection successful!");
        console.log(result.rows[0]);
    } catch (error) {
        console.error("Database connection failed:", error);
    } finally {
        await pool.end();
    }
}

await main();