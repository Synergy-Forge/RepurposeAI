import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { Transcription } from 'openai/resources/audio/transcriptions';

// This function creates and returns the OpenAI client.
// It ensures the API key is only read when the function is actually called.
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set.');
  }
  return new OpenAI({ apiKey, timeout: 60000 });
}

// ============================================================================
// Types and Interfaces
// ============================================================================

// Supported output formats from Whisper API
type TranscriptionFormat = 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';

interface TranscriptionOptions {
  format: TranscriptionFormat;
  prompt?: string;
  language?: string;
}

// Return type depends on format for better TypeScript support
type TranscriptionResult<T extends TranscriptionFormat> = 
  T extends 'verbose_json' | 'json' ? Transcription : string;

// ============================================================================
// Helper Functions
// ============================================================================

// File validation before processing
function validateServerFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
}

// Better error messages for common OpenAI errors
function handleError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message.includes('rate_limit')) throw new Error('Rate limit exceeded. Try again later.');
    if (error.message.includes('invalid_api_key')) throw new Error('Invalid API key.');
    if (error.message.includes('file_too_large')) throw new Error('File too large (max 25MB).');
    throw new Error(`Transcription failed: ${error.message}`);
  }
  throw new Error('Unknown transcription error.');
}

// ============================================================================
// Main Exported Functions
// ============================================================================

/**
 * Use this for server-side processing (video pipeline)
 */
export async function getTranscription<T extends TranscriptionFormat>(
  filePath: string,
  options: TranscriptionOptions & { format: T }
): Promise<TranscriptionResult<T>> {
  try {
    validateServerFile(filePath);
    
    const openai = getOpenAIClient();
    
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1',
      response_format: options.format,
      prompt: options.prompt,
      language: options.language,
    });

    return transcription as TranscriptionResult<T>;
  } catch (error) {
    console.error(`Transcription error for ${path.basename(filePath)}:`, error);
    handleError(error);
  }
}

/**
 * Use this for direct frontend-to-API calls
 */
export async function transcribeAudio(audioFile: File): Promise<string> {
  try {
    const openai = getOpenAIClient();
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });
    return transcription.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    handleError(error);
  }
}

/**
 * Use this for generating subtitles from frontend uploads
 */
export async function transcribeVideoAudio(videoFile: File): Promise<string> {
  try {
    const openai = getOpenAIClient();
    const transcription = await openai.audio.transcriptions.create({
      file: videoFile,
      model: "whisper-1",
      response_format: "vtt"
    });
    return transcription as string;
  } catch (error) {
    console.error('Error transcribing video audio:', error);
    handleError(error);
  }
}
