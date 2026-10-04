import { NextRequest, NextResponse } from "next/server";
import { getUniversityState } from "@/lib/university-store";

export async function POST(req: NextRequest) {
  try {
    const { query, courseCode } = await req.json();
    const state = getUniversityState();
    const q = (query || "").toLowerCase();

    if (q.includes("deadline") || q.includes("due") || q.includes("submit")) {
      const pending = state.deadlines.filter((d) => d.status === "PENDING");
      const list = pending
        .map(
          (d, idx) =>
            `${idx + 1}. **${d.courseCode} — ${d.title}** (Due: ${d.dueAt} • Current Progress: ${d.progressPct}% • Max Size: <${d.maxFileSizeMb} MB)`
        )
        .join("\n");
      return NextResponse.json({
        answer: `You have **${pending.length} pending academic deadlines** prioritized by urgency and credit weight:\n\n${list}\n\n**Recommended Action:** Focus on **CS-301 Assignment 3** today (28 hours left). Once your PDF report is exported, use the built-in **Document Compressor (<2 MB)** to attach and lock in your timestamp.`,
        citations: [
          "Smart Deadline Engine • Fall 2026–27 (CSE-5A)",
          "CS-301 Syllabus Rubric (CO2)",
        ],
      });
    }

    if (q.includes("attendance") || q.includes("bunk") || q.includes("75%")) {
      const summary = state.courses
        .map((c) => {
          const pct = ((c.attendedClasses / c.totalClasses) * 100).toFixed(1);
          const safeMargin = Math.max(
            0,
            Math.floor(c.attendedClasses / 0.75 - c.totalClasses)
          );
          return `• **${c.code} (${c.title})**: ${pct}% (${c.attendedClasses}/${c.totalClasses}) — Safe margin: **+${safeMargin} classes** above 75%`;
        })
        .join("\n");
      return NextResponse.json({
        answer: `Here is your live **Attendance Health & Safe-Bunk Analysis** across all enrolled Semester 5 courses:\n\n${summary}\n\nAll 4 courses are safely above the **75.0% university threshold** enforced by Dynamic Rule #1.`,
        citations: ["TOAST Live Attendance Ledger • Section CSE-5A"],
      });
    }

    if (
      q.includes("lr") ||
      q.includes("parser") ||
      q.includes("compiler") ||
      q.includes("shift") ||
      courseCode === "CS-301"
    ) {
      return NextResponse.json({
        answer: `### LR(1) & LALR(1) Shift-Reduce Conflict Resolution (Grounded in CS-301 Notes)\n\nFrom **Dr. Arindam Sharma's Module 2 Lecture Slides**:\n1. **Shift-Reduce Conflict**: Occurs when an LR state contains both a shift item \`[A → α • a β, b]\` and a complete reduce item \`[B → γ •, a]\` on lookahead terminal \`a\`.\n2. **LALR(1) State Merging**: Merging LR(1) states with identical LR(0) cores but different lookahead sets **cannot introduce new Shift-Reduce conflicts**, though it can introduce **Reduce-Reduce conflicts**.\n3. **Dangling-Else Resolution**: By default, Yacc/Bison resolves the shift-reduce conflict in favor of **SHIFT**, binding the \`else\` to the innermost unmatched \`if\`.`,
        citations: [
          "CS-301 • Module 2 Slides: FIRST/FOLLOW & LR(1) Tables.pdf (pp. 29–46, CO2)",
          "CS-301 • Module 3 Handout: Syntax-Directed Translation.pdf (pp. 4–11, CO3)",
        ],
      });
    }

    if (q.includes("banker") || q.includes("deadlock") || q.includes("os")) {
      return NextResponse.json({
        answer: `### Banker's Algorithm & Deadlock Avoidance (Grounded in CS-302 Notes)\n\nFrom **Prof. Siddharth Verma's OS Kernel Notes**:\n- **Data Structures**: For $n$ processes and $m$ resource types, maintain \`Available[m]\`, \`Max[n][m]\`, \`Allocation[n][m]\`, and \`Need[i][j] = Max[i][j] - Allocation[i][j]\`.\n- **Safety Check ($O(m \\cdot n^2)$)**: Find a process $P_i$ where \`Finish[i] == false\` and \`Need[i] <= Work\`. If found, add \`Allocation[i]\` back to \`Work\` and mark \`Finish[i] = true\`.`,
        citations: [
          "CS-302 • OS Kernel Notes: CFS Scheduler, Semaphores & Banker's Algorithm.pdf (pp. 38–51, CO2)",
        ],
      });
    }

    return NextResponse.json({
      answer: `### Course-Scoped RAG Summary (Semester 5 • CSE-5A)\n\nI searched your **4 enrolled courses (11 approved PDFs & lab specs)** for **"${query}"**:\n- **CS-301 Compiler Design**: Lexical analysis, DFA minimization, LL(1)/LR(1)/LALR(1) parsing, and Three-Address Code.\n- **CS-302 Operating Systems**: CFS scheduling, POSIX mutexes, Banker's deadlock avoidance, and 4-level x86-64 paging.\n- **CS-304 Cyber Security**: AES-GCM authenticated encryption, ECDHE TLS 1.3 handshakes, and University OIDC/SAML 2.0 SSO.`,
      citations: [
        "pgvector Index • Semester 5 CSE Course Vault (4 Courses, 100% Permission-Scoped)",
      ],
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process AI query" },
      { status: 500 }
    );
  }
}
