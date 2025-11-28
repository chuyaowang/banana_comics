export type LayoutType = 'GRID' | 'VERTICAL' | 'DYNAMIC' | 'SPLASH';
export type BubbleStyle = 'STANDARD' | 'SHOUT' | 'THOUGHT';
export type FontFamily = 'Comic Neue' | 'Bangers' | 'Inter';

export interface TextConfig {
  fontFamily: FontFamily;
  fontSize: number; // multiplier, e.g. 1.0, 1.2
  color: string;
  bubbleStyle: BubbleStyle;
}

export interface ComicPanel {
  id: string;
  description: string;
  caption: string;
  imageUrl?: string; // Base64 or URL
  status: 'pending' | 'generating' | 'complete' | 'error';
}

export interface ComicPage {
  pageNumber: number;
  layout: LayoutType;
  panels: ComicPanel[];
}

export interface ComicScript {
  title: string;
  theme?: string;
  pages: ComicPage[];
}

export enum AppStatus {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  SCRIPTING = 'SCRIPTING',
  REVIEW = 'REVIEW',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface GenerationConfig {
  artStyle: string;
  theme: string;
  apiKey: string;
}