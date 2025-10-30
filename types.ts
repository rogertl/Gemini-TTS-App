

export interface VoiceOption {
  name: string;
  label: string;
}

export interface TTSModelOption {
  name: string;
  label: string;
}

// Moved from App.tsx to centralize type definition
export interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

// Declare the global window.aistudio property here to avoid redeclaration errors
declare global {
  interface Window {
    aistudio?: AIStudio;
  }
}