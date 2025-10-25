"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { TRPCClientErrorLike } from "@trpc/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc-client";
import type { AppRouter } from "@/server/api/root";

type VideoDetailsResponse = Awaited<
  ReturnType<AppRouter["video"]["getVideoWithClips"]>
>;
type VideoStatus = VideoDetailsResponse["video"]["status"];
type ProcessingStatus = Extract<VideoStatus, "uploading" | "processing">;

const isProcessingStatus = (
  status: VideoStatus | undefined
): status is ProcessingStatus =>
  status === "uploading" || status === "processing";

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "N/A";
  }

  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const parts = [
    minutes > 0 ? `${minutes}m` : null,
    `${secs.toString().padStart(2, "0")}s`,
  ].filter(Boolean);

  return parts.join(" ");
};

const sanitizeFileName = (title: string, index: number) => {
  const normalized =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "video";

  return `${normalized}-clip-${String(index + 1).padStart(2, "0")}.mp4`;
};

const toDate = (value: Date | string | null | undefined) => {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
};

export default function VideoDetailsPage() {
  const params = useParams();
  const videoId = typeof params?.id === "string" ? params.id : "";
  const [hasShownFailureToast, setHasShownFailureToast] = useState(false);

  const videoQuery = trpc.video.getVideoWithClips.useQuery(
    { videoId },
    {
      enabled: Boolean(videoId),
      retry: (failureCount, error) => {
        if (
          (error as TRPCClientErrorLike<AppRouter>)?.data?.code === "NOT_FOUND"
        ) {
          return false;
        }
        return failureCount < 3;
      },
      refetchInterval: (query) => {
        const status = query.state.data?.video.status;
        if (!status || isProcessingStatus(status)) {
          return 3000;
        }

        return false;
      },
    }
  );

  const { data, isLoading, isFetching, error } = videoQuery;

  useEffect(() => {
    if (error) {
      const err = error as TRPCClientErrorLike<AppRouter>;
      if (err.data?.code === "NOT_FOUND") {
        toast.error("Video not found or access denied.");
      } else {
        toast.error("Could not load video details. Please try again.");
      }
    }
  }, [error]);

  useEffect(() => {
    if (!data) {
      setHasShownFailureToast(false);
      return;
    }

    if (data.video.status === "failed" && !hasShownFailureToast) {
      toast.error(
        "Video processing failed. Please requeue it from the dashboard."
      );
      setHasShownFailureToast(true);
    }
  }, [data, hasShownFailureToast]);

  const clips = useMemo(() => data?.clips ?? [], [data?.clips]);

  const updatedAt = useMemo(() => toDate(data?.updatedAt), [data?.updatedAt]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if ((error as TRPCClientErrorLike<AppRouter>)?.data?.code === "NOT_FOUND") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Video not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Check that the link is correct or that you have permission to view
              this content.
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We were unable to load the video details. Please try again in a
              few moments.
            </p>
            <Button asChild className="w-full" variant="secondary">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { video, duration } = data;
  const isProcessing = isProcessingStatus(video.status);
  const isFailed = video.status === "failed";

  const createdAt = toDate(video.createdAt);

  const handleDownload = (clipUrl: string, clipIndex: number) => {
    const fileName = sanitizeFileName(video.title, clipIndex);
    const link = document.createElement("a");
    link.href = clipUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Download started: ${fileName}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="gap-2">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{video.title}</h1>
              <p className="text-sm text-muted-foreground">
                {video.description ?? "No description provided."}
              </p>
            </div>
          </div>
          <Badge
            variant={video.status === "completed" ? "default" : "secondary"}
          >
            {video.status}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Video information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Created at
                </h3>
                <p className="text-sm">
                  {createdAt ? createdAt.toLocaleString() : "N/A"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Last updated
                </h3>
                <p className="text-sm">
                  {updatedAt ? updatedAt.toLocaleString() : "N/A"}
                  {isFetching && (
                    <span className="ml-2 inline-flex items-center text-xs text-muted-foreground">
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Refreshing
                    </span>
                  )}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Total duration
                </h3>
                <p className="text-sm">{formatDuration(duration)}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Original URL
                </h3>
                <p className="break-all text-sm text-muted-foreground">
                  {video.originalUrl}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Processing status</CardTitle>
              <CardDescription>
                This page refreshes automatically until processing finishes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">
                  {video.status}
                </span>
                {isFetching && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {isProcessing && (
                <p className="text-sm text-muted-foreground">
                  We are processing your clips. You will be notified when the
                  result is ready.
                </p>
              )}
              {isFailed && (
                <p className="text-sm text-destructive">
                  Processing failed. Requeue the video from the dashboard or
                  contact support.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <section className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Generated clips</h2>
            <span className="text-sm text-muted-foreground">
              {clips.length} {clips.length === 1 ? "clip" : "clips"}
            </span>
          </div>

          {clips.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                {isFailed
                  ? "No clips available because processing failed."
                  : isProcessing
                    ? "Clips are still being generated. This page will refresh automatically."
                    : "No clips were generated for this video."}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {clips.map((clip, index) => (
                <Card key={clip.id} className="overflow-hidden">
                  <CardContent className="space-y-4 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="font-medium">{clip.title}</span>
                        <Badge variant="outline">{clip.aspectRatio}</Badge>
                      </div>
                      <div className="overflow-hidden rounded-md bg-black">
                        <video
                          key={clip.videoUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="h-full w-full"
                          src={clip.videoUrl}
                        >
                          Your browser does not support video playback.
                        </video>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {clip.startTime}s - {clip.endTime}s
                        </span>
                        <span>#{String(index + 1).padStart(2, "0")}</span>
                      </div>
                    </div>

                    {clip.captions && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                          Captions
                        </h3>
                        <p className="text-sm leading-relaxed">
                          {clip.captions}
                        </p>
                      </div>
                    )}

                    {clip.hashtags && (
                      <div className="flex flex-wrap gap-1">
                        {clip.hashtags.split(" ").map((tag, i) => (
                          <Badge key={`${tag}-${i}`} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <Button
                      onClick={() => handleDownload(clip.videoUrl, index)}
                      className="w-full"
                      size="sm"
                    >
                      Download clip {index + 1}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
