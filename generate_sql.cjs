const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Helpers
function generateUUID() {
    return crypto.randomUUID();
}
function escapeSQL(str) {
    if (!str) return 'NULL';
    return "'" + str.toString().replace(/'/g, "''") + "'";
}

const dataDir = path.join(__dirname, 'table-data');

// Read files
function readSheet(filename) {
    const workbook = xlsx.readFile(path.join(dataDir, filename));
    return xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
}

const facultiesData = readSheet('faculties.xlsx');
const departmentsData = readSheet('departments.xlsx');
const coursesData = readSheet('Courses.xlsx');
const venuesData = readSheet('VENUES-HALLS.xlsx');

// Maps to keep relationships
const facultyIdMap = {}; // excel_id -> uuid
const departmentIdMap = {}; // excel_id -> uuid
const venueIdMap = {}; // excel_id -> uuid

let sql = `-- PRODUCTION DATA INSERT SCRIPT\n`;
sql += `-- Generated on: ${new Date().toISOString()}\n\n`;

// Clear existing data to avoid conflicts
sql += `-- Truncating existing tables (CASCADE ensures related rows are deleted)\n`;
sql += `TRUNCATE TABLE public.faculties, public.departments, public.courses, public.halls, public.exam_sessions, public.exam_session_halls CASCADE;\n\n`;

// FACULTIES
sql += `-- ========================\n`;
sql += `-- FACULTIES\n`;
sql += `-- ========================\n`;
facultiesData.forEach(row => {
    const originalId = row.faculty_id;
    const name = row.faculty_name;
    if (originalId && name) {
        const uuid = generateUUID();
        facultyIdMap[originalId] = uuid;
        sql += `INSERT INTO public.faculties (id, name) VALUES ('${uuid}', ${escapeSQL(name)});\n`;
    }
});
sql += `\n`;

// DEPARTMENTS
sql += `-- ========================\n`;
sql += `-- DEPARTMENTS\n`;
sql += `-- ========================\n`;
departmentsData.forEach(row => {
    const originalId = row.id;
    const name = row.department_name;
    const facultyExcelId = row.faculty_id;
    
    if (originalId && name) {
        const uuid = generateUUID();
        departmentIdMap[originalId] = uuid;
        const mappedFacultyId = facultyIdMap[facultyExcelId];
        
        if (mappedFacultyId) {
            sql += `INSERT INTO public.departments (id, faculty_id, name) VALUES ('${uuid}', '${mappedFacultyId}', ${escapeSQL(name)});\n`;
        } else {
            console.warn(`Warning: Department ${name} references missing faculty_id ${facultyExcelId}`);
        }
    }
});
sql += `\n`;

// COURSES
sql += `-- ========================\n`;
sql += `-- COURSES\n`;
sql += `-- ========================\n`;
coursesData.forEach(row => {
    const code = row.course_code;
    const deptExcelId = row.department_id;
    const facExcelId = row.faculty_id;
    
    if (code) {
        const uuid = generateUUID();
        const mappedDeptId = departmentIdMap[deptExcelId];
        const mappedFacId = facultyIdMap[facExcelId];
        
        if (mappedDeptId && mappedFacId) {
            sql += `INSERT INTO public.courses (id, department_id, faculty_id, course_code, course_title) VALUES ('${uuid}', '${mappedDeptId}', '${mappedFacId}', ${escapeSQL(code)}, NULL);\n`;
        } else {
            console.warn(`Warning: Course ${code} missing valid department_id (${deptExcelId}) or faculty_id (${facExcelId})`);
        }
    }
});
sql += `\n`;

// HALLS / VENUES
sql += `-- ========================\n`;
sql += `-- HALLS / VENUES\n`;
sql += `-- ========================\n`;
venuesData.forEach(row => {
    const originalId = row.Venue_ID;
    const name = row.Venue_Name;
    const type = row.Venue_Type;
    
    if (originalId && name) {
        const uuid = generateUUID();
        venueIdMap[originalId] = uuid;
        
        // Ensure type column is properly handled if missing
        const typeSql = type ? escapeSQL(type) : 'NULL';
        
        sql += `INSERT INTO public.halls (id, name, type) VALUES ('${uuid}', ${escapeSQL(name)}, ${typeSql});\n`;
    }
});
sql += `\n`;

fs.writeFileSync('production_data_insert.sql', sql);
console.log('Successfully generated production_data_insert.sql');
