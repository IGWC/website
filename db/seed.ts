import { db, Departments, IGWCSubmissions } from 'astro:db';

// https://astro.build/db/seed
export default async function seed() {
    await db.insert(Departments).values([
    { deptCode: "HIST", deptName: "History" },
    { deptCode: "PHIL", deptName: "Philosophy" },
    { deptCode: "MATH", deptName: "Mathematics" },
    { deptCode: "CSCI", deptName: "Computer Science" },
    { deptCode: "BIO", deptName: "Biology" },
    { deptCode: "CHEM", deptName: "Chemistry", subfieldLabel: "Research group", subfieldHelpText: "Which research group are you a part of?" },
    { deptCode: "PHYS", deptName: "Physics" },
    { deptCode: "ENG", deptName: "English" },
    { deptCode: "other", deptName: "Other", subfieldLabel: "Other department", subfieldHelpText: "Please specify your department." },
  ]);
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
