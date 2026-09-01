import { z } from "astro/zod";

const currentYear = new Date().getFullYear();

export const unionCardSchema = z.object({
    firstName: z.string().trim().min(1, { message: "First name is required." }).max(100, { message: "First name must be at most 100 characters." }),
    lastName: z.string().trim().min(1, { message: "Last name is required. Enter first name again if you have no last name." }).max(
        100, { message: "Last name must be at most 100 characters." }
    ),

    userID: z.string().trim().toLowerCase().transform(value =>
        value.replace(/(@iu\.edu|@indiana\.edu)$/i, "")
    ).pipe(
        z.string().min(3, { message: "User ID must be at least 3 characters." }).max(8, { message: "User ID must be at most 8 characters." })
    ),
    email: z.string()
            .trim()
            .pipe(
                z.email({
                    message: "Please enter a valid email address.",
                })
            ).refine(
                (email) => {
                    const domain = email.split("@")[1].toLowerCase();

                    const blockedDomains = [
                        "iu.edu",
                        "indiana.edu",
                    ];

                    return !blockedDomains.includes(domain);
                },
                {
                    message: "Please use a non-IU email address.",
                }
            ),
    phone: z.string().length(10, { message: "Phone number must be exactly 10 digits." }).regex(/^\d{10}$/, { message: "Phone number must contain only digits." }).trim(),
    textOK: z.boolean().default(true).optional(),

    dept: z.string().min(3, { message: "Please select a department." }),
    otherDept: z.string().optional(),
    subfield: z.string().optional(),
    additionalDept: z.string().optional(),
    additionalOtherDept: z.string().optional(),
    card: z.boolean().default(true),
    contract: z.enum([
        "saa",
        "fellowship",
        "hourly",
        "none",
    ]),
    teaching: z.boolean().default(false),
    location: z.string().optional(),
    year: z
        .string()
        .trim()
        .regex(/^\d{4}$/, { message: "Year must be a 4-digit number." })
        .refine(
            (value) => {
                const year = Number(value);
                return year >= 2000 && year <= currentYear;
            },
            { message: "Year must be between 2000 and the current year." }
        ),
    getInvolved: z.boolean().default(false).optional(),
}).superRefine((data, ctx) => {
    if (data.dept === "other" && (!data.otherDept || data.otherDept.trim() === "")) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please specify your department.",
            path: ["otherDept"],
        });
    }
    if (data.additionalDept === "other" && (!data.additionalOtherDept || data.additionalOtherDept.trim() === "")) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please specify your additional department.",
            path: ["additionalOtherDept"],
        });
    }
    if (data.additionalDept && data.additionalDept === data.dept) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Additional department must be different from the primary department.",
            path: ["additionalDept"],
        });
    }
});

export type UnionCardInput = z.infer<typeof unionCardSchema>;