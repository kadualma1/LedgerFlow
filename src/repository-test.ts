import { Organization } from "./domain/entities/Organization.js";
import { OrganizationRepo } from "./infrastructure/repositories/OrganizationRepo.js";
import { pool } from "./infrastructure/database/pool.js";

const repository = new OrganizationRepo();
const organization = Organization.create("Aurora Tecnologia", "BRL");

try {
    await repository.save(organization);

    console.log("Organization saved successfully!");
    console.log("ID:", organization.getId());
} catch (error) {
    console.error("Failed to save organization:", error);
} finally {
    await pool.end();
}