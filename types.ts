
export type LayoutType = 'GRID' | 'VERTICAL' | 'DYNAMIC' | 'SPLASH';
export type BubbleStyle = 'STANDARD' | 'SHOUT' | 'THOUGHT';
export type FontFamily = 'Comic Neue' | 'Bangers' | 'Inter' | 'ZCOOL QingKe HuangYou' | 'Ma Shan Zheng' | 'Zhi Mang Xing' | 'Noto Sans SC';
export type Language = 'English' | 'Spanish' | 'French' | 'German' | 'Japanese' | 'Chinese' | 'Hindi' | 'Portuguese';

export interface TextConfig {
  fontFamily: FontFamily;
  titleFontFamily: FontFamily; // New: Separate font for titles
  fontSize: number; // multiplier, e.g. 1.0, 1.2
  color: string;
  bubbleStyle: BubbleStyle;
}

export interface ComicPanel {
  id: string;
  description: string;
  caption: string;
  imageUrl?: string; // Base64 or URL
  status: 'pending' | 'generating' | 'complete' | 'error' | 'updating_prompt';
  textConfig?: Partial<TextConfig>; // Per-panel override
  span?: 1 | 2; // 1 = half width (standard), 2 = full width
}

export interface ComicPage {
  pageNumber: number;
  chapterTitle?: string; // New: Chapter name support
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

// JSON Export Structure
export interface ComicResourcePack {
  title: string;
  metadata: {
    artStyle: string;
    themeAndTone: string; // Combined field
    language: string;
    date: string;
  };
  chapters: {
    chapterNumber: number;
    title: string;
    panels: {
      index: number;
      caption: string;
      visualPrompt: string;
      imageFileName: string;
    }[];
  }[];
}
