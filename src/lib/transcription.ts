import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Transcribes audio content from a file using OpenAI Whisper
 */
export async function transcribeAudio(audioFile: File) {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });
    return transcription.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

/**
 * Transcribes video audio content and returns VTT formatted captions
 */
export async function transcribeVideoAudio(videoFile: File) {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: videoFile,
      model: "whisper-1",
      response_format: "vtt"
    });
    return transcription;
  } catch (error) {
    console.error('Error transcribing video audio:', error);
    throw error;
  }
}
