"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Edit3, Clock, Film } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { Skeleton } from "@/components/ui/skeleton";

function formatDuration(seconds: number): string {
  const rounded = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function EditorPage() {
  const [aspectFilter, setAspectFilter] = useState<string>("all");
  const clipsQuery = trpc.video.getAllUserClips.useQuery();

  const filtered = useMemo(() => {
    if (!clipsQuery.data) return [];
    if (aspectFilter === "all") return clipsQuery.data;
    return clipsQuery.data.filter((c) => c.aspectRatio === aspectFilter);
  }, [clipsQuery.data, aspectFilter]);

  const aspectRatios = useMemo<string[]>(() => {
    if (!clipsQuery.data) return [];
    const set = new Set<string>();
    for (const clip of clipsQuery.data) set.add(clip.aspectRatio);
    return Array.from(set).sort();
  }, [clipsQuery.data]);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Edit3 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Clip Editor</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
          Refine any AI-generated clip. Trim the start and end, change aspect
          ratio, adjust captions, or swap templates. Saved edits re-render the
          clip with your new settings.
        </p>
      </div>

      {clipsQuery.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-lg" />
          ))}
        </div>
      ) : clipsQuery.isError ? (
        <div className="dashboard-card p-6 text-center">
          <p className="text-red-600 dark:text-red-400">
            Failed to load clips. Try refreshing.
          </p>
        </div>
      ) : clipsQuery.data && clipsQuery.data.length === 0 ? (
        <div className="dashboard-card p-12 text-center">
          <Film className="w-10 h-10 mx-auto mb-4 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No clips yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Upload a video and process it to start generating clips.
          </p>
          <Link
            href="/dashboard/upload"
            className="dashboard-btn btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold"
          >
            Upload a video
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setAspectFilter("all")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                aspectFilter === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              All ratios
            </button>
            {aspectRatios.map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectFilter(ratio)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  aspectFilter === ratio
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((clip) => (
              <Link
                key={clip.id}
                href={`/clip/${clip.id}/edit`}
                className="dashboard-card p-0 overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all group"
              >
                <div className="relative aspect-video bg-gray-900">
                  {clip.videoUrl ? (
                    <video
                      src={clip.videoUrl}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      No preview
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                    {clip.aspectRatio}
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(clip.endTime - clip.startTime)}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1">
                    {clip.title}
                  </h3>
                  <p className="text-xs text-gray-500 truncate mb-2">
                    From: {clip.video.title}
                  </p>
                  {clip.captions && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {clip.captions}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="dashboard-card p-8 text-center text-gray-600 dark:text-gray-400">
              No clips match the current filter.
            </div>
          )}
        </>
      )}
    </div>
  );
}
