import { defineAction } from "astro:actions";
import { db, IGWCSubmissions } from "astro:db";
import { unionCardSchema } from "../schemas/card";

export const server = {
  unionCard: defineAction({
    input: unionCardSchema,

    handler: async (input) => {
      try {
        const row = { ...input,
            card: true,
            teaching: input.contract === "saa" && input.teaching,
            otherDept: 
                input.dept === "other" ? input.otherDept?.trim() : undefined,
            additionalOtherDept: 
                input.additionalDept === "other" ? input.additionalOtherDept?.trim() : undefined,
         };
        const [submission] = await db
          .insert(IGWCSubmissions)
          .values(row)
          .returning();

        console.log(
          "Stored submission:",
          submission.submissionID
        );

        return { success: true };
      } catch (error) {
        console.error("Union card submission failed:", {
            type: error instanceof Error ? error.name : "UnknownError",
        })
        return { success: false };
      }
    },
  }),
};