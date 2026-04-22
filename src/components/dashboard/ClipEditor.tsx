"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc-client";
import { Skeleton } from "@/components/ui/skeleton";

type AspectRatio = "9:16" | "1:1" | "16:9";

interface ClipEditorProps {
  clipId: string;
}

function isAspectRatio(value: string): value is AspectRatio {
  return value === "9:16" || value === "1:1" || value === "16:9";
}

export function ClipEditor({ clipId }: ClipEditorProps) {
  const router = useRouter();
  const clipQuery = trpc.video.getClipForEditor.useQuery({ clipId });
  const templatesQuery = trpc.template.list.useQuery();
  const utils = trpc.useUtils();

  const reRender = trpc.video.reRenderClip.useMutation({
    onSuccess: () => {
      toast.success("Clip re-render queued. Refresh in a moment to preview.");
      utils.video.getClipForEditor.invalidate({ clipId });
      utils.video.getAllUserClips.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to queue clip re-render");
    },
  });

  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [captions, setCaptions] = useState<string>("");
  const [templateSlug, setTemplateSlug] = useState<string>("");

  useEffect(() => {
    if (!clipQuery.data) return;
    setStartTime(clipQuery.data.startTime);
    setEndTime(clipQuery.data.endTime);
    setAspectRatio(
      isAspectRatio(clipQuery.data.aspectRatio)
        ? clipQuery.data.aspectRatio
        : "9:16"
    );
    setCaptions(clipQuery.data.captions ?? "");
    setTemplateSlug(clipQuery.data.templateSlug ?? "");
  }, [clipQuery.data]);

  const videoDuration = clipQuery.data?.video.duration ?? null;
  const clipDuration = useMemo(
    () => Math.max(0, endTime - startTime),
    [startTime, endTime]
  );

  const hasChanges = useMemo(() => {
    if (!clipQuery.data) return false;
    return (
      startTime !== clipQuery.data.startTime ||
      endTime !== clipQuery.data.endTime ||
      aspectRatio !== clipQuery.data.aspectRatio ||
      captions !== (clipQuery.data.captions ?? "") ||
      templateSlug !== (clipQuery.data.templateSlug ?? "")
    );
  }, [clipQuery.data, startTime, endTime, aspectRatio, captions, templateSlug]);

  const handleSave = () => {
    if (endTime <= startTime) {
      toast.error("End time must be greater than start time");
      return;
    }
    if (videoDuration && endTime > videoDuration + 2) {
      toast.error(`End time cannot exceed video duration (${videoDuration}s)`);
      return;
    }

    reRender.mutate({
      clipId,
      startTime,
      endTime,
      aspectRatio,
      captions,
      templateSlug: templateSlug || undefined,
    });
  };

  if (clipQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (clipQuery.isError || !clipQuery.data) {
    return (
      <div className="dashboard-card p-8 text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">
          Couldn&apos;t load this clip.
        </p>
        <button
          onClick={() => router.push("/dashboard/editor")}
          className="dashboard-btn btn-primary px-4 py-2 rounded"
        >
          Back to clips
        </button>
      </div>
    );
  }

  const clip = clipQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/editor"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to clips
        </Link>

        <button
          onClick={handleSave}
          disabled={!hasChanges || reRender.isPending}
          className="dashboard-btn btn-primary inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {reRender.isPending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Queueing…
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save &amp; re-render
            </>
          )}
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{clip.title}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          From video: {clip.video.title}
          {videoDuration ? ` · ${Math.round(videoDuration)}s total` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dashboard-card p-4">
          <h2 className="text-sm font-semibold mb-3">Preview</h2>
          {clip.videoUrl ? (
            <video
              src={clip.videoUrl}
              controls
              className="w-full rounded-lg bg-black aspect-video"
            />
          ) : (
            <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
              No preview available
            </div>
          )}
          <p className="text-xs text-gray-500 mt-3">
            Preview shows the currently saved render. Saving queues a new
            render based on your edits.
          </p>
        </div>

        <div className="dashboard-card p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Start time (s)
              </label>
              <input
                type="number"
                value={startTime}
                min={0}
                max={videoDuration ?? undefined}
                step={0.01}
                onChange={(e) => setStartTime(Number(e.target.value))}
                className="dashboard-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                End time (s)
              </label>
              <input
                type="number"
                value={endTime}
                min={0}
                max={videoDuration ?? undefined}
                step={0.01}
                onChange={(e) => setEndTime(Number(e.target.value))}
                className="dashboard-input"
              />
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Clip length: {clipDuration.toFixed(2)}s
            {videoDuration ? ` (source ${videoDuration}s)` : ""}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Aspect ratio
            </label>
            <select
              value={aspectRatio}
              onChange={(e) => {
                const value = e.target.value;
                if (isAspectRatio(value)) setAspectRatio(value);
              }}
              className="dashboard-input"
            >
              <option value="9:16">9:16 — Vertical (TikTok, Shorts)</option>
              <option value="1:1">1:1 — Square</option>
              <option value="16:9">16:9 — Landscape</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Template</label>
            <select
              value={templateSlug}
              onChange={(e) => setTemplateSlug(e.target.value)}
              className="dashboard-input"
              disabled={templatesQuery.isLoading}
            >
              <option value="">(No template — keep current style)</option>
              {templatesQuery.data?.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Picking a template applies its caption style on the next render.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Captions</label>
            <textarea
              value={captions}
              onChange={(e) => setCaptions(e.target.value)}
              rows={4}
              className="dashboard-input resize-none"
              placeholder="Caption text burned into the clip"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
