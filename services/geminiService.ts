import { GoogleGenAI, Modality } from '@google/genai';

// Helper function to decode base64 string to Uint8Array
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper function to decode raw PCM audio data into an AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Processes text to remove non-colloquial symbols and format it for more natural speech.
 * This version includes specific "口语化" (verbalization) optimizations for Chinese text.
 * @param text The input text string.
 * @returns The processed text string.
 */
export function processTextForSpeech(text: string): string {
  let processedText = text;

  // 1. Initial cleanup: Remove non-spoken symbols and replace '&'
  // Remove underscores, asterisks, hashtags, square/curly/round brackets if they're likely not intended to be spoken literally
  processedText = processedText.replace(/[_*#@\[\]{}()]/g, ' ');
  // Replace ampersand with " and " for verbalization
  processedText = processedText.replace(/&/g, ' and ');
  // Replace multiple spaces with a single space and trim
  processedText = processedText.replace(/\s+/g, ' ').trim();

  // 2. Handle percentages (e.g., "10%" -> "百分之10")
  // The model is generally smart enough to read "百分之10" as "百分之十".
  // This avoids complex number-to-Chinese-text conversion logic in the frontend.
  processedText = processedText.replace(/(\d+(\.\d+)?)%/g, '百分之$1');

  // 3. Handle English acronyms (e.g., "API" -> "A P I")
  // This regex targets sequences of two or more uppercase letters that form a word boundary.
  // It aims to convert acronyms into spaced-out letters for clearer pronunciation.
  // Example: "API" becomes "A P I", "USA" becomes "U S A".
  // It uses a negative lookbehind and lookahead to avoid splitting letters within mixed-case words
  // or splitting single capital letters.
  processedText = processedText.replace(/(?<![a-zA-Z])([A-Z]{2,})(?![a-zA-Z])/g, (match) => {
    return match.split('').join(' ');
  });

  // 4. For general numbers (e.g., "123", "2024年"), we will rely on the Gemini model's
  // internal capabilities for natural pronunciation in a Chinese context.
  // Implementing a robust number-to-Chinese character converter is beyond the scope of a
  // minimal frontend change and often leads to context-specific errors.
  // The model is typically good at reading "123" as "一百二十三" or "一二三" depending on context.

  return processedText;
}

/**
 * Generates speech from text using the Gemini Text-to-Speech API.
 * @param text The text to convert to speech.
 * @param voiceName The name of the voice to use (e.g., 'Zephyr', 'Kore').
 * @param modelName The name of the Gemini model to use for TTS.
 * @param audioContext The AudioContext for decoding audio data.
 * @returns A Promise that resolves to an AudioBuffer, or rejects with an error.
 */
export async function generateSpeech(
  text: string,
  voiceName: string,
  modelName: string,
  audioContext: AudioContext
): Promise<AudioBuffer> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not defined.");
  }

  // Create a new GoogleGenAI instance for each API call to ensure it uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: modelName, // Use the provided modelName
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data received from the API.");
    }

    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      audioContext,
      24000, // Sample rate of the returned audio
      1,     // Number of channels (mono)
    );

    return audioBuffer;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw new Error(`Failed to generate speech: ${error instanceof Error ? error.message : String(error)}`);
  }
}