import { config } from 'dotenv';
import { defineConfig } from 'vitest/config';

config({ path: '.env.test', override: true });

if (process.env.DB_NAME !== 'ledgerflow_test') {
    throw new Error("Integration tests must be run on 'ledgerflow_test' database. Please check your .env.test file.");
}

export default defineConfig({
    test: {
        include: ["tests/integration/**/*.test.ts"],
        fileParallelism: false
    }
})