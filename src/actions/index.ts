import { defineAction } from "astro:actions";
import { db, IGWCSubmissions } from "astro:db";
import { unionCardSchema } from "../schemas/card";

export const server = {
  unionCard: defineAction({
    input: unionCardSchema,

    handler: async (input) => {
      try {
        const [submission] = await db
          .insert(IGWCSubmissions)
          .values(input)
          .returning();

        console.log(
          "Stored submission:",
          submission.submissionID
        );

        return { success: true };
      } catch (error) {
        console.error("Failed to store submission:", error);
        return { success: false };
      }
    },
  }),
};