"use client";

import { useMemo } from "react";
import { trpc } from "@/lib/trpc-client";

type VideoStatus = "queued" | "processing" | "completed" | "failed";

export type VideoPollingResult = Record<
  string,
  | {
      status: VideoStatus;
      progress: number | null;
      error: string | null;
      jobId?: string | null;
      updatedAt?: string;
    }
  | undefined
>;

interface UseVideoPollingOptions {
  enabled?: boolean;
}

export function useVideoPolling(
  videoIds: string[],
  options?: UseVideoPollingOptions
) {
  const ids = useMemo(
    () => Array.from(new Set(videoIds)).filter(Boolean),
    [videoIds]
  );

  const queries = trpc.useQueries((t) =>
    ids.map((videoId) =>
      t.video.getVideoProcessingStatus(
        { videoId },
        {
          // adaptive polling interval per video
          refetchInterval: (query) => {
            if (!options?.enabled) return false;
            const status = (query.state.data as { status?: string } | undefined)
              ?.status;
            if (status === "completed" || status === "failed") return false;
            if (status === "processing") return 1000; // 1s
            if (status === "queued") return 3000; // 3s (pode variar até 5s)
            return 5000;
          },
          enabled: Boolean(options?.enabled) && Boolean(videoId),
        }
      )
    )
  );

  const dataById: VideoPollingResult = useMemo(() => {
    const map: VideoPollingResult = {};
    queries.forEach((q, idx) => {
      const id = ids[idx];
      map[id] = q.data;
    });
    return map;
  }, [queries, ids]);

  return {
    dataById,
    isLoading: queries.some((q) => q.isLoading),
    isError: queries.some((q) => q.isError),
    refetchAll: () => queries.forEach((q) => q.refetch()),
  } as const;
}
