// src/actions/actions.ts
import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { db, IGWC } from "astro:db";
//import { FormSchema } from "/src/layouts/components/forms/card.tsx"

export const server = {
	unionCard: defineAction({
		input: z.object({
			firstName: z.string().min(1, { message: "First name is required." }).trim(),
			lastName: z.string().min(1, { message: "Last name is required." }).trim(),

			userID: z.string().toLowerCase().min(1, { message: "IU Username is required." }).trim().transform((val) => {return val.replace(/(@iu\.edu|@indiana\.edu)$/i, '');}),
			email: z.string().email({ message: "Invalid email address." }).min(1, { message: "Email is required." }).trim(),
			phone: z.string().length(10, { message: "Phone number must be exactly 10 digits." }).regex(/^\d{10}$/, { message: "Phone number must contain only digits." }).trim(),
			textOK: z.boolean().default(true).optional(),
	
			dept: z.string().min(3, { message: "Please select a department." }),
			otherDept: z.string().optional(),
			subfield: z.string().optional(),
			card: z.boolean().default(true),
			contract: z.enum([
				"saa-instructional",
				"saa-research",
				"saa-assistant",
				"fellowship",
				"hourly",
				"none",
			], { message: "Please select a contract type." }),
			location: z.string().optional(),
			year: z.string().min(4, { message: "Too small." }).max(4, { message: "Too big." }).startsWith('20', "A year in this century, we mean.").trim(),
			getInvolved: z.boolean().default(false).optional(),
		}).superRefine((data, ctx) => {
			if (data.dept === "other" && (!data.otherDept || data.otherDept.trim() === "")) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Please specify your department.",
					path: ["otherDept"],
				});
			}
		}),
		handler: async (input) => {
			try {
				console.log(JSON.stringify(input))
				const googleScriptUrl = "https://script.google.com/macros/s/AKfycby2oEQbkHixO7im5Ya2gOAUOATPWiypcHR9ZQlHz2adC77MZetEj5jGw_e7m_E9HLPqqQ/exec";

				const requests = [
					await db.insert(IGWC).values(input).onConflictDoUpdate({ target: IGWC.userID, set: input }),
					fetch(googleScriptUrl, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(input),
					}),
				]
				await Promise.all(requests);
				console.log("All requests (DB insert and Google Script POSTs) successfully completed!");
				return { success: true };
			} catch (error) {
				console.error("An error occurred during concurrent requests:", error);
				return { success: false };
			}
		}
	}),
};