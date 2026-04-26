export type Lecturer = {
  id: string;
  name: string;
  email: string;
  available: boolean;
  courses: string[];
};

export type Course = {
  id: string;
  code: string;
  name: string;
  lecturerId: string;
  credits: number;
  department: string;
  level: string;
};

export type Classroom = {
  id: string;
  name: string;
  capacity: number;
  type: "Lecture Hall" | "Lab" | "Studio";
};

export type TimetableSlot = {
  day: string;
  time: string;
  courseCode: string;
  courseName: string;
  lecturer: string;
  room: string;
  conflict?: "lecturer" | "room" | "course" | null;
};

export type Conflict = {
  id: string;
  type: "lecturer" | "room" | "course";
  description: string;
  details: string;
  day: string;
  time: string;
  severity: "high" | "medium" | "low";
};

export type User = {
  id: string;
  username: string;
  email: string;
  role: "Admin" | "Lecturer";
};

export const lecturers: Lecturer[] = [
  { id: "l1", name: "Dr. Adaeze Okonkwo", email: "a.okonkwo@uni.edu", available: true, courses: ["CSC301", "CSC401"] },
  { id: "l2", name: "Prof. Tunde Bakare", email: "t.bakare@uni.edu", available: true, courses: ["NET305"] },
  { id: "l3", name: "Dr. Mercy Eze", email: "m.eze@uni.edu", available: false, courses: ["CSC205", "CSC310"] },
  { id: "l4", name: "Mr. Idris Lawal", email: "i.lawal@uni.edu", available: true, courses: ["SWE402"] },
  { id: "l5", name: "Dr. Ngozi Umeh", email: "n.umeh@uni.edu", available: true, courses: ["DBA301"] },
  { id: "l6", name: "Prof. Kelechi Obi", email: "k.obi@uni.edu", available: false, courses: ["AI405"] },
];

export const courses: Course[] = [
  { id: "c1", code: "CSC301", name: "Data Structures & Algorithms", lecturerId: "l1", credits: 3, department: "Software", level: "300" },
  { id: "c2", code: "CSC401", name: "Software Engineering", lecturerId: "l1", credits: 4, department: "Software", level: "400" },
  { id: "c3", code: "NET305", name: "Computer Networks", lecturerId: "l2", credits: 3, department: "Network", level: "300" },
  { id: "c4", code: "CSC205", name: "Discrete Mathematics", lecturerId: "l3", credits: 2, department: "Software", level: "200" },
  { id: "c5", code: "CSC310", name: "Operating Systems", lecturerId: "l3", credits: 3, department: "Software", level: "300" },
  { id: "c6", code: "SWE402", name: "Mobile App Development", lecturerId: "l4", credits: 3, department: "Software", level: "400" },
  { id: "c7", code: "DBA301", name: "Database Systems", lecturerId: "l5", credits: 3, department: "Software", level: "300" },
  { id: "c8", code: "AI405", name: "Artificial Intelligence", lecturerId: "l6", credits: 4, department: "Software", level: "400" },
];

export const classrooms: Classroom[] = [
  { id: "r1", name: "Hall A", capacity: 120, type: "Lecture Hall" },
  { id: "r2", name: "Hall B", capacity: 80, type: "Lecture Hall" },
  { id: "r3", name: "Lab 1", capacity: 40, type: "Lab" },
  { id: "r4", name: "Lab 2", capacity: 40, type: "Lab" },
  { id: "r5", name: "Studio C", capacity: 30, type: "Studio" },
];

export const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const timeSlots = ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00"];

export const initialTimetable: TimetableSlot[] = [
  { day: "Monday", time: "08:00 - 10:00", courseCode: "CSC301", courseName: "Data Structures", lecturer: "Dr. Adaeze Okonkwo", room: "Hall A" },
  { day: "Monday", time: "10:00 - 12:00", courseCode: "NET305", courseName: "Computer Networks", lecturer: "Prof. Tunde Bakare", room: "Hall B" },
  { day: "Monday", time: "14:00 - 16:00", courseCode: "DBA301", courseName: "Database Systems", lecturer: "Dr. Ngozi Umeh", room: "Lab 1" },
  { day: "Tuesday", time: "08:00 - 10:00", courseCode: "CSC401", courseName: "Software Engineering", lecturer: "Dr. Adaeze Okonkwo", room: "Hall A" },
  { day: "Tuesday", time: "10:00 - 12:00", courseCode: "CSC205", courseName: "Discrete Math", lecturer: "Dr. Mercy Eze", room: "Hall B", conflict: "lecturer" },
  { day: "Tuesday", time: "10:00 - 12:00", courseCode: "CSC310", courseName: "Operating Systems", lecturer: "Dr. Mercy Eze", room: "Lab 2", conflict: "lecturer" },
  { day: "Wednesday", time: "08:00 - 10:00", courseCode: "SWE402", courseName: "Mobile App Dev", lecturer: "Mr. Idris Lawal", room: "Lab 1" },
  { day: "Wednesday", time: "12:00 - 14:00", courseCode: "AI405", courseName: "Artificial Intelligence", lecturer: "Prof. Kelechi Obi", room: "Hall A" },
  { day: "Thursday", time: "10:00 - 12:00", courseCode: "CSC301", courseName: "Data Structures", lecturer: "Dr. Adaeze Okonkwo", room: "Hall A" },
  { day: "Thursday", time: "14:00 - 16:00", courseCode: "NET305", courseName: "Computer Networks", lecturer: "Prof. Tunde Bakare", room: "Lab 2" },
  { day: "Friday", time: "08:00 - 10:00", courseCode: "CSC310", courseName: "Operating Systems", lecturer: "Dr. Mercy Eze", room: "Hall B" },
  { day: "Friday", time: "12:00 - 14:00", courseCode: "DBA301", courseName: "Database Systems", lecturer: "Dr. Ngozi Umeh", room: "Lab 1" },
];

export const conflicts: Conflict[] = [
  { id: "cf1", type: "lecturer", description: "Dr. Mercy Eze double-booked", details: "CSC205 (Hall B) and CSC310 (Lab 2)", day: "Tuesday", time: "10:00 - 12:00", severity: "high" },
  { id: "cf2", type: "room", description: "Hall A double-booked", details: "CSC301 and AI405", day: "Wednesday", time: "12:00 - 14:00", severity: "high" },
  { id: "cf3", type: "course", description: "Level 300 course overlap", details: "CSC301 and DBA301 share student group", day: "Monday", time: "14:00 - 16:00", severity: "medium" },
];

export const users: User[] = [
  { id: "u1", username: "admin", email: "admin@uni.edu", role: "Admin" },
  { id: "u2", username: "a.okonkwo", email: "a.okonkwo@uni.edu", role: "Lecturer" },
  { id: "u3", username: "t.bakare", email: "t.bakare@uni.edu", role: "Lecturer" },
  { id: "u4", username: "m.eze", email: "m.eze@uni.edu", role: "Lecturer" },
];

export const recentActivity = [
  { id: 1, action: "Generated timetable", user: "Admin", time: "2 min ago", icon: "Sparkles" },
  { id: 2, action: "Resolved lecturer conflict", user: "Admin", time: "15 min ago", icon: "CheckCircle2" },
  { id: 3, action: "Added course CSC410", user: "Admin", time: "1 hour ago", icon: "BookPlus" },
  { id: 4, action: "Updated lecturer availability", user: "Dr. Eze", time: "3 hours ago", icon: "UserCheck" },
  { id: 5, action: "Exported Friday schedule", user: "Admin", time: "Yesterday", icon: "Download" },
];
