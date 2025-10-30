
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
export async function decodeAudioData(
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
 * Optimizes text for colloquial speech using the Gemini model.
 * This function sends the text to a Gemini text model with a system instruction
 * to transform it into more natural and idiomatic spoken Chinese,
 * tailored to a specific colloquial style.
 * @param text The input text string.
 * @param colloquialStyleDescription A description of the desired colloquial style.
 * @returns A Promise that resolves to the optimized text string.
 */
export async function optimizeTextForColloquialSpeech(
  text: string,
  colloquialStyleDescription: string
): Promise<string> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not defined.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const systemInstruction = `你是一个专业的中文口语化优化助手。你的任务是将用户提供的中文文本，转换成更自然、更地道的口语表达。
    请根据以下口语化风格描述进行优化："${colloquialStyleDescription}"。
    具体规则包括：注意语序、习惯用语（例如将“百分之十”转换为“百分之十”，将“API”转换为“A P I”等），处理数字、日期、单位和百分比的表述，使其听起来更自然。简化可能存在的复杂句子结构，去除书面语痕迹，使文本听起来像日常对话。
    **只返回优化后的纯文本，确保包含自然的中文断句标点符号（如逗号、句号、问号、感叹号等，但不限于这些），不要包含任何Markdown语法（如粗体、斜体、列表等）、其他特殊符号（如星号、井号等）、解释或额外信息。确保输出是完全纯净且适合口语朗读的文本。**`;

    console.log("Calling Gemini for colloquial optimization with style:", colloquialStyleDescription);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Use a text model for optimization
      contents: text,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    const optimizedText = response.text.trim();
    console.log("Colloquial optimization successful. Optimized text:", optimizedText);
    return optimizedText;
  } catch (error) {
    console.error("Error optimizing text for colloquial speech:", error);
    throw new Error(`Failed to optimize text for colloquial speech: ${error instanceof Error ? error.message : String(error)}`);
  }
}


/**
 * Generates speech from text using the Gemini Text-to-Speech API.
 * @param text The text to convert to speech. This text is expected to be already optimized for colloquial speech.
 * @param voiceName The name of the voice to use (e.g., 'Zephyr', 'Kore').
 * @param modelName The name of the Gemini model to use for TTS.
 * @param audioContext The AudioContext for decoding audio data.
 * @returns A Promise that resolves to an AudioBuffer, or rejects with an error.
*/
export async function generateSpeech(
  text: string,
  voiceName: string,
  modelName: string,
  audioContext: AudioContext,
): Promise<AudioBuffer> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not defined.");
  }

  // Create a new GoogleGenAI instance for each API call to ensure it uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    console.log("Calling Gemini for speech generation with model:", modelName, "voice:", voiceName);
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
    console.log("Speech generation successful. Decoding audio data.");

    // Ensure AudioContext is running before decoding
    if (audioContext.state === 'suspended') {
        console.log("AudioContext is suspended, attempting to resume for decoding...");
        await audioContext.resume();
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
