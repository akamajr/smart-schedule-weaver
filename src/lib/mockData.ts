export type Lecturer = {
  id: string;
  name: string;
  title: string;
  email: string;
  department: string;
  status: "online" | "busy" | "sabbatical";
  available: boolean;
  courses: string[];
  preferredRoom: string;
  constraints: string[];
  hasOverlap?: boolean;
  avatarSeed: string;
};

export type Course = {
  id: string;
  code: string;
  name: string;
  lecturerId: string;
  credits: number;
  department: string;
  level: string;
  semester: "First" | "Second";
  status: "optimized" | "conflicts" | "pending";
};

export type Classroom = {
  id: string;
  name: string;
  capacity: number;
  type: "Lecture Hall" | "Lab" | "Studio";
  building: string;
};

export type TimetableSlot = {
  day: string;
  time: string;
  courseCode: string;
  courseName: string;
  lecturer: string;
  room: string;
  conflict?: "lecturer" | "room" | "course" | null;
  density?: "low" | "medium" | "high";
};

export type Conflict = {
  id: string;
  type: "lecturer" | "room" | "course";
  category: string;
  title: string;
  description: string;
  details: string;
  day: string;
  time: string;
  severity: "critical" | "medium" | "low";
  detectedAgo: string;
};

export type User = {
  id: string;
  username: string;
  email: string;
  role: "Admin" | "Lecturer";
  avatarSeed: string;
  status: "active" | "inactive";
};

export const lecturers: Lecturer[] = [
  { id: "l1", name: "Dr. Nyanga B", title: "Senior Lecturer", email: "nyanga.b@ubuea.edu", department: "Computer Engineering", status: "online", available: true, courses: ["CEC431"], preferredRoom: "U-Block E", constraints: ["Mon/Wed/Fri"], avatarSeed: "Nyanga B" },
  { id: "l2", name: "Mr. Kometa Dennis", title: "Lecturer", email: "kometa.d@ubuea.edu", department: "Computer Engineering", status: "online", available: true, courses: ["CEC427", "CEC315", "CEC418"], preferredRoom: "PEAGOB 1", constraints: ["Tue/Thu"], avatarSeed: "Kometa Dennis" },
  { id: "l3", name: "Dr. Mellingui Melono", title: "Senior Lecturer", email: "mellingui.m@ubuea.edu", department: "Computer Engineering", status: "online", available: true, courses: ["CEC433", "CEC318", "CEC430"], preferredRoom: "PEAGOB 2", constraints: ["Mon/Wed"], avatarSeed: "Mellingui Melono" },
  { id: "l4", name: "Mr. Nana", title: "Lecturer", email: "nana@ubuea.edu", department: "Computer Engineering", status: "online", available: true, courses: ["COT305"], preferredRoom: "CB1 50A", constraints: ["Tue/Fri"], avatarSeed: "Nana" },
  { id: "l5", name: "Dr. Sone Ekonde", title: "Associate Professor", email: "sone.e@ubuea.edu", department: "Computer Engineering", status: "online", available: true, courses: ["CEC461", "CEC304"], preferredRoom: "CB II 50F", constraints: ["Mon/Thu"], avatarSeed: "Sone Ekonde" },
  { id: "l6", name: "Mr. Nkentenyim D", title: "Lecturer", email: "nkentenyim.d@ubuea.edu", department: "Computer Engineering", status: "online", available: true, courses: ["CEC317"], preferredRoom: "CT2", constraints: ["Wed/Fri"], avatarSeed: "Nkentenyim D" },
  { id: "l7", name: "Mr. Megoze", title: "Lecturer", email: "megoze@ubuea.edu", department: "Computer Engineering", status: "busy", available: false, courses: ["CEC417", "CEC321", "CEC434", "CEC436"], preferredRoom: "Open CT", constraints: ["Full Week"], hasOverlap: true, avatarSeed: "Megoze" },
  { id: "l8", name: "Mr. Baloko Collins", title: "Lecturer", email: "baloko.c@ubuea.edu", department: "Computer Engineering", status: "online", available: true, courses: ["CEC323"], preferredRoom: "CB1 50B", constraints: ["Mon/Wed"], avatarSeed: "Baloko Collins" },
  { id: "l9", name: "Prof. Moffo", title: "Professor", email: "moffo@ubuea.edu", department: "Computer Engineering", status: "online", available: true, courses: ["CEC412"], preferredRoom: "PEAGOB 4", constraints: ["Tue/Thu"], avatarSeed: "Moffo" },
];

export const courses: Course[] = [
  // First Semester
  { id: "c1", code: "CEC431", name: "Software Construction and Quality", lecturerId: "l1", credits: 3.0, department: "Computer Engineering", level: "400", semester: "First", status: "optimized" },
  { id: "c2", code: "CEC427", name: "Fundamentals of Big Data", lecturerId: "l2", credits: 3.0, department: "Computer Engineering", level: "400", semester: "First", status: "optimized" },
  { id: "c3", code: "CEC433", name: "Mobile Apps with Embedded Systems", lecturerId: "l3", credits: 3.0, department: "Computer Engineering", level: "400", semester: "First", status: "optimized" },
  { id: "c4", code: "COT305", name: "Computing Theory", lecturerId: "l4", credits: 3.0, department: "Computer Engineering", level: "300", semester: "First", status: "optimized" },
  { id: "c5", code: "CEC461", name: "Information Security", lecturerId: "l5", credits: 3.0, department: "Computer Engineering", level: "400", semester: "First", status: "conflicts" },
  { id: "c6", code: "CEC317", name: "Computer Engineering Course 317", lecturerId: "l6", credits: 3.0, department: "Computer Engineering", level: "300", semester: "First", status: "optimized" },
  { id: "c7", code: "CEC417", name: "Computer Engineering Course 417", lecturerId: "l7", credits: 3.0, department: "Computer Engineering", level: "400", semester: "First", status: "pending" },
  { id: "c8", code: "CEC315", name: "Computer Engineering Course 315", lecturerId: "l2", credits: 3.0, department: "Computer Engineering", level: "300", semester: "First", status: "optimized" },
  { id: "c9", code: "CEC321", name: "Computer Engineering Course 321", lecturerId: "l7", credits: 3.0, department: "Computer Engineering", level: "300", semester: "First", status: "optimized" },
  { id: "c10", code: "CEC323", name: "Computer Engineering Course 323", lecturerId: "l8", credits: 3.0, department: "Computer Engineering", level: "300", semester: "First", status: "optimized" },
  // Second Semester
  { id: "c11", code: "CEC318", name: "Introduction to Mobile Apps", lecturerId: "l3", credits: 3.0, department: "Computer Engineering", level: "300", semester: "Second", status: "optimized" },
  { id: "c12", code: "CEC304", name: "Data Security and Integrity", lecturerId: "l5", credits: 3.0, department: "Computer Engineering", level: "300", semester: "Second", status: "optimized" },
  { id: "c13", code: "CEC412", name: "Virtual Instruments", lecturerId: "l9", credits: 3.0, department: "Computer Engineering", level: "400", semester: "Second", status: "optimized" },
  { id: "c14", code: "CEC430", name: "Fullstack Web Development", lecturerId: "l3", credits: 3.0, department: "Computer Engineering", level: "400", semester: "Second", status: "optimized" },
  { id: "c15", code: "CEC434", name: "Data Visualization", lecturerId: "l7", credits: 3.0, department: "Computer Engineering", level: "400", semester: "Second", status: "optimized" },
  { id: "c16", code: "CEC436", name: "Wireless Applications", lecturerId: "l7", credits: 3.0, department: "Computer Engineering", level: "400", semester: "Second", status: "pending" },
  { id: "c17", code: "CEC418", name: "Software Construction and Quality", lecturerId: "l2", credits: 3.0, department: "Computer Engineering", level: "400", semester: "Second", status: "optimized" },
];

export const classrooms: Classroom[] = [
  { id: "r1", name: "U-Block E", capacity: 120, type: "Lecture Hall", building: "U-Block" },
  { id: "r2", name: "PEAGOB 1", capacity: 80, type: "Lecture Hall", building: "PEAGOB Complex" },
  { id: "r3", name: "PEAGOB 2", capacity: 80, type: "Lecture Hall", building: "PEAGOB Complex" },
  { id: "r4", name: "PEAGOB 3", capacity: 80, type: "Lecture Hall", building: "PEAGOB Complex" },
  { id: "r5", name: "PEAGOB 4", capacity: 80, type: "Lecture Hall", building: "PEAGOB Complex" },
  { id: "r6", name: "CB II 50F", capacity: 50, type: "Lecture Hall", building: "CB II" },
  { id: "r7", name: "CT2", capacity: 60, type: "Lab", building: "Computing Tech Block" },
  { id: "r8", name: "Open CT", capacity: 100, type: "Lab", building: "Computing Tech Block" },
  { id: "r9", name: "CB1 50A", capacity: 50, type: "Lecture Hall", building: "CB1" },
  { id: "r10", name: "CB1 50B", capacity: 50, type: "Lecture Hall", building: "CB1" },
  { id: "r11", name: "CB1 50C", capacity: 50, type: "Lecture Hall", building: "CB1" },
];

export const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const daysShort = ["MON", "TUE", "WED", "THU", "FRI"];
export const timeSlots = ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00"];

export const initialTimetable: TimetableSlot[] = [
  { day: "Monday", time: "08:00 - 10:00", courseCode: "CEC431", courseName: "Software Construction and Quality", lecturer: "Dr. Nyanga B", room: "U-Block E", density: "high" },
  { day: "Monday", time: "10:00 - 12:00", courseCode: "CEC427", courseName: "Fundamentals of Big Data", lecturer: "Mr. Kometa Dennis", room: "PEAGOB 1", density: "high" },
  { day: "Tuesday", time: "08:00 - 10:00", courseCode: "CEC433", courseName: "Mobile Apps with Embedded Systems", lecturer: "Dr. Mellingui Melono", room: "PEAGOB 2", density: "medium" },
  { day: "Tuesday", time: "14:00 - 16:00", courseCode: "COT305", courseName: "Computing Theory", lecturer: "Mr. Nana", room: "CB1 50A", density: "medium" },
  { day: "Wednesday", time: "08:00 - 10:00", courseCode: "CEC461", courseName: "Information Security", lecturer: "Dr. Sone Ekonde", room: "CB II 50F", density: "high" },
  { day: "Wednesday", time: "12:00 - 14:00", courseCode: "CEC317", courseName: "CEC 317", lecturer: "Mr. Nkentenyim D", room: "CT2", density: "medium" },
  { day: "Thursday", time: "10:00 - 12:00", courseCode: "CEC417", courseName: "CEC 417", lecturer: "Mr. Megoze", room: "Open CT", density: "medium" },
  { day: "Friday", time: "10:00 - 12:00", courseCode: "CEC323", courseName: "CEC 323", lecturer: "Mr. Baloko Collins", room: "CB1 50B", density: "medium" },
];

export const lecturerSchedule = [
  { day: "Monday, Oct 23", isToday: true, sessions: [
    { time: "08:00 AM - 10:00 AM", code: "CEC431", name: "Software Construction and Quality", venue: "U-Block E", students: 65, status: "now" as const },
    { time: "01:00 PM - 03:00 PM", code: "CEC315", name: "CEC 315", venue: "PEAGOB 1", students: 42, status: "upcoming" as const },
  ]},
  { day: "Tuesday, Oct 24", isToday: false, sessions: [
    { time: "10:00 AM - 12:00 PM", code: "CEC427", name: "Fundamentals of Big Data", venue: "PEAGOB 3", students: 25, status: "upcoming" as const },
  ]},
  { day: "Wednesday, Oct 25", isToday: false, sessions: [
    { time: "09:00 AM - 11:00 AM", code: "CEC418", name: "Software Construction and Quality", venue: "CB II 50F", students: 65, status: "upcoming" as const },
    { time: "02:00 PM - 04:00 PM", code: "CEC430", name: "Fullstack Web Development", venue: "Open CT", students: 18, status: "upcoming" as const },
  ]},
];

export const conflicts: Conflict[] = [
  { id: "cf1", type: "lecturer", category: "LECTURER TIME CLASH", title: "Lecturer Time Clash", description: "Mr. Megoze assigned to CEC417 & CEC434 at 10:00 AM, Monday.", details: "CEC417 and CEC434 overlap", day: "Monday", time: "10:00 AM", severity: "critical", detectedAgo: "2m ago" },
  { id: "cf2", type: "room", category: "INFRASTRUCTURE ALERT", title: "Venue Unavailability", description: "PEAGOB 2 scheduled for maintenance during CEC433 on Tuesday.", details: "CEC433 conflicts with maintenance", day: "Tuesday", time: "11:00 AM", severity: "medium", detectedAgo: "15m ago" },
  { id: "cf3", type: "course", category: "COURSE OVERLAP", title: "Student Group Overlap", description: "Level 400 students assigned to CEC431 and CEC461 simultaneously on Wednesday at 02:00 PM.", details: "CEC431 and CEC461 share cohort", day: "Wednesday", time: "02:00 PM", severity: "critical", detectedAgo: "32m ago" },
  { id: "cf4", type: "lecturer", category: "WORKLOAD ALERT", title: "Faculty Overload", description: "Mr. Megoze scheduled for 7 consecutive hours Tuesday — exceeds policy limit.", details: "Workload threshold exceeded", day: "Tuesday", time: "All day", severity: "medium", detectedAgo: "1h ago" },
  { id: "cf5", type: "room", category: "INFRASTRUCTURE ALERT", title: "Capacity Mismatch", description: "CEC430 (95 students) booked into CB1 50C (50 capacity) on Friday.", details: "Room undersized for cohort", day: "Friday", time: "10:00 AM", severity: "critical", detectedAgo: "5m ago" },
];

export const users: User[] = [
  { id: "u1", username: "nyanga_admin", email: "nyanga.b@ubuea.edu", role: "Admin", avatarSeed: "Nyanga", status: "active" },
  { id: "u2", username: "kometa_d", email: "kometa.d@ubuea.edu", role: "Lecturer", avatarSeed: "Kometa", status: "active" },
  { id: "u3", username: "mellingui_m", email: "mellingui.m@ubuea.edu", role: "Lecturer", avatarSeed: "Mellingui", status: "active" },
  { id: "u4", username: "megoze", email: "megoze@ubuea.edu", role: "Lecturer", avatarSeed: "Megoze", status: "active" },
];

export const recentActivity = [
  { id: 1, action: "Generated Semester 1 timetable", user: "Admin", time: "2 min ago", icon: "Sparkles" },
  { id: 2, action: "Resolved lecturer conflict", user: "Admin", time: "15 min ago", icon: "CheckCircle2" },
  { id: 3, action: "Added course CEC430", user: "Admin", time: "1 hour ago", icon: "BookPlus" },
  { id: 4, action: "Updated lecturer availability", user: "Dr. Mellingui", time: "3 hours ago", icon: "UserCheck" },
];
