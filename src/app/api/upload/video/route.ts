import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ensureDirectory,
  storagePaths,
  buildUploadsPath,
  toPublicUrl,
  resolveStoredPath,
} from "@/lib/storage";
import { randomUUID } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { createWriteStream } from "node:fs";
import { once } from "node:events";

const MB = 1024 * 1024;
const GB = MB * 1024;

const SUBSCRIPTION_UPLOAD_LIMITS: Record<string, number> = {
  free: 100 * MB,
  basic: 500 * MB,
  pro: 2 * GB,
  enterprise: 5 * GB,
  default: 500 * MB,
};

const ALLOWED_VIDEO_MIME_TYPES = new Set<string>([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
  "video/x-msvideo",
  "video/avi",
]);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file");
    const title = (form.get("title") as string | null) ?? null;
    const description = (form.get("description") as string | null) ?? null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    // Validate subscription limit by size (server-side)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionStatus: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subscriptionPlan = user.subscriptionStatus?.toLowerCase() ?? "free";
    const maxUploadSizeBytes =
      SUBSCRIPTION_UPLOAD_LIMITS[subscriptionPlan] ??
      SUBSCRIPTION_UPLOAD_LIMITS.default;

    if (typeof file.size === "number" && file.size > maxUploadSizeBytes) {
      return NextResponse.json(
        {
          error: `Video size exceeds the ${subscriptionPlan} plan limit of ${(maxUploadSizeBytes / MB).toFixed(0)}MB`,
        },
        { status: 413 }
      );
    }

    // Detect MIME from a small prefix and stream to disk using a separate tee branch
    const webStream = file.stream();
    // Split stream into two branches: one for detection (small prefix) and one for saving
     
    const [detectStream, saveStream] = (webStream as ReadableStream<Uint8Array>).tee();

    // Read up to 64KB for detection
    const reader = detectStream.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    const MAX_PROBE = 64 * 1024;
    while (total < MAX_PROBE) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      total += value.byteLength;
    }
    // Cancel the remaining of detect branch
    try {
      await reader.cancel();
    } catch (err) {
      console.error("Error cancelling detectStream reader:", err);
    }

    const probe = chunks.length
      ? Buffer.concat(chunks.map((u) => Buffer.from(u)))
      : Buffer.alloc(0);
    const detectedType = await fileTypeFromBuffer(probe);

    if (!detectedType || !ALLOWED_VIDEO_MIME_TYPES.has(detectedType.mime)) {
      const allowedFormats = Array.from(ALLOWED_VIDEO_MIME_TYPES)
        .map((t) => t.split("/")[1])
        .join(", ");
      return NextResponse.json(
        {
          error: `Unsupported video format${detectedType?.mime ? ` (${detectedType.mime})` : ""}. Allowed formats: ${allowedFormats}`,
        },
        { status: 400 }
      );
    }

    const videoFileExtension = detectedType.ext ?? "mp4";
    const videoFileName = `${randomUUID()}.${videoFileExtension}`;
    const relativeVideoPath = buildUploadsPath(
      "uploads",
      "videos",
      videoFileName
    );
    const absoluteVideoPath = resolveStoredPath(relativeVideoPath);

    await ensureDirectory(storagePaths.originalsDir);

    // Stream write using the remaining stream from typeProbe (no buffering in memory)
    const writeStream = createWriteStream(absoluteVideoPath);
    const reader2 = saveStream.getReader();
    let writtenTotal = 0;
    const MAX_FILE_SIZE = maxUploadSizeBytes; // per-plan limit

    try {
      while (true) {
        const { done, value } = await reader2.read();
        if (done) break;
        if (!value) continue;

        writtenTotal += value.byteLength;
        if (writtenTotal > MAX_FILE_SIZE) {
          try {
            await reader2.cancel();
          } catch (cancelErr) {
            console.error("[upload:video] error cancelling reader2", cancelErr);
          }
          writeStream.destroy();
          return NextResponse.json(
            { error: "File exceeds plan size limit" },
            { status: 413 }
          );
        }

        const canContinue = writeStream.write(Buffer.from(value));
        if (!canContinue) {
          await once(writeStream, "drain");
        }
      }
    } finally {
      await new Promise<void>((resolve, reject) => {
        writeStream.end(() => resolve());
        writeStream.on("error", reject);
      });
    }

    const publicVideoUrl = toPublicUrl(relativeVideoPath);
    const video = await prisma.video.create({
      data: {
        id: randomUUID(),
        title: title ?? file.name.replace(/\.[^.]+$/, ""),
        description: description ?? undefined,
        originalUrl: publicVideoUrl,
        userId: session.user.id,
        status: "uploading",
        updatedAt: new Date(),
      },
      select: { id: true },
    });

    return NextResponse.json({ videoId: video.id }, { status: 200 });
  } catch (err) {
    console.error("[upload:video] error", err);
    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    );
  }
}
