"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Play, FileVideo, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc-client";
import { useVideoPolling } from "./hooks/useVideoPolling";

type UploadItem = {
  file: File;
  progress: number;
  status: "uploading" | "processing" | "completed" | "error";
  videoId?: string;
  title?: string;
};

interface UploadPageProps {
  onUpload?: (files: File[]) => void;
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024 * 1024; // 5GB teto local; backend aplica limites por plano

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  // Evitar sobrecarga de memória em arquivos gigantes
  if (buffer.byteLength > MAX_SIZE_BYTES) {
    throw new Error("File too large");
  }
  // Browser: btoa em binário pode quebrar; usar from + toString base64 via polyfill Buffer
  // Next 15 com React 19 usa webpack polyfill de Buffer no client only se habilitado; aqui usaremos b64 manual
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as unknown as number[]);
  }
  return btoa(binary);
}

export function UploadPage({ onUpload }: UploadPageProps) {
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [dragActive, _setDragActive] = useState(false);
  const processingIdsRef = useRef<Set<string>>(new Set());

  const utils = trpc.useUtils();

  const uploadVideo = trpc.video.uploadVideo.useMutation({
    onError: (err) => {
      toast.error(err.message || "Upload failed");
    },
  });
  const processVideo = trpc.video.processVideo.useMutation({
    onError: (err) => {
      toast.error(err.message || "Processing failed");
    },
  });

  const processingIds = useMemo(() =>
    uploadQueue.map((u) => u.videoId).filter(Boolean) as string[],
  [uploadQueue]);

  const polling = useVideoPolling(processingIds, { enabled: processingIds.length > 0 });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles?.length) return;
    onUpload?.(acceptedFiles);

    // Enqueue itens visualmente
    const newItems: UploadItem[] = acceptedFiles.map((file) => ({ file, progress: 0, status: "uploading" }));
    setUploadQueue((prev) => [...prev, ...newItems]);

    for (const item of newItems) {
      try {
        // Limites de tipo/tamanho no client (rápidos); servidor revalida MIME e plano
        if (!item.file.type.startsWith("video/")) {
          throw new Error("Unsupported file type");
        }

        if (item.file.size > MAX_SIZE_BYTES) {
          throw new Error("File exceeds maximum size");
        }

        const title = item.file.name.replace(/\.[^.]+$/, "");
        const base64 = await fileToBase64(item.file);

        const toastId = toast.loading("Uploading video...");
        const uploadRes = await uploadVideo.mutateAsync({
          title,
          description: undefined,
          videoData: base64,
        });
        toast.success("Upload completed", { id: toastId });

        // Atualiza queue com videoId e status
        setUploadQueue((prev) => prev.map((u) =>
          u.file === item.file ? { ...u, status: "processing", progress: 10, videoId: uploadRes.videoId, title } : u
        ));

        // Inicia processamento
        const procToast = toast.loading("Queuing for processing...");
        await processVideo.mutateAsync({ videoId: uploadRes.videoId });
        toast.success("Processing started", { id: procToast });

        processingIdsRef.current.add(uploadRes.videoId);
        // Invalidate lista do usuário
        utils.video.getUserVideos.invalidate();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        toast.error(message);
        setUploadQueue((prev) => prev.map((u) =>
          u.file === item.file ? { ...u, status: "error" } : u
        ));
      }
    }
  }, [onUpload, uploadVideo, processVideo, utils.video.getUserVideos]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"] },
    multiple: true,
  });

  const removeFromQueue = (fileToRemove: File) => {
    setUploadQueue((prev) => prev.filter((item) => item.file !== fileToRemove));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Atualizar progresso visual a partir do polling
  const polledMap = polling.data;
  const renderedQueue = useMemo(() => {
    return uploadQueue.map((u) => {
      if (!u.videoId) return u;
      const p = polledMap[u.videoId];
      if (!p) return u;
      const next: UploadItem = { ...u };
      if (typeof p.progress === "number") next.progress = p.progress;
      if (p.status === "processing" && next.progress < 10) next.progress = 10;
      if (p.status === "completed") next.progress = 100;
      if (p.status === "completed" || p.status === "failed") {
        next.status = p.status === "completed" ? "completed" : "error";
      }
      return next;
    });
  }, [uploadQueue, polledMap]);

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <section className="dashboard-card">
        <div
          {...getRootProps()}
          className={`
            upload-dropzone p-12 cursor-pointer transition-all
            ${isDragActive || dragActive ? "dragover" : ""}
          `}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center space-y-6">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
              <Upload className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>

            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">
                {isDragActive ? "Drop your videos here" : "Upload your videos"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Drag and drop your video files here, or click to browse
              </p>
              <p className="text-sm text-gray-500">Supports MP4, MOV, AVI, MKV, WEBM • Max file size: 5GB</p>
            </div>

            <button className="dashboard-btn btn-primary px-8 py-3 rounded-lg font-semibold">Select Files</button>
          </div>
        </div>
      </section>

      {/* Upload Queue */}
      {renderedQueue.length > 0 && (
        <section className="dashboard-card p-6">
          <h3 className="text-lg font-semibold mb-6">Upload Queue</h3>

          <div className="space-y-4">
            {renderedQueue.map((upload, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  {/* File Icon */}
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileVideo className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium truncate pr-4">{upload.title ?? upload.file.name}</h4>
                      <div className="flex items-center space-x-2">
                        {upload.status === "completed" && <Check className="w-5 h-5 text-green-500" />}
                        <button onClick={() => removeFromQueue(upload.file)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <span>{formatFileSize(upload.file.size)}</span>
                      <span>Video</span>
                      {upload.status === "completed" && (
                        <span className="text-green-600 dark:text-green-400 font-medium">Upload Complete</span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {upload.status !== "completed" && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{upload.status === "uploading" ? "Uploading..." : upload.status === "processing" ? "Processing..." : ""}</span>
                          <span>{upload.progress}%</span>
                        </div>
                        <Progress value={upload.progress} className="h-2" />
                      </div>
                    )}

                    {/* Action Buttons */}
                    {upload.status === "completed" && (
                      <div className="flex space-x-3 mt-3">
                        <button className="dashboard-btn btn-primary px-4 py-2 rounded text-sm">Process Video</button>
                        <button className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <Play className="w-4 h-4 inline mr-1" />
                          Preview
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upload Tips */}
      <section className="dashboard-card p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Tips</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-indigo-600 dark:text-indigo-400">📹 Video Quality</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Upload in the highest quality available</li>
              <li>• Minimum resolution: 720p recommended</li>
              <li>• Clear audio quality improves transcription</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-indigo-600 dark:text-indigo-400">⚡ Processing</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Processing time depends on video length</li>
              <li>• You&apos;ll be notified when complete</li>
              <li>• Multiple videos can be processed simultaneously</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
