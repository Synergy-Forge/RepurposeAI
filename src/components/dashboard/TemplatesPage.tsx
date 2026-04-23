"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Layout, Sparkles, Clock, Target, Users, X } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { Skeleton } from "@/components/ui/skeleton";

type TemplateRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  platform: string;
  audience: string;
  aspectRatio: string;
  clipLengthMin: number;
  clipLengthMax: number;
  captionStyle: unknown;
  isPopular: boolean;
};

type CaptionStyleShape = {
  fontSize?: number;
  fontColor?: string;
  bgColor?: string;
  bgOpacity?: number;
  position?: "top" | "center" | "bottom";
};

function coerceCaptionStyle(value: unknown): CaptionStyleShape {
  if (!value || typeof value !== "object") return {};
  return value as CaptionStyleShape;
}

function captionBoxStyle(style: CaptionStyleShape): React.CSSProperties {
  const bgOpacity = style.bgOpacity ?? 0.5;
  const bgColor = style.bgColor ?? "black";
  return {
    backgroundColor:
      bgColor.startsWith("#") || bgColor.startsWith("rgb")
        ? bgColor
        : cssNamedColor(bgColor),
    color: style.fontColor ?? "white",
    opacity: 1,
    padding: "6px 10px",
    borderRadius: 4,
    fontSize: Math.max(10, Math.round((style.fontSize ?? 48) / 4)),
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    boxShadow: `0 0 0 9999px rgba(0,0,0,0)`,
    background: `${cssNamedColor(bgColor)}${opacityToHex(bgOpacity)}`,
  };
}

/** Rough mapping of a handful of FFmpeg-named colors to CSS. */
function cssNamedColor(name: string): string {
  const normalized = name.toLowerCase();
  const map: Record<string, string> = {
    white: "#ffffff",
    black: "#000000",
    navy: "#001f3f",
    red: "#ef4444",
    blue: "#3b82f6",
    green: "#10b981",
    yellow: "#facc15",
  };
  if (normalized in map) return map[normalized];
  if (normalized.startsWith("#")) return normalized;
  return "#000000";
}

function opacityToHex(opacity: number): string {
  const clamped = Math.max(0, Math.min(1, opacity));
  const byte = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, "0");
  return byte;
}

function positionStyle(position?: string): React.CSSProperties {
  switch (position) {
    case "top":
      return { top: 10 };
    case "center":
      return { top: "50%", transform: "translate(-50%, -50%)" };
    case "bottom":
    default:
      return { bottom: 10 };
  }
}

const ASPECT_RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "9:16": { width: 90, height: 160 },
  "1:1": { width: 130, height: 130 },
  "16:9": { width: 160, height: 90 },
};

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  twitter: "X / Twitter",
};

function TemplatePreview({ template }: { template: TemplateRow }) {
  const style = coerceCaptionStyle(template.captionStyle);
  const dimensions =
    ASPECT_RATIO_DIMENSIONS[template.aspectRatio] ??
    ASPECT_RATIO_DIMENSIONS["9:16"];

  return (
    <div
      className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg overflow-hidden flex items-center justify-center mx-auto"
      style={dimensions}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
      <div
        style={{
          ...captionBoxStyle(style),
          ...positionStyle(style.position),
        }}
      >
        Caption preview
      </div>
    </div>
  );
}

function TemplateModal({
  template,
  onClose,
}: {
  template: TemplateRow;
  onClose: () => void;
}) {
  const style = coerceCaptionStyle(template.captionStyle);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="dashboard-card max-w-2xl w-full p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0 mx-auto">
            <TemplatePreview template={template} />
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold">{template.name}</h2>
                {template.isPopular && (
                  <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    Popular
                  </span>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {template.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  Platform:
                </span>
                <span className="font-medium">
                  {PLATFORM_LABELS[template.platform] ?? template.platform}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  Audience:
                </span>
                <span className="font-medium capitalize">
                  {template.audience}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-indigo-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  Ratio:
                </span>
                <span className="font-medium">{template.aspectRatio}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  Length:
                </span>
                <span className="font-medium">
                  {template.clipLengthMin}–{template.clipLengthMax}s
                </span>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="text-sm font-semibold mb-2">Caption style</h4>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div>Font size: {style.fontSize ?? 48}px</div>
                <div>Position: {style.position ?? "bottom"}</div>
                <div>Color: {style.fontColor ?? "white"}</div>
                <div>
                  Background: {style.bgColor ?? "black"} @{" "}
                  {Math.round((style.bgOpacity ?? 0.5) * 100)}%
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href={`/dashboard/upload?template=${template.slug}`}
                className="dashboard-btn btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold"
              >
                <Sparkles className="w-4 h-4" />
                Use this template for a new upload
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TemplatesPage() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  const templatesQuery = trpc.template.list.useQuery();

  const platforms = useMemo<string[]>(() => {
    const data = templatesQuery.data as TemplateRow[] | undefined;
    if (!data) return [];
    const set = new Set<string>();
    for (const template of data) set.add(template.platform);
    return Array.from(set).sort();
  }, [templatesQuery.data]);

  const filtered = useMemo<TemplateRow[]>(() => {
    const data = templatesQuery.data as TemplateRow[] | undefined;
    if (!data) return [];
    if (platformFilter === "all") return data;
    return data.filter((t) => t.platform === platformFilter);
  }, [templatesQuery.data, platformFilter]);

  const selected = (() => {
    const data = templatesQuery.data as TemplateRow[] | undefined;
    if (!selectedSlug || !data) return null;
    return data.find((t) => t.slug === selectedSlug) ?? null;
  })();

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Layout className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Video Templates</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
          Pick a template before you upload to shape the aspect ratio, caption
          style, clip length, and the way our AI picks key moments for your
          target platform.
        </p>
      </div>

      {templatesQuery.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : templatesQuery.isError ? (
        <div className="dashboard-card p-6 text-center">
          <p className="text-red-600 dark:text-red-400">
            Failed to load templates. Try refreshing the page.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setPlatformFilter("all")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                platformFilter === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              All
            </button>
            {platforms.map((platform) => (
              <button
                key={platform}
                onClick={() => setPlatformFilter(platform)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  platformFilter === platform
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {PLATFORM_LABELS[platform] ?? platform}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedSlug(template.slug)}
                className="dashboard-card p-0 overflow-hidden text-left hover:ring-2 hover:ring-indigo-500 transition-all group"
              >
                <div className="h-44 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center relative">
                  <TemplatePreview template={template} />
                  {template.isPopular && (
                    <span className="absolute top-3 right-3 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Popular
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {template.name}
                    </h3>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                      {template.aspectRatio}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="uppercase tracking-wide font-medium">
                      {PLATFORM_LABELS[template.platform] ?? template.platform}
                    </span>
                    <span>
                      {template.clipLengthMin}–{template.clipLengthMax}s
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="dashboard-card p-8 text-center text-gray-600 dark:text-gray-400">
              No templates match the current filter.
            </div>
          )}
        </>
      )}

      {selected && (
        <TemplateModal
          template={selected as TemplateRow}
          onClose={() => setSelectedSlug(null)}
        />
      )}
    </div>
  );
}
