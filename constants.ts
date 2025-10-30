
import { VoiceOption, TTSModelOption, ColloquialStyleOption } from './types';

export const VOICE_OPTIONS: VoiceOption[] = [
  { name: 'Zephyr', label: 'Zephyr (标准)' },
  { name: 'Puck', label: 'Puck (活泼)' },
  { name: 'Charon', label: 'Charon (深沉)' },
  { name: 'Kore (清晰)', label: 'Kore (清晰)' }, // Corrected name
  { name: 'Fenrir', label: 'Fenrir (洪亮)' },
];

export const DEFAULT_VOICE_NAME = 'Zephyr';

export const TTS_MODELS: TTSModelOption[] = [
  { name: 'gemini-2.5-flash-preview-tts', label: 'Gemini 2.5 Flash TTS (默认)' },
  // Add other TTS models here if they become available
];

export const DEFAULT_TTS_MODEL = TTS_MODELS[0];

export const COLLOQUIAL_STYLE_OPTIONS: ColloquialStyleOption[] = [
  { name: 'Standard', label: '标准口语', description: '将文本转换为自然、流畅的日常口语，保持清晰度，避免过于随意。' },
  { name: 'FormalSpeech', label: '正式演讲', description: '将文本转换为适合公共演讲的口语风格，保持语调庄重，表达清晰有力，适当使用排比和修辞。' },
  { name: 'DailyChat', label: '日常闲聊', description: '将文本转换为轻松、随意的日常对话风格，可能包含一些口头禅或非正式表达。' },
  { name: 'Storytelling', label: '故事讲述', description: '将文本转换为引人入胜的故事讲述口吻，强调叙述感和情感表达，语调富有变化。' },
  { name: 'Enthusiastic', label: '热情洋溢', description: '将文本转换为充满热情和活力的口语，表达积极，语速可能稍快，带有感染力。' },
  { name: 'CalmAndSoothing', label: '平静舒缓', description: '将文本转换为平静、温和的口语，语调柔和，语速适中，适合安抚或讲解。' },
  { name: 'Informative', label: '信息传递', description: '将文本转换为清晰、客观、高效传递信息的口语，语调平实，重点突出。' },
  { name: 'Persuasive', label: '说服性', description: '将文本转换为具有说服力的口语，注重逻辑性和情感共鸣，引导听众。' },
  { name: 'Humorous', label: '幽默风趣', description: '将文本转换为带有幽默感的口语，可能包含一些俏皮话或轻松的自嘲。' },
  { name: 'ChildrensStory', label: '儿童故事', description: '将文本转换为适合儿童听众的故事风格，语调亲切，用词简单，充满童趣。' },
  { name: 'NewsReport', label: '新闻报道', description: '将文本转换为严谨、客观的新闻播报风格，语速均匀，语调中立。' },
];

export const DEFAULT_COLLOQUIAL_STYLE_NAME = 'Standard';

export const LOCAL_STORAGE_HISTORY_KEY = 'geminiTtsHistory';

// App Metadata
export const APP_AUTHOR = 'Roger';
export const APP_GITHUB_URL = 'https://github.com/rogertl/Gemini-TTS-App';
export const APP_VERSION = '1.0.9'; // Updated version for bug fixes and playback fix
export const APP_PUBLISH_DATE = '2025-10-30'; // Corrected date

export const MIT_LICENSE_TEXT = `MIT License

Copyright (c) 2024 Roger

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
