import { NextRequest, NextResponse } from "next/server";
import {
  getUniversityState,
  saveUniversityState,
  rotateAttendanceSessionCode,
} from "@/lib/university-store";

export async function GET() {
  const state = getUniversityState();
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    data: state,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;
    const state = getUniversityState();

    switch (action) {
      case "CHECK_IN_ATTENDANCE": {
        const { studentId, pinCode } = payload;
        if (!state.liveAttendance.active) {
          return NextResponse.json(
            { error: "Attendance session is currently closed." },
            { status: 400 }
          );
        }
        if (
          pinCode &&
          pinCode.trim() !== state.liveAttendance.pinCode &&
          pinCode !== "QR_AUTO"
        ) {
          return NextResponse.json(
            { error: "Invalid rotating PIN code. Check the classroom screen." },
            { status: 400 }
          );
        }
        if (!state.liveAttendance.checkedInStudentIds.includes(studentId)) {
          state.liveAttendance.checkedInStudentIds.push(studentId);
          const cs301 = state.courses.find((c) => c.code === "CS-301");
          if (cs301) {
            cs301.attendedClasses += 1;
            cs301.totalClasses += 1;
          }
          const student = state.users.find((u) => u.id === studentId);
          if (student) {
            student.xp += 15;
          }
        }
        saveUniversityState(state);
        return NextResponse.json({ status: "ok", data: state });
      }

      case "ROTATE_ATTENDANCE_PIN": {
        const updated = rotateAttendanceSessionCode(state);
        return NextResponse.json({ status: "ok", data: updated });
      }

      case "TOGGLE_ATTENDANCE_SESSION": {
        state.liveAttendance.active = !state.liveAttendance.active;
        if (state.liveAttendance.active) {
          rotateAttendanceSessionCode(state);
        } else {
          saveUniversityState(state);
        }
        return NextResponse.json({ status: "ok", data: state });
      }

      case "UPDATE_DEADLINE_PROGRESS": {
        const { deadlineId, progressPct } = payload;
        const dl = state.deadlines.find((d) => d.id === deadlineId);
        if (dl) {
          dl.progressPct = Math.max(0, Math.min(100, Number(progressPct)));
          if (dl.progressPct === 100 && dl.status === "PENDING") {
            dl.status = "SUBMITTED";
            dl.submittedAt = "Just now (On Time • Timestamp Locked)";
          }
        }
        saveUniversityState(state);
        return NextResponse.json({ status: "ok", data: state });
      }

      case "SUBMIT_ASSIGNMENT": {
        const { deadlineId, fileName, sizeMb, compressedFromMb } = payload;
        const dl = state.deadlines.find((d) => d.id === deadlineId);
        if (dl) {
          dl.status = "SUBMITTED";
          dl.progressPct = 100;
          dl.submittedFileName = fileName || "24BCE1042_Submission_Optimized.pdf";
          dl.submittedSizeMb = sizeMb || 1.38;
          if (compressedFromMb) {
            dl.compressedFromMb = compressedFromMb;
          }
          dl.submittedAt = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }) + " (On Time • Locked)";
        }
        const student = state.users.find((u) => u.role === "STUDENT");
        if (student) {
          student.xp += 50;
          student.level = Math.floor(student.xp / 350) + 1;
        }
        saveUniversityState(state);
        return NextResponse.json({ status: "ok", data: state });
      }

      case "GRADE_SUBMISSION": {
        const { deadlineId, marksAwarded, feedback } = payload;
        const dl = state.deadlines.find((d) => d.id === deadlineId);
        if (dl) {
          dl.status = "GRADED";
          dl.marksAwarded = Number(marksAwarded);
          dl.feedback = feedback || "Evaluated via TOAST Rubric Speed-Grader.";
        }
        saveUniversityState(state);
        return NextResponse.json({ status: "ok", data: state });
      }

      case "BOOK_VIVA_SLOT": {
        const { slotId, studentId, studentName } = payload;
        const slot = state.vivaSlots.find((s) => s.id === slotId);
        if (!slot) {
          return NextResponse.json({ error: "Slot not found" }, { status: 404 });
        }
        if (slot.bookedByStudentId && slot.bookedByStudentId !== studentId) {
          return NextResponse.json(
            { error: "Slot already locked by another student via Redis NX lock." },
            { status: 409 }
          );
        }
        if (slot.bookedByStudentId === studentId) {
          slot.bookedByStudentId = null;
          slot.bookedByStudentName = null;
        } else {
          // Release any previous slot in same course
          state.vivaSlots.forEach((s) => {
            if (s.courseCode === slot.courseCode && s.bookedByStudentId === studentId) {
              s.bookedByStudentId = null;
              s.bookedByStudentName = null;
            }
          });
          slot.bookedByStudentId = studentId;
          slot.bookedByStudentName = studentName;
        }
        saveUniversityState(state);
        return NextResponse.json({ status: "ok", data: state });
      }

      case "TOGGLE_DYNAMIC_RULE": {
        const { ruleId } = payload;
        const rule = state.dynamicRules.find((r) => r.id === ruleId);
        if (rule) {
          rule.enabled = !rule.enabled;
        }
        saveUniversityState(state);
        return NextResponse.json({ status: "ok", data: state });
      }

      case "TOGGLE_OFFLINE_PIN": {
        const { courseId, itemId } = payload;
        const course = state.courses.find((c) => c.id === courseId);
        if (course) {
          for (const mod of course.modules) {
            const item = mod.items.find((i) => i.id === itemId);
            if (item) {
              item.offlinePinned = !item.offlinePinned;
            }
          }
        }
        saveUniversityState(state);
        return NextResponse.json({ status: "ok", data: state });
      }

      case "CREATE_ASSIGNMENT": {
        const { courseCode, title, dueAt, maxMarks, coTag } = payload;
        const course =
          state.courses.find((c) => c.code === courseCode) || state.courses[0];
        state.deadlines.unshift({
          id: "dl-" + Date.now(),
          courseCode: course.code,
          courseTitle: course.title,
          title: title || "New Faculty Assignment",
          type: "ASSIGNMENT",
          dueAt: dueAt || "Next Friday, 11:59 PM",
          hoursRemaining: 96,
          maxMarks: Number(maxMarks) || 25,
          weightagePct: 15,
          maxFileSizeMb: 2.0,
          progressPct: 0,
          status: "PENDING",
          coTag: coTag || "CO3",
          suggestedMilestones: [
            "Read faculty problem statement & rubric",
            "Draft solution and compress PDF < 2.0 MB",
          ],
        });
        saveUniversityState(state);
        return NextResponse.json({ status: "ok", data: state });
      }

      case "SIMULATE_TRAFFIC_SPIKE": {
        const { mode } = payload;
        if (mode === "EXAM_SPIKE") {
          state.serverMetrics = {
            concurrentUsersOnline: 18450,
            activePgConnections: 162,
            pgBouncerPooledConnections: 18450,
            redisHitRatePct: 99.2,
            compressorQueueDepth: 14,
            avgApiLatencyMs: 14,
          };
        } else {
          state.serverMetrics = {
            concurrentUsersOnline: 6420,
            activePgConnections: 84,
            pgBouncerPooledConnections: 6420,
            redisHitRatePct: 98.4,
            compressorQueueDepth: 3,
            avgApiLatencyMs: 11,
          };
        }
        saveUniversityState(state);
        return NextResponse.json({ status: "ok", data: state });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
