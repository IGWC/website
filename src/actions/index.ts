import { ActionError, defineAction, isActionError } from "astro:actions";
import { db, IGWCSubmissions, Departments, eq } from "astro:db";
import { unionCardSchema } from "../schemas/card";

const findDepartment = async (deptCode: string) => {
  const [department] = await db.select({
    deptCode: Departments.deptCode,
    subfieldLabel: Departments.subfieldLabel,
  }).from(Departments).where(eq(Departments.deptCode, deptCode)).limit(1);

  return department;
};

const normalizeOptionalText = (value?: string) => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

export const server = {
  unionCard: defineAction({
    input: unionCardSchema,

    handler: async (input) => {
      try {
        const [department, additionalDepartment] = await Promise.all([
          findDepartment(input.dept),
          input.additionalDept
            ? findDepartment(input.additionalDept)
            : Promise.resolve(undefined),
        ]);

        if (!department) {
          throw new ActionError({
            code: "BAD_REQUEST",
            message: "Please select a valid department.",
          });
        }

        if (input.additionalDept && !additionalDepartment) {
          throw new ActionError({
            code: "BAD_REQUEST",
            message: "Please select a valid additional department.",
          });
        }

        if (input.additionalDept === input.dept) {
          throw new ActionError({
            code: "BAD_REQUEST",
            message: "Additional department must be different from the primary department.",
          });
        }

        const acceptsSubfield =
          department.deptCode === "other" || Boolean(department.subfieldLabel?.trim());
        const subfield = acceptsSubfield
          ? normalizeOptionalText(input.subfield)
          : undefined;

        if (acceptsSubfield && !subfield) {
          throw new ActionError({
            code: "BAD_REQUEST",
            message: department.subfieldLabel?.trim()
              ? `${department.subfieldLabel.trim()} is required.`
              : "Please specify your department.",
          });
        }

        const acceptsAdditionalSubfield = Boolean(
          additionalDepartment && (
            additionalDepartment.deptCode === "other" ||
            additionalDepartment.subfieldLabel?.trim()
          )
        );
        const additionalSubfield = acceptsAdditionalSubfield
          ? normalizeOptionalText(input.additionalSubfield)
          : undefined;

        if (acceptsAdditionalSubfield && !additionalSubfield) {
          throw new ActionError({
            code: "BAD_REQUEST",
            message: additionalDepartment?.subfieldLabel?.trim()
              ? `${additionalDepartment.subfieldLabel.trim()} is required.`
              : "Please specify your additional department.",
          });
        }

        const row = {
          userID: input.userID,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          textOK: input.textOK ?? true,
          dept: department.deptCode,
          subfield,
          card: true,
          contract: input.contract,
          year: input.year,
          getInvolved: input.getInvolved ?? false,
          additionalDept: additionalDepartment?.deptCode,
          additionalSubfield,
          teaching: input.contract === "saa" && input.teaching,
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
        if (isActionError(error)) {
          throw error;
        }

        console.error("Union card submission failed:", {
            type: error instanceof Error ? error.name : "UnknownError",
        });

        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "We couldn't submit your card. Please try again.",
        });
      }
    },
  }),
};
