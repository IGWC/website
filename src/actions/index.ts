import { ActionError, defineAction, isActionError } from "astro:actions";
import { db, IGWC, IGWCSubmissions, Departments, eq, gt, asc } from "astro:db";
import { getSecret } from "astro:env/server";
import { unionCardSchema } from "../schemas/card";
import type { UnionCardInput } from "../schemas/card";
import { createCardDelivery } from "./card-delivery.mjs";

const cardDelivery = (() => {
  // Enable only in the deployed Node process; keep disabled during builds and development.
  if (process.env.IGWC_CARD_DELIVERY_ENABLED !== "true") return null;
  try {
    const worker = createCardDelivery({
      loadSubmissions: (afterId: number, limit: number) => db.select().from(IGWCSubmissions)
        .where(gt(IGWCSubmissions.submissionID, afterId))
        .orderBy(asc(IGWCSubmissions.submissionID)).limit(limit),
      directory: process.env.IGWC_CARD_PROGRESS_DIR,
      afterId: process.env.IGWC_CARD_SYNC_AFTER_ID?.trim()
        ? Number(process.env.IGWC_CARD_SYNC_AFTER_ID) : undefined,
      term: process.env.IGWC_CARD_TERM,
      legacyUrl: process.env.IGWC_CARD_LEGACY_URL,
      backendUrl: process.env.IGWC_CARD_BACKEND_URL,
      websiteToken: process.env.IGWC_CARD_WEBSITE_TOKEN,
    });
    worker.start();
    return worker;
  } catch {
    console.error("IGWC card delivery: configuration invalid; submissions remain in Turso.");
    return null;
  }
})();

function toLegacySubmission(
  input: UnionCardInput,
  subfield: string | undefined,
  additionalDept: string | undefined,
  additionalSubfield: string | undefined,
) {
  const isOtherDepartment = input.dept === "other";
  const isOtherAdditionalDepartment = additionalDept === "other";

  const legacyContract =
    input.contract === "saa" && input.teaching
      ? "saa-instructional"
      : input.contract;

  return {
    userID: input.userID,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    textOK: input.textOK ?? true,

    otherDept: isOtherDepartment ? subfield ?? null : null,
    dept: input.dept,
    subfield: isOtherDepartment ? null : subfield ?? null,

    card: true,
    contract: legacyContract,
    location: null,
    year: input.year,
    getInvolved: input.getInvolved ?? false,
    additionalDept: additionalDept ?? null,
    additionalOtherDept: isOtherAdditionalDepartment
      ? additionalSubfield ?? null
      : null,
    organizer: null,
  };
}

type LegacySubmission = ReturnType<typeof toLegacySubmission>;

async function sendLegacySubmissionToGoogleSheet(
  submission: LegacySubmission,
) {
  const googleScriptUrl = getSecret("GOOGLE_SHEETS_WEBHOOK_URL");

  if (!googleScriptUrl) {
    throw new Error("GOOGLE_SHEETS_WEBHOOK_URL is not configured.");
  }

  const response = await fetch(googleScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Google Sheets request failed with HTTP ${response.status}.`);
  }
}

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

        // The new database retries from Turso independently of the existing compatibility writes.
        void cardDelivery?.drain().catch(() => {
          console.error("IGWC card delivery: pending; submissions remain in Turso.");
        });

        const legacyRow = toLegacySubmission(
          input,
          subfield,
          additionalDepartment?.deptCode,
          additionalSubfield,
        );
        const { userID: _userID, ...legacyUpdate } = legacyRow;

        const compatibilityResults = await Promise.allSettled([
          db
            .insert(IGWC)
            .values(legacyRow)
            .onConflictDoUpdate({
              target: IGWC.userID,
              set: legacyUpdate,
            }),
          sendLegacySubmissionToGoogleSheet(legacyRow),
        ]);

        const compatibilityDestinations = ["legacy-database", "google-sheet"];
        compatibilityResults.forEach((result, index) => {
          if (result.status === "rejected") {
            console.error("Compatibility write failed:", {
              submissionID: submission.submissionID,
              destination: compatibilityDestinations[index],
              type:
                result.reason instanceof Error
                  ? result.reason.name
                  : "UnknownError",
            });
          }
        });

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
