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
  GraduationCap,
  LayoutDashboard,
  Lock,
  QrCode,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  Sparkles,
  Trophy,
  Upload,
  Users,
  Video,
  Workflow,
  Zap,
  ArrowUpRight,
  Download,
  Check,
  AlertTriangle,
  Sun,
  Moon,
  Send,
  Layers,
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
    "Ask me anything about your enrolled Semester 5 courses (CS-301 Compiler Design, CS-302 OS, CS-303 Networks, CS-304 Cyber Security), your attendance safe-bunk margin, or upcoming deadlines."
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
    "Saved to Redis Hash exam:attempt:24BCE1042 in 3.2 ms"
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
      mode === "QR_AUTO" ? "QR_AUTO" : attendancePinInput || state.liveAttendance.pinCode;
    const res = await mutateUniversity("CHECK_IN_ATTENDANCE", {
      studentId: "usr-student-1",
      pinCode: pinToUse,
    });
    if (res.error) {
      setAttendanceFeedback(`⚠️ ${res.error}`);
    } else {
      setAttendanceFeedback(
        "✅ Checked in via Redis HMAC Verification (<2ms) • +15 Academic XP!"
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
              ? " & attached to assignment with locked timestamp!"
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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm max-w-md w-full text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-700 text-white font-bold text-xl flex items-center justify-center mx-auto">
            T
          </div>
          <h1 className="text-lg font-semibold text-slate-900">
            Bootstrapping TOAST University OS…
          </h1>
          <p className="text-sm text-slate-600">
            Connecting to High-Concurrency Academic State & Daylight UI Engine
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

  const surfaceClass = isDark
    ? "bg-slate-900 border-slate-800 text-slate-100"
    : "bg-white border-slate-200 text-slate-900";
  const canvasClass = isDark
    ? "bg-slate-950 text-slate-100"
    : "bg-[#F8FAFC] text-[#0F172A]";
  const subtleBg = isDark ? "bg-slate-800/70" : "bg-slate-100/80";
  const mutedText = isDark ? "text-slate-400" : "text-slate-600";

  return (
    <div className={`min-h-screen flex flex-col ${canvasClass} transition-colors`}>
      {/* =====================================================================
          TOP UNIVERSITY SERVER TELEMETRY & MULTI-USER ROLE SWITCHER BAR
      ===================================================================== */}
      <div className="bg-slate-900 text-slate-200 text-xs border-b border-slate-800 px-4 py-2">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              UNIVERSITY CLUSTER LIVE
            </span>
            <span className="font-mono tabular-nums text-slate-300">
              <strong className="text-white">
                {state.serverMetrics.concurrentUsersOnline.toLocaleString()}
              </strong>{" "}
              Concurrent Users
            </span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:inline font-mono tabular-nums text-slate-300">
              PgBouncer:{" "}
              <strong className="text-blue-300">
                {state.serverMetrics.pgBouncerPooledConnections.toLocaleString()} →{" "}
                {state.serverMetrics.activePgConnections} PG Conns
              </strong>
            </span>
            <span className="hidden lg:inline text-slate-500">•</span>
            <span className="hidden lg:inline font-mono tabular-nums text-slate-300">
              Redis Hit:{" "}
              <strong className="text-emerald-300">
                {state.serverMetrics.redisHitRatePct}%
              </strong>{" "}
              ({state.serverMetrics.avgApiLatencyMs}ms avg)
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
              className="px-2 py-0.5 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 font-medium transition"
            >
              {state.serverMetrics.concurrentUsersOnline > 10000
                ? "Reset to Normal Load (6.4k)"
                : "⚡ Simulate 18.4k Exam Spike"}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 mr-1">Switch Live Role:</span>
            {(["STUDENT", "FACULTY", "HOD", "ADMIN"] as UserRole[]).map(
              (role) => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    activeRole === role
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
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
          MAIN DAYLIGHT ACADEMIC COMMAND HEADER
      ===================================================================== */}
      <header
        className={`sticky top-0 z-30 border-b ${surfaceClass} backdrop-blur-md bg-opacity-95 px-6 py-3`}
      >
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              🍞
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight">TOAST</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  {state.activeSemester}
                </span>
              </div>
              <p className={`text-xs ${mutedText}`}>{state.campusName}</p>
            </div>
          </div>

          {/* Global Command+K Search Trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className={`hidden md:flex items-center justify-between w-96 px-3.5 py-2 rounded-xl border ${
              isDark
                ? "bg-slate-800 border-slate-700 text-slate-300"
                : "bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-400"
            } text-sm transition`}
          >
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-600" />
              <span>Search courses, PDFs, deadlines, viva…</span>
            </span>
            <kbd className="px-2 py-0.5 text-xs font-mono rounded bg-white border border-slate-200 text-slate-600 shadow-2xs">
              Ctrl + K
            </kbd>
          </button>

          {/* Right User Profile & Daylight/Dark Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("COMPRESSOR")}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition"
            >
              <FileArchive className="w-3.5 h-3.5" />
              PDF/DOCX &lt;2MB Compressor
            </button>

            <button
              onClick={() => setIsDark(!isDark)}
              title="Toggle Daylight Light Mode / Dark Mode"
              className={`p-2 rounded-lg border ${
                isDark
                  ? "border-slate-700 bg-slate-800 text-amber-300"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-blue-700 text-white font-semibold text-sm flex items-center justify-center">
                {currentUser.avatarInitials}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-semibold leading-none">
                  {currentUser.name}
                </div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  {currentUser.institutionalId} • {currentUser.role}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================================
          MAIN WORKSPACE SHELL (SIDEBAR + 3-COLUMN ADAPTIVE CONTENT)
      ===================================================================== */}
      <div className="max-w-[1600px] w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        {/* LEFT NAVIGATION RAIL */}
        <aside className="lg:col-span-2 space-y-2">
          <div className={`rounded-2xl border p-3 ${surfaceClass} shadow-2xs space-y-1`}>
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Academic OS
            </div>
            {(
              [
                {
                  id: "DASHBOARD",
                  label: "Command Center",
                  icon: LayoutDashboard,
                  badge: null,
                },
                {
                  id: "COURSES",
                  label: "Courses & Syllabus",
                  icon: BookOpen,
                  badge: String(state.courses.length),
                },
                {
                  id: "DEADLINES",
                  label: "Smart Deadlines",
                  icon: Clock,
                  badge: String(pendingDeadlines.length),
                },
                {
                  id: "COMPRESSOR",
                  label: "Doc Compressor",
                  icon: FileArchive,
                  badge: "<2MB",
                },
                {
                  id: "VIVA_SLOTS",
                  label: "Viva & Lab Slots",
                  icon: Calendar,
                  badge: null,
                },
                {
                  id: "LIVE_EXAM",
                  label: "Timed Exam Engine",
                  icon: Lock,
                  badge: "Redis",
                },
                {
                  id: "GOVERNANCE",
                  label: "Rules & OBE Matrix",
                  icon: Workflow,
                  badge: "Auto",
                },
                {
                  id: "ALIEN_RUN",
                  label: "Alien Run & XP",
                  icon: Trophy,
                  badge: `Lv.${studentUser.level}`,
                },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200/80 font-semibold"
                      : isDark
                      ? "text-slate-300 hover:bg-slate-800"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-blue-700" : "text-slate-500"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge && (
                    <span
                      className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? "bg-blue-700 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* University Multi-User Info Card */}
          <div className={`rounded-2xl border p-4 ${surfaceClass} shadow-2xs space-y-2`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
              <Server className="w-3.5 h-3.5" />
              Multi-User Sync
            </div>
            <p className={`text-xs leading-relaxed ${mutedText}`}>
              Open <code className="font-mono text-blue-700">localhost:3000</code>{" "}
              in two browser tabs simultaneously: switch one to{" "}
              <strong>FACULTY</strong> and one to <strong>STUDENT</strong> to test
              real-time QR attendance, assignment grading, and viva booking!
            </p>
          </div>
        </aside>

        {/* CENTER + RIGHT WORKSPACE */}
        <main className="lg:col-span-10 space-y-6">
          {/* =================================================================
              ROLE BANNER (ADAPTS TO STUDENT / FACULTY / HOD / ADMIN)
          ================================================================= */}
          <div
            className={`rounded-2xl border p-6 ${surfaceClass} shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  {activeRole} WORKSPACE
                </span>
                <span className={`text-xs font-mono ${mutedText}`}>
                  ID: {currentUser.institutionalId} • {currentUser.department}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                {activeRole === "STUDENT" &&
                  `Good morning, ${currentUser.name.split(" ")[0]} 👋`}
                {activeRole === "FACULTY" &&
                  `Faculty Command Center — ${currentUser.name}`}
                {activeRole === "HOD" &&
                  `Department Governance & OBE Console — ${currentUser.name}`}
                {activeRole === "ADMIN" &&
                  `University Server & Multi-Tenant Operations — ${currentUser.name}`}
              </h1>
              <p className={`text-sm ${mutedText}`}>
                {activeRole === "STUDENT" &&
                  "Everything you have today: live lecture check-in, prioritized deadlines, <2MB document compressor, and course-grounded AI."}
                {activeRole === "FACULTY" &&
                  "Project live rotating attendance QR/PINs, publish assignments, speed-grade submissions with rubrics, and manage viva slots."}
                {activeRole === "HOD" &&
                  "Monitor CSE department attendance health, early-warning at-risk student interventions, and NBA/NAAC CO-PO attainment matrices."}
                {activeRole === "ADMIN" &&
                  "Monitor 5,000–25,000+ user PgBouncer pools, Redis exam buffers, MinIO object storage, and institutional Dynamic Rules."}
              </p>
            </div>

            {/* Quick Role Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {activeRole === "STUDENT" && (
                <>
                  <button
                    onClick={() => handleAttendanceCheckIn("QR_AUTO")}
                    disabled={isStudentCheckedIn || !state.liveAttendance.active}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs transition ${
                      isStudentCheckedIn
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-blue-700 hover:bg-blue-800 text-white"
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    {isStudentCheckedIn
                      ? "Checked In: CS-301 (LH-204)"
                      : "1-Click Live Check-In (CS-301)"}
                  </button>
                  <button
                    onClick={() => setActiveTab("COMPRESSOR")}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 flex items-center gap-2 transition"
                  >
                    <Upload className="w-4 h-4 text-blue-700" />
                    Compress &amp; Submit PDF
                  </button>
                </>
              )}
              {activeRole === "FACULTY" && (
                <>
                  <button
                    onClick={() => mutateUniversity("ROTATE_ATTENDANCE_PIN")}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-2 transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Rotate Classroom PIN ({state.liveAttendance.pinCode})
                  </button>
                  <button
                    onClick={() => mutateUniversity("TOGGLE_ATTENDANCE_SESSION")}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition"
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
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-2 transition"
                >
                  <Workflow className="w-4 h-4" />
                  Manage Dynamic Automation Rules
                </button>
              )}
            </div>
          </div>

          {/* =================================================================
              KPI STRIP (LIGHT-THEMED HIGH-CONTRAST ACADEMIC METRICS)
          ================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className={`rounded-2xl border p-5 ${surfaceClass} shadow-2xs`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold uppercase ${mutedText}`}>
                  Overall Attendance
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Safe (&ge;75%)
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono tabular-nums">
                  {overallAttendancePct}%
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  ({totalAttended}/{totalConducted} classes)
                </span>
              </div>
              <p className="mt-2 text-xs text-emerald-700 font-medium">
                +{overallSafeBunkBuffer} classes buffer above 75% debarment line
              </p>
            </div>

            <div className={`rounded-2xl border p-5 ${surfaceClass} shadow-2xs`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold uppercase ${mutedText}`}>
                  Smart Deadlines
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  1 Due Tomorrow
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono tabular-nums">
                  {pendingDeadlines.length}
                </span>
                <span className="text-xs text-slate-500">Pending Tasks</span>
              </div>
              <p className={`mt-2 text-xs ${mutedText}`}>
                Next: CS-301 LALR(1) Parser Report (28h left)
              </p>
            </div>

            <div className={`rounded-2xl border p-5 ${surfaceClass} shadow-2xs`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold uppercase ${mutedText}`}>
                  Cumulative CGPA
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  160 Cr B.Tech
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono tabular-nums">
                  {studentUser.cgpa?.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500">
                  / 10.0 (Sem 5 SGPA: 9.18)
                </span>
              </div>
              <p className={`mt-2 text-xs ${mutedText}`}>
                96 / 160 Degree Credits Completed (Dean&apos;s List)
              </p>
            </div>

            <div className={`rounded-2xl border p-5 ${surfaceClass} shadow-2xs`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold uppercase ${mutedText}`}>
                  Academic XP &amp; Streak
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  Level {studentUser.level}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono tabular-nums text-purple-700">
                  {studentUser.xp.toLocaleString()} XP
                </span>
                <span className="text-xs font-semibold text-amber-600 flex items-center gap-0.5">
                  <Flame className="w-3.5 h-3.5 fill-amber-500" />
                  {studentUser.streakDays}d streak
                </span>
              </div>
              <p className={`mt-2 text-xs ${mutedText}`}>
                Alien Run Sector 4 Unlocked • Top 5% in CSE-5A
              </p>
            </div>
          </div>

          {/* =================================================================
              TAB 1: COMMAND DASHBOARD (ADAPTS TO ROLE)
          ================================================================= */}
          {activeTab === "DASHBOARD" && (
            <div className="space-y-6">
              {/* FACULTY / HOD / ADMIN SPECIALIZED TOP PANELS WHEN SELECTED */}
              {activeRole === "FACULTY" && (
                <div
                  className={`rounded-2xl border-2 border-blue-200 p-6 ${surfaceClass} shadow-xs space-y-5`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                        FACULTY LIVE CLASSROOM &amp; SPEED-GRADER STUDIO
                      </span>
                      <h2 className="text-xl font-bold mt-0.5">
                        CS-301 Compiler Design • Section CSE-5A (Room LH-204)
                      </h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-right">
                        <div className="text-[11px] uppercase font-semibold text-slate-500">
                          Live Rotating PIN
                        </div>
                        <div className="text-xl font-mono font-bold tracking-widest text-blue-700">
                          {state.liveAttendance.pinCode}
                        </div>
                      </div>
                      <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-right">
                        <div className="text-[11px] uppercase font-semibold text-emerald-700">
                          Checked-In Live
                        </div>
                        <div className="text-xl font-mono font-bold text-emerald-800">
                          {38 + state.liveAttendance.checkedInStudentIds.length} /{" "}
                          {state.liveAttendance.totalEnrolled}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Faculty Create Assignment + Speed Grader */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <h3 className="text-sm font-bold text-slate-900">
                        Publish New Course Assignment (Instant Student Sync)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <select
                          value={newAssignCourse}
                          onChange={(e) => setNewAssignCourse(e.target.value)}
                          className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900"
                        >
                          {state.courses.map((c) => (
                            <option key={c.id} value={c.code}>
                              {c.code}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={newAssignTitle}
                          onChange={(e) => setNewAssignTitle(e.target.value)}
                          placeholder="e.g., Assignment 4: SSA Code Optimization"
                          className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900"
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
                        className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition"
                      >
                        + Publish Assignment &amp; Trigger Deadline Engine
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <h3 className="text-sm font-bold text-slate-900">
                        Rubric Speed-Grader Queue (Submitted Work)
                      </h3>
                      {state.deadlines
                        .filter((d) => d.status !== "PENDING")
                        .map((dl) => (
                          <div
                            key={dl.id}
                            className="p-3 rounded-lg bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-2"
                          >
                            <div>
                              <div className="text-xs font-bold text-slate-900">
                                {dl.courseCode} • {dl.title}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                File: {dl.submittedFileName || "Submitted.pdf"} (
                                {dl.submittedSizeMb || 1.4} MB) • Status:{" "}
                                <span className="font-semibold text-emerald-700">
                                  {dl.status}
                                  {dl.marksAwarded !== undefined
                                    ? ` (${dl.marksAwarded}/${dl.maxMarks})`
                                    : ""}
                                </span>
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
                                className="w-16 px-2 py-1 text-xs font-mono border border-slate-300 rounded bg-white text-slate-900"
                              />
                              <button
                                onClick={() =>
                                  mutateUniversity("GRADE_SUBMISSION", {
                                    deadlineId: dl.id,
                                    marksAwarded:
                                      gradeMarksInput[dl.id] || dl.maxMarks,
                                  })
                                }
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                              >
                                Publish Grade
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {(activeRole === "HOD" || activeRole === "ADMIN") && (
                <div
                  className={`rounded-2xl border-2 border-amber-200 p-6 ${surfaceClass} shadow-xs space-y-4`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                        PREDICTIVE AT-RISK STUDENT ENGINE (DYNAMIC RULE #1)
                      </span>
                      <h2 className="text-lg font-bold mt-0.5">
                        Students Flagged Below 75% Attendance or Missing Consecutive
                        Deadlines
                      </h2>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                      {state.atRiskStudents.length} Students Flagged
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 bg-slate-50">
                          <th className="py-2.5 px-3">Roll No / Name</th>
                          <th className="py-2.5 px-3">Section</th>
                          <th className="py-2.5 px-3">Attendance</th>
                          <th className="py-2.5 px-3">Missed Work</th>
                          <th className="py-2.5 px-3">Advisor</th>
                          <th className="py-2.5 px-3">Automated Trigger Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {state.atRiskStudents.map((st) => (
                          <tr key={st.id}>
                            <td className="py-2.5 px-3 font-medium">
                              <span className="font-mono text-xs text-slate-500 mr-1.5">
                                {st.institutionalId}
                              </span>
                              {st.name}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-xs">
                              {st.section}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-red-600">
                              {st.attendancePct}%
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              {st.missedDeadlines} overdue
                            </td>
                            <td className="py-2.5 px-3 text-xs text-slate-600">
                              {st.advisorName}
                            </td>
                            <td className="py-2.5 px-3 text-xs text-amber-900">
                              {st.flaggedReason}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* MAIN 2-COLUMN STUDENT / ACADEMIC COMMAND GRID */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* LEFT 7 COLS: TODAY'S SCHEDULE + LIVE ATTENDANCE + COURSES */}
                <div className="xl:col-span-7 space-y-6">
                  {/* Live Classroom Attendance Banner */}
                  <div
                    className={`rounded-2xl border p-5 ${surfaceClass} shadow-2xs space-y-4`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                          Live Classroom Session Active Now
                        </span>
                      </div>
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        Token: {state.liveAttendance.hmacToken}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-blue-50/70 border border-blue-200/80">
                      <div>
                        <div className="text-xs font-bold text-blue-700">
                          {state.liveAttendance.courseCode} •{" "}
                          {state.liveAttendance.section} • Room{" "}
                          {state.liveAttendance.room}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5">
                          {state.liveAttendance.courseTitle}
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Instructor: {state.liveAttendance.instructorName} •
                          Classroom Projector PIN:{" "}
                          <strong className="font-mono text-blue-800">
                            {state.liveAttendance.pinCode}
                          </strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={attendancePinInput}
                          onChange={(e) => setAttendancePinInput(e.target.value)}
                          placeholder={state.liveAttendance.pinCode}
                          className="w-28 px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono text-sm text-center text-slate-900"
                        />
                        <button
                          onClick={() => handleAttendanceCheckIn("PIN")}
                          disabled={isStudentCheckedIn}
                          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                            isStudentCheckedIn
                              ? "bg-emerald-600 text-white"
                              : "bg-blue-700 hover:bg-blue-800 text-white"
                          }`}
                        >
                          {isStudentCheckedIn ? "✓ Marked Present" : "Verify PIN"}
                        </button>
                      </div>
                    </div>

                    {attendanceFeedback && (
                      <div className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                        {attendanceFeedback}
                      </div>
                    )}

                    {/* Today's Full Timetable */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                        <span>Today&apos;s University Timetable</span>
                        <span>Section CSE-5A</span>
                      </div>
                      <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
                        {state.courses.map((course) => {
                          const attPct = (
                            (course.attendedClasses / course.totalClasses) *
                            100
                          ).toFixed(1);
                          return (
                            <div
                              key={course.id}
                              className="p-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 transition"
                            >
                              <div className="flex items-center gap-3">
                                <div className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-800 font-mono text-xs font-bold">
                                  {course.code}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-slate-900">
                                    {course.title}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {course.nextClassTime} • {course.room} •{" "}
                                    {course.instructor}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {attPct}% ({course.attendedClasses}/
                                  {course.totalClasses})
                                </span>
                                <button
                                  onClick={() => {
                                    setSelectedCourseId(course.id);
                                    setActiveTab("COURSES");
                                  }}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                                  title="Open Course Modules"
                                >
                                  <ArrowUpRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Course-Grounded AI Study Copilot */}
                  <div
                    className={`rounded-2xl border p-5 ${surfaceClass} shadow-2xs space-y-4`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-700" />
                        <h3 className="text-base font-bold">
                          TOAST AI Study Copilot (Course-Grounded RAG)
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        100% Permission-Scoped
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Explain LR(1) shift-reduce conflicts from my CS-301 notes",
                        "What deadlines do I have this week?",
                        "How is my attendance safe-bunk margin?",
                        "Explain Banker's Algorithm from CS-302 OS notes",
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            setAiPrompt(suggestion);
                            handleAskAi(suggestion);
                          }}
                          className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 transition"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                      {aiLoading ? "Retrieving course chunks from pgvector…" : aiResponse}
                      {aiCitations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap gap-1.5">
                          {aiCitations.map((cit) => (
                            <span
                              key={cit}
                              className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600"
                            >
                              📄 {cit}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAskAi()}
                        placeholder="Ask about your lecture slides, syllabus, deadlines, or attendance…"
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900"
                      />
                      <button
                        onClick={() => handleAskAi()}
                        className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold flex items-center gap-1.5 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Ask
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT 5 COLS: SMART DEADLINE PRIORITY QUEUE + QUICK COMPRESSOR */}
                <div className="xl:col-span-5 space-y-6">
                  <div
                    className={`rounded-2xl border p-5 ${surfaceClass} shadow-2xs space-y-4`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                          Smart Deadline Engine
                        </span>
                        <h3 className="text-base font-bold">
                          Priority Work Queue (Urgency × Credits)
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveTab("DEADLINES")}
                        className="text-xs font-semibold text-blue-700 hover:underline"
                      >
                        View All ({state.deadlines.length})
                      </button>
                    </div>

                    <div className="space-y-3">
                      {state.deadlines.map((dl: SmartDeadline) => (
                        <div
                          key={dl.id}
                          className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 hover:border-blue-300 transition"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                                  {dl.courseCode}
                                </span>
                                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                  {dl.coTag} • {dl.weightagePct}% Weight
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-slate-900 mt-1">
                                {dl.title}
                              </h4>
                            </div>
                            <span
                              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
                                dl.status === "GRADED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : dl.status === "SUBMITTED"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : dl.hoursRemaining <= 36
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {dl.status === "GRADED"
                                ? `Graded: ${dl.marksAwarded}/${dl.maxMarks}`
                                : dl.status === "SUBMITTED"
                                ? "✓ Submitted"
                                : dl.dueAt}
                            </span>
                          </div>

                          {/* Interactive Progress Slider */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">
                                Personal Progress Milestone
                              </span>
                              <span className="font-mono font-bold text-slate-800">
                                {dl.progressPct}%
                              </span>
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
                              className="w-full accent-blue-700 cursor-pointer"
                            />
                          </div>

                          {/* Action Footer */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <span className="text-[11px] text-slate-500 font-mono">
                              Limit: &lt;{dl.maxFileSizeMb.toFixed(1)} MB PDF/DOCX
                            </span>
                            {dl.status === "PENDING" ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setAttachDeadlineId(dl.id);
                                    setActiveTab("COMPRESSOR");
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                                >
                                  Compress &lt;2MB
                                </button>
                                <button
                                  onClick={() =>
                                    mutateUniversity("SUBMIT_ASSIGNMENT", {
                                      deadlineId: dl.id,
                                      fileName: `24BCE1042_${dl.courseCode}_Report.pdf`,
                                      sizeMb: 1.48,
                                    })
                                  }
                                  className="px-3 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition"
                                >
                                  Submit Now
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-medium text-emerald-700">
                                {dl.submittedFileName} ({dl.submittedSizeMb} MB)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 2: COURSES, SYLLABUS TREE & OFFLINE PWA PINNING
          ================================================================= */}
          {activeTab === "COURSES" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 space-y-3">
                {state.courses.map((course) => {
                  const isSelected = course.id === selectedCourse.id;
                  const pct = (
                    (course.attendedClasses / course.totalClasses) *
                    100
                  ).toFixed(1);
                  return (
                    <button
                      key={course.id}
                      onClick={() => setSelectedCourseId(course.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition ${
                        isSelected
                          ? "bg-blue-50/90 border-blue-400 shadow-xs"
                          : `${surfaceClass} hover:border-slate-300`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-700 text-white font-mono text-xs font-bold">
                          {course.code}
                        </span>
                        <span className="text-xs font-mono font-semibold text-emerald-700">
                          Attendance: {pct}%
                        </span>
                      </div>
                      <h3 className="text-base font-bold mt-2">{course.title}</h3>
                      <p className={`text-xs mt-1 ${mutedText}`}>
                        {course.instructor} • {course.credits} Credits •{" "}
                        {course.room}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="lg:col-span-8 space-y-4">
                <div className={`rounded-2xl border p-6 ${surfaceClass} space-y-5`}>
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          {selectedCourse.code}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          OBE CO Attainment: {selectedCourse.coAttainmentPct}%
                        </span>
                      </div>
                      <h2 className="text-xl font-bold mt-1">
                        {selectedCourse.title}
                      </h2>
                      <p className={`text-xs ${mutedText}`}>
                        Instructor: {selectedCourse.instructor} • Room:{" "}
                        {selectedCourse.room}
                      </p>
                    </div>
                  </div>

                  {/* Module Syllabus Tree */}
                  <div className="space-y-4">
                    {selectedCourse.modules.map((mod) => (
                      <div
                        key={mod.id}
                        className="rounded-xl border border-slate-200 overflow-hidden"
                      >
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-900">
                            Module {mod.number}: {mod.title}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            {mod.items.length} resources
                          </span>
                        </div>
                        <div className="divide-y divide-slate-200 bg-white">
                          {mod.items.map((item) => (
                            <div
                              key={item.id}
                              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-blue-700 shrink-0" />
                                  <span className="text-sm font-semibold text-slate-900">
                                    {item.title}
                                  </span>
                                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                    {item.coTag}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 pl-6">
                                  <strong>AI Digest:</strong> {item.summary}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 pl-6 sm:pl-0">
                                <span className="text-xs font-mono text-slate-500">
                                  {item.sizeMb} MB
                                </span>
                                <button
                                  onClick={() =>
                                    mutateUniversity("TOGGLE_OFFLINE_PIN", {
                                      courseId: selectedCourse.id,
                                      itemId: item.id,
                                    })
                                  }
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                                    item.offlinePinned
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                  }`}
                                >
                                  {item.offlinePinned
                                    ? "✓ Pinned Offline"
                                    : "Pin for Offline"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 3: SMART DEADLINES FULL VIEW
          ================================================================= */}
          {activeTab === "DEADLINES" && (
            <div className={`rounded-2xl border p-6 ${surfaceClass} space-y-5`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                    SMART DEADLINE &amp; MILESTONE ENGINE
                  </span>
                  <h2 className="text-xl font-bold mt-0.5">
                    Actionable Academic Breakdown &amp; Timestamp-Locked Submissions
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.deadlines.map((dl) => (
                  <div
                    key={dl.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-xs font-bold">
                          {dl.courseCode} • {dl.coTag}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-1.5">
                          {dl.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Due: <strong>{dl.dueAt}</strong> • Max Marks:{" "}
                          {dl.maxMarks} ({dl.weightagePct}% course weight)
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          dl.status === "PENDING"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {dl.status}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="text-xs font-bold text-slate-700">
                        Recommended Action Plan:
                      </div>
                      {dl.suggestedMilestones.map((m, i) => (
                        <div
                          key={i}
                          className="text-xs text-slate-600 flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{m}</span>
                        </div>
                      ))}
                    </div>

                    {dl.feedback && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                        <strong>Faculty Feedback:</strong> {dl.feedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 4: BUILT-IN <2 MB PDF & DOCX COMPRESSOR STUDIO
          ================================================================= */}
          {activeTab === "COMPRESSOR" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <form
                  onSubmit={handleRunCompressor}
                  className={`rounded-2xl border p-6 ${surfaceClass} space-y-5`}
                >
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                      UNIVERSITY DOCUMENT STUDIO &amp; MICROSERVICE WORKER
                    </span>
                    <h2 className="text-xl font-bold mt-0.5">
                      PDF &amp; DOCX Optimizer (&lt; 2.0 MB University Upload Limit)
                    </h2>
                    <p className={`text-xs mt-1 ${mutedText}`}>
                      Compress heavy scanned lab records, Wireshark screenshots, and
                      LaTeX PDFs directly inside TOAST and lock in your submission
                      timestamp immediately.
                    </p>
                  </div>

                  <div className="border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-2xl p-6 text-center space-y-3">
                    <FileArchive className="w-10 h-10 text-blue-700 mx-auto" />
                    <div className="text-sm font-semibold text-slate-900">
                      {selectedFile
                        ? `${selectedFile.name} (${(
                            selectedFile.size /
                            (1024 * 1024)
                          ).toFixed(2)} MB)`
                        : "Select any PDF or DOCX file (or click Compress below to run with sample 11.3 MB Lab Report)"}
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={(e) =>
                        setSelectedFile(e.target.files?.[0] || null)
                      }
                      className="block mx-auto text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-700 file:text-white hover:file:bg-blue-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Optimization Preset
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
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900"
                      >
                        <option value="BALANCED">
                          Balanced (150 DPI • ~81% smaller)
                        </option>
                        <option value="MAX_COMPRESSION">
                          Max Compression (120 DPI • ~86% smaller)
                        </option>
                        <option value="HIGH_QUALITY">
                          High Print Quality (220 DPI • ~68% smaller)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Target Max Size (MB)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="10"
                        value={targetMb}
                        onChange={(e) => setTargetMb(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-mono text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Auto-Attach to Assignment
                      </label>
                      <select
                        value={attachDeadlineId}
                        onChange={(e) => setAttachDeadlineId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900"
                      >
                        <option value="NONE">Just Compress &amp; Download</option>
                        {state.deadlines
                          .filter((d) => d.status === "PENDING")
                          .map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.courseCode}: {d.title.slice(0, 28)}…
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isCompressing}
                    className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm shadow-xs transition"
                  >
                    {isCompressing
                      ? "Compressing in Isolated Worker Container…"
                      : "⚡ Compress Document Under 2.0 MB & Lock Submission Timestamp"}
                  </button>

                  {lastCompressedMsg && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                      ✅ {lastCompressedMsg}
                    </div>
                  )}
                </form>
              </div>

              <div className="lg:col-span-5">
                <div className={`rounded-2xl border p-6 ${surfaceClass} space-y-4`}>
                  <h3 className="text-base font-bold">
                    Recent Server Compression Jobs
                  </h3>
                  <div className="space-y-3">
                    {state.compressionHistory.map((job) => (
                      <div
                        key={job.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {job.originalName}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-xs font-bold">
                            -{job.reductionPct}%
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate-600">
                          {(job.originalSizeBytes / (1024 * 1024)).toFixed(2)} MB →{" "}
                          <strong className="text-emerald-700">
                            {(job.compressedSizeBytes / (1024 * 1024)).toFixed(2)}{" "}
                            MB
                          </strong>{" "}
                          • {job.durationMs}ms • {job.createdAt}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 5: VIVA, LAB EVALUATION & OFFICE-HOURS SLOT BOOKING
          ================================================================= */}
          {activeTab === "VIVA_SLOTS" && (
            <div className={`rounded-2xl border p-6 ${surfaceClass} space-y-5`}>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  REDIS-LOCKED APPOINTMENT &amp; VIVA SCHEDULER
                </span>
                <h2 className="text-xl font-bold mt-0.5">
                  Project Viva, Lab Practical &amp; Faculty Office-Hours Slot Booking
                </h2>
                <p className={`text-xs mt-1 ${mutedText}`}>
                  Eliminates messy shared spreadsheets. Every booking acquires an
                  atomic Redis distributed lock so two students never double-book a
                  slot.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.vivaSlots.map((slot) => {
                  const isMine = slot.bookedByStudentId === "usr-student-1";
                  const isTaken =
                    slot.bookedByStudentId !== null && !isMine;
                  return (
                    <div
                      key={slot.id}
                      className={`p-5 rounded-2xl border transition ${
                        isMine
                          ? "bg-blue-50/70 border-blue-400"
                          : "bg-white border-slate-200"
                      } flex flex-col justify-between gap-4`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs font-bold">
                            {slot.courseCode}
                          </span>
                          <span className="text-xs font-mono font-semibold text-blue-700">
                            {slot.dateLabel} • {slot.timeRange}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1">
                          {slot.title}
                        </h3>
                        <p className="text-xs text-slate-600">
                          Evaluator: {slot.evaluator} • Location: {slot.room}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                        <span className="text-xs font-medium text-slate-600">
                          {slot.bookedByStudentName
                            ? `Booked by: ${slot.bookedByStudentName}`
                            : "Status: Available (15 min slot)"}
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
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                            isMine
                              ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                              : isTaken
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-blue-700 hover:bg-blue-800 text-white"
                          }`}
                        >
                          {isMine
                            ? "Release My Slot"
                            : isTaken
                            ? "Slot Locked"
                            : "Book This Viva Slot"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 6: HIGH-CONCURRENCY TIMED EXAM ENGINE (REDIS AUTOSAVE)
          ================================================================= */}
          {activeTab === "LIVE_EXAM" && (
            <div className={`rounded-2xl border p-6 ${surfaceClass} space-y-5`}>
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    SYNCHRONIZED UNIVERSITY EXAM ENGINE (2,000+ CONCURRENT SEATS)
                  </span>
                  <h2 className="text-xl font-bold mt-0.5">
                    CS-301 Mid-Semester Quiz • Syntax Analysis &amp; LR Parsers
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-semibold">
                    ✓ {examAutosaveStatus}
                  </span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-mono text-sm font-bold tabular-nums">
                    ⏱ 24:18
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                  <span>Question 4 of 15 • Tagged: CO2 (Bloom Level L4)</span>
                  <span>+2.0 Marks / -0.5 Negative</span>
                </div>
                <p className="text-base font-semibold text-slate-900">
                  When merging LR(1) states that share an identical LR(0) core item
                  set to construct an LALR(1) parsing table, which of the following
                  holds true?
                </p>
                <div className="space-y-2.5">
                  {[
                    "New Shift-Reduce conflicts may be introduced, but never Reduce-Reduce conflicts.",
                    "New Reduce-Reduce conflicts may be introduced, but never new Shift-Reduce conflicts.",
                    "Neither Shift-Reduce nor Reduce-Reduce conflicts can ever be introduced.",
                    "The number of states in the LALR(1) automaton is strictly greater than in the LR(0) automaton.",
                  ].map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedExamAnswer(idx);
                        setExamAutosaveStatus(
                          `Saved Option ${String.fromCharCode(
                            65 + idx
                          )} to Redis Hash exam:attempt:24BCE1042 in ${(
                            1.8 +
                            Math.random() * 2.1
                          ).toFixed(1)} ms`
                        );
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border text-sm font-medium transition flex items-center gap-3 ${
                        selectedExamAnswer === idx
                          ? "bg-blue-50 border-blue-500 text-blue-900 font-semibold"
                          : "bg-white border-slate-200 text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center font-mono text-xs">
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
              TAB 7: DYNAMIC AUTOMATION RULES & OBE CO-PO GOVERNANCE
          ================================================================= */}
          {activeTab === "GOVERNANCE" && (
            <div className="space-y-6">
              <div className={`rounded-2xl border p-6 ${surfaceClass} space-y-4`}>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                    INSTITUTIONAL IF-THIS-THEN-THAT AUTOMATION ENGINE
                  </span>
                  <h2 className="text-xl font-bold mt-0.5">
                    Dynamic University Workflow Rules
                  </h2>
                </div>

                <div className="space-y-3">
                  {state.dynamicRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {rule.name}
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {rule.executionsCount.toLocaleString()} runs • Last:{" "}
                            {rule.lastTriggered}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate-600">
                          <strong className="text-blue-700">{rule.trigger}</strong>{" "}
                          •{" "}
                          <strong className="text-amber-700">
                            {rule.condition}
                          </strong>{" "}
                          →{" "}
                          <strong className="text-emerald-700">
                            {rule.action}
                          </strong>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          mutateUniversity("TOGGLE_DYNAMIC_RULE", {
                            ruleId: rule.id,
                          })
                        }
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                          rule.enabled
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {rule.enabled ? "● Rule Active" : "○ Rule Paused"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 8: ALIEN RUN GAMIFICATION & ACADEMIC XP WORLD
          ================================================================= */}
          {activeTab === "ALIEN_RUN" && (
            <div className={`rounded-2xl border p-6 ${surfaceClass} space-y-6`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                    ACADEMIC PROGRESSION &amp; GAMIFICATION ENGINE
                  </span>
                  <h2 className="text-xl font-bold mt-0.5">
                    Alien Run — Sector 4: Orbital Compiler Citadel
                  </h2>
                  <p className={`text-xs mt-1 ${mutedText}`}>
                    Every on-time assignment submission (+50 XP), live attendance
                    check-in (+15 XP), and compressed document (+65 XP) powers your
                    explorer across university worlds.
                  </p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-purple-50 border border-purple-200 text-right">
                  <div className="text-xs font-bold text-purple-700">
                    Level {studentUser.level} Explorer
                  </div>
                  <div className="text-xl font-mono font-bold text-purple-900">
                    {studentUser.xp.toLocaleString()} XP
                  </div>
                </div>
              </div>

              {/* Interactive Progression Map */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  {
                    stage: 1,
                    title: "Sector 1: Lexical Canyon",
                    reqXp: 500,
                    reward: "Unlocked • Early Bird Badge",
                  },
                  {
                    stage: 2,
                    title: "Sector 2: Kernel Crater",
                    reqXp: 1200,
                    reward: "Unlocked • 7-Day Streak Shield",
                  },
                  {
                    stage: 3,
                    title: "Sector 3: Cipher Nebula",
                    reqXp: 2000,
                    reward: "Unlocked • Zero-Late Star",
                  },
                  {
                    stage: 4,
                    title: "Sector 4: LALR Citadel",
                    reqXp: 2800,
                    reward: "In Progress • 350 XP to Boss Gate",
                  },
                ].map((sector) => {
                  const unlocked = studentUser.xp >= sector.reqXp;
                  return (
                    <div
                      key={sector.stage}
                      className={`p-4 rounded-2xl border ${
                        unlocked
                          ? "bg-purple-50/60 border-purple-300"
                          : "bg-slate-50 border-slate-200"
                      } space-y-2`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-purple-700">
                          STAGE 0{sector.stage}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {sector.reqXp} XP
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {sector.title}
                      </h3>
                      <p className="text-xs text-slate-600">{sector.reward}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =====================================================================
          COMMAND+K GLOBAL SEMANTIC SEARCH MODAL
      ===================================================================== */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-xl w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center gap-3">
              <Search className="w-5 h-5 text-blue-700" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses, PDFs, deadlines, viva slots, or ask AI…"
                className="flex-1 text-sm text-slate-900 outline-none"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600"
              >
                ESC
              </button>
            </div>
            <div className="p-3 max-h-80 overflow-y-auto space-y-1">
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
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50 flex items-center justify-between text-sm"
                  >
                    <span>
                      <strong className="font-mono text-blue-700 mr-2">
                        {c.code}
                      </strong>
                      {c.title}
                    </span>
                    <span className="text-xs text-slate-400">Course</span>
                  </button>
                ))}
              {state.deadlines
                .filter((d) =>
                  d.title.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setActiveTab("DEADLINES");
                      setSearchOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50 flex items-center justify-between text-sm"
                  >
                    <span>
                      <strong className="font-mono text-amber-700 mr-2">
                        {d.courseCode}
                      </strong>
                      {d.title}
                    </span>
                    <span className="text-xs text-slate-400">{d.dueAt}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
