import React from 'react';
import { Palette, Sparkles, Layers, Globe } from 'lucide-react';
import { Language } from '../types';

interface StyleInputProps {
  styleValue: string;
  onStyleChange: (value: string) => void;
  themeValue: string;
  onThemeChange: (value: string) => void;
  chapterCount: number;
  onChapterCountChange: (value: number) => void;
  language: Language;
  onLanguageChange: (val: Language) => void;
}

const PRESETS = [
  "Golden Age Comic Book, halftone patterns, bold colors",
  "Noir, high contrast black and white, moody shadows",
  "Manga, detailed linework, screentones, dynamic angles",
  "Modern Superhero, vibrant digital coloring, cinematic lighting",
  "Cyberpunk Graphic Novel, neon accents, gritty details"
];

const LANGUAGES: Language[] = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Hindi', 'Portuguese'];

const StyleInput: React.FC<StyleInputProps> = ({ 
  styleValue, 
  onStyleChange, 
  themeValue, 
  onThemeChange,
  chapterCount,
  onChapterCountChange,
  language,
  onLanguageChange
}) => {
  return (
    <div className="w-full space-y-6">
      {/* Art Style Section */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 flex items-center gap-2">
          <Palette className="w-4 h-4 text-yellow-500" />
          Describe Art Style
        </label>
        
        <textarea
          className="w-full h-24 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 resize-none transition-all"
          placeholder="e.g. 1980s retro comic style, thick outlines, vibrant colors..."
          value={styleValue}
          onChange={(e) => onStyleChange(e.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => onStyleChange(preset)}
              className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-slate-700 hover:border-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors text-left"
            >
              {preset.split(',')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Theme/Tone Section */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Theme & Tone (Optional)
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 transition-all"
            placeholder="e.g. Dark, Whimsical..."
            value={themeValue}
            onChange={(e) => onThemeChange(e.target.value)}
          />
        </div>

        {/* Language Section */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 flex items-center gap-2">
            <Globe className="w-4 h-4 text-green-400" />
            Caption Language
          </label>
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 dark:text-gray-100 cursor-pointer"
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        {/* Chapter Count Section */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            Number of Chapters
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={chapterCount}
              onChange={(e) => onChapterCountChange(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-xl font-bold text-blue-500 dark:text-blue-400 w-8 text-center">{chapterCount}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-gray-500">
            Generates {chapterCount} distinct pages.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StyleInput;