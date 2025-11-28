import React from 'react';
import { Palette } from 'lucide-react';

interface StyleInputProps {
  value: string;
  onChange: (value: string) => void;
}

const PRESETS = [
  "Golden Age Comic Book, halftone patterns, bold colors",
  "Noir, high contrast black and white, moody shadows",
  "Manga, detailed linework, screentones, dynamic angles",
  "Modern Superhero, vibrant digital coloring, cinematic lighting",
  "Cyberpunk Graphic Novel, neon accents, gritty details"
];

const StyleInput: React.FC<StyleInputProps> = ({ value, onChange }) => {
  return (
    <div className="w-full space-y-4">
      <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
        <Palette className="w-4 h-4 text-yellow-500" />
        Describe Art Style
      </label>
      
      <textarea
        className="w-full h-24 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-100 placeholder-gray-500 resize-none transition-all"
        placeholder="e.g. 1980s retro comic style, thick outlines, vibrant colors..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className="text-xs px-3 py-1.5 rounded-full bg-slate-800 text-gray-400 border border-slate-700 hover:border-yellow-500 hover:text-yellow-500 transition-colors text-left"
          >
            {preset.split(',')[0]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StyleInput;
