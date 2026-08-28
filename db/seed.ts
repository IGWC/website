import { db, IGWCSubmissions } from 'astro:db';

// https://astro.build/db/seed
export default async function seed() {
	await db.insert(IGWCSubmissions).values([
    {
    userID: "vhalibut",
    firstName: "Vera",
    lastName: "Halibut",
    dept: "HIST",
    email: "halibut@email.com",
    phone: "1800987065",
    textOK: false,
    card: false,
    contract: "saa",
    year: "2024",
    teaching: true,
  }
  ])
}
