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
  { id: "l1", name: "Dr. Sarah Jenkins", title: "Senior Fellow", email: "s.jenkins@scholarly.edu", department: "Applied Science", status: "online", available: true, courses: ["CS101", "CS210"], preferredRoom: "Hall A", constraints: ["Mon/Wed/Fri", "10 AM - 4 PM"], avatarSeed: "Sarah" },
  { id: "l2", name: "Prof. Michael Chen", title: "Head of Dept.", email: "m.chen@scholarly.edu", department: "Economics", status: "busy", available: false, courses: ["EC305", "EC410"], preferredRoom: "Hall B", constraints: ["Tue/Thu"], hasOverlap: true, avatarSeed: "Michael" },
  { id: "l3", name: "Dr. Elena Rossi", title: "Lecturer", email: "e.rossi@scholarly.edu", department: "Mathematics", status: "online", available: true, courses: ["MATH205", "MATH310"], preferredRoom: "Lab 1", constraints: ["Full Week", "8 AM - 2 PM"], avatarSeed: "Elena" },
  { id: "l4", name: "Dr. David Thorne", title: "Assoc. Professor", email: "d.thorne@scholarly.edu", department: "History", status: "sabbatical", available: false, courses: [], preferredRoom: "Hall C", constraints: ["No recurring constraints"], avatarSeed: "David" },
  { id: "l5", name: "Dr. Alan Turing", title: "Professor", email: "a.turing@scholarly.edu", department: "Computer Science", status: "online", available: true, courses: ["CS101"], preferredRoom: "Lab 2", constraints: ["Mon/Wed", "9 AM - 5 PM"], avatarSeed: "Alan" },
  { id: "l6", name: "Prof. Marie Curie", title: "Distinguished", email: "m.curie@scholarly.edu", department: "Applied Physics", status: "busy", available: false, courses: ["PHY302"], preferredRoom: "Lab 1", constraints: ["Tue/Thu/Fri"], hasOverlap: true, avatarSeed: "Marie" },
  { id: "l7", name: "Dr. Emmy Noether", title: "Professor", email: "e.noether@scholarly.edu", department: "Pure Mathematics", status: "online", available: true, courses: ["MATH205"], preferredRoom: "Hall B", constraints: ["Full Week"], avatarSeed: "Emmy" },
  { id: "l8", name: "Prof. Jane Doe", title: "Senior Lecturer", email: "j.doe@scholarly.edu", department: "Liberal Arts", status: "online", available: true, courses: ["LIT110"], preferredRoom: "Studio C", constraints: ["Mon/Tue"], avatarSeed: "Jane" },
];

export const courses: Course[] = [
  { id: "c1", code: "CS101", name: "Intro to Computer Science", lecturerId: "l5", credits: 4.0, department: "Computer Science", level: "100", status: "optimized" },
  { id: "c2", code: "PHY302", name: "Quantum Mechanics II", lecturerId: "l6", credits: 3.0, department: "Applied Physics", level: "300", status: "conflicts" },
  { id: "c3", code: "MATH205", name: "Linear Algebra", lecturerId: "l7", credits: 4.0, department: "Pure Mathematics", level: "200", status: "optimized" },
  { id: "c4", code: "LIT110", name: "World Literature", lecturerId: "l8", credits: 2.0, department: "Liberal Arts", level: "100", status: "optimized" },
  { id: "c5", code: "CS210", name: "Data Structures", lecturerId: "l1", credits: 3.0, department: "Computer Science", level: "200", status: "optimized" },
  { id: "c6", code: "EC305", name: "Macroeconomics", lecturerId: "l2", credits: 3.0, department: "Economics", level: "300", status: "pending" },
  { id: "c7", code: "MATH310", name: "Real Analysis", lecturerId: "l3", credits: 4.0, department: "Mathematics", level: "300", status: "optimized" },
  { id: "c8", code: "EC410", name: "Game Theory", lecturerId: "l2", credits: 3.0, department: "Economics", level: "400", status: "optimized" },
];

export const classrooms: Classroom[] = [
  { id: "r1", name: "Hall A", capacity: 120, type: "Lecture Hall", building: "Engineering Hall B" },
  { id: "r2", name: "Hall B", capacity: 80, type: "Lecture Hall", building: "Science Block 4" },
  { id: "r3", name: "Lab 1", capacity: 40, type: "Lab", building: "Innovation Lab" },
  { id: "r4", name: "Lab 2", capacity: 40, type: "Lab", building: "Science Block 4" },
  { id: "r5", name: "Studio C", capacity: 30, type: "Studio", building: "Liberal Arts" },
  { id: "r6", name: "Room 402", capacity: 60, type: "Lecture Hall", building: "Humanities" },
];

export const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const daysShort = ["MON", "TUE", "WED", "THU", "FRI"];
export const timeSlots = ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00"];

export const initialTimetable: TimetableSlot[] = [
  { day: "Monday", time: "08:00 - 10:00", courseCode: "CS210", courseName: "Data Structures", lecturer: "Dr. Sarah Jenkins", room: "Hall A", density: "high" },
  { day: "Monday", time: "10:30 - 12:30", courseCode: "ALG2", courseName: "Algorithms II", lecturer: "Dr. Sarah Jenkins", room: "Hall A", density: "high" },
  { day: "Tuesday", time: "09:00 - 12:00", courseCode: "SQA", courseName: "Software QA", lecturer: "Prof. Michael Chen", room: "Hall B", density: "medium" },
  { day: "Tuesday", time: "14:00 - 16:00", courseCode: "FREE", courseName: "Free Slot", lecturer: "—", room: "—", density: "low" },
  { day: "Wednesday", time: "08:00 - 10:00", courseCode: "CLOUD", courseName: "Cloud Arch", lecturer: "Dr. Elena Rossi", room: "Lab 1", density: "medium" },
  { day: "Wednesday", time: "11:00 - 13:00", courseCode: "ETHICS", courseName: "Ethics Lab", lecturer: "Dr. Elena Rossi", room: "Lab 1", density: "medium" },
  { day: "Thursday", time: "10:00 - 13:00", courseCode: "RESERVED", courseName: "Reserved", lecturer: "—", room: "—", density: "low" },
  { day: "Friday", time: "10:00 - 12:30", courseCode: "THESIS", courseName: "Thesis Seminar", lecturer: "Prof. Marie Curie", room: "Hall A", density: "medium" },
];

export const lecturerSchedule = [
  { day: "Monday, Oct 23", isToday: true, sessions: [
    { time: "08:00 AM - 10:00 AM", code: "CE402", name: "Software Architecture", venue: "Engineering Hall B, Level 2", students: 65, status: "now" as const },
    { time: "01:00 PM - 03:00 PM", code: "CS201", name: "Discrete Mathematics", venue: "Science Block 4, Room 102", students: 42, status: "upcoming" as const },
  ]},
  { day: "Tuesday, Oct 24", isToday: false, sessions: [
    { time: "10:00 AM - 12:00 PM", code: "SE305", name: "Cloud Infrastructure Lab", venue: "Innovation Lab, Level 4", students: 25, status: "upcoming" as const },
  ]},
  { day: "Wednesday, Oct 25", isToday: false, sessions: [
    { time: "09:00 AM - 11:00 AM", code: "CE402", name: "Software Architecture", venue: "Engineering Hall B, Level 2", students: 65, status: "upcoming" as const },
    { time: "02:00 PM - 04:00 PM", code: "ML410", name: "Machine Learning Capstone", venue: "Innovation Lab, Level 4", students: 18, status: "upcoming" as const },
  ]},
];

export const conflicts: Conflict[] = [
  { id: "cf1", type: "lecturer", category: "LECTURER TIME CLASH", title: "Lecturer Time Clash", description: "Dr. A. Smith assigned to CE402 (Software Architecture) & CE405 (Cloud Computing) at 10:00 AM, Monday.", details: "CE402 (Software Architecture) and CE405 (Cloud Computing)", day: "Monday", time: "10:00 AM", severity: "critical", detectedAgo: "2m ago" },
  { id: "cf2", type: "room", category: "INFRASTRUCTURE ALERT", title: "Venue Unavailability", description: "Room 101 scheduled for maintenance during CS301 session on Tuesday.", details: "CS301 session conflicts with maintenance", day: "Tuesday", time: "11:00 AM", severity: "medium", detectedAgo: "15m ago" },
  { id: "cf3", type: "course", category: "COURSE OVERLAP", title: "Student Group Overlap", description: "Level 300 students assigned to MATH310 and EC305 simultaneously on Wednesday at 02:00 PM.", details: "MATH310 and EC305 share student cohort", day: "Wednesday", time: "02:00 PM", severity: "critical", detectedAgo: "32m ago" },
  { id: "cf4", type: "lecturer", category: "WORKLOAD ALERT", title: "Faculty Overload", description: "Prof. Marie Curie scheduled for 7 consecutive hours Tuesday — exceeds policy limit.", details: "Workload threshold exceeded", day: "Tuesday", time: "All day", severity: "medium", detectedAgo: "1h ago" },
  { id: "cf5", type: "room", category: "INFRASTRUCTURE ALERT", title: "Capacity Mismatch", description: "LIT110 (95 students) booked into Studio C (30 capacity) on Friday.", details: "Room undersized for cohort", day: "Friday", time: "10:00 AM", severity: "critical", detectedAgo: "5m ago" },
];

export const users: User[] = [
  { id: "u1", username: "sjensen_admin", email: "s.jensen@scholarly.edu", role: "Admin", avatarSeed: "Sarah", status: "active" },
  { id: "u2", username: "m_thorne", email: "m.thorne@scholarly.edu", role: "Lecturer", avatarSeed: "Marcus", status: "active" },
  { id: "u3", username: "achen_admin", email: "a.chen@scholarly.edu", role: "Admin", avatarSeed: "Alex", status: "active" },
  { id: "u4", username: "e_rossi", email: "e.rossi@scholarly.edu", role: "Lecturer", avatarSeed: "Elena", status: "inactive" },
];

export const recentActivity = [
  { id: 1, action: "Generated Q3 timetable", user: "Admin", time: "2 min ago", icon: "Sparkles" },
  { id: 2, action: "Resolved lecturer conflict", user: "Admin", time: "15 min ago", icon: "CheckCircle2" },
  { id: 3, action: "Added course CSC410", user: "Admin", time: "1 hour ago", icon: "BookPlus" },
  { id: 4, action: "Updated lecturer availability", user: "Dr. Eze", time: "3 hours ago", icon: "UserCheck" },
];
