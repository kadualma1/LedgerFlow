
import { Organization } from "./domain/entities/Organization.js";
import { OrganizationRepo } from "./infrastructure/repositories/OrganizationRepo.js";
import { pool } from "./infrastructure/database/pool.js";

async function main(): Promise<void> {
    const repo = new OrganizationRepo();
    const organization = Organization.create("Aurora Tecnologia", "BRL");

    try {
        await repo.save(organization);
        console.log("Organization saved:", organization.getId());

        const original = organization.toState();

        organization.rename("Boreal Tech");
        await repo.update(organization);
        console.log("Organization updated:", organization.getId());

        const restored = await repo.findById(organization.getId());

        if (!restored) throw new Error("Organization not found.");

        console.log("Original:", original);
        console.log("Restored:", restored.toState());
        console.log("Updated:", organization?.toState());
    } catch (error) {
        console.error("Repository test failed:", error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

await main();
