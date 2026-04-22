// CONTEXT: This file contains all the logic for processing a video.
// It has been refactored to use "lazy initialization" for the OpenAI client,
// preventing build-time errors by creating the client only when a function is executed.

import { spawn } from 'child_process';
import { join } from 'path';
import { tmpdir } from 'os';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import { unlink as removeFile } from 'fs/promises';
import {
  buildUploadsPath,
  storageProvider,
  createReadStream,
} from '@/lib/storage';
import { getTranscription } from './transcription';
import { Transcription } from 'openai/resources/audio/transcriptions';

/** Lazily creates the OpenAI client so build-time imports don't require the API key. */
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('FATAL: OPENAI_API_KEY environment variable is not set in the current process.');
  }
  return new OpenAI({ apiKey, timeout: 60000 });
}

const FFMPEG_TIMEOUT_MS = parseInt(process.env.FFMPEG_TIMEOUT_MS ?? '900000', 10);

// ============================================================================
// Interfaces and Helper Types
// ============================================================================

export interface KeyMoment {
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  hashtags: string[];
}

export type CaptionPosition = 'top' | 'center' | 'bottom';

export interface CaptionStyle {
  fontSize: number;
  fontColor: string;
  bgColor: string;
  bgOpacity: number;
  position: CaptionPosition;
  fontFamily?: string;
}

export interface BrandingConfig {
  enabled: boolean;
  /** Absolute local path to a logo image. FFmpeg cannot fetch URLs directly. */
  logoPath?: string;
}

export interface TemplateConfig {
  aspectRatios?: string[];
  captionStyle?: CaptionStyle;
  branding?: BrandingConfig;
  aiPromptOverride?: string | null;
  clipLengthMin?: number;
  clipLengthMax?: number;
  platform?: string;
  audience?: string;
}

export interface ProcessedClip {
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  aspectRatio: string;
  videoUrl: string;
  captions: string;
  hashtags: string;
  captionStyle?: CaptionStyle;
}

interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}
interface VerboseTranscription extends Transcription {
  segments: TranscriptionSegment[];
}

/**
 * Fallback caption style that matches the legacy hardcoded FFmpeg drawtext
 * configuration. Used when a caller does not provide a template.
 */
export const DEFAULT_CAPTION_STYLE: CaptionStyle = {
  fontSize: 48,
  fontColor: 'white',
  bgColor: 'black',
  bgOpacity: 0.5,
  position: 'bottom',
  fontFamily: 'sans-serif',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sanitizes text before embedding it in an FFmpeg drawtext filter. Replaces
 * single quotes with a visually similar safe character and escapes other
 * filter-breaking characters.
 */
function sanitizeTextForFFmpeg(text: string): string {
  if (!text) return '';
  return text.replace(/'/g, '’').replace(/[\\$:"]/g, '\\$&');
}

/** Returns true if the input is a valid hex color (e.g. "#fff" or "#ffffff"). */
function isHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

/**
 * FFmpeg drawtext accepts either named colors (`white`, `navy`) or
 * `0xRRGGBB` / `@` hex notation. This normalizes user-supplied hex values to
 * the `0xRRGGBB` form FFmpeg prefers and leaves named colors alone.
 */
function normalizeFfmpegColor(color: string): string {
  if (!color) return 'white';
  if (isHexColor(color)) {
    const hex = color.slice(1);
    const full = hex.length === 3
      ? hex.split('').map((c) => c + c).join('')
      : hex;
    return `0x${full.toLowerCase()}`;
  }
  return color;
}

/**
 * Uses ffprobe to safely check whether a video file contains an audio stream
 * before attempting to extract audio.
 */
function hasAudioStream(videoPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error', '-select_streams', 'a:0',
      '-show_entries', 'stream=codec_type', '-of', 'default=noprint_wrappers=1:nokey=1',
      videoPath
    ]);
    let output = '';
    ffprobe.stdout.on('data', (data) => { output += data.toString(); });
    ffprobe.on('close', () => resolve(output.trim().length > 0));
    ffprobe.on('error', () => resolve(false));
  });
}

/** Maps an aspect ratio label to the FFmpeg scale dimensions. */
function getScaleForAspectRatio(aspectRatio: string): string {
  switch (aspectRatio) {
    case '9:16': return '1080:1920';
    case '1:1': return '1080:1080';
    case '16:9': return '1920:1080';
    default: return '1920:1080';
  }
}

/**
 * Returns the FFmpeg drawtext `y=` expression for the requested caption
 * position. `h` is the scaled video height, `th` is the rendered text height.
 */
function drawtextYExpression(position: CaptionPosition): string {
  switch (position) {
    case 'top':
      return '50';
    case 'center':
      return '(h-th)/2';
    case 'bottom':
    default:
      return 'h-th-50';
  }
}

/**
 * Builds the `drawtext` filter segment from a CaptionStyle. Kept internal so
 * the caller only needs to pass the sanitized caption text and the style.
 */
function buildDrawtextFilter(
  sanitizedCaption: string,
  style: CaptionStyle
): string {
  const fontColor = normalizeFfmpegColor(style.fontColor);
  const boxColor = normalizeFfmpegColor(style.bgColor);
  const clampedOpacity = Math.max(0, Math.min(1, style.bgOpacity));
  const y = drawtextYExpression(style.position);
  return [
    `drawtext=text='${sanitizedCaption}'`,
    `fontcolor=${fontColor}`,
    `fontsize=${style.fontSize}`,
    `box=1`,
    `boxcolor=${boxColor}@${clampedOpacity}`,
    `boxborderw=5`,
    `x=(w-text_w)/2`,
    `y=${y}`,
  ].join(':');
}

// ============================================================================
// Main Exported Functions
// ============================================================================

/**
 * Extracts the audio track from a video as an MP3 suitable for transcription.
 * Rejects if the video has no audio stream.
 */
export async function extractAudioFromVideo(videoPath: string): Promise<string> {
  const hasAudio = await hasAudioStream(videoPath);
  if (!hasAudio) {
    throw new Error('The uploaded video does not contain an audio stream.');
  }

  const audioPath = join(tmpdir(), `${randomUUID()}.mp3`);
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', videoPath, '-vn', '-acodec', 'mp3',
      '-ab', '128k', '-ar', '44100', '-y', audioPath,
    ]);
    let errorOutput = '';

    const timer = setTimeout(() => {
      ffmpeg.kill('SIGKILL');
      reject(new Error('FFmpeg audio extraction timed out'));
    }, FFMPEG_TIMEOUT_MS);

    ffmpeg.stderr.on('data', (data) => { errorOutput += data.toString(); });
    ffmpeg.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve(audioPath);
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}. Stderr: ${errorOutput}`));
      }
    });
    ffmpeg.on('error', (err) => { clearTimeout(timer); reject(err); });
  });
}

/**
 * Uses GPT-4o to identify key moments in a verbose transcription. When a
 * TemplateConfig is passed, its `aiPromptOverride` replaces the default
 * instructions, and `platform`/`audience`/`clipLength*` are woven into the
 * prompt so the model respects user-facing knobs that were previously inert.
 */
export async function generateKeyMoments(
  transcript: VerboseTranscription,
  templateConfig?: TemplateConfig
): Promise<KeyMoment[]> {
  const openai = getOpenAIClient();
  const transcriptWithTimestamps = transcript.segments
    .map((seg) => `[${seg.start.toFixed(2)}s - ${seg.end.toFixed(2)}s] ${seg.text}`)
    .join('\n');

  const lengthHintParts: string[] = [];
  if (templateConfig?.clipLengthMin != null) {
    lengthHintParts.push(`at least ${templateConfig.clipLengthMin}s`);
  }
  if (templateConfig?.clipLengthMax != null) {
    lengthHintParts.push(`at most ${templateConfig.clipLengthMax}s`);
  }
  const lengthHint = lengthHintParts.length
    ? `Target clip length: ${lengthHintParts.join(', ')}.`
    : '';

  const contextHintParts: string[] = [];
  if (templateConfig?.platform) {
    contextHintParts.push(`Target platform: ${templateConfig.platform}.`);
  }
  if (templateConfig?.audience) {
    contextHintParts.push(`Target audience: ${templateConfig.audience}.`);
  }
  const contextHint = contextHintParts.join(' ');

  const baseInstruction = templateConfig?.aiPromptOverride
    ? templateConfig.aiPromptOverride
    : 'Identify 5 to 8 key moments suitable for short-form content. Each moment should have a catchy title, a brief description, precise startTime and endTime from the provided segments, and relevant hashtags.';

  const prompt = `
    Analyze the following video transcript, which includes timestamps for each segment.

    ${baseInstruction}

    ${contextHint}
    ${lengthHint}

    You MUST return your response as a single, valid JSON object with a root key named "clips" which contains an array of objects. Each clip must include title, description, startTime (seconds), endTime (seconds), and hashtags (array of strings).

    Example format:
    {
      "clips": [
        {
          "title": "Example Title",
          "description": "Example description of the moment.",
          "startTime": 45.12,
          "endTime": 65.34,
          "hashtags": ["#example", "#ai"]
        }
      ]
    }

    Transcript with Timestamps:
    ${transcriptWithTimestamps}
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    response_format: { type: 'json_object' },
  });
  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Failed to generate key moments: No content returned from AI.');
  }
  try {
    const parsedJson = JSON.parse(content);
    if (!parsedJson.clips || !Array.isArray(parsedJson.clips)) {
      throw new Error('AI response did not contain a valid "clips" array.');
    }
    return parsedJson.clips;
  } catch (error) {
    console.error('Error parsing key moments:', error);
    console.error('Problematic content from AI:', content);
    throw new Error('Failed to parse key moments response from AI.');
  }
}

/**
 * Generates a short social-media caption for a specific clip using GPT-4o.
 * Falls back to a single space if the model returns empty, to keep FFmpeg's
 * drawtext filter happy downstream.
 */
export async function generateCaptionsForClip(title: string, description: string, transcript: string): Promise<string> {
  const openai = getOpenAIClient();
  const prompt = `
    Create an engaging caption for a short video clip.
    Title: ${title}
    Description: ${description}
    Transcript excerpt: ${transcript}
    Generate a caption that is engaging, optimized for social media, includes emojis, and is under 200 characters.
    Return only the caption text.
  `;
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 150,
  });
  return response.choices[0]?.message?.content || ' ';
}

/**
 * Clips the source video at the given timestamps, scales to the target aspect
 * ratio, optionally burns in captions styled by CaptionStyle, and optionally
 * overlays a branding logo in the top-right corner.
 */
export async function createVideoClip(
  originalVideoPath: string,
  startTime: number,
  endTime: number,
  aspectRatio: string,
  outputPath: string,
  captions?: string,
  captionStyle?: CaptionStyle,
  branding?: BrandingConfig
): Promise<void> {
  const duration = endTime - startTime;
  const effectiveCaptionStyle = captionStyle ?? DEFAULT_CAPTION_STYLE;
  const safeCaptions = sanitizeTextForFFmpeg(captions || '');
  const scale = getScaleForAspectRatio(aspectRatio);

  const filters: string[] = [`[0:v]scale=${scale}[scaled]`];
  let lastLabel = '[scaled]';

  if (captions) {
    const drawtext = buildDrawtextFilter(safeCaptions, effectiveCaptionStyle);
    filters.push(`${lastLabel}${drawtext}[captioned]`);
    lastLabel = '[captioned]';
  }

  const hasLogo = Boolean(branding?.enabled && branding?.logoPath);
  if (hasLogo) {
    // Scale the logo to ~12% of the output width, then pin to top-right.
    filters.push(`movie=${branding!.logoPath}[logoRaw]`);
    filters.push(`[logoRaw]scale=iw*0.5:-1[logo]`);
    filters.push(`${lastLabel}[logo]overlay=W-w-30:30[branded]`);
    lastLabel = '[branded]';
  }

  return new Promise((resolve, reject) => {
    const args = [
      '-i', originalVideoPath,
      '-ss', startTime.toString(),
      '-t', duration.toString(),
      '-filter_complex', filters.join(';'),
      '-map', lastLabel,
      '-map', '0:a?',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-preset', 'fast',
      '-y', outputPath,
    ];
    const ffmpeg = spawn('ffmpeg', args);
    let errorOutput = '';

    const timer = setTimeout(() => {
      ffmpeg.kill('SIGKILL');
      reject(new Error('FFmpeg clip creation timed out'));
    }, FFMPEG_TIMEOUT_MS);

    ffmpeg.stderr.on('data', (data) => { errorOutput += data.toString(); });
    ffmpeg.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg process exited with code ${code}. Stderr: ${errorOutput}`));
    });
    ffmpeg.on('error', (err) => { clearTimeout(timer); reject(err); });
  });
}

export interface ProcessingResult {
  clips: ProcessedClip[];
  transcriptText: string;
}

/**
 * Orchestrates the full video pipeline: extract audio → transcribe → identify
 * key moments → generate captions → render clips. A TemplateConfig tunes the
 * AI prompt, clip rendering, and branding overlay. Cleans up temp files in a
 * `finally` block and rolls back uploaded clips on error.
 */
export async function processVideoToExtractKeyMoments(
  videoPath: string,
  templateConfig?: TemplateConfig
): Promise<ProcessingResult> {
  let audioPath: string | null = null;
  const uploadedClipKeys: string[] = [];
  const tempClipPaths: string[] = [];

  try {
    console.log('Step 1: Extracting audio...');
    audioPath = await extractAudioFromVideo(videoPath);

    console.log('Step 2: Transcribing audio...');
    const transcript = await getTranscription(audioPath, { format: 'verbose_json' }) as VerboseTranscription;

    console.log('Step 3: Generating key moments with AI...');
    const keyMoments = await generateKeyMoments(transcript, templateConfig);

    const videoDuration =
      transcript.segments.length > 0
        ? transcript.segments[transcript.segments.length - 1].end
        : Infinity;

    const validMoments = keyMoments.filter((m) => {
      const valid =
        typeof m.startTime === 'number' &&
        typeof m.endTime === 'number' &&
        m.startTime >= 0 &&
        m.endTime > m.startTime &&
        m.startTime < videoDuration &&
        m.endTime <= videoDuration + 2;
      if (!valid) {
        console.warn(
          `[video-processing] Skipping out-of-bounds moment: "${m.title}" [${m.startTime}–${m.endTime}] (video ~${videoDuration}s)`
        );
      }
      return valid;
    });

    console.log(`Step 4: Found ${validMoments.length} valid key moments (${keyMoments.length - validMoments.length} filtered). Creating clips...`);
    const processedClips: ProcessedClip[] = [];
    const aspectRatios = templateConfig?.aspectRatios?.length
      ? templateConfig.aspectRatios
      : ['9:16'];
    const effectiveCaptionStyle = templateConfig?.captionStyle ?? DEFAULT_CAPTION_STYLE;

    for (const moment of validMoments) {
      for (const aspectRatio of aspectRatios) {
        const clipId = randomUUID();
        const clipFileName = `${clipId}_${aspectRatio.replace(':', 'x')}.mp4`;
        const relativeClipPath = buildUploadsPath('uploads', 'clips', clipFileName);
        const tempOutputPath = join(tmpdir(), clipFileName);

        const momentText = transcript.segments
          .filter((seg) => seg.start >= moment.startTime && seg.end <= moment.endTime)
          .map((seg) => seg.text)
          .join(' ');

        console.log(`  - Generating caption for moment: "${moment.title}"`);
        const captions = await generateCaptionsForClip(moment.title, moment.description, momentText);

        console.log(`  - Creating video clip for moment: "${moment.title}"`);
        await createVideoClip(
          videoPath,
          moment.startTime,
          moment.endTime,
          aspectRatio,
          tempOutputPath,
          captions,
          effectiveCaptionStyle,
          templateConfig?.branding
        );
        tempClipPaths.push(tempOutputPath);

        const clipUrl = await storageProvider.save(createReadStream(tempOutputPath), relativeClipPath);
        uploadedClipKeys.push(relativeClipPath);

        processedClips.push({
          title: moment.title,
          description: moment.description,
          startTime: moment.startTime,
          endTime: moment.endTime,
          aspectRatio,
          videoUrl: clipUrl,
          captions,
          hashtags: moment.hashtags.join(' '),
          captionStyle: effectiveCaptionStyle,
        });
      }
    }
    console.log('Step 5: Finished creating all clips.');
    return {
      clips: processedClips,
      transcriptText: transcript.text ?? '',
    };
  } catch (error) {
    await Promise.all(
      uploadedClipKeys.map((key) =>
        storageProvider.delete(key).catch((err) => console.error('Failed to delete clip from storage during cleanup:', err))
      )
    );
    console.error('FATAL ERROR in video processing pipeline:', error);
    throw error;
  } finally {
    await Promise.all(
      tempClipPaths.map((p) =>
        removeFile(p).catch((err) => console.error('Failed to remove temp clip file during cleanup:', err))
      )
    );
    if (audioPath) {
      await removeFile(audioPath).catch((err) => console.error('Failed to remove audio file during cleanup:', err));
    }
  }
}
