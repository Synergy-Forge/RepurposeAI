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
  ensureDirectory,
  storagePaths,
  buildUploadsPath,
  toPublicUrl,
  resolveStoredPath,
} from '@/lib/storage';
import { getTranscription } from './transcription';
import { Transcription } from 'openai/resources/audio/transcriptions';

// This function creates and returns the OpenAI client.
// It ensures the API key is only read when a function is actually called.
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('FATAL: OPENAI_API_KEY environment variable is not set in the current process.');
  }
  return new OpenAI({ apiKey, timeout: 60000 });
}

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

export interface ProcessedClip {
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  aspectRatio: string;
  videoUrl: string;
  captions: string;
  hashtags: string;
}

interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}
interface VerboseTranscription extends Transcription {
  segments: TranscriptionSegment[];
}

// ============================================================================
// Helper Functions
// ============================================================================

// A security helper function to sanitize caption text
// before passing it to FFmpeg, preventing special characters from breaking the command.
function sanitizeTextForFFmpeg(text: string): string {
  if (!text) return '';
  // Replaces single quotes with a similar-looking but safe character
  // and escapes other special characters.
  return text.replace(/'/g, '’').replace(/[\\$:"]/g, "\\$&");
}

// Uses ffprobe (which comes with FFmpeg) to safely check
// if a video contains an audio stream before attempting to process it.
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

// A simple helper to return the correct scale arguments
// for FFmpeg based on the desired aspect ratio (e.g., 9:16 for Reels/Shorts).
function getScaleForAspectRatio(aspectRatio: string): string {
  switch (aspectRatio) {
    case '9:16': return '1080:1920';
    case '1:1': return '1080:1080';
    case '16:9': return '1920:1080';
    default: return '1920:1080';
  }
}

// ============================================================================
// Main Exported Functions
// ============================================================================

// The first step of the pipeline. It takes a video path, verifies
// if it has audio, and if so, uses FFmpeg to extract and save that audio as an MP3.
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
    ffmpeg.stderr.on('data', (data) => { errorOutput += data.toString(); });
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(audioPath);
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}. Stderr: ${errorOutput}`));
      }
    });
    ffmpeg.on('error', (err) => reject(err));
  });
}

// The AI "brain" of the system. It receives the transcript with timestamps,
// sends it to GPT-4o, and asks it to identify key moments, returning a structured JSON.
export async function generateKeyMoments(transcript: VerboseTranscription): Promise<KeyMoment[]> {
    const openai = getOpenAIClient(); // Client is created here, at runtime.
    const transcriptWithTimestamps = transcript.segments.map(seg => `[${seg.start.toFixed(2)}s - ${seg.end.toFixed(2)}s] ${seg.text}`).join('\n');
    const prompt = `
    Analyze the following video transcript, which includes timestamps for each segment. Your task is to identify 5 to 8 key moments suitable for short-form content.
    For each moment, you must provide a catchy title, a brief description, the precise startTime and endTime in seconds based on the provided segments, and relevant hashtags.
    You MUST return your response as a single, valid JSON object with a root key named "clips" which contains an array of objects.
    
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
        response_format: { type: "json_object" },
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

// A simpler AI function to generate a caption (text for a social media post)
// for a specific clip, based on its title and description.
export async function generateCaptionsForClip(title: string, description: string, transcript: string): Promise<string> {
    const openai = getOpenAIClient(); // Client is created here, at runtime.
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
    return response.choices[0]?.message?.content || ' '; // Return a space if empty to prevent ffmpeg errors
}

// The "workhorse" of the system. It uses FFmpeg to clip the original video
// at the exact timestamps and "burns" the captions directly onto the new video frames.
export async function createVideoClip(
  originalVideoPath: string,
  startTime: number,
  endTime: number,
  aspectRatio: string,
  outputPath: string,
  captions?: string
): Promise<void> {
  const duration = endTime - startTime;
  const safeCaptions = sanitizeTextForFFmpeg(captions || '');
  const filterComplex = captions
    ? `[0:v]scale=${getScaleForAspectRatio(aspectRatio)},drawtext=text='${safeCaptions}':fontcolor=white:fontsize=48:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=h-th-50[v]`
    : `[0:v]scale=${getScaleForAspectRatio(aspectRatio)}[v]`;

  return new Promise((resolve, reject) => {
    const args = [
      '-i', originalVideoPath, '-ss', startTime.toString(), '-t', duration.toString(),
      '-filter_complex', filterComplex, '-map', '[v]', '-map', '0:a',
      '-c:v', 'libx264', '-c:a', 'aac', '-preset', 'fast', '-y', outputPath,
    ];
    const ffmpeg = spawn('ffmpeg', args);
    let errorOutput = '';
    ffmpeg.stderr.on('data', data => errorOutput += data.toString());
    ffmpeg.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg process exited with code ${code}. Stderr: ${errorOutput}`));
    });
    ffmpeg.on('error', err => reject(err));
  });
}

// The main "orchestrator". This function ties everything together. It is
// called by your tRPC router and executes each step of the pipeline in the correct order.
export async function processVideoToExtractKeyMoments(videoPath: string): Promise<ProcessedClip[]> {
  let audioPath: string | null = null;
  const createdClipPaths: string[] = [];

  try {
    console.log("Step 1: Extracting audio...");
    audioPath = await extractAudioFromVideo(videoPath);

    console.log("Step 2: Transcribing audio...");
    const transcript = await getTranscription(audioPath, { format: 'verbose_json' }) as VerboseTranscription;

    console.log("Step 3: Generating key moments with AI...");
    const keyMoments = await generateKeyMoments(transcript);

    console.log(`Step 4: Found ${keyMoments.length} key moments. Creating clips...`);
    await ensureDirectory(storagePaths.clipsDir);
    const processedClips: ProcessedClip[] = [];
    const aspectRatios = ['9:16']; // Focusing on one aspect ratio for simplicity

    for (const moment of keyMoments) {
      for (const aspectRatio of aspectRatios) {
        const clipId = randomUUID();
        const clipFileName = `${clipId}_${aspectRatio}.mp4`;
        const relativeClipPath = buildUploadsPath('uploads', 'clips', clipFileName);
        const outputPath = resolveStoredPath(relativeClipPath);
        const momentText = transcript.segments
          .filter(seg => seg.start >= moment.startTime && seg.end <= moment.endTime)
          .map(seg => seg.text)
          .join(' ');

        console.log(`  - Generating caption for moment: "${moment.title}"`);
        const captions = await generateCaptionsForClip(moment.title, moment.description, momentText);

        console.log(`  - Creating video clip for moment: "${moment.title}"`);
        await createVideoClip(videoPath, moment.startTime, moment.endTime, aspectRatio, outputPath, captions);
        createdClipPaths.push(relativeClipPath);

        processedClips.push({
          title: moment.title,
          description: moment.description,
          startTime: moment.startTime,
          endTime: moment.endTime,
          aspectRatio,
          videoUrl: toPublicUrl(relativeClipPath),
          captions,
          hashtags: moment.hashtags.join(' '),
        });
      }
    }
    console.log("Step 5: Finished creating all clips.");
    return processedClips;
  } catch (error) {
    await Promise.all(
      createdClipPaths.map((relativePath) =>
        removeFile(resolveStoredPath(relativePath)).catch(() => undefined)
      )
    );
    console.error('FATAL ERROR in video processing pipeline:', error);
    throw error;
  } finally {
    if (audioPath) {
      await removeFile(audioPath).catch(() => undefined);
    }
  }
}

