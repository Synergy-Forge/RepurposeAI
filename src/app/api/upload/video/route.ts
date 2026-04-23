import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildUploadsPath, storageProvider } from "@/lib/storage";
import { randomUUID } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { Readable, Transform } from "node:stream";

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

const ALLOWED_AUDIENCES = new Set(["general", "business", "educational", "entertainment"]);
const ALLOWED_PLATFORMS = new Set(["youtube", "tiktok", "instagram", "linkedin", "twitter"]);

function sanitizeIntegerInRange(value: string | null, min: number, max: number): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < min || parsed > max) return null;
  return parsed;
}

export async function POST(req: Request) {
  try {
    console.log("[upload:video] POST received");
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("[upload:video] auth ok", { userId: session.user.id });

    console.log("[upload:video] awaiting formData...");
    const form = await req.formData();
    const file = form.get("file");
    const title = (form.get("title") as string | null) ?? null;
    const description = (form.get("description") as string | null) ?? null;
    const templateSlug = (form.get("templateSlug") as string | null) ?? null;
    const audienceRaw = (form.get("audience") as string | null) ?? null;
    const platformRaw = (form.get("platform") as string | null) ?? null;
    const clipLengthRaw = (form.get("clipLength") as string | null) ?? null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    console.log("[upload:video] formData parsed", {
      fileSize: file.size,
      fileName: file.name,
      hasTitle: !!title,
      hasTemplate: !!templateSlug,
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionStatus: true },
    });
    console.log("[upload:video] user lookup done", { hasUser: !!user });

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

    // Validate optional template + overrides before we commit to storing the video
    let templateId: string | null = null;
    if (templateSlug) {
      const template = await prisma.videoTemplate.findUnique({
        where: { slug: templateSlug },
        select: { id: true },
      });
      if (!template) {
        return NextResponse.json(
          { error: `Unknown template: ${templateSlug}` },
          { status: 400 }
        );
      }
      templateId = template.id;
    }

    const audience =
      audienceRaw && ALLOWED_AUDIENCES.has(audienceRaw) ? audienceRaw : null;
    const platform =
      platformRaw && ALLOWED_PLATFORMS.has(platformRaw) ? platformRaw : null;
    const clipLength = sanitizeIntegerInRange(clipLengthRaw, 10, 300);

    const webStream = file.stream();
    const [detectStream, saveStream] = (webStream as ReadableStream<Uint8Array>).tee();

    const reader = detectStream.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    const MAX_PROBE = 64 * 1024;
    console.log("[upload:video] starting mime probe");
    while (total < MAX_PROBE) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      total += value.byteLength;
    }
    try {
      await reader.cancel();
    } catch (err) {
      console.error("Error cancelling detectStream reader:", err);
    }
    console.log("[upload:video] mime probe done", { probeBytes: total });

    const probe = chunks.length
      ? Buffer.concat(chunks.map((u) => Buffer.from(u)))
      : Buffer.alloc(0);
    const detectedType = await fileTypeFromBuffer(probe);
    console.log("[upload:video] mime detected", { mime: detectedType?.mime });

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
    const relativeVideoPath = buildUploadsPath("uploads", "videos", videoFileName);

    const nodeReadable = Readable.fromWeb(
      saveStream as Parameters<typeof Readable.fromWeb>[0]
    );
    let writtenTotal = 0;
    const MAX_FILE_SIZE = maxUploadSizeBytes;

    const sizeGuard = new Transform({
      transform(
        chunk: Buffer,
        _encoding: string,
        callback: (err?: Error | null, data?: Buffer) => void
      ) {
        writtenTotal += chunk.length;
        if (writtenTotal > MAX_FILE_SIZE) {
          callback(new Error("FILE_TOO_LARGE"));
        } else {
          callback(null, chunk);
        }
      },
    });

    let publicVideoUrl: string;
    try {
      console.log("[upload:video] storage save start", { relativeVideoPath });
      publicVideoUrl = await storageProvider.save(
        nodeReadable.pipe(sizeGuard),
        relativeVideoPath
      );
      console.log("[upload:video] storage save done", { publicVideoUrl });
    } catch (err) {
      if (err instanceof Error && err.message === "FILE_TOO_LARGE") {
        return NextResponse.json(
          { error: "File exceeds plan size limit" },
          { status: 413 }
        );
      }
      throw err;
    }

    const video = await prisma.video.create({
      data: {
        id: randomUUID(),
        title: title ?? file.name.replace(/\.[^.]+$/, ""),
        description: description ?? undefined,
        originalUrl: publicVideoUrl,
        userId: session.user.id,
        status: "uploading",
        updatedAt: new Date(),
        templateId,
        audience,
        platform,
        clipLength,
      },
      select: { id: true },
    });
    console.log("[upload:video] video row created", { videoId: video.id });

    return NextResponse.json({ videoId: video.id }, { status: 200 });
  } catch (err) {
    console.error("[upload:video] error", err);
    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    );
  }
}
