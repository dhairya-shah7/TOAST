import fs from "fs";
import path from "path";
import crypto from "crypto";

export type UserRole = "STUDENT" | "FACULTY" | "HOD" | "ADMIN";

export interface UniversityUser {
  id: string;
  institutionalId: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  program?: string;
  semester?: number;
  section?: string;
  cgpa?: number;
  xp: number;
  level: number;
  streakDays: number;
  avatarInitials: string;
}

export interface CourseModuleItem {
  id: string;
  title: string;
  type: "PDF" | "SLIDES" | "VIDEO" | "LAB_SPEC" | "NOTES";
  sizeMb: number;
  pages?: number;
  coTag: string;
  completed: boolean;
  offlinePinned: boolean;
  summary: string;
}

export interface CourseModule {
  id: string;
  number: number;
  title: string;
  items: CourseModuleItem[];
}

export interface CourseOffering {
  id: string;
  code: string;
  title: string;
  credits: number;
  instructor: string;
  room: string;
  section: string;
  attendedClasses: number;
  totalClasses: number;
  minAttendancePct: number;
  nextClassTime: string;
  currentGrade: string;
  gradePoints: number;
  coAttainmentPct: number;
  modules: CourseModule[];
}

export interface SmartDeadline {
  id: string;
  courseCode: string;
  courseTitle: string;
  title: string;
  type: "ASSIGNMENT" | "LAB_RECORD" | "QUIZ" | "PROJECT_M1";
  dueAt: string;
  hoursRemaining: number;
  maxMarks: number;
  weightagePct: number;
  maxFileSizeMb: number;
  progressPct: number;
  status: "PENDING" | "SUBMITTED" | "GRADED";
  submittedFileName?: string;
  submittedSizeMb?: number;
  compressedFromMb?: number;
  submittedAt?: string;
  marksAwarded?: number;
  feedback?: string;
  suggestedMilestones: string[];
  coTag: string;
}

export interface LiveAttendanceSession {
  id: string;
  courseCode: string;
  courseTitle: string;
  section: string;
  room: string;
  instructorName: string;
  active: boolean;
  pinCode: string;
  hmacToken: string;
  startedAt: string;
  expiresAt: string;
  checkedInStudentIds: string[];
  totalEnrolled: number;
}

export interface VivaSlot {
  id: string;
  courseCode: string;
  title: string;
  evaluator: string;
  room: string;
  timeRange: string;
  dateLabel: string;
  bookedByStudentId: string | null;
  bookedByStudentName: string | null;
}

export interface DynamicRule {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  enabled: boolean;
  executionsCount: number;
  lastTriggered: string;
}

export interface CompressionJobRecord {
  id: string;
  originalName: string;
  format: "PDF" | "DOCX";
  originalSizeBytes: number;
  compressedSizeBytes: number;
  reductionPct: number;
  preset: "BALANCED" | "MAX_COMPRESSION" | "HIGH_QUALITY";
  targetMb: number;
  durationMs: number;
  createdAt: string;
  attachedToDeadlineId?: string;
}

export interface AtRiskStudentRecord {
  id: string;
  institutionalId: string;
  name: string;
  section: string;
  attendancePct: number;
  missedDeadlines: number;
  cgpa: number;
  riskLevel: "CRITICAL" | "MODERATE";
  advisorName: string;
  flaggedReason: string;
}

export interface UniversityState {
  universityName: string;
  campusName: string;
  activeSemester: string;
  serverMetrics: {
    concurrentUsersOnline: number;
    activePgConnections: number;
    pgBouncerPooledConnections: number;
    redisHitRatePct: number;
    compressorQueueDepth: number;
    avgApiLatencyMs: number;
  };
  users: UniversityUser[];
  courses: CourseOffering[];
  deadlines: SmartDeadline[];
  liveAttendance: LiveAttendanceSession;
  vivaSlots: VivaSlot[];
  dynamicRules: DynamicRule[];
  compressionHistory: CompressionJobRecord[];
  atRiskStudents: AtRiskStudentRecord[];
  announcements: {
    id: string;
    title: string;
    department: string;
    author: string;
    createdAt: string;
    priority: "HIGH" | "NORMAL";
  }[];
}

const DATA_DIR = path.join(process.cwd(), ".toast-data");
const DB_FILE = path.join(DATA_DIR, "university-db.json");

function createInitialState(): UniversityState {
  return {
    universityName: "Institute of Technology & Sciences",
    campusName: "Main Academic Campus • School of Computer Science & Engineering",
    activeSemester: "Fall 2026–27 • Odd Semester (Sem 5)",
    serverMetrics: {
      concurrentUsersOnline: 6420,
      activePgConnections: 84,
      pgBouncerPooledConnections: 6420,
      redisHitRatePct: 98.4,
      compressorQueueDepth: 3,
      avgApiLatencyMs: 11,
    },
    users: [
      {
        id: "usr-student-1",
        institutionalId: "24BCE1042",
        name: "Dhairya Shah",
        email: "dhairya.shah@uni.edu",
        role: "STUDENT",
        department: "Computer Science & Engineering",
        program: "B.Tech CSE (2024–2028)",
        semester: 5,
        section: "CSE-5A",
        cgpa: 8.84,
        xp: 2450,
        level: 7,
        streakDays: 12,
        avatarInitials: "DS",
      },
      {
        id: "usr-faculty-1",
        institutionalId: "FAC-CSE-018",
        name: "Dr. Arindam Sharma",
        email: "arindam.sharma@uni.edu",
        role: "FACULTY",
        department: "Computer Science & Engineering",
        xp: 8900,
        level: 15,
        streakDays: 45,
        avatarInitials: "AS",
      },
      {
        id: "usr-hod-1",
        institutionalId: "HOD-CSE-001",
        name: "Prof. Meenakshi Iyer",
        email: "hod.cse@uni.edu",
        role: "HOD",
        department: "Computer Science & Engineering",
        xp: 12000,
        level: 20,
        streakDays: 60,
        avatarInitials: "MI",
      },
      {
        id: "usr-admin-1",
        institutionalId: "ADM-UNI-001",
        name: "Vikramaditya Rao",
        email: "sysadmin@uni.edu",
        role: "ADMIN",
        department: "University Directorate of IT & Servers",
        xp: 15000,
        level: 25,
        streakDays: 90,
        avatarInitials: "VR",
      },
    ],
    courses: [
      {
        id: "crs-cs301",
        code: "CS-301",
        title: "Compiler Design & Program Translation",
        credits: 4,
        instructor: "Dr. Arindam Sharma",
        room: "LH-204 (Academic Block B)",
        section: "CSE-5A",
        attendedClasses: 28,
        totalClasses: 32,
        minAttendancePct: 75,
        nextClassTime: "10:00 AM – 11:00 AM",
        currentGrade: "A+",
        gradePoints: 9.5,
        coAttainmentPct: 89,
        modules: [
          {
            id: "mod-cs301-1",
            number: 1,
            title: "Lexical Analysis, Finite Automata & Regular Expressions",
            items: [
              {
                id: "itm-101",
                title: "Module 1 Lecture Notes — DFA Minimization & Flex Specifications.pdf",
                type: "PDF",
                sizeMb: 1.8,
                pages: 42,
                coTag: "CO1",
                completed: true,
                offlinePinned: true,
                summary:
                  "Covers lexical tokenization, input buffering with sentinels, Thompson's construction (NFA from RegEx), subset construction (NFA to DFA), and Hopcroft's state minimization algorithm.",
              },
              {
                id: "itm-102",
                title: "Lab 1 Specification — Building a C Subset Scanner in Flex.pdf",
                type: "LAB_SPEC",
                sizeMb: 0.9,
                pages: 12,
                coTag: "CO1",
                completed: true,
                offlinePinned: true,
                summary:
                  "Step-by-step specification for tokenizing identifiers, numeric literals, comments, and operators with line/column tracking.",
              },
            ],
          },
          {
            id: "mod-cs301-2",
            number: 2,
            title: "Top-Down & Bottom-Up Syntax Analysis (LL(1), SLR, LR(1), LALR)",
            items: [
              {
                id: "itm-201",
                title: "Module 2 Slides — FIRST/FOLLOW Sets, LL(1) Tables & Shift-Reduce Conflicts.pdf",
                type: "SLIDES",
                sizeMb: 3.4,
                pages: 64,
                coTag: "CO2",
                completed: true,
                offlinePinned: true,
                summary:
                  "Formal rules for eliminating left recursion, computing FIRST and FOLLOW sets, constructing predictive LL(1) parsing tables, and resolving shift/reduce conflicts in LR(1) and LALR(1) parsers.",
              },
              {
                id: "itm-202",
                title: "Module 3 Handout — Syntax-Directed Translation & Three-Address Code (TAC).pdf",
                type: "PDF",
                sizeMb: 2.1,
                pages: 38,
                coTag: "CO3",
                completed: false,
                offlinePinned: false,
                summary:
                  "S-attributed vs L-attributed definitions, dependency graphs, quadruples, triples, and SSA intermediate representation.",
              },
            ],
          },
        ],
      },
      {
        id: "crs-cs302",
        code: "CS-302",
        title: "Operating Systems & Kernel Internals",
        credits: 4,
        instructor: "Prof. Siddharth Verma",
        room: "LH-102 (Academic Block A)",
        section: "CSE-5A",
        attendedClasses: 25,
        totalClasses: 31,
        minAttendancePct: 75,
        nextClassTime: "12:00 PM – 01:00 PM",
        currentGrade: "A",
        gradePoints: 9.0,
        coAttainmentPct: 84,
        modules: [
          {
            id: "mod-cs302-1",
            number: 1,
            title: "Process Scheduling, Concurrency, Mutexes & Deadlock Avoidance",
            items: [
              {
                id: "itm-301",
                title: "OS Kernel Notes — CFS Scheduler, Semaphores & Banker's Algorithm.pdf",
                type: "PDF",
                sizeMb: 2.6,
                pages: 54,
                coTag: "CO2",
                completed: true,
                offlinePinned: true,
                summary:
                  "Covers POSIX threads, Peterson's solution, hardware atomic instructions (CAS), reader-writer locks, dining philosophers, and Banker's safety algorithm.",
              },
            ],
          },
          {
            id: "mod-cs302-2",
            number: 2,
            title: "Virtual Memory, Multi-Level Page Tables & Page Replacement",
            items: [
              {
                id: "itm-302",
                title: "Virtual Memory Deep Dive — TLB, Copy-on-Write & Belady's Anomaly.pdf",
                type: "PDF",
                sizeMb: 1.9,
                pages: 40,
                coTag: "CO3",
                completed: false,
                offlinePinned: false,
                summary:
                  "x86-64 4-level paging, TLB shootdowns, demand paging, thrashing, working-set model, and LRU clock replacement.",
              },
            ],
          },
        ],
      },
      {
        id: "crs-cs303",
        code: "CS-303",
        title: "Computer Networks & Distributed Protocols",
        credits: 3,
        instructor: "Dr. Kavita Nair",
        room: "LH-301 (Academic Block C)",
        section: "CSE-5A",
        attendedClasses: 21,
        totalClasses: 28,
        minAttendancePct: 75,
        nextClassTime: "02:00 PM – 03:00 PM",
        currentGrade: "A",
        gradePoints: 8.5,
        coAttainmentPct: 81,
        modules: [
          {
            id: "mod-cs303-1",
            number: 1,
            title: "Transport Layer: TCP Congestion Control (Tahoe, Reno, CUBIC, BBR)",
            items: [
              {
                id: "itm-401",
                title: "TCP State Machine, Flow Control & Congestion Window Analysis.pdf",
                type: "PDF",
                sizeMb: 1.5,
                pages: 35,
                coTag: "CO3",
                completed: true,
                offlinePinned: false,
                summary:
                  "3-way handshake, slow start, congestion avoidance, fast retransmit, fast recovery, and Wireshark packet trace analysis.",
              },
            ],
          },
        ],
      },
      {
        id: "crs-cs304",
        code: "CS-304",
        title: "Information & Applied Cyber Security",
        credits: 3,
        instructor: "Prof. Rakesh Menon",
        room: "Cyber Lab 4 (Innovation Wing)",
        section: "CSE-5A",
        attendedClasses: 26,
        totalClasses: 28,
        minAttendancePct: 75,
        nextClassTime: "03:30 PM – 04:30 PM",
        currentGrade: "O",
        gradePoints: 10.0,
        coAttainmentPct: 93,
        modules: [
          {
            id: "mod-cs304-1",
            number: 1,
            title: "Modern Cryptography, TLS 1.3 Handshake & Zero-Trust Auth",
            items: [
              {
                id: "itm-501",
                title: "AES-GCM, ECDHE Key Exchange, OIDC & SAML 2.0 Security Architecture.pdf",
                type: "PDF",
                sizeMb: 2.2,
                pages: 48,
                coTag: "CO4",
                completed: true,
                offlinePinned: true,
                summary:
                  "Authenticated encryption, forward secrecy in TLS 1.3, X.509 certificate chains, OAuth2 PKCE, and CSRF/XSS mitigation.",
              },
            ],
          },
        ],
      },
    ],
    deadlines: [
      {
        id: "dl-101",
        courseCode: "CS-301",
        courseTitle: "Compiler Design & Program Translation",
        title: "Assignment 3: LALR(1) Parser Generator & AST Visualizer Report",
        type: "ASSIGNMENT",
        dueAt: "Tomorrow, 11:59 PM",
        hoursRemaining: 28,
        maxMarks: 25,
        weightagePct: 15,
        maxFileSizeMb: 2.0,
        progressPct: 65,
        status: "PENDING",
        coTag: "CO2",
        suggestedMilestones: [
          "Complete conflict resolution table for dangling-else grammar (Today)",
          "Export AST visualization screenshots & compress PDF under 2.0 MB",
          "Submit final report before Tomorrow 11:59 PM",
        ],
      },
      {
        id: "dl-102",
        courseCode: "CS-302",
        courseTitle: "Operating Systems & Kernel Internals",
        title: "Lab 5 Record: Multithreaded Banker's Algorithm & Deadlock Detector in C",
        type: "LAB_RECORD",
        dueAt: "Thursday, 05:00 PM",
        hoursRemaining: 68,
        maxMarks: 20,
        weightagePct: 10,
        maxFileSizeMb: 2.0,
        progressPct: 35,
        status: "PENDING",
        coTag: "CO2",
        suggestedMilestones: [
          "Verify pthread mutex lock ordering under 50 concurrent threads",
          "Attach Valgrind / Helgrind race-free output log",
          "Compress lab record DOCX/PDF and submit",
        ],
      },
      {
        id: "dl-103",
        courseCode: "CS-304",
        courseTitle: "Information & Applied Cyber Security",
        title: "Audit Report: Campus SSO & TLS 1.3 Packet Capture Analysis",
        type: "PROJECT_M1",
        dueAt: "Saturday, 11:59 PM",
        hoursRemaining: 118,
        maxMarks: 30,
        weightagePct: 20,
        maxFileSizeMb: 2.0,
        progressPct: 80,
        status: "PENDING",
        coTag: "CO4",
        suggestedMilestones: [
          "Annotate ClientHello / ServerHello cipher suite negotiation",
          "Run TOAST PDF Compressor to shrink Wireshark screenshot PDF (<2 MB)",
        ],
      },
      {
        id: "dl-104",
        courseCode: "CS-301",
        courseTitle: "Compiler Design & Program Translation",
        title: "Assignment 2: Lexical Analyzer & Regular Expression to Minimal DFA",
        type: "ASSIGNMENT",
        dueAt: "Completed Last Week",
        hoursRemaining: 0,
        maxMarks: 20,
        weightagePct: 10,
        maxFileSizeMb: 2.0,
        progressPct: 100,
        status: "GRADED",
        submittedFileName: "24BCE1042_CS301_Lexical_Analyzer_Compressed.pdf",
        submittedSizeMb: 1.42,
        compressedFromMb: 9.85,
        submittedAt: "Sep 26, 2026 • 09:41 PM (On Time)",
        marksAwarded: 19,
        feedback:
          "Excellent Hopcroft DFA minimization proof and clean Flex scanner implementation.",
        coTag: "CO1",
        suggestedMilestones: ["Completed & Graded"],
      },
    ],
    liveAttendance: {
      id: "att-live-cs301",
      courseCode: "CS-301",
      courseTitle: "Compiler Design & Program Translation",
      section: "CSE-5A",
      room: "LH-204",
      instructorName: "Dr. Arindam Sharma",
      active: true,
      pinCode: "482915",
      hmacToken: "TOAST-HMAC-CS301-LIVE-98A4F",
      startedAt: "10:00 AM",
      expiresAt: "10:15 AM",
      checkedInStudentIds: ["usr-student-demo-a", "usr-student-demo-b"],
      totalEnrolled: 64,
    },
    vivaSlots: [
      {
        id: "viva-1",
        courseCode: "CS-301P",
        title: "Compiler Lab Mid-Sem Viva & Code Walkthrough",
        evaluator: "Dr. Arindam Sharma",
        room: "Programming Lab 4 • Cabin 2",
        dateLabel: "Friday, Oct 8",
        timeRange: "02:30 PM – 02:45 PM",
        bookedByStudentId: "usr-other-1",
        bookedByStudentName: "Aarav Mehta (24BCE1011)",
      },
      {
        id: "viva-2",
        courseCode: "CS-301P",
        title: "Compiler Lab Mid-Sem Viva & Code Walkthrough",
        evaluator: "Dr. Arindam Sharma",
        room: "Programming Lab 4 • Cabin 2",
        dateLabel: "Friday, Oct 8",
        timeRange: "02:45 PM – 03:00 PM",
        bookedByStudentId: null,
        bookedByStudentName: null,
      },
      {
        id: "viva-3",
        courseCode: "CS-301P",
        title: "Compiler Lab Mid-Sem Viva & Code Walkthrough",
        evaluator: "Dr. Arindam Sharma",
        room: "Programming Lab 4 • Cabin 2",
        dateLabel: "Friday, Oct 8",
        timeRange: "03:00 PM – 03:15 PM",
        bookedByStudentId: "usr-student-1",
        bookedByStudentName: "Dhairya Shah (24BCE1042)",
      },
      {
        id: "viva-4",
        courseCode: "CS-302P",
        title: "OS Kernel Lab Evaluation — Pthreads & Synchronization",
        evaluator: "Prof. Siddharth Verma",
        room: "Systems Lab 2",
        dateLabel: "Monday, Oct 11",
        timeRange: "03:30 PM – 03:45 PM",
        bookedByStudentId: null,
        bookedByStudentName: null,
      },
    ],
    dynamicRules: [
      {
        id: "rule-1",
        name: "Attendance < 75% Early Intervention & HoD Alert",
        trigger: "WHEN Attendance Session Closes",
        condition: "IF Student Course Attendance < 75.0% after Week 4",
        action:
          "THEN Alert Student + Notify Faculty Advisor + Add to HoD At-Risk Watchlist",
        enabled: true,
        executionsCount: 142,
        lastTriggered: "Today, 10:12 AM",
      },
      {
        id: "rule-2",
        name: "Oversized Submission Auto-Compression Pipeline",
        trigger: "WHEN Assignment File Uploaded > 2.0 MB",
        condition: "IF Format IN (PDF, DOCX) AND Auto-Compress Enabled",
        action:
          "THEN Lock Upload Timestamp + Enqueue Ghostscript/OOXML Worker (< 2 MB) + Attach",
        enabled: true,
        executionsCount: 1894,
        lastTriggered: "Today, 09:58 AM",
      },
      {
        id: "rule-3",
        name: "Semester 5 Batch Auto-Enrollment & Cohort Sync",
        trigger: "WHEN Student Promoted to Semester 5 (B.Tech CSE)",
        condition: "IF Prerequisites (CS-201 Data Structures) = PASSED",
        action:
          "THEN Auto-Enroll in CS-301, CS-302, CS-303, CS-304 + Assign Section Cohort",
        enabled: true,
        executionsCount: 480,
        lastTriggered: "Aug 1, 2026",
      },
      {
        id: "rule-4",
        name: "Course Mastery Verifiable QR Certificate & +200 XP",
        trigger: "WHEN Course Final Grade Published",
        condition: "IF Grade >= 85% AND All Modules Completed",
        action:
          "THEN Issue Cryptographic QR-Verified PDF Certificate + Award +200 Alien Run XP",
        enabled: true,
        executionsCount: 318,
        lastTriggered: "Yesterday, 06:30 PM",
      },
    ],
    compressionHistory: [
      {
        id: "cmp-901",
        originalName: "24BCE1042_CS301_Lexical_Analyzer.pdf",
        format: "PDF",
        originalSizeBytes: 10328473,
        compressedSizeBytes: 1488977,
        reductionPct: 85.6,
        preset: "BALANCED",
        targetMb: 2.0,
        durationMs: 640,
        createdAt: "Sep 26, 2026 • 09:40 PM",
        attachedToDeadlineId: "dl-104",
      },
      {
        id: "cmp-902",
        originalName: "OS_Lab4_System_Calls_Screenshots.docx",
        format: "DOCX",
        originalSizeBytes: 7654604,
        compressedSizeBytes: 1184890,
        reductionPct: 84.5,
        preset: "BALANCED",
        targetMb: 2.0,
        durationMs: 490,
        createdAt: "Sep 29, 2026 • 04:15 PM",
      },
    ],
    atRiskStudents: [
      {
        id: "risk-1",
        institutionalId: "24BCE1089",
        name: "Rohan Deshmukh",
        section: "CSE-5A",
        attendancePct: 68.8,
        missedDeadlines: 2,
        cgpa: 7.12,
        riskLevel: "CRITICAL",
        advisorName: "Dr. Arindam Sharma",
        flaggedReason: "CS-301 Attendance below 75% threshold (Needs +3 consecutive classes)",
      },
      {
        id: "risk-2",
        institutionalId: "24BCE1104",
        name: "Sneha Kulkarni",
        section: "CSE-5A",
        attendancePct: 72.4,
        missedDeadlines: 1,
        cgpa: 7.85,
        riskLevel: "MODERATE",
        advisorName: "Dr. Arindam Sharma",
        flaggedReason: "CS-303 Attendance at 72.4% + Pending Lab 4 submission",
      },
      {
        id: "risk-3",
        institutionalId: "24BCE1152",
        name: "Karanveer Gill",
        section: "CSE-5B",
        attendancePct: 64.5,
        missedDeadlines: 3,
        cgpa: 6.54,
        riskLevel: "CRITICAL",
        advisorName: "Prof. Siddharth Verma",
        flaggedReason: "Debarment warning triggered by Dynamic Rule #1 across 2 courses",
      },
    ],
    announcements: [
      {
        id: "ann-1",
        title:
          "Mid-Semester Timed Online Quiz for CS-301 scheduled on Oct 12 (10:00 AM) in Lab Complex",
        department: "Department of CSE",
        author: "Dr. Arindam Sharma",
        createdAt: "2 hours ago",
        priority: "HIGH",
      },
      {
        id: "ann-2",
        title:
          "Viva Slot Booking is now OPEN for Compiler Design Lab (CS-301P) — Book before Thursday 5 PM",
        department: "Department of CSE",
        author: "Prof. Meenakshi Iyer (HoD)",
        createdAt: "Yesterday",
        priority: "NORMAL",
      },
    ],
  };
}

export function getUniversityState(): UniversityState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = createInitialState();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw) as UniversityState;
  } catch {
    return createInitialState();
  }
}

export function saveUniversityState(state: UniversityState): UniversityState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch {
    // Fallback gracefully if filesystem is read-only
  }
  return state;
}

export function rotateAttendanceSessionCode(state: UniversityState): UniversityState {
  const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
  const token =
    "TOAST-HMAC-CS301-" + crypto.randomBytes(3).toString("hex").toUpperCase();
  state.liveAttendance.pinCode = randomPin;
  state.liveAttendance.hmacToken = token;
  state.liveAttendance.active = true;
  return saveUniversityState(state);
}
