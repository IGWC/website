import { defineDb, defineTable, column } from 'astro:db';

const IGWC =  defineTable({
  columns: {
    userID: column.text({ primaryKey: true }),
    firstName: column.text(),
    lastName: column.text(),
    email: column.text(),
    phone: column.text(),
    textOK: column.boolean({ default: false }),
    otherDept: column.text({ optional: true }),
    dept: column.text({ references: () => Departments.columns.deptCode }),
    subfield: column.text({ optional: true }),
    card: column.boolean({ default: true }),
    contract: column.text(),
    location: column.text({ optional: true }),
    year: column.text(),
    getInvolved: column.boolean({ default: false }),
    organizer: column.text({ references: () => Departments.columns.deptCode, optional: true }),
  }
});


const Departments = defineTable({
  columns: {
    deptCode: column.text({ primaryKey: true }),
    deptName: column.text(),
    subDept: column.text({ optional: true }),
    deptAC: column.text({ references: () => IGWC.columns.userID, optional: true }),
  }
});


// https://astro.build/db/config
export default defineDb({
  tables: { IGWC, Departments }
});
