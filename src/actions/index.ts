// src/actions/actions.ts
import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { db, IGWC } from "astro:db";
//import { FormSchema } from "/src/layouts/components/forms/card.tsx"

export const server = {
	unionCard: defineAction({
		input: z.object({
			firstName: z.string().min(1, { message: "First name is required." }),
			lastName: z.string().min(1, { message: "Last name is required." }),

			userID: z.string().min(1, { message: "IU Username is required." }),
			email: z.string().email({ message: "Invalid email address." }).min(1, { message: "Email is required." }),
			phone: z.string().length(10, { message: "Phone number must be exactly 10 digits." }).regex(/^\d{10}$/, { message: "Phone number must contain only digits." }),
			textOK: z.boolean().default(true).optional(),
	
			dept: z.string().min(3, { message: "Please select a department." }),
			otherDept: z.string().optional(),
			subfield: z.string().optional(),
			card: z.boolean().default(true),
			contract: z.enum([
				"saa-instructional",
				"saa-research",
				"saa-assisstant",
				"fellowship",
				"hourly",
				"none",
			], { message: "Please select a contract type." }),
			location: z.string().optional(),
			year: z.string().min(4, { message: "Too small." }).max(4, { message: "Too big." }).startsWith('20', "A year in this century, we mean."),
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
				console.log(input)
				await db.insert(IGWC).values(input).onConflictDoUpdate({ target: IGWC.userID, set: input });
				return { success: true };
			} catch (error) {
				console.log(error)
				return { success: false };
			}
		}
	}),
};