"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileArchive,
  FileText,
  Flame,
  LayoutDashboard,
  Lock,
  QrCode,
  RefreshCw,
  Search,
  Server,
  Sparkles,
  Trophy,
  Upload,
  Workflow,
  ArrowUpRight,
  Sun,
  Moon,
  Send,
  Zap,
  Check,
} from "lucide-react";
import type {
  UniversityState,
  UserRole,
  CourseOffering,
  SmartDeadline,
} from "@/lib/university-store";

type NavTab =
  | "DASHBOARD"
  | "COURSES"
  | "DEADLINES"
  | "COMPRESSOR"
  | "VIVA_SLOTS"
  | "LIVE_EXAM"
  | "GOVERNANCE"
  | "ALIEN_RUN";

export default function ToastUniversityOS() {
  const [state, setState] = useState<UniversityState | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>("STUDENT");
  const [activeTab, setActiveTab] = useState<NavTab>("DASHBOARD");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("crs-cs301");
  const [isDark, setIsDark] = useState<boolean>(false);

  // Command+K Search Modal
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Attendance PIN input
  const [attendancePinInput, setAttendancePinInput] = useState<string>("");
  const [attendanceFeedback, setAttendanceFeedback] = useState<string>("");

  // Compressor state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressPreset, setCompressPreset] = useState<
    "BALANCED" | "MAX_COMPRESSION" | "HIGH_QUALITY"
  >("BALANCED");
  const [targetMb, setTargetMb] = useState<number>(2.0);
  const [attachDeadlineId, setAttachDeadlineId] = useState<string>("dl-101");
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [lastCompressedMsg, setLastCompressedMsg] = useState<string>("");

  // AI Copilot state
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string>(
    "Select a prompt chip or ask anything about your enrolled Semester 5 courses (CS-301 Compiler Design, CS-302 OS, CS-303 Networks, CS-304 Cyber Security), your attendance safe-bunk margin, or upcoming deadlines."
  );
  const [aiCitations, setAiCitations] = useState<string[]>([
    "pgvector Course Index • 4 Enrolled Semester 5 Courses",
  ]);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Faculty New Assignment & Grading state
  const [newAssignTitle, setNewAssignTitle] = useState<string>("");
  const [newAssignCourse, setNewAssignCourse] = useState<string>("CS-301");
  const [gradeMarksInput, setGradeMarksInput] = useState<Record<string, string>>(
    {}
  );

  // Live Exam Demo state
  const [selectedExamAnswer, setSelectedExamAnswer] = useState<number | null>(1);
  const [examAutosaveStatus, setExamAutosaveStatus] = useState<string>(
    "Saved to Redis Hash exam:attempt:24BCE1042 in 2.4 ms"
  );

  const fetchUniversityState = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/university", { cache: "no-store" });
      const json = await res.json();
      if (json?.data) {
        setState(json.data);
      }
    } catch {
      // ignore transient network errors
    }
  }, []);

  useEffect(() => {
    fetchUniversityState();
    const interval = setInterval(fetchUniversityState, 4000);
    return () => clearInterval(interval);
  }, [fetchUniversityState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const mutateUniversity = async (
    action: string,
    payload: Record<string, unknown> = {}
  ) => {
    const res = await fetch("/api/v1/university", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    const json = await res.json();
    if (json?.data) {
      setState(json.data);
    }
    return json;
  };

  const handleAttendanceCheckIn = async (mode: "PIN" | "QR_AUTO") => {
    if (!state) return;
    const pinToUse =
      mode === "QR_AUTO"
        ? "QR_AUTO"
        : attendancePinInput || state.liveAttendance.pinCode;
    const res = await mutateUniversity("CHECK_IN_ATTENDANCE", {
      studentId: "usr-student-1",
      pinCode: pinToUse,
    });
    if (res.error) {
      setAttendanceFeedback(`⚠️ ${res.error}`);
    } else {
      setAttendanceFeedback(
        "✓ Checked in via Redis HMAC Verification (<2ms) • +15 Academic XP"
      );
    }
  };

  const handleRunCompressor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCompressing(true);
    setLastCompressedMsg("");
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("file", selectedFile);
      }
      formData.append("preset", compressPreset);
      formData.append("targetMb", String(targetMb));
      if (attachDeadlineId && attachDeadlineId !== "NONE") {
        formData.append("attachDeadlineId", attachDeadlineId);
      }
      const res = await fetch("/api/v1/compress", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json?.data) {
        setState(json.data);
        const origMb = (json.job.originalSizeBytes / (1024 * 1024)).toFixed(2);
        const compMb = (json.job.compressedSizeBytes / (1024 * 1024)).toFixed(2);
        setLastCompressedMsg(
          `Optimized ${json.job.originalName}: ${origMb} MB → ${compMb} MB (-${json.job.reductionPct}% in ${json.job.durationMs}ms)${
            attachDeadlineId !== "NONE"
              ? " & attached with locked timestamp!"
              : "!"
          }`
        );
      }
    } finally {
      setIsCompressing(false);
    }
  };

  const handleAskAi = async (customQuery?: string) => {
    const q = customQuery ?? aiPrompt;
    if (!q.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/v1/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const json = await res.json();
      if (json?.answer) {
        setAiResponse(json.answer);
        setAiCitations(json.citations || []);
      }
    } finally {
      setAiLoading(false);
    }
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm max-w-md w-full text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-white font-orbitron font-bold text-lg flex items-center justify-center mx-auto">
            T
          </div>
          <h1 className="font-orbitron text-base font-semibold text-zinc-950">
            INITIALIZING TOAST OS…
          </h1>
          <p className="font-mono text-xs text-zinc-500">
            Syncing University Cluster • Vengeance UI Daylight Kernel
          </p>
        </div>
      </div>
    );
  }

  const currentUser =
    state.users.find((u) => u.role === activeRole) || state.users[0];
  const studentUser =
    state.users.find((u) => u.role === "STUDENT") || state.users[0];

  const totalAttended = state.courses.reduce(
    (acc, c) => acc + c.attendedClasses,
    0
  );
  const totalConducted = state.courses.reduce(
    (acc, c) => acc + c.totalClasses,
    0
  );
  const overallAttendancePct = (
    (totalAttended / Math.max(1, totalConducted)) *
    100
  ).toFixed(1);
  const overallSafeBunkBuffer = Math.max(
    0,
    Math.floor(totalAttended / 0.75 - totalConducted)
  );
  const pendingDeadlines = state.deadlines.filter(
    (d) => d.status === "PENDING"
  );
  const isStudentCheckedIn =
    state.liveAttendance.checkedInStudentIds.includes("usr-student-1");
  const selectedCourse: CourseOffering =
    state.courses.find((c) => c.id === selectedCourseId) || state.courses[0];

  const borderCol = isDark ? "border-[#222226]" : "border-neutral-200/90";
  const divideCol = isDark ? "divide-[#222226]" : "divide-neutral-200/90";
  const bgMain = isDark
    ? "bg-[#050608] text-zinc-100"
    : "bg-[#FAFAFA] text-zinc-950";
  const cardSurface = isDark
    ? "bg-[#0A0B0E] border-[#222226] text-zinc-100"
    : "bg-white border-neutral-200/90 text-zinc-950";
  const mutedText = isDark ? "text-zinc-400" : "text-zinc-500";
  const motionIslandClass = isDark
    ? "vng-motion-island-dark vng-grid-dark border-white/[0.08]"
    : "vng-motion-island-light vng-grid-light border-white/85";
  const glassCardClass = isDark
    ? "vng-glass-card-dark border-white/[0.08] text-zinc-100"
    : "vng-glass-card-light border-white/95 text-zinc-950";

  return (
    <div className={`min-h-screen flex flex-col pb-24 ${bgMain} transition-colors`}>
      {/* =====================================================================
          1. VENGEANCE UI TOP ARCHITECTURAL TELEMETRY STRIP
      ===================================================================== */}
      <div className={`border-b ${borderCol} text-[11px] font-mono`}>
        <div
          className={`mx-auto max-w-[1520px] md:px-6 xl:px-12 md:border-x ${borderCol} py-2 px-4 flex flex-wrap items-center justify-between gap-2`}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              CLUSTER ONLINE
            </span>
            <span className="tabular-nums">
              <strong>
                {state.serverMetrics.concurrentUsersOnline.toLocaleString()}
              </strong>{" "}
              Active Users
            </span>
            <span className={mutedText}>/</span>
            <span className="hidden sm:inline tabular-nums">
              PgBouncer:{" "}
              <strong>
                {state.serverMetrics.pgBouncerPooledConnections.toLocaleString()}{" "}
                → {state.serverMetrics.activePgConnections} PG
              </strong>
            </span>
            <span className={`hidden md:inline ${mutedText}`}>/</span>
            <span className="hidden md:inline tabular-nums">
              Redis SWR:{" "}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {state.serverMetrics.redisHitRatePct}%
              </strong>{" "}
              ({state.serverMetrics.avgApiLatencyMs}ms)
            </span>
            <button
              onClick={() =>
                mutateUniversity("SIMULATE_TRAFFIC_SPIKE", {
                  mode:
                    state.serverMetrics.concurrentUsersOnline > 10000
                      ? "NORMAL"
                      : "EXAM_SPIKE",
                })
              }
              className="px-2.5 py-0.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-[10px] uppercase tracking-wider font-semibold transition"
            >
              {state.serverMetrics.concurrentUsersOnline > 10000
                ? "Reset Load (6.4k)"
                : "⚡ Simulate 18.4k Exam Spike"}
            </button>
          </div>

          {/* Multi-User Live Role Switcher */}
          <div className="flex items-center gap-1">
            <span className={`mr-1.5 uppercase tracking-wider text-[10px] ${mutedText}`}>
              Role View:
            </span>
            {(["STUDENT", "FACULTY", "HOD", "ADMIN"] as UserRole[]).map(
              (role) => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition ${
                    activeRole === role
                      ? isDark
                        ? "bg-white text-zinc-950 font-semibold shadow-xs"
                        : "bg-zinc-950 text-white font-semibold shadow-xs"
                      : `${mutedText} hover:text-current`
                  }`}
                >
                  {role === "HOD" ? "HoD / Dean" : role}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. VENGEANCE UI STICKY HEADER & INSET COMMAND+K BAR
      ===================================================================== */}
      <header
        className={`sticky top-0 isolate z-40 border-b ${borderCol} ${
          isDark ? "bg-[#050608]/90" : "bg-[#FAFAFA]/90"
        } backdrop-blur-md`}
      >
        <div
          className={`mx-auto max-w-[1520px] md:px-6 xl:px-12 md:border-x ${borderCol} py-3.5 px-4 flex items-center justify-between gap-4`}
        >
          {/* Brand Logo (Vengeance UI Geometric Wing + Orbitron Title) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("DASHBOARD")}
              className="flex items-center gap-2.5 text-left group"
            >
              <div
                className={`w-9 h-9 rounded-xl border ${borderCol} ${
                  isDark ? "bg-zinc-900" : "bg-white"
                } flex items-center justify-center shadow-2xs`}
              >
                <svg
                  viewBox="0 0 374 313"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 rotate-180 transition-transform duration-300 group-hover:scale-110"
                >
                  <path
                    d="M247 181L237.5 236.5L373.5 313L247 181Z"
                    fill="currentColor"
                  />
                  <path
                    d="M187.5 0L154 209L173.5 195L237.5 83L187.5 0Z"
                    fill="currentColor"
                  />
                  <path
                    d="M373.5 313L253.761 110.5L197.5 195L237.5 181L212.5 222L0 313H187.5L237.5 236.5L247 181L373.5 313Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-orbitron text-lg font-bold tracking-tight">
                    TOAST OS
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border border-zinc-300/80 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900">
                    SEM 05 • CSE-5A
                  </span>
                </div>
                <p className={`text-[11px] font-mono ${mutedText} hidden sm:block`}>
                  {state.universityName}
                </p>
              </div>
            </button>
          </div>

          {/* Vengeance UI Inset Search Button + Navigation Pills */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={`group flex h-9 w-[290px] items-center justify-between rounded-md border ${
                isDark
                  ? "border-white/10 bg-white/[0.035] hover:border-white/20 text-zinc-400"
                  : "border-zinc-950/10 bg-zinc-950/[0.03] hover:border-zinc-950/20 text-zinc-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
              } px-3 text-xs transition-colors`}
            >
              <span className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 opacity-70" />
                <span className="truncate">
                  Search courses, PDFs, deadlines…
                </span>
              </span>
              <kbd
                className={`ml-2 rounded border ${borderCol} ${
                  isDark ? "bg-white/[0.05]" : "bg-white"
                } px-1.5 py-0.5 font-mono text-[10px] leading-none shadow-2xs`}
              >
                ⌘ K
              </kbd>
            </button>

            <div className="flex items-center gap-1">
              {(
                [
                  { id: "DASHBOARD", label: "Command" },
                  { id: "COURSES", label: "Courses" },
                  { id: "DEADLINES", label: "Deadlines" },
                  { id: "COMPRESSOR", label: "Compressor <2MB" },
                  { id: "VIVA_SLOTS", label: "Viva Slots" },
                  { id: "LIVE_EXAM", label: "Live Exam" },
                  { id: "GOVERNANCE", label: "Rules & OBE" },
                  { id: "ALIEN_RUN", label: "Alien Run" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`h-8 px-3 rounded-full text-xs font-medium transition-colors ${
                    activeTab === item.id
                      ? isDark
                        ? "bg-white text-zinc-950 font-semibold"
                        : "bg-zinc-950 text-white font-semibold"
                      : `${mutedText} hover:text-current`
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right User Badge & Theme Toggle */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsDark(!isDark)}
              aria-label="Toggle Light/Dark Theme"
              className={`w-8 h-8 rounded-full border ${borderCol} flex items-center justify-center transition hover:scale-105 ${
                isDark ? "bg-zinc-900 text-amber-300" : "bg-white text-zinc-700"
              }`}
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <div
              className={`flex items-center gap-2 pl-2.5 border-l ${borderCol}`}
            >
              <div
                className={`w-8 h-8 rounded-full font-mono text-xs font-bold flex items-center justify-center ${
                  isDark
                    ? "bg-white text-zinc-950"
                    : "bg-zinc-950 text-white"
                }`}
              >
                {currentUser.avatarInitials}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold leading-none">
                  {currentUser.name}
                </div>
                <div className={`text-[10px] font-mono mt-0.5 ${mutedText}`}>
                  {currentUser.institutionalId} • {currentUser.role}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================================
          3. VENGEANCE UI HERO & KPI ARCHITECTURAL SPLIT SECTION
      ===================================================================== */}
      <section className={`border-b ${borderCol}`}>
        <div
          className={`mx-auto max-w-[1520px] md:px-6 xl:px-12 md:border-x ${borderCol}`}
        >
          <div
            className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x ${divideCol}`}
          >
            {/* Left 7 Cols: Role Command Headline & Quick Actions */}
            <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-md border border-neutral-300/80 dark:border-zinc-800 bg-neutral-100/80 dark:bg-zinc-900 px-3 py-1 text-xs font-mono">
                  <span className={mutedText}>Workspace</span>
                  <span>▲ {activeRole} OPERATING MODE</span>
                </div>

                <h1 className="font-orbitron font-semibold tracking-tight text-2xl sm:text-3xl lg:text-4xl leading-tight">
                  {activeRole === "STUDENT" && (
                    <>
                      Good morning, {currentUser.name.split(" ")[0]}.{" "}
                      <span className="bg-gradient-to-r from-zinc-500 via-zinc-800 to-zinc-500 dark:from-zinc-400 dark:via-zinc-100 dark:to-zinc-500 bg-clip-text text-transparent">
                        Academic Command.
                      </span>
                    </>
                  )}
                  {activeRole === "FACULTY" && (
                    <>
                      Faculty Studio —{" "}
                      <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
                        {currentUser.name}
                      </span>
                    </>
                  )}
                  {activeRole === "HOD" && (
                    <>
                      CSE Department Governance —{" "}
                      <span className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 bg-clip-text text-transparent">
                        {currentUser.name}
                      </span>
                    </>
                  )}
                  {activeRole === "ADMIN" && (
                    <>
                      University Server Matrix —{" "}
                      <span className="bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
                        {currentUser.name}
                      </span>
                    </>
                  )}
                </h1>

                <p className={`font-mono text-xs sm:text-sm ${mutedText} max-w-2xl`}>
                  {activeRole === "STUDENT" &&
                    "Live attendance check-in (<2ms Redis HMAC), Smart Deadline Priority Queue, <2.0 MB Server PDF/DOCX Compressor, and Course-Scoped AI RAG."}
                  {activeRole === "FACULTY" &&
                    "Project rotating classroom QR/PIN tokens, publish assignments, speed-grade student PDFs with rubrics, and manage viva evaluation slots."}
                  {activeRole === "HOD" &&
                    "Real-time CSE attendance compliance, automated Dynamic Rule #1 at-risk interventions, and NBA/NAAC CO-PO attainment tracking."}
                  {activeRole === "ADMIN" &&
                    "High-concurrency PgBouncer connection multiplexing, Redis exam answer buffers, MinIO object storage, and institutional workflow rules."}
                </p>
              </div>

              {/* Vengeance UI Tactile Pop Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {activeRole === "STUDENT" && (
                  <>
                    <button
                      onClick={() => handleAttendanceCheckIn("QR_AUTO")}
                      disabled={
                        isStudentCheckedIn || !state.liveAttendance.active
                      }
                      className={`h-10 px-5 rounded-md font-medium text-xs sm:text-sm inline-flex items-center gap-2 transition active:scale-[0.98] ${
                        isStudentCheckedIn
                          ? "bg-emerald-600 text-white"
                          : isDark
                          ? "bg-white text-zinc-950 hover:bg-zinc-200"
                          : "bg-zinc-950 text-white hover:bg-zinc-800"
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      {isStudentCheckedIn
                        ? "Checked In: CS-301 (LH-204)"
                        : `1-Click Check-In • CS-301 (PIN ${state.liveAttendance.pinCode})`}
                    </button>

                    <button
                      onClick={() => setActiveTab("COMPRESSOR")}
                      className="vng-pop-btn h-10 px-5 rounded-md bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 font-semibold text-xs sm:text-sm inline-flex items-center gap-2"
                    >
                      <FileArchive className="w-4 h-4 text-rose-500" />
                      Compress PDF/DOCX &lt; 2MB
                    </button>
                  </>
                )}

                {activeRole === "FACULTY" && (
                  <>
                    <button
                      onClick={() => mutateUniversity("ROTATE_ATTENDANCE_PIN")}
                      className="h-10 px-5 rounded-md bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-medium text-xs sm:text-sm inline-flex items-center gap-2 active:scale-[0.98]"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Rotate Live PIN ({state.liveAttendance.pinCode})
                    </button>
                    <button
                      onClick={() =>
                        mutateUniversity("TOGGLE_ATTENDANCE_SESSION")
                      }
                      className="vng-pop-btn h-10 px-5 rounded-md bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 font-semibold text-xs sm:text-sm"
                    >
                      {state.liveAttendance.active
                        ? "Close Attendance Session"
                        : "Start Attendance Session"}
                    </button>
                  </>
                )}

                {(activeRole === "HOD" || activeRole === "ADMIN") && (
                  <button
                    onClick={() => setActiveTab("GOVERNANCE")}
                    className="h-10 px-5 rounded-md bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-medium text-xs sm:text-sm inline-flex items-center gap-2"
                  >
                    <Workflow className="w-4 h-4" />
                    Configure Dynamic Automation Rules
                  </button>
                )}
              </div>
            </div>

            {/* Right 5 Cols: Vengeance UI 2x2 Architectural Telemetry Grid */}
            <div className={`lg:col-span-5 grid grid-cols-2 divide-x divide-y ${divideCol}`}>
              <div className="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-[10px] uppercase tracking-widest ${mutedText}`}>
                    01 / Attendance
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    +{overallSafeBunkBuffer} Safe Buffer
                  </span>
                </div>
                <div className="mt-4">
                  <p className="font-orbitron text-2xl sm:text-3xl font-semibold tabular-nums">
                    {overallAttendancePct}%
                  </p>
                  <p className={`mt-1 text-xs font-mono ${mutedText}`}>
                    {totalAttended}/{totalConducted} Classes • Min 75.0%
                  </p>
                </div>
              </div>

              <div className="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-[10px] uppercase tracking-widest ${mutedText}`}>
                    02 / Deadlines
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400">
                    28h Next Due
                  </span>
                </div>
                <div className="mt-4">
                  <p className="font-orbitron text-2xl sm:text-3xl font-semibold tabular-nums">
                    0{pendingDeadlines.length}
                  </p>
                  <p className={`mt-1 text-xs font-mono ${mutedText}`}>
                    CS-301 LALR(1) Report
                  </p>
                </div>
              </div>

              <div className="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-[10px] uppercase tracking-widest ${mutedText}`}>
                    03 / Transcript
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400">
                    96/160 Cr
                  </span>
                </div>
                <div className="mt-4">
                  <p className="font-orbitron text-2xl sm:text-3xl font-semibold tabular-nums">
                    {studentUser.cgpa?.toFixed(2)}
                  </p>
                  <p className={`mt-1 text-xs font-mono ${mutedText}`}>
                    CGPA • Sem 5 SGPA 9.18
                  </p>
                </div>
              </div>

              <div className="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-[10px] uppercase tracking-widest ${mutedText}`}>
                    04 / Alien Run
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-violet-500/10 text-violet-700 dark:text-violet-400">
                    🔥 {studentUser.streakDays}d Streak
                  </span>
                </div>
                <div className="mt-4">
                  <p className="font-orbitron text-2xl sm:text-3xl font-semibold tabular-nums">
                    {studentUser.xp.toLocaleString()}
                  </p>
                  <p className={`mt-1 text-xs font-mono ${mutedText}`}>
                    Academic XP • Level 0{studentUser.level}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. VENGEANCE UI ISOMETRIC 3D COURSE STACK STRIP (iso-stack)
      ===================================================================== */}
      <section className={`border-b ${borderCol}`}>
        <div
          className={`mx-auto max-w-[1520px] md:px-6 xl:px-12 md:border-x ${borderCol}`}
        >
          <div className={`flex items-center justify-between px-6 py-3 border-b ${borderCol}`}>
            <span className="font-orbitron text-xs font-semibold uppercase tracking-wider">
              Enrolled Semester 05 Courses — Interactive 3D Folders
            </span>
            <span className={`font-mono text-[11px] ${mutedText}`}>
              Click any 3D folder to inspect syllabus modules &amp; OBE outcomes
            </span>
          </div>

          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x ${divideCol}`}
          >
            {state.courses.map((course) => {
              const attPct = (
                (course.attendedClasses / course.totalClasses) *
                100
              ).toFixed(1);
              const safeMargin = Math.max(
                0,
                Math.floor(course.attendedClasses / 0.75 - course.totalClasses)
              );
              const isSelected = selectedCourse.id === course.id;
              return (
                <div
                  key={course.id}
                  onClick={() => {
                    setSelectedCourseId(course.id);
                    setActiveTab("COURSES");
                  }}
                  className={`p-5 flex items-center gap-4 cursor-pointer transition-colors duration-200 ${
                    isSelected
                      ? isDark
                        ? "bg-white/[0.04]"
                        : "bg-zinc-100/80"
                      : "hover:bg-zinc-100/50 dark:hover:bg-white/[0.02]"
                  }`}
                >
                  {/* Authentic Vengeance UI Isometric 3D Folder SVG */}
                  <svg
                    viewBox="0 0 40 35"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="iso-stack w-16 h-14 shrink-0"
                  >
                    <g className="iso-stack-back">
                      <path
                        d="M38.6162 5.29118C38.8616 5.80954 39 6.38856 39 7.00016V30.0002C39 32.2093 37.2091 34.0001 35 34.0001H7C6.21257 34.0001 5.47933 33.771 4.86035 33.3781C2.68828 31.9994 1.5 29 1.5 29L3 29.8595V7.00016C3 4.79102 4.79086 3.00016 7 3.00016H34.6631L34.5 1.5C34.5 1.5 37.7407 3.44195 38.6162 5.29118Z"
                        className="fill-neutral-200 dark:fill-zinc-800 stroke-neutral-400 dark:stroke-zinc-600"
                      />
                      <path
                        d="M35.7144 25.5003L38.9286 28M35.7144 23.2188L39 26"
                        className="stroke-neutral-400 dark:stroke-zinc-600"
                      />
                    </g>
                    <g className="iso-stack-front">
                      <rect
                        x="0.5"
                        y="0.5"
                        width="35"
                        height="30"
                        rx="3.5"
                        className="fill-white dark:fill-zinc-950 stroke-neutral-400 dark:stroke-zinc-600"
                      />
                      <text
                        x="18"
                        y="19"
                        textAnchor="middle"
                        className="fill-zinc-950 dark:fill-white font-mono text-[8px] font-bold"
                      >
                        {course.code}
                      </text>
                    </g>
                  </svg>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-orbitron text-xs font-bold">
                        {course.code}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {attPct}% (+{safeMargin})
                      </span>
                    </div>
                    <p className="text-sm font-semibold truncate mt-0.5">
                      {course.title}
                    </p>
                    <p className={`text-[11px] font-mono truncate mt-0.5 ${mutedText}`}>
                      {course.nextClassTime} • {course.room.split(" ")[0]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. MAIN TAB WORKSPACE (VENGEANCE UI MOTION ISLANDS & BENTO GRIDS)
      ===================================================================== */}
      <main className={`border-b ${borderCol} flex-1`}>
        <div
          className={`mx-auto max-w-[1520px] md:px-6 xl:px-12 md:border-x ${borderCol}`}
        >
          {/* ROLE-SPECIFIC FACULTY / HOD STUDIO STRIP WHEN SELECTED */}
          {activeRole === "FACULTY" && (
            <div className={`p-6 border-b ${borderCol} space-y-5`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className={`font-mono text-[10px] uppercase tracking-widest ${mutedText}`}>
                    FACULTY TEACHING &amp; EVALUATION KERNEL
                  </p>
                  <h2 className="font-orbitron text-lg font-semibold mt-0.5">
                    Live Classroom Projector &amp; Rubric Speed-Grader
                  </h2>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    Projector PIN:{" "}
                    <strong className="text-blue-600 text-sm">
                      {state.liveAttendance.pinCode}
                    </strong>
                  </span>
                  <span className="px-3 py-1.5 rounded-lg border border-emerald-300/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    Present:{" "}
                    <strong>
                      {38 + state.liveAttendance.checkedInStudentIds.length}/
                      {state.liveAttendance.totalEnrolled}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Publish New Assignment */}
                <div className={`p-4 rounded-2xl border ${cardSurface} space-y-3`}>
                  <div className="font-orbitron text-xs font-semibold">
                    01 / Publish Assignment to Student Queue
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={newAssignCourse}
                      onChange={(e) => setNewAssignCourse(e.target.value)}
                      className={`px-3 py-2 rounded-lg border ${borderCol} bg-transparent text-xs font-mono`}
                    >
                      {state.courses.map((c) => (
                        <option key={c.id} value={c.code} className="text-black">
                          {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={newAssignTitle}
                      onChange={(e) => setNewAssignTitle(e.target.value)}
                      placeholder="e.g., Assignment 4: SSA & Register Allocation"
                      className={`sm:col-span-2 px-3 py-2 rounded-lg border ${borderCol} bg-transparent text-xs`}
                    />
                  </div>
                  <button
                    onClick={async () => {
                      if (!newAssignTitle.trim()) return;
                      await mutateUniversity("CREATE_ASSIGNMENT", {
                        courseCode: newAssignCourse,
                        title: newAssignTitle,
                        dueAt: "Next Monday, 11:59 PM",
                        maxMarks: 25,
                        coTag: "CO3",
                      });
                      setNewAssignTitle("");
                    }}
                    className="vng-pop-btn px-4 py-2 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold"
                  >
                    + Publish to Section CSE-5A
                  </button>
                </div>

                {/* Speed Grader */}
                <div className={`p-4 rounded-2xl border ${cardSurface} space-y-3`}>
                  <div className="font-orbitron text-xs font-semibold">
                    02 / Speed-Grader Submissions Queue
                  </div>
                  <div className="space-y-2">
                    {state.deadlines
                      .filter((d) => d.status !== "PENDING")
                      .map((dl) => (
                        <div
                          key={dl.id}
                          className={`p-3 rounded-xl border ${borderCol} flex flex-wrap items-center justify-between gap-2`}
                        >
                          <div>
                            <div className="text-xs font-semibold">
                              {dl.courseCode} • {dl.title}
                            </div>
                            <div className={`text-[11px] font-mono ${mutedText}`}>
                              {dl.submittedFileName} ({dl.submittedSizeMb} MB) •{" "}
                              <strong className="text-emerald-600">
                                {dl.status}
                                {dl.marksAwarded !== undefined
                                  ? ` (${dl.marksAwarded}/${dl.maxMarks})`
                                  : ""}
                              </strong>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder={`/${dl.maxMarks}`}
                              value={gradeMarksInput[dl.id] ?? ""}
                              onChange={(e) =>
                                setGradeMarksInput({
                                  ...gradeMarksInput,
                                  [dl.id]: e.target.value,
                                })
                              }
                              className={`w-16 px-2 py-1 text-xs font-mono border ${borderCol} rounded bg-transparent`}
                            />
                            <button
                              onClick={() =>
                                mutateUniversity("GRADE_SUBMISSION", {
                                  deadlineId: dl.id,
                                  marksAwarded:
                                    gradeMarksInput[dl.id] || dl.maxMarks,
                                })
                              }
                              className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-semibold"
                            >
                              Grade
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {(activeRole === "HOD" || activeRole === "ADMIN") && (
            <div className={`p-6 border-b ${borderCol} space-y-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-mono text-[10px] uppercase tracking-widest ${mutedText}`}>
                    DYNAMIC RULE #1 • EARLY-WARNING INTERVENTION ENGINE
                  </p>
                  <h2 className="font-orbitron text-lg font-semibold mt-0.5">
                    At-Risk Students Flagged (&lt; 75% Attendance or Missed Deadlines)
                  </h2>
                </div>
                <span className="font-mono text-xs px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20 font-semibold">
                  {state.atRiskStudents.length} Active Flags
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {state.atRiskStudents.map((st) => (
                  <div
                    key={st.id}
                    className={`p-4 rounded-2xl border ${cardSurface} space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold">
                        {st.institutionalId} • {st.name}
                      </span>
                      <span className="font-mono text-xs font-bold text-rose-600">
                        {st.attendancePct}% Att
                      </span>
                    </div>
                    <p className={`text-xs ${mutedText}`}>{st.flaggedReason}</p>
                    <div className="text-[11px] font-mono pt-1 border-t border-neutral-200/60 dark:border-zinc-800">
                      Advisor Notified: {st.advisorName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 1: COMMAND DASHBOARD — VENGEANCE UI 3-COLUMN MOTION ISLAND BENTO
          ================================================================= */}
          {activeTab === "DASHBOARD" && (
            <div className="relative">
              {/* Animated SVG Flow Network (Signature Vengeance UI Circuit Lines) */}
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-10 hidden h-full w-full overflow-visible text-sky-500/25 dark:text-cyan-400/20 xl:block"
                preserveAspectRatio="none"
                viewBox="0 0 300 200"
              >
                <g
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="0.45"
                  vectorEffect="non-scaling-stroke"
                >
                  <path d="M6 50 H82 C96 50 96 100 114 100 H150 C174 100 174 50 208 50 H294" />
                </g>
                <g fill="currentColor">
                  <circle r="1.4">
                    <animateMotion
                      begin="0s"
                      dur="7s"
                      path="M6 50 H82 C96 50 96 100 114 100 H150 C174 100 174 50 208 50 H294"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle r="1.4">
                    <animateMotion
                      begin="-3.5s"
                      dur="7s"
                      path="M6 50 H82 C96 50 96 100 114 100 H150 C174 100 174 50 208 50 H294"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              </svg>

              <div
                className={`grid grid-cols-1 xl:grid-cols-3 divide-y xl:divide-y-0 xl:divide-x ${divideCol}`}
              >
                {/* -----------------------------------------------------------
                    ISLAND 01/03: LIVE ATTENDANCE & TIMETABLE MOTION ISLAND
                ----------------------------------------------------------- */}
                <div className="p-5 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex w-7 h-7 items-center justify-center rounded-md border ${borderCol}`}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-orbitron text-sm font-medium">
                          Attendance &amp; Timetable
                        </p>
                        <p className={`text-[11px] ${mutedText}`}>
                          Rotating HMAC PIN + Live Schedule
                        </p>
                      </div>
                    </div>
                    <span className={`font-mono text-[10px] ${mutedText}`}>
                      01/03
                    </span>
                  </div>

                  {/* Vengeance UI Rounded Motion Island */}
                  <div
                    className={`relative rounded-[2.2rem] border p-4 overflow-hidden ${motionIslandClass} space-y-3`}
                  >
                    <div
                      className="pointer-events-none absolute inset-0 rounded-[2.2rem] bg-[radial-gradient(circle_at_85%_0%,rgba(56,189,248,0.22),transparent_38%),radial-gradient(circle_at_0%_80%,rgba(16,185,129,0.18),transparent_38%)]"
                    />

                    {/* Floating Glass Live Session Card */}
                    <div
                      className={`relative z-10 rounded-[1.35rem] border p-4 ${glassCardClass} space-y-3`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          LIVE SESSION • {state.liveAttendance.room}
                        </span>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                          PIN: {state.liveAttendance.pinCode}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-semibold text-sm">
                          {state.liveAttendance.courseCode} —{" "}
                          {state.liveAttendance.courseTitle}
                        </h3>
                        <p className={`text-[11px] font-mono mt-0.5 ${mutedText}`}>
                          {state.liveAttendance.instructorName} •{" "}
                          {state.liveAttendance.hmacToken}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={attendancePinInput}
                          onChange={(e) =>
                            setAttendancePinInput(e.target.value)
                          }
                          placeholder={state.liveAttendance.pinCode}
                          className={`w-24 px-2.5 py-1.5 rounded-lg border ${borderCol} bg-transparent font-mono text-xs text-center`}
                        />
                        <button
                          onClick={() => handleAttendanceCheckIn("PIN")}
                          disabled={isStudentCheckedIn}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-semibold transition ${
                            isStudentCheckedIn
                              ? "bg-emerald-600 text-white"
                              : "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90"
                          }`}
                        >
                          {isStudentCheckedIn
                            ? "✓ PRESENT LOGGED"
                            : "VERIFY PIN"}
                        </button>
                      </div>

                      {attendanceFeedback && (
                        <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                          {attendanceFeedback}
                        </p>
                      )}
                    </div>

                    {/* Today's Classes Stack */}
                    <div className="relative z-10 space-y-2">
                      {state.courses.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCourseId(c.id);
                            setActiveTab("COURSES");
                          }}
                          className={`rounded-xl border p-3 cursor-pointer transition hover:-translate-y-0.5 ${glassCardClass} flex items-center justify-between gap-2`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-bold">
                                {c.code}
                              </span>
                              <span className="text-xs font-medium truncate">
                                {c.title}
                              </span>
                            </div>
                            <p className={`text-[10px] font-mono mt-0.5 ${mutedText}`}>
                              {c.nextClassTime} • {c.room}
                            </p>
                          </div>
                          <span className="font-mono text-[11px] font-semibold text-emerald-600 shrink-0">
                            {((c.attendedClasses / c.totalClasses) * 100).toFixed(
                              0
                            )}
                            %
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* -----------------------------------------------------------
                    ISLAND 02/03: SMART DEADLINE & <2MB COMPRESSOR FORGE
                ----------------------------------------------------------- */}
                <div className="p-5 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex w-7 h-7 items-center justify-center rounded-md border ${borderCol}`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-orbitron text-sm font-medium">
                          Smart Deadline Forge
                        </p>
                        <p className={`text-[11px] ${mutedText}`}>
                          Priority Queue + &lt;2MB Auto-Compressor
                        </p>
                      </div>
                    </div>
                    <span className={`font-mono text-[10px] ${mutedText}`}>
                      02/03
                    </span>
                  </div>

                  <div
                    className={`relative rounded-[2.2rem] border p-4 overflow-hidden ${motionIslandClass} space-y-3`}
                  >
                    <div
                      className="pointer-events-none absolute inset-0 rounded-[2.2rem] bg-[radial-gradient(circle_at_80%_0%,rgba(251,113,133,0.22),transparent_36%),radial-gradient(circle_at_0%_75%,rgba(251,146,60,0.2),transparent_36%)]"
                    />

                    {state.deadlines.slice(0, 3).map((dl: SmartDeadline) => (
                      <div
                        key={dl.id}
                        className={`relative z-10 rounded-[1.35rem] border p-4 ${glassCardClass} space-y-2.5`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-zinc-300/80 dark:border-zinc-700">
                              {dl.courseCode} • {dl.coTag}
                            </span>
                            <h4 className="text-xs font-semibold mt-1.5 leading-snug">
                              {dl.title}
                            </h4>
                          </div>
                          <span
                            className={`font-mono text-[10px] px-2 py-0.5 rounded-full shrink-0 font-semibold ${
                              dl.status === "PENDING"
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            }`}
                          >
                            {dl.status === "PENDING" ? dl.dueAt : dl.status}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className={mutedText}>Milestone Progress</span>
                            <span className="font-bold">{dl.progressPct}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={dl.progressPct}
                            onChange={(e) =>
                              mutateUniversity("UPDATE_DEADLINE_PROGRESS", {
                                deadlineId: dl.id,
                                progressPct: Number(e.target.value),
                              })
                            }
                            className="w-full accent-zinc-950 dark:accent-white h-1.5 cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className={`font-mono text-[10px] ${mutedText}`}>
                            Max &lt;{dl.maxFileSizeMb.toFixed(1)} MB
                          </span>
                          {dl.status === "PENDING" ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setAttachDeadlineId(dl.id);
                                  setActiveTab("COMPRESSOR");
                                }}
                                className="px-2.5 py-1 rounded-full border border-zinc-300 dark:border-zinc-700 font-mono text-[10px] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                              >
                                Compress &lt;2MB
                              </button>
                              <button
                                onClick={() =>
                                  mutateUniversity("SUBMIT_ASSIGNMENT", {
                                    deadlineId: dl.id,
                                    fileName: `24BCE1042_${dl.courseCode}_Optimized.pdf`,
                                    sizeMb: 1.41,
                                  })
                                }
                                className="px-2.5 py-1 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-mono text-[10px] font-semibold"
                              >
                                Submit
                              </button>
                            </div>
                          ) : (
                            <span className="font-mono text-[10px] text-emerald-600">
                              ✓ {dl.submittedFileName}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* -----------------------------------------------------------
                    ISLAND 03/03: AI RAG MOTION KERNEL & CONIC ORBIT CORE
                ----------------------------------------------------------- */}
                <div className="p-5 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex w-7 h-7 items-center justify-center rounded-md border ${borderCol}`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-orbitron text-sm font-medium">
                          Course AI Kernel
                        </p>
                        <p className={`text-[11px] ${mutedText}`}>
                          Permission-Scoped RAG + Citations
                        </p>
                      </div>
                    </div>
                    <span className={`font-mono text-[10px] ${mutedText}`}>
                      03/03
                    </span>
                  </div>

                  <div
                    className={`relative rounded-[2.2rem] border p-4 overflow-hidden ${motionIslandClass} flex-1 flex flex-col justify-between gap-3`}
                  >
                    {/* Top Vengeance Generator Prompt Pill */}
                    <div
                      className={`relative z-10 flex h-10 items-center gap-2 rounded-full border px-3.5 ${glassCardClass}`}
                    >
                      <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAskAi()}
                        placeholder="Ask CS-301 / CS-302 course RAG…"
                        className="min-w-0 flex-1 bg-transparent font-mono text-xs outline-none"
                      />
                      <button
                        onClick={() => handleAskAi()}
                        className="flex w-7 h-7 items-center justify-center rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shrink-0"
                        title="Ask Course RAG"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick Prompt Chips */}
                    <div className="relative z-10 flex flex-wrap gap-1.5">
                      {[
                        {
                          label: "LR(1) Conflicts",
                          q: "Explain LR(1) shift-reduce conflicts from my CS-301 notes",
                        },
                        {
                          label: "Banker's Algorithm",
                          q: "Explain Banker's Algorithm from CS-302 OS notes",
                        },
                        {
                          label: "Safe-Bunk Margin",
                          q: "How is my attendance safe-bunk margin?",
                        },
                        {
                          label: "This Week's Deadlines",
                          q: "What deadlines do I have this week?",
                        },
                      ].map((chip) => (
                        <button
                          key={chip.label}
                          onClick={() => {
                            setAiPrompt(chip.q);
                            handleAskAi(chip.q);
                          }}
                          className={`px-2.5 py-1 rounded-full border font-mono text-[10px] transition hover:-translate-y-0.5 ${glassCardClass}`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>

                    {/* Vengeance UI Conic Ring Core Badge + Grounded Response */}
                    <div
                      className={`relative z-10 rounded-[1.35rem] border p-4 ${glassCardClass} space-y-3`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative flex w-10 h-10 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 shrink-0 overflow-hidden">
                          <div className="absolute inset-0 bg-[conic-gradient(from_145deg,transparent_0_20%,#93c5fd_36%,#a5b4fc_50%,#f9a8d4_64%,#fde68a_78%,transparent_90%)] animate-spin-slow opacity-85" />
                          <span className="relative flex w-8 h-8 items-center justify-center rounded-lg bg-zinc-950 text-white font-mono text-[9px] font-bold">
                            RAG
                          </span>
                        </div>
                        <div>
                          <div className="font-orbitron text-xs font-semibold">
                            Grounded Academic Answer
                          </div>
                          <div className={`font-mono text-[10px] ${mutedText}`}>
                            {aiLoading
                              ? "Searching pgvector HNSW index…"
                              : "Verified against Sem 5 Syllabus"}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto pr-1">
                        {aiResponse}
                      </div>

                      <div className="flex flex-wrap gap-1 pt-2 border-t border-zinc-200/70 dark:border-zinc-800">
                        {aiCitations.map((cit) => (
                          <span
                            key={cit}
                            className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900"
                          >
                            📄 {cit}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 2: COURSES & SYLLABUS TREE
          ================================================================= */}
          {activeTab === "COURSES" && (
            <div className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x ${divideCol}`}>
              <div className="lg:col-span-4 p-6 space-y-3">
                <p className="font-orbitron text-xs font-semibold uppercase">
                  Semester 05 Course Offerings
                </p>
                {state.courses.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCourseId(c.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition ${
                      selectedCourse.id === c.id
                        ? "border-zinc-950 dark:border-white bg-zinc-100/80 dark:bg-white/[0.06]"
                        : `${cardSurface}`
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="font-bold">{c.code}</span>
                      <span className="text-emerald-600">
                        {((c.attendedClasses / c.totalClasses) * 100).toFixed(1)}%
                        Att
                      </span>
                    </div>
                    <div className="font-semibold text-sm mt-1">{c.title}</div>
                    <div className={`text-xs font-mono mt-1 ${mutedText}`}>
                      {c.instructor} • {c.credits} Credits
                    </div>
                  </button>
                ))}
              </div>

              <div className="lg:col-span-8 p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700">
                      {selectedCourse.code} • OBE Attainment{" "}
                      {selectedCourse.coAttainmentPct}%
                    </span>
                    <h2 className="font-orbitron text-xl font-semibold mt-2">
                      {selectedCourse.title}
                    </h2>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedCourse.modules.map((mod) => (
                    <div
                      key={mod.id}
                      className={`rounded-2xl border ${cardSurface} overflow-hidden`}
                    >
                      <div
                        className={`px-4 py-3 border-b ${borderCol} flex items-center justify-between`}
                      >
                        <span className="font-orbitron text-xs font-semibold">
                          MODULE 0{mod.number} — {mod.title}
                        </span>
                        <span className={`font-mono text-[11px] ${mutedText}`}>
                          {mod.items.length} artifacts
                        </span>
                      </div>
                      <div className={`divide-y ${divideCol}`}>
                        {mod.items.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 shrink-0" />
                                <span className="text-sm font-semibold">
                                  {item.title}
                                </span>
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700">
                                  {item.coTag}
                                </span>
                              </div>
                              <p className={`text-xs pl-6 ${mutedText}`}>
                                {item.summary}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                mutateUniversity("TOGGLE_OFFLINE_PIN", {
                                  courseId: selectedCourse.id,
                                  itemId: item.id,
                                })
                              }
                              className={`vng-pop-btn px-3 py-1.5 rounded-lg font-mono text-xs font-semibold shrink-0 ${
                                item.offlinePinned
                                  ? "bg-emerald-600 text-white"
                                  : "bg-white dark:bg-zinc-900"
                              }`}
                            >
                              {item.offlinePinned
                                ? "✓ Pinned Offline"
                                : `Pin Offline (${item.sizeMb} MB)`}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 3: SMART DEADLINES FULL VIEW
          ================================================================= */}
          {activeTab === "DEADLINES" && (
            <div className="p-6 space-y-5">
              <div>
                <p className={`font-mono text-[10px] uppercase tracking-widest ${mutedText}`}>
                  URGENCY × CREDIT WEIGHT × MILESTONE ENGINE
                </p>
                <h2 className="font-orbitron text-xl font-semibold mt-1">
                  Smart Academic Deadlines
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {state.deadlines.map((dl) => (
                  <div
                    key={dl.id}
                    className={`rounded-3xl border p-5 ${cardSurface} space-y-4`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold">
                          {dl.courseCode} • {dl.coTag} ({dl.weightagePct}% Weight)
                        </span>
                        <h3 className="text-base font-bold mt-1">{dl.title}</h3>
                      </div>
                      <span className="font-mono text-xs px-2.5 py-1 rounded-full border border-zinc-300 dark:border-zinc-700">
                        {dl.status === "PENDING" ? dl.dueAt : dl.status}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {dl.suggestedMilestones.map((m, idx) => (
                        <div
                          key={idx}
                          className={`text-xs flex items-center gap-2 ${mutedText}`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 4: DOCUMENT COMPRESSOR (<2 MB)
          ================================================================= */}
          {activeTab === "COMPRESSOR" && (
            <div className={`grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x ${divideCol}`}>
              <div className="lg:col-span-7 p-6">
                <form onSubmit={handleRunCompressor} className="space-y-5">
                  <div>
                    <p className={`font-mono text-[10px] uppercase tracking-widest ${mutedText}`}>
                      ISOLATED GHOSTSCRIPT / QPDF / OOXML WORKER
                    </p>
                    <h2 className="font-orbitron text-xl font-semibold mt-1">
                      Document Compressor (&lt; 2.0 MB University Upload Target)
                    </h2>
                  </div>

                  <div
                    className={`rounded-[2rem] border p-6 text-center space-y-3 ${motionIslandClass}`}
                  >
                    <FileArchive className="w-9 h-9 mx-auto" />
                    <div className="text-sm font-semibold">
                      {selectedFile
                        ? `${selectedFile.name} (${(
                            selectedFile.size /
                            (1024 * 1024)
                          ).toFixed(2)} MB)`
                        : "Drop PDF or DOCX here (or click Compress to test with 11.3 MB Lab Report)"}
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={(e) =>
                        setSelectedFile(e.target.files?.[0] || null)
                      }
                      className="block mx-auto text-xs font-mono file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-950 file:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-mono text-[11px] mb-1">
                        Preset
                      </label>
                      <select
                        value={compressPreset}
                        onChange={(e) =>
                          setCompressPreset(
                            e.target.value as
                              | "BALANCED"
                              | "MAX_COMPRESSION"
                              | "HIGH_QUALITY"
                          )
                        }
                        className={`w-full px-3 py-2 rounded-lg border ${borderCol} bg-transparent text-xs font-mono`}
                      >
                        <option value="BALANCED" className="text-black">
                          Balanced (150 DPI)
                        </option>
                        <option value="MAX_COMPRESSION" className="text-black">
                          Max Compression (120 DPI)
                        </option>
                        <option value="HIGH_QUALITY" className="text-black">
                          High Quality (220 DPI)
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-[11px] mb-1">
                        Target Max Size (MB)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="10"
                        value={targetMb}
                        onChange={(e) => setTargetMb(Number(e.target.value))}
                        className={`w-full px-3 py-2 rounded-lg border ${borderCol} bg-transparent text-xs font-mono`}
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[11px] mb-1">
                        Attach to Deadline
                      </label>
                      <select
                        value={attachDeadlineId}
                        onChange={(e) => setAttachDeadlineId(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${borderCol} bg-transparent text-xs font-mono`}
                      >
                        <option value="NONE" className="text-black">
                          Download Only
                        </option>
                        {state.deadlines
                          .filter((d) => d.status === "PENDING")
                          .map((d) => (
                            <option
                              key={d.id}
                              value={d.id}
                              className="text-black"
                            >
                              {d.courseCode}: {d.title.slice(0, 24)}…
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isCompressing}
                    className="w-full py-3 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-orbitron text-xs font-semibold tracking-wider uppercase transition hover:opacity-90"
                  >
                    {isCompressing
                      ? "COMPRESSING IN WORKER CONTAINER…"
                      : "⚡ COMPRESS UNDER 2.0 MB & LOCK SUBMISSION TIMESTAMP"}
                  </button>

                  {lastCompressedMsg && (
                    <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 font-mono text-xs text-emerald-700 dark:text-emerald-300">
                      ✓ {lastCompressedMsg}
                    </div>
                  )}
                </form>
              </div>

              <div className="lg:col-span-5 p-6 space-y-4">
                <h3 className="font-orbitron text-sm font-semibold">
                  Compression Worker Ledger
                </h3>
                <div className="space-y-3">
                  {state.compressionHistory.map((job) => (
                    <div
                      key={job.id}
                      className={`p-4 rounded-2xl border ${cardSurface} space-y-1`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold truncate">
                          {job.originalName}
                        </span>
                        <span className="font-mono text-xs font-bold text-emerald-600">
                          -{job.reductionPct}%
                        </span>
                      </div>
                      <p className={`font-mono text-[11px] ${mutedText}`}>
                        {(job.originalSizeBytes / (1024 * 1024)).toFixed(2)} MB →{" "}
                        <strong>
                          {(job.compressedSizeBytes / (1024 * 1024)).toFixed(2)}{" "}
                          MB
                        </strong>{" "}
                        • {job.durationMs}ms
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 5: VIVA & LAB SLOT BOOKING
          ================================================================= */}
          {activeTab === "VIVA_SLOTS" && (
            <div className="p-6 space-y-5">
              <div>
                <p className={`font-mono text-[10px] uppercase tracking-widest ${mutedText}`}>
                  REDIS DISTRIBUTED LOCK SLOT SCHEDULER
                </p>
                <h2 className="font-orbitron text-xl font-semibold mt-1">
                  Project Viva &amp; Lab Evaluation Slots
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.vivaSlots.map((slot) => {
                  const isMine = slot.bookedByStudentId === "usr-student-1";
                  const isTaken = slot.bookedByStudentId !== null && !isMine;
                  return (
                    <div
                      key={slot.id}
                      className={`p-5 rounded-2xl border ${cardSurface} flex flex-col justify-between gap-4`}
                    >
                      <div>
                        <div className="flex items-center justify-between font-mono text-xs">
                          <span className="font-bold">{slot.courseCode}</span>
                          <span>
                            {slot.dateLabel} • {slot.timeRange}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold mt-1.5">
                          {slot.title}
                        </h3>
                        <p className={`text-xs font-mono mt-1 ${mutedText}`}>
                          {slot.evaluator} • {slot.room}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-neutral-200/70 dark:border-zinc-800">
                        <span className={`font-mono text-xs ${mutedText}`}>
                          {slot.bookedByStudentName
                            ? `Locked: ${slot.bookedByStudentName}`
                            : "Available (15m)"}
                        </span>
                        <button
                          disabled={isTaken}
                          onClick={() =>
                            mutateUniversity("BOOK_VIVA_SLOT", {
                              slotId: slot.id,
                              studentId: "usr-student-1",
                              studentName: "Dhairya Shah (24BCE1042)",
                            })
                          }
                          className={`vng-pop-btn px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold ${
                            isMine
                              ? "bg-rose-600 text-white"
                              : isTaken
                              ? "opacity-40 cursor-not-allowed"
                              : "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                          }`}
                        >
                          {isMine
                            ? "Release Slot"
                            : isTaken
                            ? "Locked"
                            : "Book Viva Slot"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 6: HIGH-CONCURRENCY TIMED EXAM ENGINE
          ================================================================= */}
          {activeTab === "LIVE_EXAM" && (
            <div className="p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className={`font-mono text-[10px] uppercase tracking-widest ${mutedText}`}>
                    REDIS HASH SUB-MILLISECOND AUTOSAVE ENGINE
                  </p>
                  <h2 className="font-orbitron text-xl font-semibold mt-1">
                    CS-301 Mid-Semester Timed Assessment
                  </h2>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    ✓ {examAutosaveStatus}
                  </span>
                  <span className="px-3.5 py-1.5 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold tabular-nums">
                    24:18
                  </span>
                </div>
              </div>

              <div className={`p-6 rounded-3xl border ${cardSurface} space-y-4`}>
                <p className="text-sm sm:text-base font-semibold">
                  Q4 (CO2 • 2.0 Marks): When merging LR(1) states with identical
                  LR(0) cores to build an LALR(1) parser, which statement is
                  guaranteed?
                </p>
                <div className="space-y-2.5">
                  {[
                    "Shift-Reduce conflicts may arise, but never Reduce-Reduce conflicts.",
                    "Reduce-Reduce conflicts may arise, but never new Shift-Reduce conflicts.",
                    "Neither conflict type can ever be introduced by state merging.",
                    "LALR(1) tables have more states than canonical LR(1) tables.",
                  ].map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedExamAnswer(idx);
                        setExamAutosaveStatus(
                          `Saved Option ${String.fromCharCode(
                            65 + idx
                          )} to Redis Hash exam:attempt:24BCE1042 in ${(
                            1.6 +
                            Math.random() * 1.9
                          ).toFixed(1)} ms`
                        );
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border font-mono text-xs transition flex items-center gap-3 ${
                        selectedExamAnswer === idx
                          ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950 font-semibold"
                          : `${cardSurface}`
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 7: DYNAMIC AUTOMATION RULES & OBE MATRIX
          ================================================================= */}
          {activeTab === "GOVERNANCE" && (
            <div className="p-6 space-y-4">
              <div>
                <p className={`font-mono text-[10px] uppercase tracking-widest ${mutedText}`}>
                  WHEN [TRIGGER] + IF [CONDITION] → EXECUTE [ACTION]
                </p>
                <h2 className="font-orbitron text-xl font-semibold mt-1">
                  Institutional Dynamic Automation Rules
                </h2>
              </div>
              <div className="space-y-3">
                {state.dynamicRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`p-4 rounded-2xl border ${cardSurface} flex flex-col md:flex-row md:items-center justify-between gap-4`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{rule.name}</span>
                        <span className={`font-mono text-[10px] ${mutedText}`}>
                          ({rule.executionsCount.toLocaleString()} runs)
                        </span>
                      </div>
                      <p className={`font-mono text-xs ${mutedText}`}>
                        {rule.trigger} • {rule.condition} →{" "}
                        <strong className="text-current">{rule.action}</strong>
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        mutateUniversity("TOGGLE_DYNAMIC_RULE", {
                          ruleId: rule.id,
                        })
                      }
                      className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-semibold shrink-0 ${
                        rule.enabled
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                          : "border border-zinc-300 dark:border-zinc-700"
                      }`}
                    >
                      {rule.enabled ? "● ACTIVE" : "○ PAUSED"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 8: ALIEN RUN GAMIFICATION
          ================================================================= */}
          {activeTab === "ALIEN_RUN" && (
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-mono text-[10px] uppercase tracking-widest ${mutedText}`}>
                    EVENT-DRIVEN ACADEMIC XP PROGRESSION
                  </p>
                  <h2 className="font-orbitron text-xl font-semibold mt-1">
                    Alien Run — Orbital Compiler Citadel
                  </h2>
                </div>
                <span className="font-orbitron text-lg font-bold">
                  {studentUser.xp.toLocaleString()} XP • LV.0{studentUser.level}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    stage: "01",
                    name: "Lexical Canyon",
                    xp: 500,
                    status: "COMPLETED",
                  },
                  {
                    stage: "02",
                    name: "Kernel Crater",
                    xp: 1200,
                    status: "COMPLETED",
                  },
                  {
                    stage: "03",
                    name: "Cipher Nebula",
                    xp: 2000,
                    status: "COMPLETED",
                  },
                  {
                    stage: "04",
                    name: "LALR Citadel",
                    xp: 2800,
                    status: "350 XP TO BOSS GATE",
                  },
                ].map((s) => (
                  <div
                    key={s.stage}
                    className={`p-5 rounded-3xl border ${cardSurface} space-y-2`}
                  >
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span>SECTOR {s.stage}</span>
                      <span>{s.xp} XP</span>
                    </div>
                    <h3 className="font-orbitron text-base font-semibold">
                      {s.name}
                    </h3>
                    <p className="font-mono text-[11px] text-emerald-600">
                      {s.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* =====================================================================
          6. VENGEANCE UI FLOATING GLASS DOCK (BOTTOM NAVIGATION)
      ===================================================================== */}
      <div className="fixed bottom-4 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
        <div
          className={`pointer-events-auto flex items-center gap-1.5 rounded-full border px-3 py-2 shadow-[0_18px_46px_-24px_rgba(24,24,27,0.65)] backdrop-blur-md ${
            isDark
              ? "border-white/10 bg-[#050608]/90"
              : "border-zinc-200/90 bg-white/90"
          }`}
        >
          {(
            [
              { id: "DASHBOARD", label: "Command", icon: LayoutDashboard },
              { id: "COURSES", label: "Courses", icon: BookOpen },
              { id: "DEADLINES", label: "Deadlines", icon: Clock },
              { id: "COMPRESSOR", label: "<2MB Compress", icon: FileArchive },
              { id: "VIVA_SLOTS", label: "Viva", icon: Calendar },
              { id: "LIVE_EXAM", label: "Exam", icon: Lock },
              { id: "GOVERNANCE", label: "Rules", icon: Workflow },
              { id: "ALIEN_RUN", label: "Alien Run", icon: Trophy },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  active
                    ? isDark
                      ? "bg-white text-zinc-950 font-semibold shadow-xs scale-105"
                      : "bg-zinc-950 text-white font-semibold shadow-xs scale-105"
                    : `${mutedText} hover:text-current`
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          7. COMMAND+K GLOBAL SEARCH MODAL
      ===================================================================== */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
          <div
            className={`rounded-2xl border ${cardSurface} shadow-2xl max-w-xl w-full overflow-hidden`}
          >
            <div
              className={`p-4 border-b ${borderCol} flex items-center gap-3`}
            >
              <Search className="w-4 h-4 opacity-70" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses, PDFs, deadlines, viva slots…"
                className="flex-1 bg-transparent font-mono text-xs outline-none"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="font-mono text-[10px] px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700"
              >
                ESC
              </button>
            </div>
            <div className="p-2 max-h-72 overflow-y-auto space-y-1">
              {state.courses
                .filter(
                  (c) =>
                    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.code.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCourseId(c.id);
                      setActiveTab("COURSES");
                      setSearchOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center justify-between text-xs"
                  >
                    <span>
                      <strong className="font-mono mr-2">{c.code}</strong>
                      {c.title}
                    </span>
                    <span className={`font-mono text-[10px] ${mutedText}`}>
                      COURSE
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
