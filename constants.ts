import { VoiceOption, TTSModelOption } from './types';

export const VOICE_OPTIONS: VoiceOption[] = [
  { name: 'Zephyr', label: 'Zephyr (标准)' },
  { name: 'Puck', label: 'Puck (活泼)' },
  { name: 'Charon', label: 'Charon (深沉)' },
  { name: 'Kore', label: 'Kore (清晰)' },
  { name: 'Fenrir', label: 'Fenrir (洪亮)' },
];

export const DEFAULT_VOICE_NAME = 'Zephyr';

export const TTS_MODELS: TTSModelOption[] = [
  { name: 'gemini-2.5-flash-preview-tts', label: 'Gemini 2.5 Flash TTS (默认)' },
  // Add other TTS models here if they become available
];

export const DEFAULT_TTS_MODEL = TTS_MODELS[0];