import { db, IGWC } from 'astro:db';

// https://astro.build/db/seed
export default async function seed() {
	await db.insert(IGWC).values([
    {
    userID: "vhalibut",
    firstName: "Vera",
    lastName: "Halibut",
    dept: "HIST",
    email: "halibut@email.com",
    phone: "1800halibut",
    textOK: false,
    card: false,
    saa: true,
  }
  ])
}
