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
    textOK: column.boolean({ optional: true }),
    otherDept: column.text({ optional: true }),
    dept: column.text({ references: () => Departments.columns.deptCode }),
    subfield: column.text({ optional: true }),
    card: column.boolean({ default: true }),
    contract: column.text({ optional: true }),
    location: column.text({ optional: true }),
    year: column.text(),
    getInvolved: column.boolean({ optional: true }),
    additionalDept: column.text({ references: () => Departments.columns.deptCode, optional: true }),
    additionalOtherDept: column.text({ optional: true }),
    teaching: column.boolean({ optional: false }),
  }
});


const Departments = defineTable({
  columns: {
    deptCode: column.text({ primaryKey: true }),
    deptName: column.text(),
    subDept: column.text({ optional: true }),
  }
});


// https://astro.build/db/config
export default defineDb({
  tables: { IGWCSubmissions, Departments }
});
