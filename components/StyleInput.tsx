import React from 'react';
import { Palette, Sparkles } from 'lucide-react';

interface StyleInputProps {
  styleValue: string;
  onStyleChange: (value: string) => void;
  themeValue: string;
  onThemeChange: (value: string) => void;
}

const PRESETS = [
  "Golden Age Comic Book, halftone patterns, bold colors",
  "Noir, high contrast black and white, moody shadows",
  "Manga, detailed linework, screentones, dynamic angles",
  "Modern Superhero, vibrant digital coloring, cinematic lighting",
  "Cyberpunk Graphic Novel, neon accents, gritty details"
];

const StyleInput: React.FC<StyleInputProps> = ({ styleValue, onStyleChange, themeValue, onThemeChange }) => {
  return (
    <div className="w-full space-y-6">
      {/* Art Style Section */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
          <Palette className="w-4 h-4 text-yellow-500" />
          Describe Art Style
        </label>
        
        <textarea
          className="w-full h-24 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-100 placeholder-gray-500 resize-none transition-all"
          placeholder="e.g. 1980s retro comic style, thick outlines, vibrant colors..."
          value={styleValue}
          onChange={(e) => onStyleChange(e.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => onStyleChange(preset)}
              className="text-xs px-3 py-1.5 rounded-full bg-slate-800 text-gray-400 border border-slate-700 hover:border-yellow-500 hover:text-yellow-500 transition-colors text-left"
            >
              {preset.split(',')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Theme/Tone Section */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Theme & Tone (Optional)
        </label>
        <input
          type="text"
          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100 placeholder-gray-500 transition-all"
          placeholder="e.g. Dark and gritty, Whimsical and funny, Suspenseful..."
          value={themeValue}
          onChange={(e) => onThemeChange(e.target.value)}
        />
        <p className="text-xs text-gray-500">
          This guides the story pacing and emotional tone of the script.
        </p>
      </div>
    </div>
  );
};

export default StyleInput;