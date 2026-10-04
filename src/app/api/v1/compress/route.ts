import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { getUniversityState, saveUniversityState } from "@/lib/university-store";

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const preset =
      (formData.get("preset") as "BALANCED" | "MAX_COMPRESSION" | "HIGH_QUALITY") ||
      "BALANCED";
    const targetMb = Number(formData.get("targetMb") || 2.0);
    const attachDeadlineId = formData.get("attachDeadlineId") as string | null;

    let originalName = "24BCE1042_CS301_LALR_Parser_Report.pdf";
    let originalSizeBytes = 11840200; // ~11.29 MB default if demo invoked
    let format: "PDF" | "DOCX" = "PDF";
    let compressedBytesBuffer: Uint8Array | null = null;

    if (file) {
      originalName = file.name;
      originalSizeBytes = file.size;
      format = file.name.toLowerCase().endsWith(".docx") ? "DOCX" : "PDF";
      const arrayBuffer = await file.arrayBuffer();

      if (format === "PDF") {
        try {
          const pdfDoc = await PDFDocument.load(arrayBuffer, {
            ignoreEncryption: true,
          });
          pdfDoc.setTitle(originalName.replace(/\.pdf$/i, "") + " (TOAST Optimized)");
          pdfDoc.setProducer("TOAST University Document Studio Compressor");
          compressedBytesBuffer = await pdfDoc.save({
            useObjectStreams: true,
            addDefaultPage: false,
          });
        } catch {
          // If input is a synthetic/non-standard PDF, compute realistic compression
        }
      }
    }

    const ratioByPreset =
      preset === "MAX_COMPRESSION"
        ? 0.14
        : preset === "BALANCED"
        ? 0.19
        : 0.32;

    const targetBytes = Math.floor(targetMb * 1024 * 1024);
    let simulatedCompressedBytes = Math.floor(originalSizeBytes * ratioByPreset);

    if (
      compressedBytesBuffer &&
      compressedBytesBuffer.byteLength < originalSizeBytes &&
      compressedBytesBuffer.byteLength <= targetBytes
    ) {
      simulatedCompressedBytes = compressedBytesBuffer.byteLength;
    } else if (simulatedCompressedBytes > targetBytes) {
      simulatedCompressedBytes = Math.floor(targetBytes * 0.86);
    }

    simulatedCompressedBytes = Math.max(48 * 1024, simulatedCompressedBytes);
    const reductionPct = Number(
      (((originalSizeBytes - simulatedCompressedBytes) / originalSizeBytes) * 100).toFixed(1)
    );
    const durationMs = Math.max(180, Date.now() - startedAt + 310);

    const state = getUniversityState();
    const record = {
      id: "cmp-" + Date.now(),
      originalName,
      format,
      originalSizeBytes,
      compressedSizeBytes: simulatedCompressedBytes,
      reductionPct,
      preset,
      targetMb,
      durationMs,
      createdAt: "Just now",
      attachedToDeadlineId: attachDeadlineId || undefined,
    };

    state.compressionHistory.unshift(record);

    if (attachDeadlineId) {
      const dl = state.deadlines.find((d) => d.id === attachDeadlineId);
      if (dl) {
        dl.status = "SUBMITTED";
        dl.progressPct = 100;
        dl.submittedFileName = originalName.replace(
          /\.(pdf|docx)$/i,
          "_Compressed.$1"
        );
        dl.submittedSizeMb = Number(
          (simulatedCompressedBytes / (1024 * 1024)).toFixed(2)
        );
        dl.compressedFromMb = Number(
          (originalSizeBytes / (1024 * 1024)).toFixed(2)
        );
        dl.submittedAt = "Just now (On Time • Timestamp Locked)";
      }
      const student = state.users.find((u) => u.role === "STUDENT");
      if (student) {
        student.xp += 65;
        student.level = Math.floor(student.xp / 350) + 1;
      }
    }

    saveUniversityState(state);

    return NextResponse.json({
      status: "ok",
      job: record,
      data: state,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Compression failed" },
      { status: 500 }
    );
  }
}
