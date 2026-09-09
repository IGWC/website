import { defineDb, defineTable, column, NOW } from 'astro:db';

const IGWCSubmissions =  defineTable({
  columns: {
    submissionID: column.number({ primaryKey: true }),
    submittedAt: column.date({ default: NOW }),

    userID: column.text(),
    firstName: column.text(),
    lastName: column.text(),
    email: column.text(),
    phone: column.text(),
    textOK: column.boolean({ default: false }),
    dept: column.text({ references: () => Departments.columns.deptCode }),
    subfield: column.text({ optional: true }),
    card: column.boolean({ default: true }),
    contract: column.text({ enum: ["saa", "fellowship", "hourly", "none"] }),
    year: column.text(),
    getInvolved: column.boolean({ default: false }),
    additionalDept: column.text({ references: () => Departments.columns.deptCode, optional: true }),
    additionalSubfield: column.text({ optional: true }),
    teaching: column.boolean({ default: false }),
  }
});


const Departments = defineTable({
  columns: {
    deptCode: column.text({ primaryKey: true }),
    deptName: column.text(),
    subfieldLabel: column.text({ optional: true }),
    subfieldHelpText: column.text({ optional: true }),
  },
});


// https://astro.build/db/config
export default defineDb({
  tables: { IGWCSubmissions, Departments }
});
