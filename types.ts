export interface ComicPanel {
  id: string;
  description: string;
  caption: string;
  imageUrl?: string; // Base64 or URL
  status: 'pending' | 'generating' | 'complete' | 'error';
}

export interface ComicPage {
  pageNumber: number;
  panels: ComicPanel[];
}

export interface ComicScript {
  title: string;
  pages: ComicPage[];
}

export enum AppStatus {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  SCRIPTING = 'SCRIPTING',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface GenerationConfig {
  artStyle: string;
  apiKey: string; // We don't store this, but we use env
}
