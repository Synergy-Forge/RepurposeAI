import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export async function extractAudioFromVideo(
  videoPath: string
): Promise<string> {
  const audioPath = join(tmpdir(), `${randomUUID()}.mp3`);

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i',
      videoPath,
      '-vn',
      '-acodec',
      'mp3',
      '-ab',
      '128k',
      '-ar',
      '44100',
      '-y',
      audioPath,
    ]);

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(audioPath);
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });

    ffmpeg.on('error', (err) => {
      reject(err);
    });
  });
}

export async function transcribeAudio(audioPath: string): Promise<string> {
  const audioBuffer = await writeFile(audioPath, '');

  const transcription = await openai.audio.transcriptions.create({
    file: audioBuffer as unknown as Blob,
    model: 'whisper-1',
    response_format: 'text',
  });

  await unlink(audioPath);
  return transcription;
}

export async function generateKeyMoments(
  transcript: string
): Promise<KeyMoment[]> {
  const prompt = `
    Analyze this video transcript and identify 5-8 key moments that would make engaging short-form content.
    For each moment, provide:
    - A catchy title
    - A brief description
    - Start and end timestamps (in seconds)
    - Relevant hashtags

    Transcript: ${transcript}

    Return the response as a JSON array of objects with the following structure:
    [
      {
        "title": "Catchy Title",
        "description": "Brief description",
        "startTime": 30,
        "endTime": 45,
        "hashtags": ["#hashtag1", "#hashtag2"]
      }
    ]
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Failed to generate key moments');
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating key moments:', error);
    throw new Error('Failed to parse key moments response');
  }
}

export async function generateCaptionsForClip(
  title: string,
  description: string,
  transcript: string
): Promise<string> {
  const prompt = `
    Create engaging captions for a short video clip.

    Title: ${title}
    Description: ${description}
    Transcript excerpt: ${transcript}

    Generate captions that are:
    - Engaging and attention-grabbing
    - Optimized for social media
    - Include emojis where appropriate
    - Keep it under 200 characters

    Return only the caption text.
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 100,
  });

  return response.choices[0]?.message?.content || '';
}

export async function createVideoClip(
  originalVideoPath: string,
  startTime: number,
  endTime: number,
  aspectRatio: string,
  outputPath: string,
  captions?: string
): Promise<void> {
  const duration = endTime - startTime;
  const filterComplex = captions
    ? `[0:v]scale=${getScaleForAspectRatio(
        aspectRatio
      )},drawtext=text='${captions}':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=h-th-10[v]`
    : `[0:v]scale=${getScaleForAspectRatio(aspectRatio)}[v]`;

  return new Promise((resolve, reject) => {
    const args = [
      '-i',
      originalVideoPath,
      '-ss',
      startTime.toString(),
      '-t',
      duration.toString(),
      '-filter_complex',
      filterComplex,
      '-map',
      '[v]',
      '-map',
      '0:a',
      '-c:v',
      'libx264',
      '-c:a',
      'aac',
      '-preset',
      'fast',
      '-y',
      outputPath,
    ];

    const ffmpeg = spawn('ffmpeg', args);

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });

    ffmpeg.on('error', (err) => {
      reject(err);
    });
  });
}

function getScaleForAspectRatio(aspectRatio: string): string {
  switch (aspectRatio) {
    case '9:16':
      return '1080:1920';
    case '1:1':
      return '1080:1080';
    case '16:9':
      return '1920:1080';
    default:
      return '1920:1080';
  }
}

export async function processVideoToExtractKeyMoments(
  videoPath: string
): Promise<ProcessedClip[]> {
  try {
    // Extract audio
    const audioPath = await extractAudioFromVideo(videoPath);

    // Transcribe audio
    const transcript = await transcribeAudio(audioPath);

    // Generate key moments
    const keyMoments = await generateKeyMoments(transcript);

    const processedClips: ProcessedClip[] = [];
    const aspectRatios = ['9:16', '1:1', '16:9'];

    for (const moment of keyMoments) {
      for (const aspectRatio of aspectRatios) {
        const clipId = randomUUID();
        const outputPath = join(tmpdir(), `${clipId}_${aspectRatio}.mp4`);

        // Generate captions
        const captions = await generateCaptionsForClip(
          moment.title,
          moment.description,
          transcript
        );

        // Create video clip
        await createVideoClip(
          videoPath,
          moment.startTime,
          moment.endTime,
          aspectRatio,
          outputPath,
          captions
        );

        processedClips.push({
          title: moment.title,
          description: moment.description,
          startTime: moment.startTime,
          endTime: moment.endTime,
          aspectRatio,
          videoUrl: outputPath,
          captions,
          hashtags: moment.hashtags.join(' '),
        });
      }
    }

    return processedClips;
  } catch (error) {
    console.error('Error processing video:', error);
    throw error;
  }
}
