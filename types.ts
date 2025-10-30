
export interface VoiceOption {
  name: string;
  label: string;
}

export interface TTSModelOption {
  name: string;
  label: string;
}

export interface ColloquialStyleOption {
  name: string;
  label: string;
  description: string; // Used to guide the AI
}

export interface HistoryItem {
  id: string; // Unique ID for each history entry
  timestamp: number; // For sorting
  originalText: string;
  optimizedText: string;
  voiceName: string;
  modelName: string;
  colloquialStyleName: string; // New field for colloquial style
}

// Moved from App.tsx to centralize type definition
// Changed from interface to type alias to resolve "Subsequent property declarations must have the same type" error
export type AIStudio = {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
};

// Declare the global window.aistudio property here to avoid redeclaration errors.
// Removed the redundant `WindowAIStudio` type alias as it can sometimes cause conflicts
// with `declare global` when the base interface is also exported.
// Directly use `AIStudio` within the `declare global` block.
declare global {
  interface Window {
    aistudio?: AIStudio;
    webkitAudioContext?: typeof AudioContext; // For broader browser compatibility
  }
}