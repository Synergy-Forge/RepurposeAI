import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

type SeedTemplate = {
  slug: string;
  name: string;
  description: string;
  platform: string;
  audience: string;
  aspectRatio: string;
  clipLengthMin: number;
  clipLengthMax: number;
  captionStyle: Prisma.InputJsonValue;
  aiPromptOverride: string | null;
  isPopular: boolean;
};

/**
 * Default caption style palette reused by multiple templates.
 * Values map directly to FFmpeg drawtext parameters in
 * `src/lib/video-processing.ts`.
 */
const CAPTION_STYLES = {
  viralBold: {
    fontSize: 56,
    fontColor: "white",
    bgColor: "black",
    bgOpacity: 0.6,
    position: "center",
    fontFamily: "sans-serif",
  },
  classicBottom: {
    fontSize: 48,
    fontColor: "white",
    bgColor: "black",
    bgOpacity: 0.5,
    position: "bottom",
    fontFamily: "sans-serif",
  },
  modernClean: {
    fontSize: 44,
    fontColor: "white",
    bgColor: "black",
    bgOpacity: 0.4,
    position: "bottom",
    fontFamily: "sans-serif",
  },
  minimalTop: {
    fontSize: 40,
    fontColor: "white",
    bgColor: "black",
    bgOpacity: 0.5,
    position: "top",
    fontFamily: "sans-serif",
  },
  corporate: {
    fontSize: 42,
    fontColor: "white",
    bgColor: "navy",
    bgOpacity: 0.7,
    position: "bottom",
    fontFamily: "sans-serif",
  },
} as const satisfies Record<string, Prisma.InputJsonValue>;

const TEMPLATES: SeedTemplate[] = [
  {
    slug: "tiktok-viral-hook",
    name: "TikTok Viral Hook",
    description:
      "Vertical clips that front-load a scroll-stopping hook in the first 3 seconds. Tuned for TikTok's For You page.",
    platform: "tiktok",
    audience: "entertainment",
    aspectRatio: "9:16",
    clipLengthMin: 15,
    clipLengthMax: 60,
    captionStyle: CAPTION_STYLES.viralBold,
    aiPromptOverride:
      "Find the most scroll-stopping, emotionally charged moments. Prioritize strong hooks in the first 3 seconds, surprising twists, and quotable lines. Keep clips punchy and under 60 seconds.",
    isPopular: true,
  },
  {
    slug: "youtube-shorts-educational",
    name: "YouTube Shorts Educational",
    description:
      "Vertical clips optimized for teaching a single concept with clear structure. Works best with tutorial or explainer content.",
    platform: "youtube",
    audience: "educational",
    aspectRatio: "9:16",
    clipLengthMin: 30,
    clipLengthMax: 60,
    captionStyle: CAPTION_STYLES.modernClean,
    aiPromptOverride:
      "Extract educational moments where a complete concept, tip, or step is explained. Each clip should teach one self-contained lesson the viewer can walk away with.",
    isPopular: true,
  },
  {
    slug: "instagram-reels-lifestyle",
    name: "Instagram Reels Lifestyle",
    description:
      "Aesthetic vertical clips for lifestyle, travel, food, and fashion content. Mid-length, mood-forward pacing.",
    platform: "instagram",
    audience: "general",
    aspectRatio: "9:16",
    clipLengthMin: 20,
    clipLengthMax: 45,
    captionStyle: CAPTION_STYLES.minimalTop,
    aiPromptOverride:
      "Identify visually rich, mood-setting moments that work as standalone highlights. Favor aesthetic beats, transitions, and relatable observations over dense information.",
    isPopular: false,
  },
  {
    slug: "linkedin-thought-leadership",
    name: "LinkedIn Thought Leadership",
    description:
      "Square clips for professional audiences. Highlights business insights, frameworks, and contrarian opinions.",
    platform: "linkedin",
    audience: "business",
    aspectRatio: "1:1",
    clipLengthMin: 45,
    clipLengthMax: 90,
    captionStyle: CAPTION_STYLES.corporate,
    aiPromptOverride:
      "Surface business insights, frameworks, contrarian takes, and leadership lessons. Clips should land with a clear point or takeaway a professional audience would share.",
    isPopular: false,
  },
  {
    slug: "x-twitter-clip",
    name: "X / Twitter Clip",
    description:
      "Landscape clips tuned for autoplay timelines. Short, quotable, and front-loaded with the punchline.",
    platform: "twitter",
    audience: "general",
    aspectRatio: "16:9",
    clipLengthMin: 15,
    clipLengthMax: 45,
    captionStyle: CAPTION_STYLES.classicBottom,
    aiPromptOverride:
      "Find quotable, self-contained moments under 45 seconds. Prioritize the one-liner, the reaction, or the ending beat that makes someone hit retweet.",
    isPopular: false,
  },
  {
    slug: "podcast-highlight",
    name: "Podcast Highlight",
    description:
      "Vertical clips built around the best exchange or story from a podcast. Keeps context so the moment still lands cold.",
    platform: "tiktok",
    audience: "general",
    aspectRatio: "9:16",
    clipLengthMin: 45,
    clipLengthMax: 90,
    captionStyle: CAPTION_STYLES.classicBottom,
    aiPromptOverride:
      "Extract podcast highlights where a complete story, exchange, or insight lands with payoff. Include enough setup that a first-time listener understands the moment.",
    isPopular: true,
  },
  {
    slug: "tutorial-step-by-step",
    name: "Tutorial Step-by-Step",
    description:
      "Vertical clips that each capture one discrete step of a how-to. Great for process videos and DIY content.",
    platform: "youtube",
    audience: "educational",
    aspectRatio: "9:16",
    clipLengthMin: 20,
    clipLengthMax: 60,
    captionStyle: CAPTION_STYLES.modernClean,
    aiPromptOverride:
      "Break the content into discrete tutorial steps. Each clip should cover exactly one step or sub-task and be watchable in isolation.",
    isPopular: false,
  },
  {
    slug: "news-recap",
    name: "News Recap",
    description:
      "Landscape clips that summarize one news beat per clip. Front-loaded with the headline takeaway.",
    platform: "youtube",
    audience: "general",
    aspectRatio: "16:9",
    clipLengthMin: 30,
    clipLengthMax: 75,
    captionStyle: CAPTION_STYLES.classicBottom,
    aiPromptOverride:
      "Produce news-style recap clips. Each clip leads with the headline, then gives one or two supporting facts. Keep tone neutral and fact-forward.",
    isPopular: false,
  },
];

/**
 * Upserts all system templates so re-running the seed is idempotent.
 * System templates are keyed by slug; user-authored templates (future) are
 * expected to use a different creation path and are left untouched.
 */
async function seedTemplates(): Promise<void> {
  for (const template of TEMPLATES) {
    await prisma.videoTemplate.upsert({
      where: { slug: template.slug },
      update: {
        name: template.name,
        description: template.description,
        platform: template.platform,
        audience: template.audience,
        aspectRatio: template.aspectRatio,
        clipLengthMin: template.clipLengthMin,
        clipLengthMax: template.clipLengthMax,
        captionStyle: template.captionStyle,
        aiPromptOverride: template.aiPromptOverride,
        isSystem: true,
        isPopular: template.isPopular,
      },
      create: {
        slug: template.slug,
        name: template.name,
        description: template.description,
        platform: template.platform,
        audience: template.audience,
        aspectRatio: template.aspectRatio,
        clipLengthMin: template.clipLengthMin,
        clipLengthMax: template.clipLengthMax,
        captionStyle: template.captionStyle,
        aiPromptOverride: template.aiPromptOverride,
        isSystem: true,
        isPopular: template.isPopular,
      },
    });
    console.log(`  [seed] upserted template: ${template.slug}`);
  }
}

async function main(): Promise<void> {
  console.log("[seed] seeding system video templates...");
  await seedTemplates();
  console.log(`[seed] done. ${TEMPLATES.length} templates ensured.`);
}

main()
  .catch((error) => {
    console.error("[seed] failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
