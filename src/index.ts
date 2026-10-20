
import { Organization } from "./domain/entities/Organization.js";

const company = Organization.create("Empresa Aurora", "BRL");

console.log("Initial state:");
console.log(company.toState());

company.rename("Aurora Tecnologia");

console.log("After renaming:");
console.log(company.toState());

company.deactivate();

console.log("After deactivation:");
console.log(company.toState());

try {
    company.changeBaseCurrency("USD", true);
} catch (error) {
    console.error(error);
}
